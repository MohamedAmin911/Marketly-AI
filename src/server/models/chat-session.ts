import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, default: "New Chat" },
    messages: [
      {
        id: String,
        role: { type: String, enum: ["user", "assistant"] },
        content: { type: String, maxlength: 10000 },
        attachment: {
          dataUrl: String,
          mimeType: String,
          name: String,
          size: Number,
          textContent: { type: String, maxlength: 10000 },
        },
      },
    ],
  },
  { timestamps: true },
);

export const ChatSession =
  mongoose.models.ChatSession ?? mongoose.model("ChatSession", chatSessionSchema);
