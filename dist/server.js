

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  jwt_secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
  CREATE TABLE IF NOT EXISTS users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'contributor'
    CHECK (role IN ('contributor', 'maintainer')),

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`);
    await pool.query(`
  CREATE TABLE IF NOT EXISTS issues(
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL CHECK(char_length(description) >= 20),

    type VARCHAR(20) NOT NULL CHECK(type IN('bug', 'feature_request')),
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    CHECK(status IN('open', 'in_progress', 'resolved')),
    reporter_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )
`);
    console.log("Database connected successfully!!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var signUpUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const HashedPassword = await bcrypt.hash(password, 10);
  const existingUser = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
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
    [name, email, HashedPassword, role]
  );
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email]
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
    role: user.role
  };
  const accessToken = jwt.sign(jwtPayload, config_default.jwt_secret, {
    expiresIn: "1d"
  });
  const { password: _, ...safeUser } = user;
  return { token: accessToken, user: safeUser };
};
var authService = {
  signUpUserIntoDB,
  loginUserIntoDB
};

// src/modules/auth/auth.controller.ts
var signUp = async (req, res) => {
  try {
    const result = await authService.signUpUserIntoDB(req.body);
    console.log(result);
    res.status(201).json({
      success: true,
      message: " User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var login = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result
    });
    console.log(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  signUp,
  login
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.signUp);
router.post("/login", authController.login);
var authRoute = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (query, reporterId) => {
  const { title, description, type } = query;
  const result = await pool.query(
    `
    INSERT INTO issues(title,description,type,reporter_id) 
    VALUES($1,$2,$3,$4)
    RETURNING *
    `,
    [title, description, type, reporterId]
  );
  delete result.rows[0].password;
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const order = query.sort === "oldest" ? "ASC" : "DESC";
  const type = query.type || null;
  const status = query.status || null;
  const result = await pool.query(
    `
        SELECT * FROM issues 
        WHERE($1::text IS NULL OR type=$1)
        AND ($2::text IS NULL OR status= $2)
        ORDER BY created_at ${order}
      `,
    [type, status]
  );
  const issues = result.rows;
  const reporterIds = issues.map((issue) => issue.reporter_id);
  const userResults = await pool.query(
    `

        SELECT id,name,role FROM users WHERE id=ANY($1)
    `,
    [reporterIds]
  );
  const users = userResults.rows;
  const formattedIssues = issues.map((issue) => {
    const reporter = users.find((user) => user.id === issue.reporter_id);
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id]
  );
  if (result.rows.length === 0) {
    return null;
  }
  const issue = result.rows[0];
  const reporterResult = await pool.query(
    `
    SELECT id, name, role
    FROM users
    WHERE id = $1
    `,
    [issue.reporter_id]
  );
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueFromDB = async (payload, user, id) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id]
  );
  const issue = issueResult.rows[0];
  if (!issue) {
    throw new Error("Issue not found");
  }
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("Only open issues can be updated");
    }
  }
  const { title, description, type } = payload;
  const result = await pool.query(
    `
    UPDATE issues
    SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      type = COALESCE($3, type),
      updated_at = NOW()
    WHERE id = $4
    RETURNING *;
    `,
    [title, description, type, id]
  );
  return result.rows[0];
};
var deleteIssueFromDB = async (user, id) => {
  if (user.role !== "maintainer") {
    throw new Error("Unauthorized access");
  }
  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id = $1
    RETURNING *;
    `,
    [id]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0];
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/utils/errorHandle.ts
var errorHandle = (error, res) => {
  sendResponse_default(res, {
    statusCode: 500,
    success: false,
    message: "Something went wrong",
    error: error instanceof Error ? error.message : "Unknown error"
  });
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const result = await issueService.createIssueIntoDB(req.body, req.user?.id);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
var getAllIssues = async (req, res) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await issueService.getSingleIssueFromDB(id);
    if (!result) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const result = await issueService.updateIssueFromDB(
      req.body,
      user,
      id
    );
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const result = await issueService.deleteIssueFromDB(
      user,
      id
    );
    if (!result) {
      sendResponse_default(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found"
      });
    }
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = () => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.jwt_secret
      );
      const userdata = await pool.query(
        `
        SELECT * FROM users WHERE id=$1
        `,
        [decoded.id]
      );
      if (userdata.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: "User not found"
        });
      }
      const user = userdata.rows[0];
      if (user.role !== "contributor" && user.role !== "maintainer") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized access"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      error;
    }
  };
};
var auth_default = auth;

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.post("/", auth_default(), issueController.createIssue);
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(), issueController.updateIssue);
router2.delete("/:id", auth_default(), issueController.deleteIssue);
var issueRoute = router2;

// src/middleware/globalErrorHandling.ts
var globalErrorHandling = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : "Internal Server Error"
  });
};
var globalErrorHandling_default = globalErrorHandling;

// src/app.ts
import cors from "cors";
var app = express();
app.use(express.json());
app.use(express.text());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "http://localhost:5000"
  })
);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "Siddiqur Rahman"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.use(globalErrorHandling_default);
var app_default = app;

// src/server.ts
var port = 5e3;
var main = async () => {
  initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${port}`);
  });
};
main();
//# sourceMappingURL=server.js.map