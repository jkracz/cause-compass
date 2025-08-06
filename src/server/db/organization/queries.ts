"server-only";

import { connectToMongoDB } from "../connection";
import TaxExemptOrganizationModel, { ITaxExemptOrganization } from "./model";
import { OrganizationSearchFilters } from "@/lib/schemas";

// Get organization by EIN
export async function getOrganizationByEin(
  ein: string,
): Promise<ITaxExemptOrganization | null> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.findOne({ ein }).exec();
}

// Get organization by ID
export async function getOrganizationById(
  id: string,
): Promise<ITaxExemptOrganization | null> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.findById(id).exec();
}

// Search organizations by name
export async function searchOrganizationsByName(
  searchTerm: string,
  limit: number = 10,
  skip: number = 0,
): Promise<ITaxExemptOrganization[]> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.find({
    $text: { $search: searchTerm },
  })
    .limit(limit)
    .skip(skip)
    .exec();
}

// Get organizations by state
export async function getOrganizationsByState(
  state: string,
  limit: number = 10,
  skip: number = 0,
): Promise<ITaxExemptOrganization[]> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.find({ state })
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
}

// Get organizations by NTEE code
export async function getOrganizationsByNteeCode(
  nteeCode: string,
  limit: number = 10,
  skip: number = 0,
): Promise<ITaxExemptOrganization[]> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.find({
    "nteeCode.code": nteeCode,
  })
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
}

// Get organizations by NTEE major code
export async function getOrganizationsByNteeMajorCode(
  majorCode: string,
  limit: number = 10,
  skip: number = 0,
): Promise<ITaxExemptOrganization[]> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.find({
    "nteeCode.majorCode.code": majorCode,
  })
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
}

// Get organizations by city and state
export async function getOrganizationsByLocation(
  city: string,
  state: string,
  limit: number = 10,
  skip: number = 0,
): Promise<ITaxExemptOrganization[]> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.find({ city, state })
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
}

// Get total count of organizations
export async function getOrganizationCount(): Promise<number> {
  await connectToMongoDB();
  return await TaxExemptOrganizationModel.countDocuments().exec();
}

// Advanced search with multiple filters
export async function searchOrganizations(
  filters: OrganizationSearchFilters,
  limit: number = 10,
  skip: number = 0,
): Promise<ITaxExemptOrganization[]> {
  await connectToMongoDB();

  const query: Record<string, unknown> = {};

  if (filters.name) {
    query.$text = { $search: filters.name };
  }

  if (filters.state) {
    query.state = filters.state;
  }

  if (filters.city) {
    query.city = filters.city;
  }

  if (filters.nteeCode) {
    query["nteeCode.code"] = filters.nteeCode;
  }

  if (filters.nteeMajorCode) {
    query["nteeCode.majorCode.code"] = filters.nteeMajorCode;
  }

  if (filters.organizationType) {
    query["organization.type"] = filters.organizationType;
  }

  if (filters.assetAmtMin !== undefined || filters.assetAmtMax !== undefined) {
    query.assetAmt = {};
    if (filters.assetAmtMin !== undefined) {
      query.assetAmt.$gte = filters.assetAmtMin;
    }
    if (filters.assetAmtMax !== undefined) {
      query.assetAmt.$lte = filters.assetAmtMax;
    }
  }

  return await TaxExemptOrganizationModel.find(query)
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
}
