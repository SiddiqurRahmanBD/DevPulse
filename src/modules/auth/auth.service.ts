import { pool } from "../../db";
import type { IUser, IuserLogin } from "./auth.interface";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../../config";

const signUpUserIntoDB = async (payload: IUser) => {
  const { name, email, password, role } = payload;
  const HashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email],
  );

  if (existingUser.rows.length > 0) {
    throw new Error("User already exists");
  }

  const result = await pool.query(
    `
    INSERT INTO users (name,email,password,role) 
    VALUES($1,$2,$3,$4) 
    RETURNING 
    id,name,email,role,created_at,updated_at
    `,
    [name, email, HashedPassword, role],
  );
  return result;
};

const loginUserIntoDB = async (payload: IuserLogin) => {
  // find user if any user exists
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }

  const user = userData.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Incorrect password");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };
  const accessToken = jwt.sign(jwtPayload, config.jwt_secret, {
    expiresIn: "1d",
  });
  const { password: _, ...safeUser } = user;

  return { token: accessToken, user: safeUser };
};

export const authService = {
  signUpUserIntoDB,
  loginUserIntoDB,
};
