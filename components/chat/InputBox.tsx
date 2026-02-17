"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Paperclip,
  Globe,
  GraduationCap,
  Image,
  Mic,
  ArrowUp,
  X,
  Sparkles,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { VoiceInput } from "./VoiceInput";

interface InputBoxProps {
  onSend: (message: string, useWebSearch?: boolean) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onVoiceMode?: () => void;
  isListening?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  isLoggedIn?: boolean;
  userName?: string;
}

const tools = [
  { id: "attach", label: "Add photos & files", icon: Paperclip },
  { id: "image", label: "Create image", icon: Image },
  { id: "search", label: "Web search", icon: Globe },
  { id: "research", label: "Deep research", icon: Sparkles },
  { id: "shopping", label: "Shopping research", icon: ShoppingBag },
];

const quickTools = [
  { id: "attach", label: "Attach", icon: Paperclip },
  { id: "search", label: "Search", icon: Globe },
  { id: "study", label: "Study", icon: GraduationCap },
  { id: "create", label: "Create image", icon: Image },
];

function VoiceWaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="4" y="10" width="2" height="4" rx="1" />
      <rect x="8" y="7" width="2" height="10" rx="1" />
      <rect x="12" y="4" width="2" height="16" rx="1" />
      <rect x="16" y="7" width="2" height="10" rx="1" />
      <rect x="20" y="10" width="2" height="4" rx="1" />
    </svg>
  );
}

