import { connectToDatabase, GrowthProjectModel } from "../src/server/database/index";
import { serializeGrowthProject } from "../src/server/growth-engine/repository";

async function run() {
  await connectToDatabase();
  const mongoose = await import("mongoose");
  
  const brokenDoc = await GrowthProjectModel.findOne({ _id: "6a3f1e4dcfa042748e05cf04" }).lean();
  
  if (brokenDoc) {
    await GrowthProjectModel.updateOne(
      { _id: brokenDoc._id },
      { $set: { 
          brandName: "Heritage Collection",
          industry: "Luxury Watches",
          goal: "Launch new collection",
          brief: "Exclusive 100-year anniversary collection",
          audience: "Watch enthusiasts"
        } 
      }
    );
    console.log("Fixed broken document!");
  }
  process.exit(0);
}

run();
