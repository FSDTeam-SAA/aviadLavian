import type { Response } from "express";
class ApiResponse<T = unknown> {
  static sendError(res: Response<any, Record<string, any>>, arg1: number, arg2: string, arg3: any): any {
      throw new Error("Method not implemented.");
  }
  message: string;
  statusCode: number;
  status: string;
  meta?: any;
  data: T | string;

  constructor(message: string, statusCode: number, data?: T, meta?: any) {
    this.message = message;
    this.statusCode = statusCode;
    this.status = statusCode >= 200 && statusCode < 300 ? "ok" : "Error";
    this.data = data || "null";
    this.meta = meta;
  }

  static sendSuccess<T>(
    res: Response,
    statusCode: number,
    message: string,
    data?: T,
    meta?: any,
  ) {
    return res
      .status(statusCode)
      .json(new ApiResponse<T>(message, statusCode, data, meta));
  }
}

export default ApiResponse;
