import { NextResponse } from "next/server";
import { z } from "zod";
import { sendContactUsEmail } from "@/server/services/mail-service";
import { logger } from "@/server/logging/logger";

const contactSchema = z.object({
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters").max(100),
  message: z.string().min(10, "Message must be at least 10 characters").max(2000),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const { email, subject, message } = result.data;

    await sendContactUsEmail(email, subject, message);

    return NextResponse.json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    logger.error("Failed to send contact email:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
