import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import ApiResponse from "../../utils/apiResponse";
import { ICreateTopic, IUpdateTopic, } from "./topic.interface";
import { topicService } from "./topic.service";

//create topic
export const createTopic = asyncHandler(async (req: Request, res: Response) => {
  const data: ICreateTopic = req.body;
  const image = req.file as Express.Multer.File | undefined;
  const topic = await topicService.createTopic(data, image);
  ApiResponse.sendSuccess(res, 201, "Topic created successfully", topic);
});

//get all topics
export const getAllTopic = asyncHandler(async (req: Request, res: Response) => {
  const { topics, pagination } = await topicService.getAllTopic(req.query);
  ApiResponse.sendSuccess(res, 200, "Topics fetched successfully", topics, pagination);
});

//get single topic
export const getSingleTopic = asyncHandler(async (req: Request, res: Response) => {
  const { topicId } = req.params;
  if (!topicId) throw new Error("Topic id missing in params");
  const topic = await topicService.getTopicById(topicId as string);
  ApiResponse.sendSuccess(res, 200, "Topic fetched successfully", topic);
});

//update topic
export const updateTopic = asyncHandler(async (req: Request, res: Response) => {
  const { topicId } = req.params;
  if (!topicId) throw new Error("Topic id missing in params");
  const data: IUpdateTopic = req.body;
  const image = req?.file as Express.Multer.File | undefined;
  const topic = await topicService.updateTopic(topicId as string, data, image);
  ApiResponse.sendSuccess(res, 200, "Topic updated successfully", topic);
});


//delete topic
export const deleteTopic = asyncHandler(async (req: Request, res: Response) => {
  const { topicId } = req.params;
  if (!topicId) throw new Error("Topic id missing in params");
  const topic = await topicService.deleteTopic(topicId as string);
  ApiResponse.sendSuccess(res, 200, "Topic deleted successfully");
});