/**
 * Interface representing a row from the IRS Exempt Organizations (EO) file.
 * This is the raw format before transformation to TaxExemptOrganization.
 */
export interface EoFileRow {
  EIN: string;
  NAME: string;
  ICO: string;
  STREET: string;
  CITY: string;
  STATE: string;
  ZIP: string;
  GROUP: string;
  SUBSECTION: string;
  AFFILIATION: string;
  CLASSIFICATION: string;
  RULING: string;
  DEDUCTIBILITY: string;
  FOUNDATION: string;
  ACTIVITY: string;
  ORGANIZATION: string;
  STATUS: string;
  TAX_PERIOD: string;
  ASSET_CD: string;
  INCOME_CD: string;
  FILING_REQ_CD: string;
  PF_FILING_REQ_CD: string;
  ACCT_PD: string;
  ASSET_AMT?: string;
  INCOME_AMT?: string;
  REVENUE_AMT?: string;
  NTEE_CD: string;
  SORT_NAME: string;
}
