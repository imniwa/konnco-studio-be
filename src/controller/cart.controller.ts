import sendResponse from "@/lib/helper/response"
import { prisma } from "@/lib/utils"
import type { Request, Response } from "express"
import { z } from "zod"

export async function getAllCart(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)
    const cart = await prisma.cart.findMany({
        select: {
            customerId: false,
            qty: true,
            product: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    img: true
                }
            }
        },
        where: {
            customerId: user.id,
        }
    })
    return sendResponse(res, 200, cart.map((product) => ({
        ...product,
        product: {
            ...product.product,
            id: Number(product.product.id)
        }
    })))
}

export async function addProduct2Cart(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)

    const bodySchema = z.object({
        productId: z.number().or(z.string().transform((val, ctx) => {
            if(isNaN(Number(val))) return ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "invalid product id"
            })
            return Number(val)
        })),
        qty: z.number().gt(1, {
            message: "Quantity must be greater than 1"
        })
    })
    const { data, error } = bodySchema.safeParse(req.body)
    if (!data) return sendResponse(res, 400, error?.errors.map((err) => ({
        field: err.path,
        message: err.message
    })))
    const { productId, qty } = data

    const product = await prisma.products.findFirst({
        where: {
            id: productId as number
        }
    })
    if (!product) return sendResponse(res, 404, "Product not found")

    // Check if product stock is enough
    if (product.stock - qty < 0) return sendResponse(res, 400, "Product out of stock")

    // update product stock and add product to cart
    await prisma.products.update({
        where: {
            id: productId as number
        },
        data: {
            stock: {
                decrement: qty
            }
        }
    })

    // add product to cart
    await prisma.cart.upsert({
        where: {
            id: {
                customerId: user.id,
                productId: product.id
            }
        },
        create: {
            customerId: user.id,
            productId: product.id,
            qty: qty
        },
        update: {
            qty: {
                increment: qty
            }
        }
    })

    // return all product in cart
    const cart = await prisma.cart.findMany({
        select: {
            productId: false,
            qty: true,
            product: true
        },
        where: {
            customerId: user.id,
            productId: product.id
        }
    })
    return sendResponse(res, 200, cart.map((product) => ({
        ...product,
        product: {
            ...product.product,
            id: Number(product.product.id)
        }
    })))
}

export async function updateProductFromCart(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)
    const bodySchema = z.object({
        productId: z.number().or(z.string().transform((val, ctx) => {
            if(isNaN(Number(val))) return ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "invalid product id"
            })
            return Number(val)
        })),
        qty: z.number()
    })
    const { data, error } = bodySchema.safeParse(req.body)
    if (!data) return sendResponse(res, 400, error?.errors.map((err) => ({
        field: err.path,
        message: err.message
    })))
    const { productId, qty } = data
    const product = await prisma.products.findFirst({
        where: {
            id: productId as number
        }
    })
    if (!product) return sendResponse(res, 404, "Product not found")
    const cart = await prisma.cart.findFirst({
        where: {
            customerId: user.id,
            productId: product.id
        }
    })
    if (!cart) return sendResponse(res, 404, "Product not found in cart")

    // Check if product stock is enough
    if (product.stock < qty) return sendResponse(res, 400, "Product out of stock")

    await prisma.cart.update({
        where: {
            id: {
                customerId: user.id,
                productId: product.id
            }
        },
        data: {
            qty: qty
        }
    })

    await prisma.products.update({
        where: {
            id: productId as number
        },
        data: {
            stock: {
                decrement: qty - cart.qty
            }
        }
    })

    // return all product in cart
    const allProductInCart = await prisma.cart.findMany({
        select: {
            productId: false,
            qty: true,
            product: {
                select: {
                    id: true,
                    name: true,
                    price: true,
                    img: true
                }
            }
        },
        where: {
            customerId: user.id
        }
    })
    return sendResponse(res, 200, allProductInCart.map((product) => ({
        ...product,
        product: {
            ...product.product,
            id: Number(product.product.id)
        }
    })))
}

export async function deleteProductFromCart(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)
    const { productId } = req.body
    const product = await prisma.products.findFirst({
        where: {
            id: productId
        }
    })
    if (!product) return sendResponse(res, 404, "Product not found")
    const cart = await prisma.cart.findFirst({
        where: {
            customerId: user.id,
            productId: product.id
        }
    })
    if (!cart) return sendResponse(res, 404, "Product not found in cart")
    await prisma.products.update({
        where: {
            id: product.id
        },
        data: {
            stock: {
                increment: cart.qty
            }
        }
    })
    await prisma.cart.delete({
        where: {
            id: {
                customerId: user.id,
                productId: product.id
            }
        },
    })
    return sendResponse(res, 204)
}