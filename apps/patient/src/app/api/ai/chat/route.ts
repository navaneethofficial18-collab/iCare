import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

async function getRoleFromCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value ?? cookieStore.get("jwt")?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    return String(payload.role ?? "");
  } catch {
    return null;
  }
}

const trimHistory = (context: string, maxLen = 1000) => {
  if (context.length <= maxLen) return context;
  return "..." + context.slice(-maxLen);
};

function buildPatientFallback(prompt: string, role: string | null) {
  const normalized = prompt.toLowerCase();
  const lines = [
    role ? `Patient assistant summary for ${role} session:` : "Patient assistant summary:",
  ];

  if (normalized.includes("headache")) {
    lines.push("- Headache can happen due to dehydration, stress, lack of sleep, vision strain, or infection.");
    lines.push("- Drink water, rest in a quiet room, and monitor if fever, vomiting, or weakness appear.");
    lines.push("- Seek urgent care if the headache is sudden and severe, follows a head injury, or comes with confusion, chest pain, or one-sided weakness.");
  } else if (normalized.includes("chest") || normalized.includes("thought pain") || normalized.includes("heart")) {
    lines.push("- Chest pain should be taken seriously because it can come from muscle strain, acidity, anxiety, or heart/lung problems.");
    lines.push("- Rest now and avoid exertion.");
    lines.push("- Get urgent medical help immediately if the pain is heavy, spreading to arm/jaw/back, or comes with sweating, breathlessness, dizziness, or nausea.");
  } else if (normalized.includes("fever")) {
    lines.push("- Fever is often caused by infection or inflammation.");
    lines.push("- Rest, hydrate well, and monitor temperature regularly.");
    lines.push("- See a doctor promptly if fever is high, lasts more than 2-3 days, or comes with breathing trouble, rash, confusion, or dehydration.");
  } else {
    lines.push("- I can help with general symptom guidance, medication questions, and when to seek urgent care.");
    lines.push("- Please tell me your symptoms, how long they have been happening, your age, and whether you have fever, pain, breathing issues, or existing conditions.");
  }

  lines.push("- This is general guidance, not a confirmed diagnosis.");
  return lines.join("\n");
}

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();
    if (!prompt) {
      return NextResponse.json({ response: "Please type your symptom or question so I can help." });
    }

    const role = await getRoleFromCookie();
    const token = process.env.HUGGINGFACE_API_KEY;

    if (!token) {
      return NextResponse.json({ response: buildPatientFallback(prompt, role) });
    }

    const compressedContext = trimHistory(context || "", 800);
    const fullPrompt = `${compressedContext ? `Context Data: ${compressedContext}\n` : ""}User Input: ${prompt}\nAI Assistant:`;

    const response = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
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
          temperature: 0.3,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("HuggingFace error:", errorText);
      return NextResponse.json({ response: buildPatientFallback(prompt, role) });
    }

    const result = await response.json();
    const generatedText =
      Array.isArray(result) && result[0]?.generated_text
        ? result[0].generated_text
        : result?.generated_text || buildPatientFallback(prompt, role);

    return NextResponse.json({ response: String(generatedText).trim() });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({
      response: "I could not reach the live AI service right now. Please describe your symptom again and I will give general guidance.",
    });
  }
}
