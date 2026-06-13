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

// const getAllIssuesFromDB = async (query: IIssueQuery) => {

//   const { sort, type, status } = query;

//   let sql = `
//     SELECT *
//     FROM issues
//   `;

//   const conditions: string[] = [];
//   const values: unknown[] = [];

//   if (type) {
//     values.push(type);
//     conditions.push(`type = $${values.length}`);
//   }

//   if (status) {
//     values.push(status);
//     conditions.push(`status = $${values.length}`);
//   }

//   if (conditions.length > 0) {
//     sql += ` WHERE ${conditions.join(" AND ")}`;
//   }

//   sql += ` ORDER BY created_at `;

//   if (sort === "oldest") {
//     sql += `ASC`;
//   } else {
//     sql += `DESC`;
//   }

//   const issuesResult = await pool.query(sql, values);

//   const issues = issuesResult.rows;
//   console.log(issues);

//   const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];

//   let reportersMap = new Map();

//   if (reporterIds.length > 0) {
//     const reportersResult = await pool.query(
//       `
//         SELECT id,name,role
//         FROM users
//         WHERE id = ANY($1)
//         `,
//       [reporterIds],
//     );

//     reportersMap = new Map(
//       reportersResult.rows.map((reporter) => [reporter.id, reporter]),
//     );
//   }

//   const finalIssues = issues.map((issue) => ({
//     ...issue,
//     reporter: reportersMap.get(issue.reporter_id),
//   }));

//   return finalIssues;
// };

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
export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
