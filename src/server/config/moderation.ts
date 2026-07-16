export const AI_MODERATION_CONFIG = {
  MAX_STRIKES: 3,
  FIRST_BLOCK_DURATION_MS: 15 * 60 * 1000,
  SECOND_BLOCK_DURATION_MS: 4 * 60 * 60 * 1000,
  MAX_LOGGED_PROMPT_LENGTH: 8000,
} as const;

export const AI_SUSPENSION_MESSAGE =
  "Your account has been suspended because of repeated violations of our AI Usage Policy. If you believe this was a mistake, please contact our support team.";

export const AI_TEMPORARY_BLOCK_MESSAGE =
  "AI features are temporarily unavailable because a recent request violated our AI Usage Policy. Please try again later.";

export const AI_POLICY_WARNING_MESSAGE =
  "We could not process that request because it appears to violate our AI Usage Policy. Please revise the prompt and try again.";
