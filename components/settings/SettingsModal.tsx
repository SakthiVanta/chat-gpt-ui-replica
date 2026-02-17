"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X, Settings, Bell, Sparkles, LayoutGrid, Shield, Lock,
    Users, UserCircle, ChevronDown, Play, Monitor, Moon, Sun, Check, Globe
} from "lucide-react";
import { APP_VOICES, speak } from "@/lib/tts";

type Section = "general" | "notifications" | "personalization" | "apps" | "data" | "security" | "parental" | "account";

const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "general", label: "General", icon: <Settings className="w-4 h-4" /> },
    { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
    { id: "personalization", label: "Personalization", icon: <Sparkles className="w-4 h-4" /> },
    { id: "apps", label: "Apps", icon: <LayoutGrid className="w-4 h-4" /> },
    { id: "data", label: "Data controls", icon: <Shield className="w-4 h-4" /> },
    { id: "security", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "parental", label: "Parental controls", icon: <Users className="w-4 h-4" /> },
    { id: "account", label: "Account", icon: <UserCircle className="w-4 h-4" /> },
];

const accentColors = [
    { id: "default", label: "Default", color: "#8e8e8e" },
    { id: "green", label: "Green", color: "#19c59f" },
    { id: "blue", label: "Blue", color: "#5b8def" },
    { id: "purple", label: "Purple", color: "#9b59b6" },
    { id: "orange", label: "Orange", color: "#e67e22" },
    { id: "pink", label: "Pink", color: "#e84393" },
    { id: "red", label: "Red", color: "#e74c3c" },
    { id: "yellow", label: "Yellow", color: "#f1c40f" },
];

