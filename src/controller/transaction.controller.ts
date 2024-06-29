import sendResponse from "@/lib/helper/response"
import { prisma, ValidateRequest } from "@/lib/utils"
import type { Request, Response } from "express"

export async function getAllTransactions(req: Request, res: Response) {
    const products = await prisma.products.findMany()
    return sendResponse(res, 200, products)
}

export async function getTransactionDetails(req: Request, res: Response){
    return sendResponse(res, 204)
}

export async function createTransaction(req: Request, res: Response) {
    return sendResponse(res, 204)
}

export async function updateTransaction(req: Request, res: Response){
    return sendResponse(res, 204)
}