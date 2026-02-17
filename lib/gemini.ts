
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// Helper to convert base64 to GoogleGenerativeAI Part
function fileToGenerativePart(base64Data: string, mimeType: string) {
  return {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };
}

export async function generateResponse(
  prompt: string,
  history: Array<{ role: string; content: string }> = []
) {
  try {
    const chat = geminiModel.startChat({
      history: history.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    });

    const result = await chat.sendMessageStream(prompt);
    return result;
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

export async function generateResponseWithWebSearch(prompt: string) {
  try {
    // Use a model instance specifically configured with tools for search if needed,
    // or just use the main model with tools in the call.
    const searchModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      // @ts-ignore - googleSearch is a valid tool but types might be outdated
      tools: [{ googleSearch: {} }],
    });

    const result = await searchModel.generateContentStream(prompt);
    return result;
  } catch (error) {
    console.error("Gemini API error with search:", error);
    throw error;
  }
}

export async function generateImage(prompt: string) {
  try {
    const result = await geminiModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: `Generate an image: ${prompt}` }],
        },
      ],
    });

    return result;
  } catch (error) {
    console.error("Gemini Image Generation error:", error);
    throw error;
  }
}

export async function generateChatTitle(message: string): Promise<string> {
  try {
    const result = await geminiModel.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a very short, descriptive title (3-6 words, no quotes, no special characters) for a chat conversation that starts with this message: "${message.slice(0, 200)}". Reply with ONLY the title, nothing else.`,
            },
          ],
        },
      ],
    });
    const title = result.response.text().trim().replace(/^["']|["']$/g, "");
    return title.slice(0, 60) || message.slice(0, 30);
  } catch (error) {
    console.error("Title generation error:", error);
    return message.slice(0, 40) + (message.length > 40 ? "..." : "");
  }
}

// STT: Transcribe audio using Gemini multimodal capabilities
export async function transcribeAudio(audioBase64: string, mimeType: string = "audio/webm") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      "Transcribe the following audio exactly as spoken. Do not add any commentary.",
      fileToGenerativePart(audioBase64, mimeType),
    ]);

    return result.response.text();
  } catch (error) {
    console.error("Gemini STT error:", error);
    throw error;
  }
}

// TTS: Generate speech using Gemini 2.5 Flash Preview TTS
export async function generateSpeech(text: string, voiceName: string = "Puck") {
  try {
    // Note: Using the REST API directly for experimental audio output features
    // We use the explicit preview-tts model which supports generateContent (REST)
    // whereas native-audio-latest only supports bidiGenerateContent (WebSocket)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Read this text aloud: ${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } }
          }
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "Gemini TTS failed");
    }

    const data = await response.json();
    // Gemini returns inlineData with mimeType "audio/wav" usually using base64
    const audioPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);

    if (audioPart) {
      return audioPart.inlineData.data;
    }

    throw new Error("No audio content returned");
  } catch (error) {
    console.error("Gemini TTS error:", error);
    throw error;
  }
}
