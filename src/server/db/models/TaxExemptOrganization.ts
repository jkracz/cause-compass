import mongoose, { Schema, Document } from 'mongoose';
import { TaxExemptOrganization } from '../../schemas';

// Extend the TaxExemptOrganization type with Mongoose Document (omit _id to avoid conflicts)
export interface ITaxExemptOrganization extends Omit<TaxExemptOrganization, '_id'>, Document {}

// Define the Mongoose schema
const TaxExemptOrganizationSchema = new Schema<ITaxExemptOrganization>(
  {
    // Core Organization Info
    ein: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, index: true },
    ico: { type: String },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    group: { type: String },
    slug: { type: String, unique: true, sparse: true },

    // Tax/Legal Classification
    subsection: { type: String, required: true },
    affiliation: {
      code: { type: String, required: true },
      code_name: { type: String, required: true },
      description: { type: String, required: true },
    },
    classification: { type: String, required: true },
    ruling: { type: String, required: true },
    deductibility: {
      code: { type: String, required: true },
      description: { type: String, required: true },
    },
    foundation: {
      code: { type: String, required: true },
      description: { type: String, required: true },
    },
    activityCodes: [{
      code: { type: String, required: true },
      description: { type: String, required: true },
      category: { type: String, required: true },
    }],
    organization: {
      code: { type: String, required: true },
      type: { type: String, required: true },
    },
    status: {
      code: { type: String, required: true },
      description: { type: String, required: true },
    },

    // Financial Info
    taxPeriod: { type: String },
    assetCode: {
      code: { type: String, required: true },
      lowerLimit: { type: Number, required: true },
      upperLimit: { type: Number, default: null },
    },
    incomeCode: { type: String, required: true },
    filingReqCode: {
      code: { type: String, required: true },
      description: { type: String, required: true },
      form_number: { type: String, required: true },
    },
    pfFilingReqCode: {
      code: { type: String },
      description: { type: String },
      form_number: { type: String },
    },
    acctPeriod: { type: String, required: true },
    assetAmt: { type: Number },
    incomeAmt: { type: Number },
    revenueAmt: { type: Number },

    // NTEE Classification
    nteeCode: {
      code: { type: String },
      title: { type: String },
      description: { type: String },
      keywords: [{ type: String }],
      majorCode: {
        code: { type: String },
        description: { type: String },
        title: { type: String },
      },
    },
    sortName: { type: String },

    // Search/Crawl Data
    searchResults: [{
      kind: { type: String },
      title: { type: String },
      htmlTitle: { type: String },
      link: { type: String },
      displayLink: { type: String },
      snippet: { type: String },
      htmlSnippet: { type: String },
      formattedUrl: { type: String },
      htmlFormattedUrl: { type: String },
      pagemap: { type: Schema.Types.Mixed },
    }],
    searchKey: { 
      type: String, 
      enum: ['CC', 'PERSONAL', 'JKRACZ', 'SF', 'JK'] 
    },
    resultsParsedAt: { type: String },
    confirmationCrawlItems: [{
      title: { type: String, required: true },
      url: { type: String, required: true },
      textContent: { type: String, required: true },
      socialMediaUrls: [{ type: String }],
      hasNewsletterSignup: { type: Boolean },
      donationLinks: [{ type: String }],
      emailAddresses: [{ type: String }],
      logoLinks: [{ type: String }],
      aboutLinks: [{ type: String }],
    }],
    aiConfirmationResponse: { type: Schema.Types.Mixed },

    // Organization Details
    socialMediaUrls: {
      linkedin: { type: String },
      youtube: { type: String },
      x: { type: String },
      instagram: { type: String },
      threads: { type: String },
      facebook: { type: String },
      twitter: { type: String },
    },
    donationUrl: { type: String },
    emailAddresses: [{ type: String }],
    logoUrl: { type: String },
    websiteUrl: { type: String },

    // Timestamps
    searchedAt: { type: String },
  },
  {
    timestamps: true, // This adds createdAt and updatedAt automatically
    collection: 'tax_exempt_organizations',
  }
);

// Create indexes for better query performance
TaxExemptOrganizationSchema.index({ name: 'text', ein: 1 });
TaxExemptOrganizationSchema.index({ state: 1, city: 1 });
TaxExemptOrganizationSchema.index({ 'nteeCode.majorCode.code': 1 });
TaxExemptOrganizationSchema.index({ 'organization.type': 1 });

// Create and export the model
const TaxExemptOrganizationModel = mongoose.models.TaxExemptOrganization || 
  mongoose.model<ITaxExemptOrganization>('TaxExemptOrganization', TaxExemptOrganizationSchema);

export default TaxExemptOrganizationModel; 