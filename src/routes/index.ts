import { Router } from "express";
import { authRouter } from "./auth.route";
import { productRoute } from "./products.route";
import { cartRoute } from "./cart.route";
import { transactionRoute } from "./transactions.route";
import { RoleMiddleware } from "@/lib/middleware";
import { getActiveProduct } from "@/controller/products.controller";

export const routes = Router();
routes.use('/auth', authRouter)
routes.use(RoleMiddleware)
routes.use('/admin/products', productRoute)
routes.use('/products', getActiveProduct)
routes.use('/carts', cartRoute)
routes.use('/transactions', transactionRoute)

routes.use((_req, res) => res.status(404).send("NOT_FOUND"));