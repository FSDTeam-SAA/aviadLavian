import mongoose from "mongoose";
import { InjuryModel } from "./modules/injury/injury.model";
import { QuestionModel } from "./modules/Question/question.model";
import { FlashcardModel } from "./modules/flashcard/flashcard.models";
import { ArticleModel } from "./modules/Article/article.model";
import { articleService } from "./modules/Article/article.service";
import { LearningPlanModel } from "./modules/learningplan/learningplan.model";
import { learningPlanService } from "./modules/learningplan/learningplan.service";
import * as dotenv from "dotenv";

dotenv.config();

const testSearch = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found in environment");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    const userId = new mongoose.Types.ObjectId();

    // 1. Test Article Search
    console.log("\n--- Testing Article Search ---");
    const art1 = await ArticleModel.create({
      name: "Cardiac Health",
      description: "A guide to cardiology basics.",
      topicIds: [new mongoose.Types.ObjectId()],
    });
    const art2 = await ArticleModel.create({
      name: "Common Foot Injuries",
      description: "Walking is healthy for your heart too.",
      topicIds: [new mongoose.Types.ObjectId()],
    });

    const search1 = await articleService.getAllArticles({ search: "Cardiac" });
    console.log("Search 'Cardiac' - Found health guide:", search1.articles.some((a: any) => a.name === "Cardiac Health"));

    const search2 = await articleService.getAllArticles({ search: "heart" });
    console.log("Search 'heart' - Found foot guide via description:", search2.articles.some((a: any) => a.name === "Common Foot Injuries"));

    // 2. Test Learning Plan Search
    console.log("\n--- Testing Learning Plan Search ---");
    const plan1 = await LearningPlanModel.create({
      userId,
      name: "My Cardiology Journey",
      description: "Everything about heart.",
    });
    const plan2 = await LearningPlanModel.create({
      userId,
      name: "General Health",
      description: "Staying fit.",
    });

    const search3 = await learningPlanService.getAllLearningPlans(userId.toString(), { search: "Cardiology" });
    console.log("Search 'Cardiology' - Found my journey:", search3.plans.some((p: any) => p.name === "My Cardiology Journey"));

    const search4 = await learningPlanService.getAllLearningPlans(userId.toString(), { search: "heart" });
    console.log("Search 'heart' - Found my journey via description:", search4.plans.some((p: any) => p.name === "My Cardiology Journey"));

    // Cleanup
    await ArticleModel.deleteMany({ _id: { $in: [art1._id, art2._id] } });
    await LearningPlanModel.deleteMany({ _id: { $in: [plan1._id, plan2._id] } });
    console.log("\nCleanup complete.");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

testSearch();
