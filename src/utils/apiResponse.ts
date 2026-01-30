import type { Response } from "express";
class ApiResponse<T = unknown> {
  message: string;
  statusCode: number;
  status: string;
  data: T | null;
  
  constructor(message: string, statusCode: number, data: T) {
    this.message = message;
    this.statusCode = statusCode;
    this.status = statusCode >= 200 && statusCode < 300 ? "ok" : "Error";
    this.data = data;
  }

  static sendSuccess<T>(
    res: Response,
    statusCode: number,
    message: string,
    data: T
  ) {
    return res
      .status(statusCode)
      .json(new ApiResponse<T>(message, statusCode, data));
  }
}

export default ApiResponse;
