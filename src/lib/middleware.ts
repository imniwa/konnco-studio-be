import type { NextFunction, Request, Response } from "express";
import sendResponse from "./helper/response";
import { CustomError } from "./http.exception";
import { verifyJWT } from "./utils";

export async function RoleMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (
        !req.header("Authorization") &&
        !req.header("Authorization")?.startsWith("Bearer ")
    ) {
        return sendResponse(res, 401, "Unauthorized")
    }
    const token = req.header("Authorization")?.split(" ")[1];
    if (!token) return sendResponse(res, 401, "Unauthorized")
    try {
        const payload = await verifyJWT(token);
        if (!payload) return sendResponse(res, 401, "Unauthorized")
        if (req.originalUrl.includes('products')
            && payload.role !== "admin") {
            return sendResponse(res, 403, "Forbidden")
        }
        next();
    } catch (error) {
        if (error instanceof CustomError) {
            return sendResponse(res, error.statusCode, error.message)
        }
        return sendResponse(res, 500, "Internal Server Error")
    }
}