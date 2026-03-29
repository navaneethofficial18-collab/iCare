import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { symptoms } = await req.json();
    if (!symptoms) {
      return NextResponse.json({ error: "Symptoms are required" }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        condition: "Viral Infection (Simulated)",
        severity: "medium",
        nextStep: "Rest and stay hydrated. Consult a doctor if fever persists.",
      });
    }

    const prompt = `[INST] You are an expert AI doctor assistant. Analyze these symptoms: "${symptoms}". 
Respond ONLY with a valid JSON format having three keys: "condition" (possible medical condition), "severity" (low, medium, high), and "nextStep" (what the patient should do next). [/INST]`;

    const hfRes = await fetch("https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ 
        inputs: prompt, 
        parameters: { max_new_tokens: 150, temperature: 0.1, return_full_text: false } 
      }),
    });

    if (!hfRes.ok) throw new Error("Hugging Face API failed");
    
    const result = await hfRes.json();
    const textOutput = result[0]?.generated_text || "";
    
    // Attempt to extract JSON from the text
    const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
    let parsed = {
      condition: "Unknown",
      severity: "medium",
      nextStep: "Please consult a medical professional.",
    };

    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (e) {}
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("AI Assistant Error:", error);
    // Graceful fallback if HF API fails (e.g. model cold start or free tier limit)
    return NextResponse.json({
      condition: "Viral Syndrome (Simulated Fallback)",
      severity: "medium",
      nextStep: "Rest and stay hydrated. Consult a doctor if symptoms worsen.",
    });
  }
}
