import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import config from "../config";
import { pool } from "../db";
import sendResponse from "../utils/sendResponse";

const auth = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // console.log(req.headers.authorization);
    try {
      const token = req.headers.authorization;

      if (!token) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access",
        });
      }
      const decoded = jwt.verify(
        token as string,
        config.jwt_secret,
      ) as JwtPayload;

      const userdata = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [decoded.id],
      );

      if (userdata.rows.length === 0) {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "User not found",
        });
      }

      const user = userdata.rows[0];

      if (user.role !== "contributor" && user.role !== "maintainer") {
        return sendResponse(res, {
          statusCode: 401,
          success: false,
          message: "Unauthorized access",
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      error;
    }
  };
};
export default auth;
