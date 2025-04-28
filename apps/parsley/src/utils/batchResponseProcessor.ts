import fs from "fs";
import path from "path";
import { logger } from "./logger";
import { CrawlItem, TaxExemptOrganization } from "../types";
import { findTaxExemptOrgs, bulkUpdateOrgs } from "../db/mongo";
import { extractSocialMediaUrls, findBestDonationLink, findMainLogo } from "./parseUtils";

const BATCH_SIZE = 100;

export interface ProcessingResult {
    processedCount: number;
    errorCount: number;
    processedFile: string;
}

export async function processBatchResponseFile(filePath: string, processedDir: string): Promise<ProcessingResult> {
    let processedCount = 0;
    let errorCount = 0;

    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const fileName = path.basename(filePath);

        // Process each line in the JSONL file
        const lines = fileContent.trim().split("\n");
        logger.info(`Processing ${lines.length} entries from file: ${fileName}`);

        // Prepare updates in batches
        const orgUpdates: TaxExemptOrganization[] = [];
        const einToResponseMap = new Map<string, any>();

        // First gather all EINs and responses
        for (const line of lines) {
            try {
                const parsedLine = JSON.parse(line);
                const customId = parsedLine.custom_id;

                if (!customId) {
                    logger.warn(`Missing custom_id in file ${fileName}, line: ${line.substring(0, 100)}...`);
                    errorCount++;
                    continue;
                }

                // Extract EIN from custom_id (format: "EIN_TIMESTAMP")
                const ein = customId.split("_")[0];

                if (!ein) {
                    logger.warn(`Could not extract EIN from custom_id: ${customId}`);
                    errorCount++;
                    continue;
                }

                // Store EIN and response
                einToResponseMap.set(ein, parsedLine.response);
            } catch (lineError) {
                errorCount++;
                logger.error(`Error processing line in file ${fileName}: ${lineError}`);
            }
        }

        if (einToResponseMap.size === 0) {
            logger.warn(`No valid entries found in file: ${fileName}`);
            return { processedCount: 0, errorCount, processedFile: fileName };
        }

        // Get all the orgs in one database query
        logger.info(`Looking up ${einToResponseMap.size} organizations...`);
        const eins = Array.from(einToResponseMap.keys());
        const orgs = await findTaxExemptOrgs(eins.length, { ein: { $in: eins } });

        if (orgs.length === 0) {
            logger.warn(`No organizations found for EINs from file: ${fileName}`);
            return { processedCount: 0, errorCount, processedFile: fileName };
        }

        logger.info(`Found ${orgs.length} out of ${eins.length} organizations`);

        // Prepare updates
        for (const org of orgs) {
            const response = einToResponseMap.get(org.ein);
            const parsedContent = JSON.parse(response.body.choices[0].message.content);
            if (parsedContent.hasCorrectWebsite) {
                const correctCrawlItems: CrawlItem[] | undefined = org.confirmationCrawlItems?.filter(
                    (ci: CrawlItem) => {
                        const url = ci.url.replace(/https?:\/\//, "").replace(/\/$/, "");
                        const correctUrl = parsedContent.correctWebsiteUrl
                            .replace(/https?:\/\//, "")
                            .replace(/\/$/, "");
                        return url.includes(correctUrl) || correctUrl.includes(url);
                    }
                );

                const socialMediaUrls = extractSocialMediaUrls(
                    correctCrawlItems?.reduce<string[]>((acc, ci) => {
                        return [...acc, ...(ci.socialMediaUrls ?? [])];
                    }, []) ?? []
                );

                const logoUrl = findMainLogo(
                    correctCrawlItems?.reduce<string[]>((acc, ci) => {
                        return [...acc, ...(ci.logoLinks ?? [])];
                    }, []) ?? []
                );

                const donationLink = findBestDonationLink(
                    correctCrawlItems?.reduce<string[]>((acc, ci) => {
                        return [...acc, ...(ci.donationLinks ?? [])];
                    }, []) ?? []
                );

                orgUpdates.push({
                    ...org,
                    confirmationCrawlItems: correctCrawlItems,
                    socialMediaUrls: socialMediaUrls,
                    logoUrl: logoUrl,
                    donationUrl: donationLink,
                    aiConfirmationResponse: response,
                    lastUpdated: new Date().toISOString(),
                });
            } else if (response) {
                orgUpdates.push({
                    ...org,
                    aiConfirmationResponse: response,
                    lastUpdated: new Date().toISOString(),
                });
            }
        }

        // Perform bulk updates in batches
        for (let i = 0; i < orgUpdates.length; i += BATCH_SIZE) {
            const batch = orgUpdates.slice(i, i + BATCH_SIZE);
            await bulkUpdateOrgs(batch);
            processedCount += batch.length;
            logger.info(
                `Processed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(orgUpdates.length / BATCH_SIZE)}`
            );
        }

        // Move the file to the processed folder
        const processedFilePath = path.join(processedDir, fileName);
        fs.renameSync(filePath, processedFilePath);

        logger.info(`Processed file: ${fileName}`);
        return { processedCount, errorCount, processedFile: fileName };
    } catch (error) {
        logger.error(
            `Error processing batch response file: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        throw error;
    }
}
