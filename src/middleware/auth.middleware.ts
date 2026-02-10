import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import CustomError from "../helpers/CustomError";
import { userModel } from "../modules/usersAuth/user.models";
// import { redisTokenService } from "../helpers/redisTokenService";

interface TokenPayload extends JwtPayload {
  userId: string;
}
interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

export const authGuard = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.headers?.authorization?.split("Bearer ")[1];

    if (!accessToken) {
      throw new CustomError(401, "Access token not found!");
    }

    // // ✅ NEW: Check if token is blacklisted
    // const isBlacklisted =
    //   await redisTokenService.isTokenBlacklisted(accessToken);
    // if (isBlacklisted) {
    //   throw new CustomError(401, "Token has been revoked. Please login again.");
    // }

    const decoded = jwt.verify(
      accessToken,
      config.jwt.accessTokenSecret,
    ) as TokenPayload;

    if (!decoded || !decoded.userId) {
      throw new CustomError(401, "Invalid access token!");
    }

    const user = await userModel
      .findById(decoded.userId)
      .select("_id email role")
      .lean();
    if (!user) {
      throw new CustomError(401, "User not found!");
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

//check role admin or user i want array of roles
export const allowRole = (...roles: string[]) => {
  return async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.user?.role) {
        throw new CustomError(
          403,
          "You are not authorized to access this route!",
        );
      }
      if (!roles.includes(req.user.role)) {
        throw new CustomError(
          403,
          "You are not authorized to access this route!",
        );
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
