import { paginationHelper } from "../../utils/pagination";
import { ICreateFeedbackDTO, IUpdateFeedbackDTO } from "./feedback.interface";
import Feedback, { IFeedbackDocument } from "./feedback.models";


export class FeedbackService {
  /**
   * Create new feedback submitted by a user
   */
  async createFeedback(
    userId: string,
    dto: ICreateFeedbackDTO,
  ): Promise<IFeedbackDocument> {
    const feedback = new Feedback({
      userId,
      type: dto.type,
      rating: dto.rating,
      subject: dto.subject,
      message: dto.message,
    });

    return await feedback.save();
  }

  /**
   * Get feedbacks for the logged-in user (with pagination)
   */
  async getFeedbacksByUser(userId: string, query: any) {
    const filter: any = { userId };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const { page, limit, skip } = paginationHelper(query.page, query.limit);
    const total = await Feedback.countDocuments(filter);

    const feedbacks = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: feedbacks,
    };
  }

  /**
   * Get a single feedback by ID (validates ownership for non-admin)
   */
  async getFeedbackById(
    feedbackId: string,
    userId?: string,
  ): Promise<IFeedbackDocument | null> {
    const query: Record<string, string> = { _id: feedbackId };
    if (userId) query.userId = userId;

    return await Feedback.findOne(query).populate("userId", "name email");
  }

  /**
   * Admin: Get all feedbacks with filters and pagination
   */
  async getAllFeedbacks(query: any) {
    const filter: any = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.userId) filter.userId = query.userId;

    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    if (query.search) {
      filter.$or = [
        { subject: { $regex: query.search, $options: "i" } },
        { message: { $regex: query.search, $options: "i" } },
      ];
    }

    const { page, limit, skip } = paginationHelper(query.page, query.limit);
    const total = await Feedback.countDocuments(filter);

    const feedbacks = await Feedback.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: feedbacks,
    };
  }

  /**
   * Admin: Get all feedbacks by a specific user (with pagination)
   */
  async getFeedbackByUser(userId: string, query: any) {
    const filter: any = { userId };

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;

    const { page, limit, skip } = paginationHelper(query.page, query.limit);
    const total = await Feedback.countDocuments(filter);

    const feedbacks = await Feedback.find(filter)
      .populate("userId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: feedbacks,
    };
  }

  /**
   * Admin: Update feedback status or add admin notes
   */
  async updateFeedback(
    feedbackId: string,
    dto: IUpdateFeedbackDTO,
  ): Promise<IFeedbackDocument | null> {
    return await Feedback.findByIdAndUpdate(
      feedbackId,
      { $set: dto },
      { new: true, runValidators: true },
    );
  }

  /**
   * Admin: Delete a feedback entry
   */
  async deleteFeedback(feedbackId: string): Promise<boolean> {
    const result = await Feedback.findByIdAndDelete(feedbackId);
    return !!result;
  }

  /**
   * Get feedback summary stats (admin dashboard)
   */
  async getFeedbackStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    averageRating: number;
  }> {
    const [typeAgg, statusAgg, ratingAgg] = await Promise.all([
      Feedback.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
      Feedback.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: "$rating" },
            total: { $sum: 1 },
          },
        },
      ]),
    ]);

    const byType: Record<string, number> = {};
    typeAgg.forEach((item) => (byType[item._id] = item.count));

    const byStatus: Record<string, number> = {};
    statusAgg.forEach((item) => (byStatus[item._id] = item.count));

    const total = ratingAgg[0]?.total ?? 0;
    const averageRating = parseFloat((ratingAgg[0]?.avgRating ?? 0).toFixed(2));

    return { total, byType, byStatus, averageRating };
  }
}

export default new FeedbackService();
