import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.join(process.cwd(), ".env"),
});
const config = {
  connection_string: process.env.CONNECTIONSTRING as string,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET as string,
  token_exipires_in: process.env.TOKEN_EXPIRE_IN as any,
};
export default config;
