import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file || file.type !== "application/pdf") {
    return NextResponse.json({ error: "PDF file required" }, { status: 400 });
  }

  try {
    // Simple binary text extraction — works for text-based PDFs without any library
    const buffer = Buffer.from(await file.arrayBuffer());
    const raw = buffer.toString("latin1");

    // Extract text between stream/endstream markers and BT/ET blocks
    const texts: string[] = [];

    // Method 1: BT...ET text blocks
    const btEt = /BT([\s\S]*?)ET/g;
    let m: RegExpExecArray | null;
    while ((m = btEt.exec(raw)) !== null) {
      const block = m[1];
      const strRe = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let s: RegExpExecArray | null;
      while ((s = strRe.exec(block)) !== null) {
        const decoded = s[1]
          .replace(/\\n/g, " ").replace(/\\r/g, "").replace(/\\t/g, " ")
          .replace(/\\\\/g, "\\").replace(/\\([0-7]{3})/g, (_, o) => String.fromCharCode(parseInt(o, 8)))
          .replace(/\\(.)/g, "$1");
        if (decoded.trim().length > 1) texts.push(decoded.trim());
      }
    }

    // Method 2: stream content
    if (texts.length === 0) {
      const streamRe = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
      while ((m = streamRe.exec(raw)) !== null) {
        const t = m[1].replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
        if (t.length > 20) texts.push(t);
      }
    }

    const result = texts.join(" ").replace(/\s+/g, " ").trim();

    return NextResponse.json({
      text: result.length > 50 ? result : "[Could not extract text — PDF may be scanned/image-based]",
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
};
