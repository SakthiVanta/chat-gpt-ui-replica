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

interface InputBoxProps {
  onSend: (message: string, useWebSearch?: boolean) => void;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
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

// Voice wave icon component for logged-in users
function VoiceWaveIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
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
  onVoiceStart,
  onVoiceStop,
  isLoading,
  placeholder = "Ask anything",
  isLoggedIn = false,
  userName = "",
}: InputBoxProps) {
  const [message, setMessage] = useState("");
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToolSelect = (toolId: string) => {
    setActiveTool(toolId === activeTool ? null : toolId);
    setIsToolsOpen(false);
  };

  const hasContent = message.trim().length > 0;

  // Logged-in user view - Image 2 style
  if (isLoggedIn) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        {/* Greeting */}
        <h1 
          className="text-center mb-6"
          style={{
            fontWeight: 400,
            color: 'rgb(255, 255, 255)',
            fontSize: '28px',
            lineHeight: '34px',
          }}
        >
          Good to see you, {userName}.
        </h1>

        {/* Centered Input Container - Image 2 Style */}
        <div
          className={`relative rounded-full border transition-all duration-200 ${
            isFocused
              ? "border-[#4a4a4a]"
              : "border-[#4a4a4a]"
          } bg-[#2f2f2f]`}
        >
          <div className="flex items-center px-4 py-3">
            {/* Left Side - Attachment Icon */}
            <button
              className="p-2 rounded-full hover:bg-[#3a3a3a] text-[#b4b4b4] transition-colors flex-shrink-0"
              title="Attach file"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-[#ececec] placeholder:text-[#8e8e8e] resize-none outline-none text-base leading-relaxed min-h-[24px] max-h-[200px] mx-3"
            />

            {/* Right Side - Mic & Audio Icons */}
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onMouseDown={onVoiceStart}
                onMouseUp={onVoiceStop}
                onMouseLeave={onVoiceStop}
                className="p-2 rounded-full hover:bg-[#3a3a3a] text-[#b4b4b4] transition-colors"
                title="Voice input"
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                className="p-2 rounded-full bg-[#ececec] text-[#212121] hover:opacity-80 transition-opacity"
                title="Voice mode"
              >
                <VoiceWaveIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Non-logged-in user view - Image 1 style (bottom input)
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Main Input Container - Rounded style like Image 1 */}
      <div
        className={`relative rounded-full border transition-all duration-200 ${
          isFocused
            ? "border-[#4a4a4a]"
            : "border-[#4a4a4a]"
        } bg-[#2f2f2f]`}
      >
        <div className="flex items-center px-4 py-3">
          {/* Left Side - Plus Button */}
          <button
            onClick={() => setIsToolsOpen(!isToolsOpen)}
            className="p-2 rounded-full hover:bg-[#3a3a3a] text-[#b4b4b4] transition-colors flex-shrink-0"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            rows={1}
            className="flex-1 bg-transparent text-[#ececec] placeholder:text-[#8e8e8e] resize-none outline-none text-base leading-relaxed min-h-[24px] max-h-[200px] mx-3"
          />

          {/* Right Side - Mic & Voice Wave */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onMouseDown={onVoiceStart}
              onMouseUp={onVoiceStop}
              onMouseLeave={onVoiceStop}
              className="p-2 rounded-full hover:bg-[#3a3a3a] text-[#b4b4b4] transition-colors"
              title="Voice input"
            >
              <Mic className="w-5 h-5" />
            </button>

            <button
              className="p-2 rounded-full bg-[#ececec] text-[#212121] hover:opacity-80 transition-opacity"
              title="Voice mode"
            >
              <VoiceWaveIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tools Dropdown */}
        <AnimatePresence>
          {isToolsOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full left-0 mb-2 w-64 bg-[#212121] border border-[#4a4a4a] rounded-xl shadow-lg overflow-hidden z-50"
            >
              <div className="py-1">
                {tools.map((tool, index) => (
                  <button
                    key={tool.id}
                    onClick={() => handleToolSelect(tool.id)}
                    className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#2f2f2f] transition-colors text-left"
                  >
                    <tool.icon className="w-5 h-5 text-[#b4b4b4]" />
                    <span className="text-sm text-[#ececec]">{tool.label}</span>
                    {index === tools.length - 1 && (
                      <ChevronRight className="w-4 h-4 ml-auto text-[#b4b4b4]" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Tools Bar - Only show when empty and not focused */}
      {!hasContent && !isFocused && placeholder === "Ask anything" && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {quickTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolSelect(tool.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all duration-200 ${
                activeTool === tool.id
                  ? "border-[#19c59f] bg-[#19c59f]/10 text-[#19c59f]"
                  : "border-[#4a4a4a] text-[#b4b4b4] hover:border-[#b4b4b4] hover:text-[#ececec]"
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
