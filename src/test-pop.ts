import mongoose from "mongoose";
import dotenv from "dotenv";
import { learningPlanService } from "./modules/learningplan/learningplan.service";
import config from "./config";

dotenv.config();

async function testPopulation() {
    try {
        await mongoose.connect(config.mongoUri);
        console.log("Connected to DB");

        const planId = "69ade08a837348c3128a3a33";
        const userId = "69a5f9c4d3e901aaf536c400";

        const plan = await learningPlanService.getSingleLearningPlan(userId, planId);

        console.log("Plan found:", plan.name || "Untitled");

        if (plan.flashcards && plan.flashcards.length > 0) {
            console.log("First Flashcard Topic:", JSON.stringify((plan.flashcards[0].flashcardId as any)?.topicId, null, 2));
        } else {
            console.log("No flashcards in plan");
        }

        if (plan.articles && plan.articles.length > 0) {
            console.log("First Article Topics:", JSON.stringify((plan.articles[0].articleId as any)?.topicIds, null, 2));
        } else {
            console.log("No articles in plan");
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

testPopulation();
