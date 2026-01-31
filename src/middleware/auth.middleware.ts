import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../config";
import CustomError from "../helpers/CustomError";
import { userModel } from "../modules/usersAuth/user.models";

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
      (req.headers.accesstoken as string | undefined);

    if (!accessToken) {
      throw new CustomError(401, "Unauthorized access!");
    }

    const decoded = jwt.verify(
      accessToken,
      config.jwt.accessTokenSecret,
    ) as TokenPayload;

    if (!decoded || !decoded.userId) {
      throw new CustomError(401, "Invalid access token!");
    }

    const user = await userModel
      .findById(decoded.userId)
      .select("_id email role permissions accountStatus")
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
