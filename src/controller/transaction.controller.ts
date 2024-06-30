import { createMidtransTransaction, getMidtransTransactionStatus } from "@/lib/helper/midtrans"
import sendResponse from "@/lib/helper/response"
import { prisma } from "@/lib/utils"
import type { Request, Response } from "express"

export async function getAllTransactions(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)
    const transactions = await prisma.transactions.findMany({
        where: {
            customerId: user.id
        }
    })
    return sendResponse(res, 200, transactions.map((transaction) => ({
        ...transaction,
        id: Number(transaction.id)
    })))
}

export async function getTransactionDetails(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string,
        }
    })
    if (!user) return sendResponse(res, 401)
    const { midtransOrderId } = req.params
    const transaction = await prisma.transactions.findFirst({
        where: {
            customerId: user.id,
            midtransOrderId: midtransOrderId
        }
    })
    if (!transaction) return sendResponse(res, 404)
    return sendResponse(res, 200, {
        ...transaction,
        id: Number(transaction.id)
    })
}

export async function createTransaction(req: Request, res: Response) {
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
            productId: false,
            product: true,
            qty: true
        },
        where: {
            customerId: user.id
        }
    })
    const amount = cart.reduce((acc, item) => acc + item.qty * item.product.price, 0)
    const midtransOrderId = `ORDER-${userId}-${Math.random().toString(36).substring(6)}`
    const transaction = await createMidtransTransaction({
        order_id: midtransOrderId,
        gross_amount: amount,
    }, cart.map((item) => ({
        id: String(item.product.id),
        name: item.product.name,
        price: item.product.price,
        quantity: item.qty
    })), {
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
    })
    await prisma.transactions.create({
        data: {
            customerId: user.id,
            status: "PENDING",
            amount: amount,
            midtransOrderId: midtransOrderId,
        }
    })
    return sendResponse(res, 201, transaction)
}

export async function approveTransaction(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)
    const { midtransOrderId } = req.params
    const transaction = await prisma.transactions.findFirst({
        where: {
            customerId: user.id,
            midtransOrderId: midtransOrderId
        }
    })
    if (!transaction) return sendResponse(res, 404)
    if (transaction.status !== "PENDING") return sendResponse(res, 400)
    const getMidtransDetails = await getMidtransTransactionStatus(midtransOrderId)
    if ((getMidtransDetails?.status_message as string).includes('success')){
        await prisma.transactions.update({
            where: {
                id: transaction.id
            },
            data: {
                status: "APPROVED"
            }
        })
        const carts = await prisma.cart.findMany({
            where: {
                customerId: user.id
            }
        })
        await prisma.orders.createMany({
            data: carts.map((cart) => ({
                customerId: user.id,
                productId: cart.productId,
                qty: cart.qty,
                transactionId: transaction.id
            }))
        })
        await prisma.cart.deleteMany({
            where: {
                customerId: user.id
            }
        })
    }
    return sendResponse(res, 204)
}

export async function cancelTransaction(req: Request, res: Response) {
    const userId = req.headers['userId']
    const user = await prisma.customers.findFirst({
        where: {
            id: userId as string
        }
    })
    if (!user) return sendResponse(res, 401)
    const { midtransOrderId } = req.params
    const transaction = await prisma.transactions.findFirst({
        where: {
            customerId: user.id,
            midtransOrderId: midtransOrderId
        }
    })
    if (!transaction) return sendResponse(res, 404)
    if (transaction.status !== "PENDING") return sendResponse(res, 400)
    await prisma.transactions.update({
        where: {
            midtransOrderId: midtransOrderId
        },
        data: {
            status: "CANCELLED"
        }
    })
    const carts = await prisma.cart.findMany({
        where: {
            customerId: user.id
        }
    })
    await prisma.orders.createMany({
        data: carts.map((cart) => ({
            customerId: user.id,
            productId: cart.productId,
            qty: cart.qty,
            transactionId: transaction.id
        }))
    })
    await prisma.cart.deleteMany({
        where: {
            customerId: user.id
        }
    })
    return sendResponse(res, 204)
}