import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/gemini";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("audio") as File;

        if (!file) {
            return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Audio = buffer.toString("base64");

        // Gemini 2.5 Flash is multimodal and can transcribe audio directly
        const transcription = await transcribeAudio(base64Audio, file.type || "audio/webm");

        return NextResponse.json({ text: transcription });
    } catch (error) {
        console.error("STT Error:", error);
        return NextResponse.json(
            { error: "Failed to transcribe audio" },
            { status: 500 }
        );
    }
}
