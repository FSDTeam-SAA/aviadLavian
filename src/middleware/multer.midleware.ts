import multer, { StorageEngine, MulterError, FileFilterCallback } from "multer";
import { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import CustomError from "../helpers/CustomError";

const storage: StorageEngine = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), "public", "temp");

    // create folder if not exists
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    cb(null, `${name}_${timestamp}${ext}`);
  },
});

// Only allow specific image types
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new CustomError(400, "Invalid file type", [
      { field: "image", message: "Only JPEG, PNG, JPG, WEBP are allowed" },
    ]));
  }
  cb(null, true);
};

// Multer instance
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 1MB
  fileFilter,
});

// Middleware wrapper to catch Multer errors
export const uploadSingle =
  (fieldName: string) =>
    (req: Request, res: Response, next: NextFunction) => {
      const singleUpload = upload.single(fieldName);

      singleUpload(req, res, (err) => {
        if (err) {
          // Multer file size limit
          if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
            return next(
              new CustomError(400, "File too large. Maximum size is 1MB", [
                { field: fieldName, message: "File too large. Maximum size is 5MB" },
              ])
            );
          }

          // Custom errors from fileFilter
          if (err instanceof CustomError) {
            return next(err);
          }

          // Other errors
          return next(new CustomError(400, err.message));
        }
        next();
      });
    };
