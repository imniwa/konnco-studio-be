import type { Response } from "express";

export default function sendResponse(
  res: Response,
  code: number,
  data: any = {},
) {
  switch (code) {
    case 201:
      return res.status(code).json({
        status: "created",
        data: data,
      });
    case 200:
    case 204:
      return res.status(code).json({
        status: "ok",
        data: data,
      });
    case 401:
      return res.status(code).json({
        status: "unauthorized",
      });
    case 403:
      return res.status(code).json({
        status: "forbidden",
      });
    case 400:
    case 404:
      return res.status(code).json({
        status: "invalid request",
        errors: data,
      });
    default:
      return res.status(500).json({
        status: "Internal server error",
      });
  }
}