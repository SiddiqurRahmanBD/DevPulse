import { pool } from "../../db";
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
  return result;
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
    throw new Error("Issue not found");
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
export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
};
