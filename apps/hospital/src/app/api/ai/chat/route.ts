import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

async function verifyAccess(allowedRoles: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get("jwt")?.value;
  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    return allowedRoles.includes(payload.role as string);
  } catch {
    return false;
  }
}

// Memory optimization - limit tokens by truncating history
const trimHistory = (context: string, maxLen = 1000) => {
  if (context.length <= maxLen) return context;
  return "..." + context.slice(-maxLen);
};

export async function POST(req: Request) {
  if (!(await verifyAccess(["hospital", "patient"]))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { prompt, context } = await req.json();
    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const token = process.env.HUGGINGFACE_API_KEY;
    if (!token) {
      // Mocked fallback for development
      return NextResponse.json({ response: "AI features require valid Hugging Face API credentials. Please configure HUGGINGFACE_API_KEY." });
    }

    const compressedContext = trimHistory(context || "", 800);
    const fullPrompt = `${compressedContext ? `Context Data: ${compressedContext}\n` : ""}User Input: ${prompt}\nAI Assistant:`;

    const response = await fetch(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
            inputs: fullPrompt,
            parameters: {
              max_new_tokens: 250,
              return_full_text: false,
              temperature: 0.3
            }
        }),
      }
    );
    
    if (!response.ok) {
        throw new Error("Failed to fetch from HuggingFace");
    }

    const result = await response.json();
    const generated_text = result[0]?.generated_text || "Unable to generate response.";

    return NextResponse.json({ response: generated_text.trim() });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