export function InputBox({
  onSend,
  onVoiceMode,
  isListening = false,
  isLoading,
  placeholder = "Ask anything",
  isLoggedIn = false,
  userName = "",
}: InputBoxProps) {
  const [message, setMessage] = useState("");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [message]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(event.target as Node)) {
        setIsToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSend(message, activeTool === "search");
      setMessage("");
      setActiveTool(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleVoiceConfirm = (text: string) => {
    setMessage((prev) => prev + (prev ? " " : "") + text);
    setIsRecording(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId === activeTool ? null : toolId);
    setIsToolsOpen(false);
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const hasContent = message.trim().length > 0;
  const isSearchActive = activeTool === "search";

  // Logged-in user view
  if (isLoggedIn) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="text-center mb-6 font-normal text-white text-[28px] leading-[34px]">
          Good to see you, {userName}.
        </h1>

        <div
          className={`relative border transition-all duration-200 border-[var(--border-strong)] bg-[var(--bg-surface)] ${isSearchActive ? "rounded-2xl" : "rounded-full"
            }`}
        >
          {isRecording ? (
            <VoiceInput onConfirm={handleVoiceConfirm} onCancel={() => setIsRecording(false)} />
          ) : (
            <div className="flex flex-col">
              {/* Main input row */}
              <div className="flex items-center px-4 py-3">
                {/* Only show + in main row when NOT in search mode */}
                {!isSearchActive && (
                  <button
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                )}

                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={isSearchActive ? "Search the web" : placeholder}
                  rows={1}
                  className={`flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none text-base leading-relaxed min-h-[24px] max-h-[200px] mx-3 ${isSearchActive ? 'ml-4' : ''}`}
                />

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setIsRecording(true)}
                    className={`p-2 rounded-full transition-colors ${isListening
                      ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                      : "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                      }`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {hasContent ? (
                    <button
                      onClick={handleSend}
                      disabled={isLoading}
                      className="p-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      <ArrowUp className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={onVoiceMode}
                      className="p-2 rounded-full bg-[#ececec] dark:bg-[#212121] text-[#212121] dark:text-[#ececec] hover:opacity-80 transition-opacity"
                    >
                      <VoiceWaveIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Tool Pill - Inline at bottom */}
              {isSearchActive && (
                <div className="flex items-center gap-2 px-4 pb-3">
                  <button
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Search pill with hover X - fixed layout */}
                  <button
                    onClick={() => handleToolSelect("search")}
                    className="group flex items-center rounded-full bg-[#3b3b3b] hover:bg-[#4a4a4a] transition-colors py-1.5 pr-3"
                  >
                    {/* X icon - only on hover, takes no space when hidden */}
                    <span className="hidden group-hover:flex items-center justify-center w-7">
                      <X className="w-4 h-4 text-[#4a9eff]" />
                    </span>
                    {/* Globe icon - hidden on hover */}
                    <span className="flex group-hover:hidden items-center justify-center w-7">
                      <Globe className="w-4 h-4 text-[#4a9eff]" />
                    </span>
                    <span className="text-sm text-[#4a9eff]">Search</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tools Dropdown */}
          <AnimatePresence>
            {isToolsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-50"
              >
                <div className="py-1">
                  {tools.map((tool, index) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolSelect(tool.id)}
                      className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-surface)] transition-colors text-left"
                    >
                      <tool.icon className="w-5 h-5 text-[var(--text-secondary)]" />
                      <span className="text-sm text-[var(--text-primary)]">{tool.label}</span>
                      {index === tools.length - 1 && (
                        <ChevronRight className="w-4 h-4 ml-auto text-[var(--text-secondary)]" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Non-logged-in user view
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={`relative border transition-all duration-200 border-[var(--border-strong)] bg-[var(--bg-surface)] ${isSearchActive ? "rounded-2xl" : "rounded-full"
          }`}
      >
        {isRecording ? (
          <VoiceInput onConfirm={handleVoiceConfirm} onCancel={() => setIsRecording(false)} />
        ) : (
          <div className="flex flex-col">
            {/* Main input row */}
            <div className="flex items-center px-4 py-3">
              {/* Only show + in main row when NOT in search mode */}
              {!isSearchActive && (
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors flex-shrink-0"
                >
                  <Plus className="w-5 h-5" />
                </button>
              )}

              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={isSearchActive ? "Search the web" : placeholder}
                rows={1}
                className={`flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none outline-none text-base leading-relaxed min-h-[24px] max-h-[200px] mx-3 ${isSearchActive ? 'ml-4' : ''}`}
              />

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setIsRecording(true)}
                  className={`p-2 rounded-full transition-colors ${isListening
                    ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                    : "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                    }`}
                >
                  <Mic className="w-5 h-5" />
                </button>

                {hasContent ? (
                  <button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="p-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-80 transition-opacity disabled:opacity-50"
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={onVoiceMode}
                    className="p-2 rounded-full bg-[#ececec] dark:bg-[#212121] text-[#212121] dark:text-[#ececec] hover:opacity-80 transition-opacity"
                  >
                    <VoiceWaveIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Tool Pill - Inline at bottom */}
            {isSearchActive && (
              <div className="flex items-center gap-2 px-4 pb-3">
                <button
                  onClick={() => setIsToolsOpen(!isToolsOpen)}
                  className="p-1.5 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>

                {/* Search pill with hover X - fixed layout */}
                <button
                  onClick={() => handleToolSelect("search")}
                  className="group flex items-center rounded-full bg-[#3b3b3b] hover:bg-[#4a4a4a] transition-colors py-1.5 pr-3"
                >
                  {/* X icon - only on hover, takes no space when hidden */}
                  <span className="hidden group-hover:flex items-center justify-center w-7">
                    <X className="w-4 h-4 text-[#4a9eff]" />
                  </span>
                  {/* Globe icon - hidden on hover */}
                  <span className="flex group-hover:hidden items-center justify-center w-7">
                    <Globe className="w-4 h-4 text-[#4a9eff]" />
                  </span>
                  <span className="text-sm text-[#4a9eff]">Search</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tools Dropdown */}
        <AnimatePresence>
          {isToolsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--bg-main)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-50"
            >
              <div className="py-1">
                {tools.map((tool, index) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-surface)] transition-colors text-left"
                  >
                    <tool.icon className="w-5 h-5 text-[var(--text-secondary)]" />
                    <span className="text-sm text-[var(--text-primary)]">{tool.label}</span>
                    {index === tools.length - 1 && (
                      <ChevronRight className="w-4 h-4 ml-auto text-[var(--text-secondary)]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Tools Bar */}
      {!hasContent && !isFocused && placeholder === "Ask anything" && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-200 ${activeTool === tool.id
                ? "border-[#19c59f] bg-[#19c59f]/10 text-[#19c59f]"
                : "border-[var(--border-strong)] text-[var(--text-secondary)] hover:border-[#b4b4b4] hover:text-[var(--text-primary)]"
                }`}
            >
              <tool.icon className="w-4 h-4" />
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
