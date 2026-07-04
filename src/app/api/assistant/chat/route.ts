import { NextRequest, NextResponse } from "next/server";
import { requireFeature } from "@/server/http/subscription-middleware";
import { CreditsService } from "@/server/services/billing/credits.service";
import { AssistantSessionModel } from "@/server/database/models/assistant-session.model";
import { AssistantMessageModel } from "@/server/database/models/assistant-message.model";
import { ApiError } from "@/server/errors/api-error";

// Edge runtime can't run Mongoose easily without some setup, but this is standard route handler.
// Since we use Mongoose transactions, we keep Node.js runtime.
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const user = await requireFeature(request, "aiAssistant");
    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json({ success: false, message: "Message is required" }, { status: 400 });
    }

    // Pre-deduct or check credits
    await CreditsService.deductCredits(String(user._id), 0.2, "AI Assistant", "Chat Request");

    let session;
    if (sessionId) {
      session = await AssistantSessionModel.findById(sessionId);
    } 
    
    if (!session) {
      session = await AssistantSessionModel.create({
        user: user._id,
        title: message.substring(0, 30) + (message.length > 30 ? "..." : ""),
        provider: "openai"
      });
    }

    // Save user message
    await AssistantMessageModel.create({
      session: session._id,
      role: "user",
      content: message,
    });

    // We simulate a streaming response (In production, use OpenAI SDK stream)
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const simulatedResponse = `I am your Marketly AI assistant. You asked: "${message}". I'm here to help you strategize and optimize your campaigns!`;
        const words = simulatedResponse.split(" ");
        
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise(r => setTimeout(r, 50));
        }
        
        // Save assistant message after stream
        await AssistantMessageModel.create({
          session: session._id,
          role: "assistant",
          content: simulatedResponse,
          cost: 0.2, // Log cost
        });

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        "Transfer-Encoding": "chunked",
      }
    });
  } catch (error: any) {
    if (error instanceof ApiError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