const themes = ["System", "Dark", "Light"] as const;
const languages = ["Auto-detect", "English", "Spanish", "French", "German", "Hindi", "Tamil", "Japanese", "Chinese"];
const voices = ["Maple", "Juniper", "Breeze", "Cove", "Ember", "Sol"];

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const [activeSection, setActiveSection] = useState<Section>("general");
    const [theme, setTheme] = useState<string>("Dark");
    const [accentColor, setAccentColor] = useState("default");
    const [language, setLanguage] = useState("Auto-detect");
    const [spokenLanguage, setSpokenLanguage] = useState("Auto-detect");
    const [voice, setVoice] = useState("Maple");

    // Load saved voice
    useEffect(() => {
        const savedVoice = localStorage.getItem("gpt-voice");
        if (savedVoice && APP_VOICES.includes(savedVoice)) {
            setVoice(savedVoice);
        }
    }, []);

    // Save voice
    useEffect(() => {
        localStorage.setItem("gpt-voice", voice);
    }, [voice]);

    const voices = APP_VOICES;

    const handlePlayVoice = () => {
        speak(`Hello, I am ${voice}.`, voice);
    };
    const [showMfaBanner, setShowMfaBanner] = useState(true);

    // Dropdown states
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!openDropdown) return;
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null);
            }
        };
        const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
        return () => { clearTimeout(timer); document.removeEventListener("click", handleClick); };
    }, [openDropdown]);

    // Apply theme
    useEffect(() => {
        const root = document.documentElement;
        if (theme === "Light") {
            root.classList.add("light-theme");
        } else if (theme === "Dark") {
            root.classList.remove("light-theme");
        } else {
            // System: follow OS preference
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            if (prefersDark) {
                root.classList.remove("light-theme");
            } else {
                root.classList.add("light-theme");
            }
        }
    }, [theme]);

    // Apply accent color
    useEffect(() => {
        const selected = accentColors.find(c => c.id === accentColor);
        if (selected && selected.id !== "default") {
            document.documentElement.style.setProperty("--color-accent", selected.color);
        } else {
            document.documentElement.style.setProperty("--color-accent", "#19c59f");
        }
    }, [accentColor]);

    // Close on Escape
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    const DropdownSelect = ({
        id, value, options, onChange, prefix
    }: {
        id: string; value: string; options: string[]; onChange: (v: string) => void; prefix?: React.ReactNode
    }) => (
        <div className="relative" ref={openDropdown === id ? dropdownRef : undefined}>
            <button
                onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === id ? null : id); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm text-[var(--text-primary)]"
            >
                {prefix}
                <span>{value}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
            <AnimatePresence>
                {openDropdown === id && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-[200]"
                    >
                        {options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { onChange(opt); setOpenDropdown(null); }}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === opt ? "bg-[var(--bg-hover)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                    }`}
                            >
                                {opt}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    const renderContent = () => {
        switch (activeSection) {
            case "general":
                return (
                    <div className="space-y-0">
                        {/* MFA Banner */}
                        {showMfaBanner && (
                            <div className="bg-[var(--bg-surface)] rounded-xl p-4 mb-6 relative">
                                <button
                                    onClick={() => setShowMfaBanner(false)}
                                    className="absolute top-3 right-3 p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-muted)] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="w-10 h-10 rounded-xl bg-[var(--border-strong)] flex items-center justify-center mb-3">
                                    <Shield className="w-5 h-5 text-[var(--text-primary)]" />
                                </div>
                                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">Secure your account</h4>
                                <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
                                    Add multi-factor authentication (MFA), like a passkey or text message, to help protect your account when logging in.
                                </p>
                                <button className="px-4 py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] text-sm font-medium rounded-lg hover:opacity-90 transition-opacity">
                                    Set up MFA
                                </button>
                            </div>
                        )}

                        {/* Settings rows */}
                        <div className="divide-y divide-[var(--border)]">
                            {/* Appearance */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-[var(--text-primary)]">Appearance</span>
                                <DropdownSelect id="theme" value={theme} options={[...themes]} onChange={setTheme} />
                            </div>

                            {/* Accent color */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-[var(--text-primary)]">Accent color</span>
                                <div className="relative" ref={openDropdown === "accent" ? dropdownRef : undefined}>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === "accent" ? null : "accent"); }}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm text-[var(--text-primary)]"
                                    >
                                        <span
                                            className="w-3.5 h-3.5 rounded-full border border-[var(--border-strong)]"
                                            style={{ backgroundColor: accentColors.find(c => c.id === accentColor)?.color }}
                                        />
                                        <span>{accentColors.find(c => c.id === accentColor)?.label}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                    </button>
                                    <AnimatePresence>
                                        {openDropdown === "accent" && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.1 }}
                                                className="absolute right-0 top-full mt-1 w-44 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-[200]"
                                            >
                                                {accentColors.map((c) => (
                                                    <button
                                                        key={c.id}
                                                        onClick={() => { setAccentColor(c.id); setOpenDropdown(null); }}
                                                        className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${accentColor === c.id ? "bg-[var(--bg-hover)] text-white" : "text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                                                            }`}
                                                    >
                                                        <span className="w-3.5 h-3.5 rounded-full border border-[var(--border-strong)]" style={{ backgroundColor: c.color }} />
                                                        {c.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {/* Language */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-[var(--text-primary)]">Language</span>
                                <DropdownSelect id="lang" value={language} options={languages} onChange={setLanguage} />
                            </div>

                            {/* Spoken language */}
                            <div className="flex items-center justify-between py-4">
                                <div>
                                    <span className="text-sm text-[var(--text-primary)] block">Spoken language</span>
                                    <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs leading-relaxed">
                                        For best results, select the language you mainly speak. If it&apos;s not listed, it may still be supported via auto-detection.
                                    </p>
                                </div>
                                <DropdownSelect id="spoken" value={spokenLanguage} options={languages} onChange={setSpokenLanguage} />
                            </div>

                            {/* Voice */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-[var(--text-primary)]">Voice</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePlayVoice}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm text-[var(--text-primary)]"
                                    >
                                        <Play className="w-3.5 h-3.5" fill="currentColor" />
                                        <span>Play</span>
                                    </button>
                                    <DropdownSelect id="voice" value={voice} options={voices} onChange={setVoice} />
                                </div>
                            </div>

                            {/* Archived chats */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-[var(--text-primary)]">Archived chats</span>
                                <button className="px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors text-sm text-[var(--text-primary)]">
                                    Manage
                                </button>
                            </div>

                            {/* Delete all chats */}
                            <div className="flex items-center justify-between py-4">
                                <span className="text-sm text-[var(--text-primary)]">Delete all chats</span>
                                <button className="px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                                    Delete all
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case "notifications":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <span className="text-sm text-[var(--text-primary)] block">Email notifications</span>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Receive tips and updates via email</p>
                            </div>
                            <ToggleSwitch />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                            <div>
                                <span className="text-sm text-[var(--text-primary)] block">Push notifications</span>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Get notified about replies</p>
                            </div>
                            <ToggleSwitch />
                        </div>
                    </div>
                );

            case "data":
                return (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-3">
                            <div>
                                <span className="text-sm text-[var(--text-primary)] block">Improve the model for everyone</span>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5 max-w-xs leading-relaxed">
                                    Allow your content to be used to train our models, to make ChatGPT better for everyone.
                                </p>
                            </div>
                            <ToggleSwitch defaultOn />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                            <div>
                                <span className="text-sm text-[var(--text-primary)] block">Chat history</span>
                                <p className="text-xs text-[var(--text-muted)] mt-0.5">Save new chats to your history</p>
                            </div>
                            <ToggleSwitch defaultOn />
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                            <span className="text-sm text-[var(--text-primary)]">Export data</span>
                            <button className="px-4 py-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-primary)] text-sm hover:bg-[var(--bg-hover)] transition-colors">
                                Export
                            </button>
                        </div>
                        <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
                            <span className="text-sm text-[var(--text-primary)]">Delete account</span>
                            <button className="px-4 py-1.5 rounded-lg border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-colors">
                                Delete
                            </button>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex items-center justify-center h-40">
                        <p className="text-[var(--text-muted)] text-sm">
                            {sections.find(s => s.id === activeSection)?.label} settings coming soon.
                        </p>
                    </div>
                );
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center p-4"
                    >
                        <div className="bg-[var(--bg-main)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-[750px] max-h-[85vh] flex overflow-hidden">
                            {/* Left sidebar */}
                            <div className="w-[200px] border-r border-[var(--border)] flex flex-col flex-shrink-0">
                                <div className="p-3 pb-0">
                                    <button
                                        onClick={onClose}
                                        className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-secondary)]"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                <nav className="p-2 pt-1 space-y-0.5">
                                    {sections.map((section) => (
                                        <button
                                            key={section.id}
                                            onClick={() => setActiveSection(section.id)}
                                            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === section.id
                                                ? "bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
                                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]"
                                                }`}
                                        >
                                            {section.icon}
                                            {section.label}
                                        </button>
                                    ))}
                                </nav>
                            </div>

                            {/* Right content */}
                            <div className="flex-1 flex flex-col min-w-0">
                                <div className="px-6 pt-5 pb-3">
                                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                                        {sections.find(s => s.id === activeSection)?.label}
                                    </h2>
                                </div>
                                <div className="flex-1 overflow-y-auto px-6 pb-6">
                                    {renderContent()}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// Toggle switch sub-component
function ToggleSwitch({ defaultOn = false }: { defaultOn?: boolean }) {
    const [on, setOn] = useState(defaultOn);
    return (
        <button
            onClick={() => setOn(!on)}
            className={`relative w-10 h-6 rounded-full transition-colors ${on ? "bg-[var(--color-accent,#19c59f)]" : "bg-[var(--border-strong)]"}`}
        >
            <motion.div
                animate={{ x: on ? 16 : 2 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
            />
        </button>
    );
}
