import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import { authRoute } from "./modules/auth/auth.route";


const app: Application = express();

app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "Express Server",
    author: "Siddiqur Rahman",
  });
});

// app.post("/issues", (req: Request, res: Response) => {
//   //   console.log(req.body);
//   const { name, email, password } = req.body;
//   res.status(201).json({
//     success: true,
//     message: "Issue created successfully!",
//     data: { name, email },
//   });
// });
app.use("/api/auth", authRoute);

export default app;
