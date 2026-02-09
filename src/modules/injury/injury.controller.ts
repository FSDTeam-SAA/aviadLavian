import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateInjury, IUpdateInjury } from "./injury.interface";
import CustomError from "../../helpers/CustomError";
import { injuryService } from "./injury.service";

// Create injury manually
export const createInjury = asyncHandler(
  async (req: Request, res: Response) => {
    const data: ICreateInjury = req.body;
    console.log("📥 Received data:", JSON.stringify(data, null, 2));

    // Handle optional image upload
    if (req.file) {
      data.Image_URL = `/public/temp/${req.file.filename}`;
    }

    const injury = await injuryService.createInjury(data);
    ApiResponse.sendSuccess(res, 201, "Injury created successfully", injury);
  },
);

// Get single injury by custom Id or MongoDB _id
export const getInjury = asyncHandler(async (req: Request, res: Response) => {
  const { injuryId } = req.params;
  const injury = await injuryService.getSingleInjuryByIdOrCustomId(
    injuryId as string,
  );
  ApiResponse.sendSuccess(res, 200, "Injury found", injury);
});

// Get all injuries with pagination and filters
export const getAllInjuries = asyncHandler(
  async (req: Request, res: Response) => {
    const { injuries, meta } = await injuryService.getAllInjuries(req.query);
    ApiResponse.sendSuccess(res, 200, "Injuries found", injuries, meta);
  },
);

// Update injury
export const updateInjury = asyncHandler(
  async (req: Request, res: Response) => {
    const { injuryId } = req.params;
    const data: IUpdateInjury = req.body;

    // Handle optional image upload
    if (req.file) {
      data.Image_URL = `/public/temp/${req.file.filename}`;
    }

    const injury = await injuryService.updateInjury(injuryId as string, data);
    ApiResponse.sendSuccess(res, 200, "Injury updated successfully", injury);
  },
);

// Delete injury
export const deleteInjury = asyncHandler(
  async (req: Request, res: Response) => {
    const { injuryId } = req.params;
    const injury = await injuryService.deleteInjury(injuryId as string);
    ApiResponse.sendSuccess(res, 200, "Injury deleted successfully", {
      id: injury.Id,
      name: injury.Name,
    });
  },
);

// Upload CSV file
export const uploadCSV = asyncHandler(async (req: Request, res: Response) => {
  const file = req.file as Express.Multer.File;

  if (!file) {
    throw new CustomError(400, "CSV file is required", [
      { field: "file", message: "Please upload a CSV file" },
    ]);
  }

  const result = await injuryService.uploadCSV(file.path);

  const statusCode = result.success ? 200 : 207; // 207 Multi-Status for partial success
  const message = result.success
    ? `Successfully imported ${result.inserted} injuries`
    : `Import completed with issues: ${result.inserted} inserted, ${result.skipped} skipped, ${result.failed} failed`;

  ApiResponse.sendSuccess(res, statusCode, message, result);
});

// Get filter options
export const getFilterOptions = asyncHandler(
  async (req: Request, res: Response) => {
    const [bodyRegions, acuityValues, importanceLevels] = await Promise.all([
      injuryService.getBodyRegions(),
      injuryService.getAcuityValues(),
      injuryService.getImportanceLevels(),
    ]);

    ApiResponse.sendSuccess(res, 200, "Filter options retrieved", {
      bodyRegions,
      acuityValues,
      importanceLevels,
    });
  },
);

// Get all injuries by Primary_Body_Region
export const getInjuriesByRegion = asyncHandler(
  async (req: Request, res: Response) => {
    const { region } = req.params;
    const injuries = await injuryService.getInjuriesByRegion(region as string);
    ApiResponse.sendSuccess(
      res,
      200,
      `Injuries found for region: ${region}`,
      injuries,
    );
  },
);
