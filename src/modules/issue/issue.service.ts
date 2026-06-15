import { pool } from "../../db";
import type { User } from "../../types";
import type { IIssue, IIssueQuery } from "./issue.interface";

const createIssueIntoDB = async (query: IIssue, reporterId: number) => {
  const { title, description, type } = query;
  const result = await pool.query(
    `
    INSERT INTO issues(title,description,type,reporter_id) 
    VALUES($1,$2,$3,$4)
    RETURNING *
    `,
    [title, description, type, reporterId],
  );
  delete result.rows[0].password;
  return result.rows[0];
};

const getAllIssuesFromDB = async (query: IIssueQuery) => {
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
    [type, status],
  );

  const issues = result.rows;

  const reporterIds = issues.map((issue) => issue.reporter_id);

  const userResults = await pool.query(
    `

        SELECT id,name,role FROM users WHERE id=ANY($1)
    `,
    [reporterIds],
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
      updated_at: issue.updated_at,
    };
  });

  return formattedIssues;
};

const getSingleIssueFromDB = async (id: string) => {
  const result = await pool.query(
    `
    SELECT * FROM issues WHERE id = $1
    `,
    [id],
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
    [issue.reporter_id],
  );

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporterResult.rows[0],
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};
const updateIssueFromDB = async (payload: IIssue, user: User, id: string) => {
  const issueResult = await pool.query(
    `
    SELECT * FROM issues
    WHERE id = $1
    `,
    [id],
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
    [title, description, type, id],
  );

  return result.rows[0];
};

const deleteIssueFromDB = async (user: User, id: string) => {

  if (user.role !== "maintainer") {
    throw new Error("Unauthorized access");
  }

  const result = await pool.query(
    `
    DELETE FROM issues
    WHERE id = $1
    RETURNING *;
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return result.rows[0];
};
export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueFromDB,
  deleteIssueFromDB,
};
