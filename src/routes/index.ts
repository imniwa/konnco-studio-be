import { Router } from "express";
import { authRouter } from "./auth.route";
import { productRoute } from "./products.route";

export const routes = Router();
routes.use('/auth', authRouter)
routes.use('/products', productRoute)
routes.use((_req, res) => res.status(404).send("NOT_FOUND"));