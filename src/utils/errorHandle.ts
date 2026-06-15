import type { Response } from "express";
import sendResponse from "./sendResponse";

export const errorHandle = (error:unknown, res:Response) => {

     sendResponse(res, {
       statusCode: 500,
       success: false,
       message: "Something went wrong",
       error: error instanceof Error ? error.message : "Unknown error",
     });
};

