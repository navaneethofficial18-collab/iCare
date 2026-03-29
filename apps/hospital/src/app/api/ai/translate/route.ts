import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text, targetLang } = await req.json();
    if (!text || !targetLang) {
      return NextResponse.json({ error: "Text and targetLang are required" }, { status: 400 });
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      // Mocked fallback if API Key fails
      const mockTrans: any = { hindi: "यह अनुवादਿਤ पाठ है", malayalam: "ഇത് വിവർത്തനം ചെയ്ത വാചകമാണ്", english: text };
      return NextResponse.json({ translatedText: mockTrans[targetLang] || text });
    }

    const prompt = `[INST] Translate the following text into ${targetLang}:\n\n"${text}"\n\nProvide ONLY the translated text without quotes, markdown, or extra explanation. [/INST]`;

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
    const translatedText = result[0]?.generated_text?.trim() || text;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation Error:", error);
    return NextResponse.json({ translatedText: "Translation service unavailable" }, { status: 500 });
  }
}
