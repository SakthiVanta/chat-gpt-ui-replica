"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, X } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/tts";

interface VoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSend: (text: string) => Promise<string>; // Returns AI response text
    voiceName: string; // From Settings
}

export function VoiceModal({ isOpen, onClose, onSend, voiceName }: VoiceModalProps) {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [aiResponse, setAiResponse] = useState("");

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    // Handle open/close
    useEffect(() => {
        if (isOpen) {
            startListening();
        } else {
            stopListening();
            stopSpeaking();
        }
        return () => {
            stopListening();
            stopSpeaking();
        };
    }, [isOpen]);

    const startListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await handleAudioUpload(audioBlob);
            };

            mediaRecorder.start();
            setIsListening(true);
            setTranscript("Listening...");
            setAiResponse("");
            setIsSpeaking(false);
            stopSpeaking();
        } catch (e) {
            console.error("Microphone access error", e);
            setTranscript("Microphone access denied");
        }
    };

    const stopListening = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
            // Stop all tracks
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsListening(false);
    };

    const handleAudioUpload = async (audioBlob: Blob) => {
        setIsProcessing(true);
        setTranscript("Transcribing...");

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob);

            // 1. STT: Send to backend
            const sttResponse = await fetch("/api/voice/stt", {
                method: "POST",
                body: formData,
            });

            if (!sttResponse.ok) throw new Error("STT Failed");
            const sttData = await sttResponse.json();
            const text = sttData.text;

            if (!text) {
                setTranscript("No speech detected");
                setIsProcessing(false);
                // Resume listening after short delay?
                setTimeout(startListening, 2000);
                return;
            }

            setTranscript(text);

            // 2. Chat: Send text to AI
            const responseText = await onSend(text);
            setAiResponse(responseText);
            setIsProcessing(false);

            // 3. TTS: Speak response
            setIsSpeaking(true);
            speak(responseText, voiceName, () => {
                setIsSpeaking(false);
                // Resume listening after AI finishes speaking
                if (isOpen) startListening();
            });

        } catch (e) {
            console.error("Error processing voice message", e);
            setTranscript("Error processing audio");
            setIsProcessing(false);
            setTimeout(startListening, 2000); // Resume on error
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Dynamic Status Text */}
                <div className="absolute top-20 text-center space-y-2">
                    <p className="text-white/60 text-sm uppercase tracking-widest">
                        {isListening ? "Listening..." : isProcessing ? "Processing..." : isSpeaking ? "Speaking..." : "Ready"}
                    </p>
                </div>

                {/* Jarvis Orb Animation */}
                <div className="relative w-64 h-64 flex items-center justify-center">
                    {/* Core Orb */}
                    <motion.div
                        animate={{
                            scale: isListening ? [1, 1.2, 1] : isProcessing ? [1, 0.9, 1] : 1,
                            opacity: isListening ? 1 : 0.8,
                        }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className={`w-32 h-32 rounded-full ${isListening ? "bg-white shadow-[0_0_50px_rgba(255,255,255,0.8)]" :
                                isProcessing ? "bg-purple-500 shadow-[0_0_50px_rgba(168,85,247,0.8)]" :
                                    "bg-blue-500 shadow-[0_0_50px_rgba(59,130,246,0.8)]"
                            }`}
                    />

                    {/* Ripples when listening */}
                    {isListening && (
                        <>
                            <motion.div
                                animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                                className="absolute inset-0 rounded-full border border-white/30"
                            />
                            <motion.div
                                animate={{ scale: [1, 2.5], opacity: [0.3, 0] }}
                                transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                                className="absolute inset-0 rounded-full border border-white/20"
                            />
                        </>
                    )}

                    {/* Sound waves when speaking */}
                    {isSpeaking && (
                        <div className="absolute inset-0 flex items-center justify-center gap-1">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={{ height: [20, 60, 20] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.1 }}
                                    className="w-2 bg-white/80 rounded-full"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Live Transcript / Response Display */}
                <div className="mt-12 max-w-2xl text-center space-y-6">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-light text-white leading-relaxed"
                    >
                        &quot;{transcript}&quot;
                    </motion.p>

                    {aiResponse && (
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xl font-light text-blue-200 leading-relaxed"
                        >
                            {aiResponse}
                        </motion.p>
                    )}
                </div>

                {/* Controls */}
                <div className="absolute bottom-12 flex gap-4">
                    <button
                        onClick={isListening ? stopListening : startListening}
                        className={`p-6 rounded-full transition-all duration-300 ${isListening
                                ? "bg-red-500 hover:bg-red-600 scale-110"
                                : "bg-white hover:bg-gray-200 text-black"
                            }`}
                    >
                        {isListening ? <MicOff className="w-8 h-8 text-white" /> : <Mic className="w-8 h-8" />}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
