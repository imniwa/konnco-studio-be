import { Router } from "express";
import * as productController from '@/controller/products.controller'
import multer from "multer";
import { RoleMiddleware } from "@/lib/middleware";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router()
router.use(RoleMiddleware)
router.get('/', productController.getAllProduct)
router.post('/', upload.single('file'), productController.createProduct)
router.put('/:id', upload.single('file'), productController.updateProduct)
router.delete('/:id', productController.deleteProduct)

export { router as productRoute }