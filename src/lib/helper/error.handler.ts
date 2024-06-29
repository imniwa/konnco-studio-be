import { CustomError } from "@/lib/http.exception";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

const ErrorFactory = (err: Error, res: Response) => {
  if (err instanceof PrismaClientKnownRequestError) {
    const errors = [{ error: err.message }];
    return res.status(400).send({ errors });
  }
  if (err instanceof ZodError) {
    const errors = err.errors.map((error) => {
      return {
        field: error.path.join("."),
        error: error.message,
      }
    })
    return res.status(400).send({ errors });
  }
  if (err instanceof CustomError) {
    const { statusCode, stack, isLogging, errors } = err;
    if (isLogging) {
      const logMessage = JSON.stringify({ statusCode, errors, stack }, null, 2);
      console.log(logMessage);
    }
    return res.status(statusCode).send({ errors });
  }
  return null;
};

const ErrorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const handledError = ErrorFactory(err, res);
  if (!handledError) {
    console.log(JSON.stringify(`Unhandled error: ${err}`, null, 2));
    return res
      .status(500)
      .send({ errors: [{ message: "Internal server error" }] });
  }
  return handledError
};

export default ErrorHandler;