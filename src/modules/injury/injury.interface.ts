export interface IInjury {
  Id: string;
  Name: string;
  Primary_Body_Region: string;
  Secondary_Body_Region: string;
  Acuity: string;
  Age_Group: string;
  Tissue_Type: string[];
  Etiology_Mechanism: string;
  Common_Sports: string[];
  Synonyms_Abbreviations: string[];
  Importance_Level: string;
  Description: string;
  Video_URL: string;
  Image_URL: string;
  Tags_Keywords: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateInjury {
  Id: string;
  Name: string;
  Primary_Body_Region: string;
  Secondary_Body_Region?: string;
  Acuity?: string;
  Age_Group?: string;
  Tissue_Type?: string[];
  Etiology_Mechanism?: string;
  Common_Sports?: string[];
  Synonyms_Abbreviations?: string[];
  Importance_Level?: string;
  Description?: string;
  Video_URL?: string;
  Image_URL?: string;
  Tags_Keywords?: string[];
}

export interface IUpdateInjury {
  Name?: string;
  Primary_Body_Region?: string;
  Secondary_Body_Region?: string;
  Acuity?: string;
  Age_Group?: string;
  Tissue_Type?: string[];
  Etiology_Mechanism?: string;
  Common_Sports?: string[];
  Synonyms_Abbreviations?: string[];
  Importance_Level?: string;
  Description?: string;
  Video_URL?: string;
  Image_URL?: string;
  Tags_Keywords?: string[];
}

export interface GetAllInjuriesParams {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
  primaryRegion?: string;
  acuity?: string;
  importanceLevel?: string;
}

export interface CSVUploadResult {
  success: boolean;
  totalRows: number;
  inserted: number;
  skipped: number;
  failed: number;
  duplicates: string[];
  errors: {
    row: number;
    id: string;
    message: string;
  }[];
}

export interface CSVRow {
  Id: string;
  Name: string;
  Primary_Body_Region: string;
  Secondary_Body_Region: string;
  Acuity: string;
  Age_Group: string;
  Tissue_Type: string;
  Etiology_Mechanism: string;
  Common_Sports: string;
  Synonyms_Abbreviations: string;
  Importance_Level: string;
  Description: string;
  Video_URL: string;
  Tags_Keywords: string;
}
