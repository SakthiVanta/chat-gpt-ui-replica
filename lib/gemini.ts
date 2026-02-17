import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

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
    const result = await geminiModel.generateContentStream(
      `Search the web and answer: ${prompt}`
    );
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
