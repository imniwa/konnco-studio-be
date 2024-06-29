import sendResponse from "@/lib/helper/response"
import { deleteImage, prisma, saveImage, ValidateRequest } from "@/lib/utils"
import type { Request, Response } from "express"
import { z } from "zod"

export async function getAllProduct(req: Request, res: Response) {
    const products = await prisma.products.findMany({
        orderBy: {
            id: "desc"
        }
    })
    return sendResponse(res, 200, products.map((product) => ({
        ...product,
        id: String(product.id),
    })))
}

export async function getActiveProduct(req: Request, res: Response){
    const products = await prisma.products.findMany({
        where: {
            isAvailable: true
        },
        orderBy: {
            id: "desc"
        }
    })
    return sendResponse(res, 200, products.map((product) => ({
        ...product,
        id: String(product.id),
    })))
}

export async function createProduct(req: Request, res: Response) {
    const fileSchema = z.object({
        fieldname: z.string(),
        originalname: z.string(),
        encoding: z.string(),
        mimetype: z.string().includes("image", { message: "File must be an image" }),
        buffer: z.instanceof(Buffer),
    })
    if (req.file === undefined) return sendResponse(res, 400, "File is required")
    const validateFile = fileSchema.safeParse(req.file)
    if (!validateFile.success) {
        return sendResponse(res, 400,
            validateFile.error?.errors.map((error) => ({
                field: error.path.join("."),
                error: error.message,
            }))
        )
    }
    const bodySchema = z.object({
        name: z.string(),
        price: z.string()
            .transform((val, ctx) => {
                const num = Number(val)
                if (isNaN(num)) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Price must be a number",
                    })
                }
                return num
            }),
        stock: z.string()
            .transform((val, ctx) => {
                const num = Number(val)
                if (isNaN(num)) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Stock must be a number",
                    })
                }
                return num
            }),
        isAvailable: z.string().transform((val) => String(val) === "true"),
    })
    const validateBody = bodySchema.safeParse(req.body)
    if (!validateBody.success) {
        return sendResponse(res, 400,
            validateBody.error?.errors.map((error) => ({
                field: error.path.join("."),
                error: error.message,
            }))
        )
    }
    const { data } = bodySchema.safeParse(req.body)
    if (!data) return sendResponse(res, 400, "Invalid data")
    const saveFile = saveImage(req.file)
    if (!saveFile) return sendResponse(res, 500, "Failed to save image")
    const product = await prisma.products.create({
        data: {
            ...data,
            img: saveFile,
        },
    })
    return sendResponse(res, 201, {
        ...product,
        id: String(product.id),
    })
}

export async function updateProduct(req: Request, res: Response) {
    const { id } = req.params
    if (isNaN(Number(id))) return sendResponse(res, 400, "invalid ID")
    const product = await prisma.products.findFirst({
        where: {
            id: Number(id)
        }
    })
    if (!product) return sendResponse(res, 404, "Product not found")
    const bodySchema = z.object({
        name: z.string().optional(),
        price: z.string()
            .transform((val, ctx) => {
                const num = Number(val)
                if (isNaN(num)) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Price must be a number",
                    })
                }
                return num
            }).optional(),
        stock: z.string()
            .transform((val, ctx) => {
                const num = Number(val)
                if (isNaN(num)) {
                    ctx.addIssue({
                        code: "custom",
                        message: "Stock must be a number",
                    })
                }
                return num
            }).optional(),
        isAvailable: z.string().transform((val) => String(val) === "true").optional(),
    })
    const validateBody = bodySchema.safeParse(req.body)
    if (!validateBody.success) {
        return sendResponse(res, 400,
            validateBody.error?.errors.map((error) => ({
                field: error.path.join("."),
                error: error.message,
            }))
        )
    }
    const { data } = bodySchema.safeParse(req.body)
    if (!data) return sendResponse(res, 400, "Invalid data")
    if (req.file) {
        const fileSchema = z.object({
            fieldname: z.string(),
            originalname: z.string(),
            encoding: z.string(),
            mimetype: z.string().includes("image", { message: "File must be an image" }),
            buffer: z.instanceof(Buffer),
        })
        const validateFile = fileSchema.safeParse(req.file)
        if (!validateFile.success) {
            return sendResponse(res, 400,
                validateFile.error?.errors.map((error) => ({
                    field: error.path.join("."),
                    error: error.message,
                }))
            )
        }
        deleteImage(product.img)
        const saveFile = saveImage(req.file)
        if(saveFile) {
            await prisma.products.update({
                where: {
                    id: Number(id)
                },
                data: {
                    img: saveFile
                }
            })
        }
    }
    const updatedProduct = await prisma.products.update({
        where: {
            id: Number(id)
        },
        data: data
    })
    return sendResponse(res, 200, {
        ...updatedProduct,
        id: String(updatedProduct.id),
    })
}

export async function deleteProduct(req: Request, res: Response) {
    const {id} = req.params
    if (isNaN(Number(id))) return sendResponse(res, 400, "invalid ID")
    const product = await prisma.products.findFirst({
        where: {
            id: Number(id)
        }
    })
    if (!product) return sendResponse(res, 404, "Product not found")
    deleteImage(product.img)
    await prisma.products.delete({
        where: {
            id: Number(id)
        }
    })
    return sendResponse(res, 204)
}