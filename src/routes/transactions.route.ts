import { Router } from "express";
import * as transactionController from '@/controller/transaction.controller'

const router = Router()
router.get('/', transactionController.getAllTransactions)
router.get('/:id', transactionController.getTransactionDetails)
router.post('/', transactionController.createTransaction)
router.put('/', transactionController.updateTransaction)

export { router as transactionRoute }