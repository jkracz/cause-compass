import { connectToDatabase, disconnectFromDatabase, findTaxExemptOrgs, bulkUpdateOrgs } from "@/services/mongo";
import { logger } from "@/utils/logger";
import { TaxExemptOrganization, OpenAIResponse, WebsiteConfirmationSchema } from "@/types";

const BATCH_SIZE = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 100;

// Backfill focuses exclusively on parsing and applying website-related fields from AI responses

function monthAgoIso(): string {
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
}

// NOTE: Keep logic minimal and defensive; rely on DB filters for selection criteria

async function run() {
    await connectToDatabase();
    try {
        while (true) {
            const mongoFilter = {
                $and: [
                    { aiConfirmationResponse: { $exists: true } },
                    { websiteUrl: { $exists: false } },
                    { $or: [{ lastUpdated: { $exists: false } }, { lastUpdated: { $lt: monthAgoIso() } }] },
                ],
            };

            const orgs: TaxExemptOrganization[] = await findTaxExemptOrgs(BATCH_SIZE, mongoFilter);

            if (orgs.length === 0) {
                logger.info("No organizations require backfill");
                break;
            }

            const updates: TaxExemptOrganization[] = [];
            for (const org of orgs) {
                try {
                    // the conditions are mostly edge cases; we should never hit them, but it's good to be defensive
                    const resp = org.aiConfirmationResponse;

                    // Expect OpenAI-like shape; otherwise skip
                    const raw = resp as unknown as OpenAIResponse;
                    const content: string | undefined = raw?.body?.choices?.[0]?.message?.content;
                    if (!content) continue;

                    const parsedContent = WebsiteConfirmationSchema.parse(JSON.parse(content));

                    let updated: TaxExemptOrganization;
                    if (parsedContent.hasCorrectWebsite) {
                        updated = {
                            ...org,
                            websiteUrl: parsedContent.correctWebsiteUrl ?? undefined,
                            whySupport: parsedContent.whySupportOrganization ?? undefined,
                            mission: parsedContent.organizationMission ?? undefined,
                            tagline: parsedContent.organizationTagline ?? undefined,
                            uniqueTrait: parsedContent.organizationUniqueTrait ?? undefined,
                            targetAudience: parsedContent.organizationTargetAudience ?? undefined,
                            geographicFocus: parsedContent.organizationGeographicFocus ?? undefined,
                            keywords: parsedContent.organizationKeywords ?? undefined,
                            activities: parsedContent.organizationActivities ?? undefined,
                            lastUpdated: new Date().toISOString(),
                        };
                    } else {
                        updated = {
                            ...org,
                            lastUpdated: new Date().toISOString(),
                        };
                    }
                    updates.push(updated);
                } catch (error) {
                    logger.warn(
                        `Skipping org ${org._id?.toString?.() || org.ein}: could not parse aiConfirmationResponse: ${
                            error instanceof Error ? error.message : String(error)
                        }`
                    );
                }
            }

            if (updates.length > 0) {
                await bulkUpdateOrgs(updates);
                logger.info(`Backfilled ${updates.length} organizations`);
            }
        }
    } catch (error) {
        logger.error("Error in backfillWebsiteFields:", error);
        process.exitCode = 1;
    } finally {
        await disconnectFromDatabase();
    }
}

if (require.main === module) {
    run()
        .then(() => process.exit(0))
        .catch((err) => {
            logger.error(err);
            process.exit(1);
        });
}
