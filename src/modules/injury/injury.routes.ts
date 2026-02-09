import express from "express";
import multer from "multer";
import * as path from "node:path";
import * as fs from "node:fs";
import {
  createInjury,
  getInjury,
  getAllInjuries,
  updateInjury,
  deleteInjury,
  uploadCSV,
  getFilterOptions,
  getInjuriesByRegion,
} from "./injury.controller";
import { validateRequest } from "../../middleware/validateRequest.middleware";
import { createInjurySchema, updateInjurySchema } from "./injury.validation";
import { authGuard, allowRole } from "../../middleware/auth.middleware";
import { uploadSingle } from "../../middleware/multer.midleware";
import CustomError from "../../helpers/CustomError";

const router = express.Router();

// CSV file upload configuration
const csvStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "public", "temp");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replaceAll(/\s+/g, "_");
    cb(null, `${name}_${timestamp}${ext}`);
  },
});

const csvFileFilter = (
  req: express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/csv",
    "text/plain",
  ];
  const allowedExtensions = [".csv"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (
    !allowedTypes.includes(file.mimetype) &&
    !allowedExtensions.includes(ext)
  ) {
    return cb(
      new CustomError(400, "Invalid file type", [
        { field: "file", message: "Only CSV files are allowed" },
      ]),
    );
  }
  cb(null, true);
};

const csvUpload = multer({
  storage: csvStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for CSV
  fileFilter: csvFileFilter,
});

// Routes

// Manual CRUD operations
router.post(
  "/create",
  authGuard,
  allowRole("admin"),
  uploadSingle("image"),
  validateRequest(createInjurySchema),
  createInjury,
);

router.get("/get/:injuryId", getInjury);

router.get("/get-all", getAllInjuries);

router.patch(
  "/update/:injuryId",
  authGuard,
  allowRole("admin"),
  uploadSingle("image"),
  validateRequest(updateInjurySchema),
  updateInjury,
);

router.delete("/delete/:injuryId", authGuard, allowRole("admin"), deleteInjury);

// CSV upload route
router.post(
  "/upload-csv",
  authGuard,
  allowRole("admin"),
  csvUpload.single("file"),
  uploadCSV,
);

// Get filter options (body regions, acuity values, importance levels)
router.get("/filter-options", getFilterOptions);

// Get all injuries by Primary_Body_Region
router.get("/region/:region", getInjuriesByRegion);

export default router;
