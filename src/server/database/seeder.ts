import { UserModel } from "@/server/database/models/user.model";
import { hashPassword } from "@/server/security/password";
import { logger } from "@/server/logging/logger";

export async function seedDatabase() {
  try {
    const adminExists = await UserModel.findOne({ username: "admin" });

    if (!adminExists) {
      await UserModel.create({
        username: "admin",
        email: "admin@marketly.ai",
        fullName: "System Administrator",
        passwordHash: hashPassword("admin"),
        role: "admin",
        status: "active",
        emailVerified: true,
        onboardingCompleted: true,
        subscription: {
          plan: "business",
          status: "active",
          startedAt: new Date(),
          monthlyCredits: 9999999,
          monthlyCreditsRemaining: 9999999,
          purchasedCredits: 9999999,
        },
        features: {
          growthEngine: true,
          analytics: true,
          aiAssistant: true,
          priority: true,
          api: true,
          commercial: true,
        },
        usage: {
          totalCreditsUsed: 0,
          monthlyCreditsUsed: 0,
          purchasedCreditsUsed: 0,
          aiRequests: 0,
          growthRuns: 0,
          analyticsRuns: 0,
          projectsCreated: 0,
        }
      });
      logger.info("database.seeded", { message: "Admin user created successfully" });
    }
  } catch (error) {
    logger.error("database.seed.failed", { error });
  }
}
