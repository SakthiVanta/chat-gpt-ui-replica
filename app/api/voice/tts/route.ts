
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { text, voice } = await req.json();

        if (!text) {
            return NextResponse.json({ error: "No text provided" }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY || "";
        if (!apiKey) {
            return NextResponse.json({ error: "API key missing" }, { status: 500 });
        }

        // Gemini 2.5 Flash Preview TTS is designed for REST API generation
        // Using direct REST API call for consistent audio generation
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Read this text aloud naturally: ${text}` }] }],
                    generationConfig: {
                        responseModalities: ["AUDIO"],
                        speechConfig: {
                            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice || "Puck" } }
                        }
                    }
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            console.error("Gemini TTS API Error:", error);
            return NextResponse.json({ error: error.error?.message || "TTS failed" }, { status: response.status });
        }

        const data = await response.json();
        // Gemini returns inlineData with mimeType "audio/wav" in base64
        // Standard structure: candidates[0].content.parts[0].inlineData.data
        const audioContent = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;

        if (!audioContent) {
            console.error("No audio content in Gemini response", JSON.stringify(data));
            return NextResponse.json({ error: "No audio generated" }, { status: 500 });
        }

        return NextResponse.json({ audioContent });

    } catch (error) {
        console.error("TTS Handler Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
