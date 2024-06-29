import sendResponse from "@/lib/helper/response"
import { prisma, ValidateRequest } from "@/lib/utils"
import type { Request, Response } from "express"

export async function getAllCart(req: Request, res: Response) {
    return sendResponse(res, 204)
}

export async function addProduct2Cart(req: Request, res: Response){
    return sendResponse(res, 204)
}

export async function updateProductFromCart(req: Request, res: Response){
    return sendResponse(res, 204)
}

export async function deleteProductFromCart(req: Request, res: Response) {
    return sendResponse(res, 204)
}