import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { getDashboardSummary } from "./src/server/services/dashboard-service";
import { connectToDatabase } from "./src/server/database";

async function test() {
  try {
    await connectToDatabase();
    console.log("Connected to DB");
    
    const fakeAuth = {
      user: {
        sub: "6a47c09de897bd363a8d9423", // The user's ID from the logs!
        email: "test@test.com",
        name: "test",
        role: "admin",
      }
    };
    
    console.log("Running getDashboardSummary...");
    const result = await getDashboardSummary(fakeAuth as any);
    console.log("Success! Result keys:", Object.keys(result));
  } catch (error) {
    console.error("ERROR CAUGHT:");
    console.error(error);
  }
  process.exit(0);
}

test();
