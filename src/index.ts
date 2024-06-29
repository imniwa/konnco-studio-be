import type { Express } from "express";
import express from "express";
import { routes } from "@/routes";
import morgan from "morgan";

export const app: Express = express();
const port = process.env.PORT || 3000;

app.use(morgan('dev'))
app.use(express.json());
app.use("/api/v1/", routes);

app.listen(port, () => {
  console.info(`Server running on port ${port}`);
});