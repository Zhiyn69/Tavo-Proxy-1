const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default async function handler(req, res) {
  // Tavo biasanya kirim POST ke /v1/chat/completions
  if (req.method !== 'POST') return res.status(200).send("Proxy Active!");

  try {
    const { messages, model, temperature, stream } = req.body;

    // Cari System Prompt & Pesan Terakhir
    const systemInstruction = messages.find(m => m.role === 'system')?.content || "";
    const userMessage = messages[messages.length - 1].content;
    
    // Format history untuk Gemini (user & model)
    const history = messages
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

    const googleModel = genAI.getGenerativeModel({ 
      model: model || "gemini-1.5-pro",
      systemInstruction: systemInstruction 
    });

    const chat = googleModel.startChat({ history });
    const result = await chat.sendMessage(userMessage);
    const text = result.response.text();

    // Balas dengan format OpenAI agar Tavo tidak error
    res.status(200).json({
      choices: [{
        message: { role: "assistant", content: text },
        finish_reason: "stop"
      }]
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
