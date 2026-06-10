import app from "./app";
import config from "./config";
import { initDB } from "./db";
const port = 5000;

const main = async () => {
  initDB();
  app.listen(config.port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
main();
