import fs from "fs";
import path from "path";
import { connectToDatabase, disconnectFromDatabase, findTaxExemptOrgs, bulkUpdateOrgs } from "@/db/mongo";
import { logger } from "@/utils/logger";
import { CrawlItem, TaxExemptOrganization } from "@/types";
import { extractSocialMediaUrls, findBestDonationLink, findMainLogo } from "@/utils/parseUtils";

const BATCH_DIR = "data/batch";
const BATCH_SIZE = 100;

async function parseBatchResponses() {
    try {
        // Connect to the database
        await connectToDatabase();

        const batchOutputDir = path.join(process.cwd(), BATCH_DIR, "batchOutput", "unprocessed");
        // Move the file to the processed folder after processing
        const processedDir = path.join(process.cwd(), BATCH_DIR, "batchOutput", "processed");

        // Ensure processed directory exists
        if (!fs.existsSync(processedDir)) {
            fs.mkdirSync(processedDir, { recursive: true });
        }

        // Read all files in the batchOutput directory
        const files = fs.readdirSync(batchOutputDir).filter((file) => file.endsWith("_output.jsonl"));

        logger.info(`Found ${files.length} batch output files to process`);

        let processedCount = 0;
        let errorCount = 0;

        for (const file of files) {
            try {
                const filePath = path.join(batchOutputDir, file);
                const fileContent = fs.readFileSync(filePath, "utf-8");

                // Process each line in the JSONL file
                const lines = fileContent.trim().split("\n");
                logger.info(`Processing ${lines.length} entries from file: ${file}`);

                // Prepare updates in batches
                const orgUpdates: TaxExemptOrganization[] = [];
                const einToResponseMap = new Map<string, any>();

                // First gather all EINs and responses
                for (const line of lines) {
                    try {
                        const parsedLine = JSON.parse(line);
                        const customId = parsedLine.custom_id;

                        if (!customId) {
                            logger.warn(`Missing custom_id in file ${file}, line: ${line.substring(0, 100)}...`);
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
                        logger.error(`Error processing line in file ${file}: ${lineError}`);
                    }
                }

                if (einToResponseMap.size === 0) {
                    logger.warn(`No valid entries found in file: ${file}`);
                    continue;
                }

                // Get all the orgs in one database query
                logger.info(`Looking up ${einToResponseMap.size} organizations...`);
                const eins = Array.from(einToResponseMap.keys());
                const orgs = await findTaxExemptOrgs(eins.length, { ein: { $in: eins } });

                if (orgs.length === 0) {
                    logger.warn(`No organizations found for EINs from file: ${file}`);
                    continue;
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
                        `Processed batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(
                            orgUpdates.length / BATCH_SIZE
                        )}`
                    );
                }

                logger.info(`Processed file: ${file}`);
                // Move the file to the processed folder after processing
                // fs.renameSync(filePath, path.join(processedDir, file));
            } catch (fileError) {
                logger.error(`Error processing file ${file}: ${fileError}`);
            }
        }

        logger.info(`Batch response parsing completed. Processed ${processedCount} entries with ${errorCount} errors.`);
        return { processedCount, errorCount };
    } catch (error) {
        logger.error("Error parsing batch responses:", error);
        throw error;
    } finally {
        await disconnectFromDatabase();
    }
}

// Run the function if directly executed
if (require.main === module) {
    parseBatchResponses()
        .then((result) => {
            logger.info(`Script completed successfully: ${JSON.stringify(result)}`);
            process.exit(0);
        })
        .catch((error) => {
            logger.error("Script failed:", error);
            process.exit(1);
        });
}
