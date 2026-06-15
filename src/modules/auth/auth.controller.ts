import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { errorHandle } from "../../utils/errorHandle";

const signUp = async (req: Request, res: Response) => {
  try {
    const result = await authService.signUpUserIntoDB(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
     errorHandle(error, res);
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
   errorHandle(error, res);
  }
};

export const authController = {
  signUp,
  login,
};
