import { InjuryModel } from "./injury.model";
import {
  ICreateInjury,
  IUpdateInjury,
  GetAllInjuriesParams,
  CSVUploadResult,
  CSVRow,
} from "./injury.interface";
import CustomError from "../../helpers/CustomError";
import { paginationHelper } from "../../utils/pagination";
import * as fs from "node:fs";
import { parse } from "csv-parse";
import type { SortOrder } from "mongoose";

// Helper function to convert comma-separated string to array
const parseArrayField = (value: string): string[] => {
  if (!value || value.trim() === "") return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

// Create a single injury manually
const createInjury = async (data: ICreateInjury) => {
  const existingInjury = await InjuryModel.findOne({ Id: data.Id });
  if (existingInjury) {
    throw new CustomError(409, `Injury with Id '${data.Id}' already exists`);
  }

  const injury = await InjuryModel.create(data);
  if (!injury) throw new CustomError(400, "Injury not created");

  return injury;
};

// Get single injury by Id
const getSingleInjury = async (id: string) => {
  const injury = await InjuryModel.findOne({ Id: id });
  if (!injury) throw new CustomError(404, "Injury not found");

  return injury;
};

// Get single injury by MongoDB _id
const getSingleInjuryById = async (id: string) => {
  const injury = await InjuryModel.findById(id);
  if (!injury) throw new CustomError(404, "Injury not found");

  return injury;
};

// Get single injury by either MongoDB _id or custom Id field
const getSingleInjuryByIdOrCustomId = async (id: string) => {
  // First try to find by custom Id field
  let injury = await InjuryModel.findOne({ Id: id });

  // If not found and id looks like a MongoDB ObjectId, try to find by _id
  if (!injury && /^[0-9a-fA-F]{24}$/.test(id)) {
    injury = await InjuryModel.findById(id);
  }

  if (!injury) throw new CustomError(404, "Injury not found");

  return injury;
};

// Build search query
const buildSearchQuery = (search: string) => {
  const regex = new RegExp(search, "i");
  return {
    $or: [
      { Name: regex },
      { Id: regex },
      { Primary_Body_Region: regex },
      { Tags_Keywords: { $in: [regex] } },
      { Synonyms_Abbreviations: { $in: [regex] } },
      { Description: regex },
    ],
  };
};

// Build filter query
const buildFilterQuery = (
  primaryRegion?: string,
  acuity?: string,
  importanceLevel?: string,
) => {
  const query: any = {};

  if (primaryRegion) {
    query.Primary_Body_Region = new RegExp(primaryRegion, "i");
  }

  if (acuity) {
    query.Acuity = new RegExp(acuity, "i");
  }

  if (importanceLevel) {
    query.Importance_Level = new RegExp(importanceLevel, "i");
  }

  return query;
};

// Validate and build sort object
const buildSortObject = (
  sort: string = "ascending",
): Record<string, SortOrder> => {
  if (sort !== "ascending" && sort !== "descending") {
    throw new CustomError(
      400,
      "Invalid sort parameter, allowed values are 'ascending' and 'descending'",
    );
  }

  return sort === "ascending"
    ? { createdAt: 1 as SortOrder }
    : { createdAt: -1 as SortOrder };
};

// Get all injuries with pagination, sorting, filtering
const getAllInjuries = async ({
  page,
  limit,
  sort = "ascending",
  search,
  primaryRegion,
  acuity,
  importanceLevel,
}: GetAllInjuriesParams) => {
  const {
    page: currentPage,
    limit: pageLimit,
    skip,
  } = paginationHelper(page, limit);

  let query = buildFilterQuery(primaryRegion, acuity, importanceLevel);

  if (search) {
    query = { ...query, ...buildSearchQuery(search) };
  }

  const sortObj = buildSortObject(sort);

  const injuries = await InjuryModel.find(query)
    .skip(skip)
    .limit(pageLimit)
    .sort(sortObj);

  const totalInjuries = await InjuryModel.countDocuments(query);
  const meta = {
    page: currentPage,
    limit: pageLimit,
    total: totalInjuries,
    pages: Math.ceil(totalInjuries / pageLimit),
  };

  return { injuries, meta };
};

// Update injury
const updateInjury = async (id: string, data: IUpdateInjury) => {
  const injury = await InjuryModel.findOne({ Id: id });
  if (!injury) throw new CustomError(404, "Injury not found");

  Object.assign(injury, data);
  await injury.save();

  return injury;
};

// Delete injury
const deleteInjury = async (id: string) => {
  const injury = await InjuryModel.findOneAndDelete({ Id: id });
  if (!injury) throw new CustomError(404, "Injury not found");

  return injury;
};

// Validate required fields
const validateRequiredFields = (row: CSVRow, rowNumber: number) => {
  if (!row.Id || row.Id.trim() === "") {
    return {
      row: rowNumber,
      id: row.Id || "EMPTY",
      message: "Id is required",
    };
  }

  if (!row.Name || row.Name.trim() === "") {
    return { row: rowNumber, id: row.Id, message: "Name is required" };
  }

  if (!row.Primary_Body_Region || row.Primary_Body_Region.trim() === "") {
    return {
      row: rowNumber,
      id: row.Id,
      message: "Primary_Body_Region is required",
    };
  }

  return null;
};

// Check for duplicate IDs
const checkDuplicateId = (
  trimmedId: string,
  existingIds: Set<string>,
  processedIds: Set<string>,
) => {
  return existingIds.has(trimmedId) || processedIds.has(trimmedId);
};

// Transform CSV row to injury object
const transformRowToInjury = (row: CSVRow): ICreateInjury => {
  return {
    Id: row.Id.trim(),
    Name: row.Name.trim(),
    Primary_Body_Region: row.Primary_Body_Region.trim(),
    Secondary_Body_Region: row.Secondary_Body_Region?.trim() || "",
    Acuity: row.Acuity?.trim() || "",
    Age_Group: row.Age_Group?.trim() || "",
    Tissue_Type: parseArrayField(row.Tissue_Type || ""),
    Etiology_Mechanism: row.Etiology_Mechanism?.trim() || "",
    Common_Sports: parseArrayField(row.Common_Sports || ""),
    Synonyms_Abbreviations: parseArrayField(row.Synonyms_Abbreviations || ""),
    Importance_Level: row.Importance_Level?.trim() || "",
    Description: row.Description?.trim() || "",
    Video_URL: row.Video_URL?.trim() || "",
    Tags_Keywords: parseArrayField(row.Tags_Keywords || ""),
  };
};

// Helper function to validate a single CSV row
const validateAndTransformRow = (
  row: CSVRow,
  rowNumber: number,
  existingIds: Set<string>,
  processedIds: Set<string>,
): {
  valid: boolean;
  injury?: ICreateInjury;
  error?: { row: number; id: string; message: string };
  duplicate?: string;
} => {
  const validationError = validateRequiredFields(row, rowNumber);
  if (validationError) {
    return { valid: false, error: validationError };
  }

  const trimmedId = row.Id.trim();

  if (checkDuplicateId(trimmedId, existingIds, processedIds)) {
    return { valid: false, duplicate: trimmedId };
  }

  const injury = transformRowToInjury(row);

  return { valid: true, injury };
};

// Parse CSV file
const parseCSVFile = (filePath: string): Promise<CSVRow[]> => {
  return new Promise((resolve, reject) => {
    const rows: CSVRow[] = [];

    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
        }),
      )
      .on("data", (row: CSVRow) => rows.push(row))
      .on("error", (err) => reject(err))
      .on("end", () => resolve(rows));
  });
};

