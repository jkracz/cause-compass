import { connectToMongoDB } from '../connection';
import TaxExemptOrganizationModel, { ITaxExemptOrganization } from '../models/TaxExemptOrganization';
import { CreateTaxExemptOrganization, UpdateTaxExemptOrganization } from '../../schemas';

// Ensure database connection
async function ensureConnection() {
  await connectToMongoDB();
}

// Create a new organization
export async function createOrganization(data: CreateTaxExemptOrganization): Promise<ITaxExemptOrganization> {
  await ensureConnection();
  const organization = new TaxExemptOrganizationModel(data);
  return await organization.save();
}

// Get organization by EIN
export async function getOrganizationByEin(ein: string): Promise<ITaxExemptOrganization | null> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.findOne({ ein }).exec();
}

// Get organization by ID
export async function getOrganizationById(id: string): Promise<ITaxExemptOrganization | null> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.findById(id).exec();
}

// Update organization by EIN
export async function updateOrganizationByEin(
  ein: string, 
  updates: Partial<UpdateTaxExemptOrganization>
): Promise<ITaxExemptOrganization | null> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.findOneAndUpdate(
    { ein },
    { ...updates, lastUpdated: new Date().toISOString() },
    { new: true, runValidators: true }
  ).exec();
}

// Delete organization by EIN
export async function deleteOrganizationByEin(ein: string): Promise<boolean> {
  await ensureConnection();
  const result = await TaxExemptOrganizationModel.deleteOne({ ein }).exec();
  return result.deletedCount > 0;
}

// Search organizations by name
export async function searchOrganizationsByName(
  searchTerm: string, 
  limit: number = 10,
  skip: number = 0
): Promise<ITaxExemptOrganization[]> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.find({
    $text: { $search: searchTerm }
  })
  .limit(limit)
  .skip(skip)
  .exec();
}

// Get organizations by state
export async function getOrganizationsByState(
  state: string,
  limit: number = 10,
  skip: number = 0
): Promise<ITaxExemptOrganization[]> {
  await ensureConnection();
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
  skip: number = 0
): Promise<ITaxExemptOrganization[]> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.find({
    'nteeCode.code': nteeCode
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
  skip: number = 0
): Promise<ITaxExemptOrganization[]> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.find({
    'nteeCode.majorCode.code': majorCode
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
  skip: number = 0
): Promise<ITaxExemptOrganization[]> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.find({ city, state })
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
}

// Get total count of organizations
export async function getOrganizationCount(): Promise<number> {
  await ensureConnection();
  return await TaxExemptOrganizationModel.countDocuments().exec();
}

// Advanced search with multiple filters
export interface OrganizationSearchFilters {
  name?: string;
  state?: string;
  city?: string;
  nteeCode?: string;
  nteeMajorCode?: string;
  organizationType?: string;
  assetAmountMin?: number;
  assetAmountMax?: number;
}

export async function searchOrganizations(
  filters: OrganizationSearchFilters,
  limit: number = 10,
  skip: number = 0
): Promise<ITaxExemptOrganization[]> {
  await ensureConnection();
  
  const query: any = {};
  
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
    query['nteeCode.code'] = filters.nteeCode;
  }
  
  if (filters.nteeMajorCode) {
    query['nteeCode.majorCode.code'] = filters.nteeMajorCode;
  }
  
  if (filters.organizationType) {
    query['organization.type'] = filters.organizationType;
  }
  
  if (filters.assetAmountMin !== undefined || filters.assetAmountMax !== undefined) {
    query.assetAmt = {};
    if (filters.assetAmountMin !== undefined) {
      query.assetAmt.$gte = filters.assetAmountMin;
    }
    if (filters.assetAmountMax !== undefined) {
      query.assetAmt.$lte = filters.assetAmountMax;
    }
  }
  
  return await TaxExemptOrganizationModel.find(query)
    .limit(limit)
    .skip(skip)
    .sort({ name: 1 })
    .exec();
} 