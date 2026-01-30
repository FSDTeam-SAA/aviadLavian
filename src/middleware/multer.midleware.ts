import multer, { StorageEngine } from "multer";
import { Request } from "express";
import path from "path";

/* ================= Storage ================= */

const storage: StorageEngine = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb): void => {
    cb(null, path.join(process.cwd(), "public", "temp"));
  },

  filename: (_req: Request, file: Express.Multer.File, cb): void => {
    const sanitizedName = file.originalname.replace(" ", "");
    cb(null, sanitizedName);
  },
});

/* ================= Upload ================= */

export const upload = multer({ storage });
