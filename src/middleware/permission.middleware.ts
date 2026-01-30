import { Request, Response, NextFunction } from "express";
import { userModel } from "../models/user.model";
import CustomError from "../helpers/CustomError";

/* ================= Types ================= */

type Role = "admin" | "user" | string;
type Permission = string;

interface AuthUser {
  _id: string;
  email: string;
  role: Role;
  permissions?: Permission[];
}

interface CustomRequest extends Request {
  user?: AuthUser;
}

/* ================= Middleware ================= */

export const permission =
  (allowedRoles: Role[] = [], allowedPermissions: Permission[] = []) =>
  async (
    req: CustomRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = (req.user as AuthUser)?._id;

      if (!userId) {
        throw new CustomError(401, "Unauthorized access");
      }

      /* ================= Fetch User ================= */
      const user = await userModel.findById(userId).lean<{
        _id: string;
        email: string;
        role: Role;
        permissions?: Permission[];
        accountStatus: "active" | "inactive" | "blocked";
      }>();

      if (!user) {
        throw new CustomError(401, "User not found");
      }

      /* ================= Account Status ================= */
      if (user.accountStatus !== "active") {
        throw new CustomError(
          403,
          `Your account is ${user.accountStatus}. Access denied.`
        );
      }

      /* ================= Role Check ================= */
      if (allowedRoles.length && !allowedRoles.includes(user.role)) {
        throw new CustomError(403, "You do not have role permission.");
      }

      /* ================= Permission Check ================= */
      if (allowedPermissions.length) {
        const hasPermission = user.permissions?.some((permission) =>
          allowedPermissions.includes(permission)
        );

        if (!hasPermission) {
          throw new CustomError(403, "You do not have required permissions.");
        }
      }

      /* ================= Attach User ================= */
      req.user = {
        _id: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
      } as AuthUser;

      next();
    } catch (error) {
      next(error);
    }
  };