// Process a single CSV row
const processCSVRow = (
  row: CSVRow,
  rowNumber: number,
  existingIds: Set<string>,
  processedIds: Set<string>,
  result: CSVUploadResult,
  injuriesToInsert: ICreateInjury[],
) => {
  try {
    const validation = validateAndTransformRow(
      row,
      rowNumber,
      existingIds,
      processedIds,
    );

    if (validation.duplicate) {
      result.duplicates.push(validation.duplicate);
      result.skipped++;
      return;
    }

    if (!validation.valid && validation.error) {
      result.errors.push(validation.error);
      result.failed++;
      return;
    }

    if (validation.injury) {
      processedIds.add(validation.injury.Id);
      injuriesToInsert.push(validation.injury);
    }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    result.errors.push({
      row: rowNumber,
      id: row.Id || "UNKNOWN",
      message: errorMessage,
    });
    result.failed++;
  }
};

// Handle bulk insert errors
const handleBulkInsertErrors = (
  error: unknown,
  injuriesToInsert: ICreateInjury[],
  result: CSVUploadResult,
) => {
  const bulkError = error as {
    writeErrors?: Array<{ index: number; errmsg?: string }>;
  };

  if (!bulkError.writeErrors) {
    throw error;
  }

  result.inserted = injuriesToInsert.length - bulkError.writeErrors.length;

  for (const writeError of bulkError.writeErrors) {
    const failedInjury = injuriesToInsert[writeError.index];
    result.errors.push({
      row: writeError.index + 2,
      id: failedInjury?.Id || "UNKNOWN",
      message: writeError.errmsg || "Database insert error",
    });
    result.failed++;
  }
};

