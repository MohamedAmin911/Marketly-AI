import { connectToDatabase, GrowthProjectModel } from "../src/server/database/index";
import { serializeGrowthProject } from "../src/server/growth-engine/repository";

async function run() {
  await connectToDatabase();
  const project = await GrowthProjectModel.findOne({
    _id: "6a2c7e85ba99ec6e3bc01fc4"
  }).lean();
  console.log("Project storyboards:", JSON.stringify(project?.storyboards, null, 2));
  process.exit(0);
}

run();
