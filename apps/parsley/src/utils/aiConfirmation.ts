import { anyApi, type FunctionReference } from "convex/server";
import type { Id } from "@cause/backend/convex/_generated/dataModel";

export type LocalAiCandidate = {
  _id: Id<"organizations">;
  ein: string;
  name: string;
  street: string;
  city: string;
  state: string;
  nteeCode: string | undefined;
  crawlData: Array<{ url: string; title: string; textContent: string }>;
};

export type LocalAiCandidatePage = {
  page: LocalAiCandidate[];
  isDone: boolean;
  continueCursor: string;
};

export type CodexResearchCandidate = {
  _id: Id<"organizations">;
  ein: string;
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  nteeCode: string | undefined;
  activityCodes: string[] | undefined;
  assetBucket: string;
  incomeBucket: string;
  ico: string | undefined;
};

export type CodexResearchCandidatePage = {
  page: CodexResearchCandidate[];
  isDone: boolean;
  continueCursor: string;
};

export const listCandidatesRef = anyApi.localAiValidation!
  .listCandidates as FunctionReference<"query">;
export const commitResultRef = anyApi.localAiValidation!
  .commitResult as FunctionReference<"mutation">;
export const markUnverifiableRef = anyApi.localAiValidation!
  .markUnverifiable as FunctionReference<"mutation">;

export const listCodexResearchCandidatesRef = anyApi.codexResearch!
  .listCandidates as FunctionReference<"query">;
export const saveCodexResearchRunRef = anyApi.codexResearch!
  .saveRun as FunctionReference<"mutation">;
