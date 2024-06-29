import { Router } from "express";
import * as cartController from '@/controller/cart.controller'

const router = Router()
router.get('/', cartController.getAllCart)
router.post('/', cartController.addProduct2Cart)
router.put('/', cartController.updateProductFromCart)
router.delete('/', cartController.deleteProductFromCart)

export { router as cartRoute }