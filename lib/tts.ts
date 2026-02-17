// Map App Voice Names to Gemini 2.0 Flash Exp Voice Names
// Available: Puck, Charon, Kore, Fenrir, Aoede
const GOOGLE_VOICE_IDS: Record<string, string> = {
    Maple: "Puck",      // Soft/Playful
    Juniper: "Charon",  // Deeper/Serious
    Breeze: "Kore",     // Calm
    Cove: "Fenrir",     // Intense
    Ember: "Aoede",     // Expressive
    Sol: "Puck",        // Default fallback (or specific variant if available)
};

export const APP_VOICES = Object.keys(GOOGLE_VOICE_IDS);

// Audio Context for playback
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export const speak = async (text: string, voiceName: string, onEnd?: () => void) => {
    stopSpeaking();

    if (!text) return;

    try {
        // 1. Try Google Cloud TTS via our API route
        const googleVoiceId = GOOGLE_VOICE_IDS[voiceName] || "en-US-Journey-F";
        const response = await fetch("/api/voice/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, voice: googleVoiceId }),
        });

        if (!response.ok) {
            throw new Error("TTS API failed");
        }

        const data = await response.json();
        if (data.audioContent) {
            playAudio(data.audioContent, onEnd);
            return;
        }
    } catch (error) {
        console.warn("Google TTS failed, falling back to browser TTS", error);
        // Fallback: Browser SpeechSynthesis
        speakBrowser(text, voiceName, onEnd);
    }
};

const playAudio = async (base64Audio: string, onEnd?: () => void) => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const audioData = atob(base64Audio);
    const arrayBuffer = new ArrayBuffer(audioData.length);
    const view = new Uint8Array(arrayBuffer);
    for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
    }

    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(0);
    currentSource = source;

    source.onended = () => {
        currentSource = null;
        if (onEnd) onEnd();
    };
};

export const stopSpeaking = () => {
    if (currentSource) {
        currentSource.stop();
        currentSource = null;
    }
    window.speechSynthesis.cancel();
};

// Browser Fallback (original implementation)
const speakBrowser = (text: string, voiceName: string, onEnd?: () => void) => {
    const utterance = new SpeechSynthesisUtterance(text);
    // ... (simplified selection logic for brevity) ...
    if (onEnd) {
        utterance.onend = () => onEnd();
    }
    window.speechSynthesis.speak(utterance);
};
