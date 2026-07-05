import Filter = require("bad-words");
import { apiErrors } from "@/server/errors/api-error";
import type { AuthContext } from "@/server/security/auth-guard";

// Initialize the filter
const filter = new Filter();
// Add custom words for our specific rules if needed
filter.addWords("nsfw", "gore");

export function checkPromptSafety(text: string, auth: AuthContext) {
  if (auth.user.role === "admin") return;
  if (!text) return;

  // bad-words library uses regex to check for a massive list of bad words
  if (filter.isProfane(text)) {
    throw apiErrors.badRequest("Profanity or inappropriate content detected in your prompt.");
  }
}
