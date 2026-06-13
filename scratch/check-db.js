require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.useDb("marketly_ai");
  const project = await db.collection("growthProjects").find().sort({ _id: -1 }).limit(1).toArray();
  console.log(JSON.stringify(project[0], null, 2));
  process.exit(0);
}

run();
