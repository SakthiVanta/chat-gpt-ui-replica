"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Plus, Loader2 } from "lucide-react";

interface VoiceInputProps {
    onConfirm: (text: string) => void;
    onCancel: () => void;
}

export function VoiceInput({ onConfirm, onCancel }: VoiceInputProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [waveformData, setWaveformData] = useState<number[]>(new Array(80).fill(0.1));

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationRef = useRef<number | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const waveformHistoryRef = useRef<number[]>(new Array(80).fill(0.1));
    const isStoppedRef = useRef(false);

    const totalDots = 80;

    // Stop all audio resources
    const stopAllAudio = () => {
        if (isStoppedRef.current) return;
        isStoppedRef.current = true;

        console.log("Stopping all audio...");

        // Cancel animation frame first
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }

        // Stop media recorder
        if (mediaRecorderRef.current) {
            if (mediaRecorderRef.current.state === "recording") {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) {
                    console.log("MediaRecorder already stopped");
                }
            }
            mediaRecorderRef.current = null;
        }

        // Stop all tracks in the stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log("Track stopped:", track.kind, track.readyState);
            });
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current) {
            if (audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(() => {});
            }
            audioContextRef.current = null;
        }

        analyserRef.current = null;
    };

    useEffect(() => {
        let mounted = true;
        isStoppedRef.current = false;

        const startRecording = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                if (!mounted || isStoppedRef.current) {
                    // Component unmounted or stopped before we got stream
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }
                
                streamRef.current = stream;
                
                const audioContext = new AudioContext();
                audioContextRef.current = audioContext;
                const source = audioContext.createMediaStreamSource(stream);
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyser.smoothingTimeConstant = 0.3;
                source.connect(analyser);
                analyserRef.current = analyser;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                
                const updateWaveform = () => {
                    if (!mounted || isStoppedRef.current || !analyserRef.current) return;
                    
                    analyserRef.current.getByteFrequencyData(dataArray);
                    
                    const sum = dataArray.reduce((a, b) => a + b, 0);
                    const average = sum / dataArray.length;
                    const normalizedLevel = average / 255;
                    
                    const noise = (Math.random() - 0.5) * 0.1;
                    const currentLevel = Math.max(0.08, Math.min(1, normalizedLevel + noise));
                    
                    waveformHistoryRef.current = [
                        ...waveformHistoryRef.current.slice(1),
                        currentLevel
                    ];
                    
                    setWaveformData([...waveformHistoryRef.current]);
                    animationRef.current = requestAnimationFrame(updateWaveform);
                };
                
                updateWaveform();

                const mediaRecorder = new MediaRecorder(stream);
                mediaRecorderRef.current = mediaRecorder;
                audioChunksRef.current = [];

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunksRef.current.push(event.data);
                    }
                };

                mediaRecorder.start();
                setError(null);
            } catch (err) {
                console.error("Error accessing microphone:", err);
                setError("Microphone access denied");
            }
        };

        startRecording();

        return () => {
            mounted = false;
            stopAllAudio();
        };
    }, []);

    const handleCancel = () => {
        console.log("Cancel clicked - stopping audio");
        stopAllAudio();
        onCancel();
    };

    const handleConfirm = async () => {
        console.log("Confirm clicked - stopping audio");
        stopAllAudio();
        setIsProcessing(true);

        await new Promise(resolve => setTimeout(resolve, 200));

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        try {
            const formData = new FormData();
            formData.append("audio", audioBlob);

            const response = await fetch("/api/voice/stt", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Transcribing failed");
            }

            const data = await response.json();
            if (data.text) {
                onConfirm(data.text);
            } else {
                setError("No speech detected");
                setIsProcessing(false);
            }

        } catch (err) {
            console.error("STT Error:", err);
            setError("Failed to transcribe");
            setIsProcessing(false);
        }
    };

    const getDotHeight = (level: number) => {
        return 3 + (level * 19);
    };

    const getDotOpacity = (level: number) => {
        return 0.25 + (level * 0.75);
    };

    return (
        <div className="flex items-center w-full h-full px-4 py-3">
            <button
                className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
                title="Add attachment"
            >
                <Plus className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center justify-center mx-3 overflow-hidden">
                <AnimatePresence mode="wait">
                    {isProcessing ? (
                        <motion.div
                            key="processing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center gap-2"
                        >
                            <Loader2 className="w-4 h-4 animate-spin text-[var(--text-secondary)]" />
                            <span className="text-sm text-[var(--text-secondary)]">Processing...</span>
                        </motion.div>
                    ) : error ? (
                        <motion.span
                            key="error"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-red-500 text-sm"
                        >
                            {error}
                        </motion.span>
                    ) : (
                        <motion.div
                            key="waveform"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-[3px] h-6"
                        >
                            {waveformData.map((level, i) => (
                                <motion.div
                                    key={i}
                                    animate={{
                                        height: getDotHeight(level),
                                        opacity: getDotOpacity(level),
                                    }}
                                    transition={{
                                        duration: 0.03,
                                        ease: "linear",
                                    }}
                                    className="w-[3px] bg-[var(--text-secondary)]"
                                    style={{
                                        minHeight: 3,
                                        borderRadius: 0,
                                    }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
                <button
                    onClick={handleCancel}
                    disabled={isProcessing}
                    className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors disabled:opacity-50"
                    title="Cancel"
                >
                    <X className="w-5 h-5" />
                </button>

                <button
                    onClick={handleConfirm}
                    disabled={isProcessing || !!error}
                    className={`p-2 rounded-full transition-colors ${isProcessing || error
                            ? "bg-gray-400 text-white cursor-not-allowed"
                            : "bg-[#19c59f] text-white hover:opacity-90"
                        }`}
                    title="Confirm"
                >
                    {isProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Check className="w-5 h-5" />
                    )}
                </button>
            </div>
        </div>
    );
}
