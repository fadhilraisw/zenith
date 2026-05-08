import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { promptText, modelId } = await req.json();

    if (modelId === "cek-model") {
      let resultText = "HASIL CEK MODEL API:\n\n";
      try {
        const geminiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, '').trim();
        if (geminiKey) {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`);
          const data = await res.json();
          if (res.ok) {
            const modelList = data.models.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent")).map((m: any) => m.name.replace('models/', '')).join("\n- ");
            resultText += `🟢 GOOGLE GEMINI MODELS:\n- ${modelList}\n\n`;
          } else resultText += `🔴 GOOGLE ERROR: ${data.error?.message || "invalid key"}\n\n`;
        } else resultText += `🟡 GOOGLE: GEMINI_API_KEY kosong\n\n`;
      } catch (e: any) { resultText += `🔴 GOOGLE ERROR: ${e.message}\n\n`; }

      try {
        const groqKey = (process.env.GROQ_API_KEY || "").replace(/['"]/g, '').trim();
        if (groqKey) {
          const res = await fetch("https://api.groq.com/openai/v1/models", { headers: { "Authorization": `Bearer ${groqKey}` } });
          const data = await res.json();
          if (res.ok) {
            const modelList = data.data.map((m: any) => m.id).join("\n- ");
            resultText += `🟢 GROQ MODELS:\n- ${modelList}\n\n`;
          } else resultText += `🔴 GROQ ERROR: ${data.error?.message || "invalid key"}\n\n`;
        } else resultText += `🟡 GROQ: GROQ_API_KEY kosong\n\n`;
      } catch (e: any) { resultText += `🔴 GROQ ERROR: ${e.message}\n\n`; }

      return NextResponse.json({ content: [{ text: resultText }] });
    }

    // pengenalan model google (gemini, gemma, lyria, nano, deep-research)
    if (modelId.includes("gemini") || modelId.includes("gemma") || modelId.includes("lyria") || modelId.includes("nano") || modelId.includes("deep-research")) {
      const apiKey = (process.env.GEMINI_API_KEY || "").replace(/['"]/g, '').trim();
      if (!apiKey) throw new Error("gemini api key kosong di file env");

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
      const geminiRes = await fetch(url, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
      });
      const data = await geminiRes.json();
      if (!geminiRes.ok) throw new Error(`google error: ${JSON.stringify(data.error || data)}`);
      return NextResponse.json({ content: [{ text: data.candidates[0].content.parts[0].text }] });
    }

    // pengenalan model groq (llama, whisper, qwen, openai, canopylabs, groq, allam)
    if (modelId.includes("llama") || modelId.includes("whisper") || modelId.includes("qwen") || modelId.includes("openai") || modelId.includes("canopylabs") || modelId.includes("groq") || modelId.includes("allam")) {
      const apiKey = (process.env.GROQ_API_KEY || "").replace(/['"]/g, '').trim();
      if (!apiKey) throw new Error("groq api key kosong di file env");

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST", headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId, messages: [{ role: "user", content: promptText }] })
      });
      const data = await groqRes.json();
      if (!groqRes.ok) throw new Error(`groq error: ${JSON.stringify(data.error || data)}`);
      return NextResponse.json({ content: [{ text: data.choices[0].message.content }] });
    }

    throw new Error("model ai tidak didukung / tidak dikenali sistem backend.");
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}