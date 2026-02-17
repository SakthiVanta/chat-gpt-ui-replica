"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share2, MoreHorizontal, GitBranch, Volume2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
}

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, isLast, onRegenerate }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Click outside to close the more menu
  useEffect(() => {
    if (!isMoreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMoreOpen]);

  const formatTimestamp = (dateStr?: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isToday) return `Today, ${time}`;
    if (isYesterday) return `Yesterday, ${time}`;
    return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
  };

  // User message - right aligned, simple bubble
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="py-4"
      >
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex justify-end">
            <div
              className="bg-[var(--bg-surface)] rounded-2xl px-4 py-2.5 max-w-[85%]"
              style={{
                fontWeight: 400,
                color: 'var(--text-primary)',
                fontSize: '16px',
                lineHeight: '24px',
              }}
            >
              {message.content}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // AI message - left aligned with action buttons
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-4 group"
    >
      <div className="max-w-3xl mx-auto px-4">
        <div
          className="text-[var(--text-primary)] prose prose-invert max-w-none"
          style={{
            fontWeight: 400,
            color: 'var(--text-primary)',
            fontSize: '16px',
            lineHeight: '28px',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-5 ml-0.5 bg-[#ececec] rounded-sm animate-blink align-text-bottom" />
          )}
        </div>

        {/* Message Actions - Only for AI, no avatar visible */}
        {!message.isStreaming && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors"
              title={isCopied ? "Copied!" : "Copy"}
            >
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors" title="Good response">
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors" title="Bad response">
              <ThumbsDown className="w-4 h-4" />
            </button>
            {isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors"
                title="Regenerate"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isMoreOpen) {
                    setIsMoreOpen(false);
                  } else {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setMenuPos({ top: rect.bottom + 4, left: rect.left });
                    setIsMoreOpen(true);
                  }
                }}
                className="p-1.5 rounded-md hover:bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors"
                title="More"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed position message context menu */}
      <AnimatePresence>
        {isMoreOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed w-56 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-2xl overflow-hidden z-[100]"
            style={{ top: menuPos.top, left: menuPos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="py-1">
              {/* Timestamp */}
              <div className="px-4 py-2 text-xs text-[var(--text-muted)]">
                {formatTimestamp(message.createdAt) || "Just now"}
              </div>
              <div className="border-t border-[var(--border-strong)] my-1" />
              <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                <GitBranch className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-sm text-[var(--text-primary)]">Branch in new chat</span>
              </button>
              <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                <Volume2 className="w-4 h-4 text-[var(--text-secondary)]" />
                <span className="text-sm text-[var(--text-primary)]">Read aloud</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ThinkingIndicatorProps {
  message?: string;
}

export function ThinkingIndicator({ message = "Thinking" }: ThinkingIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-4"
    >
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <div className="w-4 h-4 border-2 border-[var(--border-strong)] border-t-[#19c59f] rounded-full animate-spin" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </motion.div>
  );
}
