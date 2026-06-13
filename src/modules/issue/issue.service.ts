import { pool } from "../../db";
import type { IIssue, IIssueQuery } from "./issue.interface";

const createIssueIntoDB = async (payload: IIssue, reporterId: number) => {
  const { title, description, type } = payload;
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
  const { sort, type, status } = query;
  

};
export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};
