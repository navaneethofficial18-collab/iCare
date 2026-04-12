import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

async function verifyAccess(allowedRoles: string[]) {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "caresync_super_secret_key");
    const { payload } = await jwtVerify(token, secret);
    return allowedRoles.includes(payload.role as string);
  } catch {
    return false;
  }
}

function buildHospitalManagerFallback(prompt: string, context: string) {
  const doctorsMatch = context.match(/Doctors available:\s*(\d+)\/(\d+)/i);
  const apptsMatch = context.match(/Appointments today:\s*(\d+)/i);
  const admissionsMatch = context.match(/Admissions active:\s*(\d+)/i);
  const availableDoctors = doctorsMatch ? Number(doctorsMatch[1]) : null;
  const totalDoctors = doctorsMatch ? Number(doctorsMatch[2]) : null;
  const appointments = apptsMatch ? Number(apptsMatch[1]) : null;
  const admissions = admissionsMatch ? Number(admissionsMatch[1]) : null;

  const lines = [
    "Hospital manager summary:",
    availableDoctors !== null && totalDoctors !== null
      ? `- Staffing: ${availableDoctors} of ${totalDoctors} doctors are marked available.`
      : "- Staffing: doctor availability data is limited right now.",
    appointments !== null
      ? `- Queue: ${appointments} appointments are currently listed for today.`
      : "- Queue: appointment volume is not fully available right now.",
    admissions !== null
      ? `- Inpatient load: ${admissions} active admissions are on the board.`
      : "- Inpatient load: admission data is limited right now.",
  ];

  if (/doctor|staff/i.test(prompt)) {
    lines.push("- Suggested action: assign available doctors to the busiest queue slots first and review any unassigned appointments.");
  }
  if (/patient|record|upload|history/i.test(prompt)) {
    lines.push("- Suggested action: verify the patient email before saving records so notes and prescriptions land in the correct patient portal.");
  }
  if (/queue|delay|appointment/i.test(prompt)) {
    lines.push("- Suggested action: prioritize confirmed appointments and surface any waiting patients without an assigned doctor.");
  }
  if (!/doctor|staff|patient|record|queue|delay|appointment/i.test(prompt)) {
    lines.push("- Suggested action: ask me about staffing, patient records, queue status, or admissions for a more targeted answer.");
  }

  lines.push(`- Your question: ${prompt}`);
  return lines.join("\n");
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
      return NextResponse.json({ response: buildHospitalManagerFallback(prompt, context || "") });
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
    const generatedText =
      Array.isArray(result) && result[0]?.generated_text
        ? result[0].generated_text
        : result?.generated_text || "Unable to generate response.";

    return NextResponse.json({ response: String(generatedText).trim() });
  } catch (error) {
    console.error("AI Assistant Error:", error);
    return NextResponse.json({
      response: buildHospitalManagerFallback("Provide a hospital operations response.", ""),
    });
  }
}
