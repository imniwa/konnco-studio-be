import { Router } from "express";
import * as authController from '@/controller/auth.controller'

const router = Router()
router.post("/register", authController.register)
router.post("/login", authController.customerLogin)
router.post("/login/admin", authController.adminLogin)

export { router as authRouter }