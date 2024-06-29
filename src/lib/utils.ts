import { PrismaClient } from '@prisma/client'
import type { Request } from 'express';
import { createHash } from 'node:crypto'
import { ZodError, type z } from 'zod';
import { dirname } from 'path'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "fs";
import * as jose from 'jose'

const secret = new TextEncoder().encode(process.env.SECRET)

export const prisma = new PrismaClient({
    // log: ['query', 'info']
});

export function hashPass(password: string): string {
    return createHash('sha256').update(password).digest('hex')
}

export function comparePass(password: string, hash: string): boolean {
    return hashPass(password) === hash
}

export async function signJWT(data: object) {
    const token = await new jose.SignJWT({
        data
    })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("1d")
        .sign(secret)
    return token
}

export async function verifyJWT(token: string) {
    const decode = await jose.jwtVerify(token, secret)
    const { data } = decode.payload as { data: { adminId: string | undefined, userId: string | undefined } }
    if (data.adminId) {
        return {
            role: 'admin',
            data: await prisma.admins.findFirst({
                where: {
                    id: data.adminId
                }
            })
        }
    }
    if (data.userId) {
        return {
            role: 'customer',
            data: await prisma.customers.findFirst({
                where: {
                    id: data.userId
                }
            })
        }
    }
    return false
}

export function saveImage(file: Express.Multer.File) {
    try {
        const fileName = `${Date.now()}-${file.originalname}`
        const path = `public/images/${fileName}`
        const dir = dirname(path)
        if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
        writeFileSync(path, file.buffer)
        return fileName    
    } catch (error) {
        return false
    }
}

export function deleteImage(fileName: string) {
    try {
        const path = `public/images/${fileName}`
        if (existsSync(path)) {
            unlinkSync(path)
            return true
        }
    } catch (err){
    }
    return false
}

export const ValidateRequest = (
    validationSchema: z.Schema,
    req: Request,
) => {
    try {
        validationSchema.parse(req.body);
    } catch (err) {
        if (err instanceof ZodError) {
            return err.errors.map(
                (error) => ({
                    field: error.path.join('.'),
                    error: error.message
                })
            );
        }
    }
};