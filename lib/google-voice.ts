import { TextToSpeechClient } from "@google-cloud/text-to-speech";
import { SpeechClient } from "@google-cloud/speech";

// Initialize clients (requires GOOGLE_APPLICATION_CREDENTIALS env var or default auth)
const ttsClient = new TextToSpeechClient();
const speechClient = new SpeechClient();

export async function synthesizeSpeech(text: string, voiceName: string = "en-US-Journey-F") {
    const [response] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: { languageCode: "en-US", name: voiceName },
        audioConfig: { audioEncoding: "MP3" },
    });
    return response.audioContent;
}

export async function transcribeAudio(audioBuffer: Buffer) {
    const [response] = await speechClient.recognize({
        config: {
            encoding: "WEBM_OPUS",
            sampleRateHertz: 48000,
            languageCode: "en-US",
        },
        audio: { content: audioBuffer.toString("base64") },
    });

    const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join("\n");

    return transcription;
}

// Map app voices to Google Cloud voices (using Journey/Studio variants for quality)
export const GOOGLE_VOICE_MAP: Record<string, string> = {
    Maple: "en-US-Journey-F",   // Warm female
    Juniper: "en-US-Journey-O", // Calm female
    Breeze: "en-US-Journey-D",  // Warm male
    Cove: "en-US-Studio-Q",     // Calm male
    Ember: "en-US-Neural2-C",   // Energetic female
    Sol: "en-US-Neural2-D",     // Energetic male
};
