import mongoose from "mongoose";
import { InjuryModel } from "./modules/injury/injury.model";
import { injuryService } from "./modules/injury/injury.service";
import * as dotenv from "dotenv";

dotenv.config();

const testGrouping = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) throw new Error("MONGO_URI not found in environment");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // 1. Create a test injury with a group
    const testId = "TEST-GROUP-1";
    await InjuryModel.deleteOne({ Id: testId });

    const newInjury = await injuryService.createInjury({
      Id: testId,
      Name: "Test Cardiac Arrest",
      Group: "Cardiology",
      Primary_Body_Region: "Chest",
      Description: "Test description",
    });
    console.log("Created injury with group:", newInjury.Group);

    // 2. Test filtering by group
    const { injuries } = await injuryService.getAllInjuries({
      group: "Cardiology",
    });
    const found = injuries.some((i) => i.Id === testId);
    console.log("Filtering by group 'Cardiology' works:", found);

    // 3. Test filter options
    const groups = await injuryService.getGroups();
    console.log("Unique groups found:", groups);
    const hasCardiology = groups.includes("Cardiology");
    console.log("Groups list contains 'Cardiology':", hasCardiology);

    // Cleanup
    await InjuryModel.deleteOne({ Id: testId });
    console.log("Cleanup complete.");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    await mongoose.disconnect();
  }
};

testGrouping();
