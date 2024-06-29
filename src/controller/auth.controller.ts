import sendResponse from "@/lib/helper/response";
import { comparePass, hashPass, prisma, signJWT, ValidateRequest } from "@/lib/utils";
import type { Request, Response } from "express";
import { z } from "zod";

export async function register(req: Request, res: Response) {
    const registerScheme = z.object({
        username: z.string().min(4, {
            message: "username length min 4 character"
        }).max(20, {
            message: "username length max 20 character"
        }),
        password: z.string().min(8),
        name: z.string().min(3),
        email: z.string().email(),
        phone: z.string().regex(/\+?([ -]?\d+)+|\(\d+\)([ -]\d+)/),
        address: z.string(),
    })
    const validate = ValidateRequest(registerScheme, req)
    const body = req.body
    if (validate) return sendResponse(res, 400, validate)
    const customer = await prisma.customers.create({
        data: {
            ...body,
            password: hashPass(body.password)
        }
    })
    return sendResponse(res, 201, {
        id: customer.id,
        username: customer.username,
        email: customer.email,
    })
}

export async function adminLogin(req: Request, res: Response) {
    const loginScheme = z.object({
        username: z.string(),
        password: z.string(),
    })
    const validate = ValidateRequest(loginScheme, req)
    if (validate) return sendResponse(res, 400, validate)
    const body = req.body
    const customer = await prisma.admins.findFirst({
        where: {
            username: body.username
        }
    })
    if (!customer) return sendResponse(res, 404, "user not found")
    const isPasswordMatch = comparePass(body.password, customer.password)
    if (!isPasswordMatch) return sendResponse(res, 401, "invalid password")
    const token = await signJWT({
        adminId: customer.id
    })
    return sendResponse(res, 200, {
        accessToken: token
    })
}

export async function customerLogin(req: Request, res: Response) {
    const loginScheme = z.object({
        username: z.union([
            z.undefined(), z.string()
        ]),
        email: z.union([
            z.undefined(), z.string()
        ]),
        password: z.string(),
    })
    const validate = ValidateRequest(loginScheme, req)
    if (validate) return sendResponse(res, 400, validate)
    const data = req.body
    const customer = await prisma.customers.findFirst({
        where: {
            OR: [
                {
                    username: data.username
                },
                {
                    email: data.email
                }
            ]
        }
    })
    if (!customer) return sendResponse(res, 404, "user not found")
    const isPasswordMatch = comparePass(data.password, customer.password)
    if (!isPasswordMatch) return sendResponse(res, 401, "invalid password")
    const token = await signJWT({
        userId: customer.id
    })
    return sendResponse(res, 200, {
        accessToken: token
    })
}