// Batch insert injuries
const batchInsertInjuries = async (
  injuriesToInsert: ICreateInjury[],
  result: CSVUploadResult,
) => {
  if (injuriesToInsert.length === 0) return;

  try {
    await InjuryModel.insertMany(injuriesToInsert, { ordered: false });
    result.inserted = injuriesToInsert.length;
  } catch (error: unknown) {
    handleBulkInsertErrors(error, injuriesToInsert, result);
  }
};

// CSV Upload - Parse and insert injuries from CSV file
const uploadCSV = async (filePath: string): Promise<CSVUploadResult> => {
  const result: CSVUploadResult = {
    success: true,
    totalRows: 0,
    inserted: 0,
    skipped: 0,
    failed: 0,
    duplicates: [],
    errors: [],
  };

  const existingInjuries = await InjuryModel.find({}, { Id: 1 });
  const existingIds = new Set(existingInjuries.map((i) => i.Id));
  const processedIds = new Set<string>();

  const records = await parseCSVFile(filePath);
  result.totalRows = records.length;

  const injuriesToInsert: ICreateInjury[] = [];

  records.forEach((row, index) => {
    if (!row) return;
    const rowNumber = index + 2;
    processCSVRow(
      row,
      rowNumber,
      existingIds,
      processedIds,
      result,
      injuriesToInsert,
    );
  });

  await batchInsertInjuries(injuriesToInsert, result);

  result.success = result.failed === 0 && result.errors.length === 0;

  fs.unlink(filePath, () => {});

  return result;
};

// Get all injuries by Primary_Body_Region
const getInjuriesByRegion = async (region: string) => {
  const injuries = await InjuryModel.find({ Primary_Body_Region: region });
  if (!injuries || injuries.length === 0) {
    throw new CustomError(404, `No injuries found for region: ${region}`);
  }
  return injuries;
};

// Get all unique body regions for filtering
const getBodyRegions = async () => {
  const regions = await InjuryModel.distinct("Primary_Body_Region");
  return regions.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

// Get all unique acuity values for filtering
const getAcuityValues = async () => {
  const values = await InjuryModel.distinct("Acuity");
  return values.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

// Get all unique importance levels for filtering
const getImportanceLevels = async () => {
  const values = await InjuryModel.distinct("Importance_Level");
  return values.filter(Boolean).sort((a, b) => a.localeCompare(b));
};

export const injuryService = {
  createInjury,
  getSingleInjury,
  getSingleInjuryById,
  getSingleInjuryByIdOrCustomId,
  getAllInjuries,
  updateInjury,
  deleteInjury,
  uploadCSV,
  getBodyRegions,
  getAcuityValues,
  getImportanceLevels,
  getInjuriesByRegion,
};
