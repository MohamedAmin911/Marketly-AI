import { connectToDatabase, GrowthProjectModel } from "./src/server/database/index.js";

async function run() {
  await connectToDatabase();
  const latest = await GrowthProjectModel.findOne().sort({ createdAt: -1 }).lean();
  console.log(JSON.stringify(latest, null, 2));
  process.exit(0);
}

run();
