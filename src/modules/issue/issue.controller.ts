import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import type { User } from "../../types";
import { errorHandle } from "../../utils/errorHandle";
import sendResponse from "../../utils/sendResponse";

const createIssue = async (req: Request, res: Response) => {
  try {
    const result = await issueService.createIssueIntoDB(req.body, req.user?.id);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: result,
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
const getAllIssues = async (req: Request, res: Response) => {
  try {
    const result = await issueService.getAllIssuesFromDB(req.query);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: result,
    });
  } catch (error) {
    errorHandle(error, res);
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await issueService.getSingleIssueFromDB(id as string);
    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      })
    }
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: result,
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = req.user;

    const result = await issueService.updateIssueFromDB(
      req.body,
      user as User,
      id as string,
    );
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: result,
    });
  } catch (error) {
    errorHandle(error, res);
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await issueService.deleteIssueFromDB(
      user as User,
      id as string,
    );

    if (!result) {
      sendResponse(res, {
        statusCode: 404,
        success: false,
        message: "Issue not found",
      });
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    errorHandle(error, res);
  }
};
export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};
