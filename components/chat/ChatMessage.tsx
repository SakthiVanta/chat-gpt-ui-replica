"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, Share2, MoreHorizontal } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatMessageProps {
  message: Message;
  isLast?: boolean;
  onRegenerate?: () => void;
}

export function ChatMessage({ message, isLast, onRegenerate }: ChatMessageProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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
              className="bg-[#2f2f2f] rounded-2xl px-4 py-2.5 max-w-[85%]"
              style={{
                fontWeight: 400,
                color: 'rgb(255, 255, 255)',
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
          className="text-[#ececec]"
          style={{
            fontWeight: 400,
            color: 'rgb(255, 255, 255)',
            fontSize: '16px',
            lineHeight: '28px',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
          {message.isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-[#19c59f] animate-pulse" />
          )}
        </div>

        {/* Message Actions - Only for AI, no avatar visible */}
        {!message.isStreaming && (
          <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md hover:bg-[#2f2f2f] text-[#b4b4b4] transition-colors"
              title="Copy"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[#2f2f2f] text-[#b4b4b4] transition-colors" title="Good response">
              <ThumbsUp className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[#2f2f2f] text-[#b4b4b4] transition-colors" title="Bad response">
              <ThumbsDown className="w-4 h-4" />
            </button>
            <button className="p-1.5 rounded-md hover:bg-[#2f2f2f] text-[#b4b4b4] transition-colors" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            {isLast && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-md hover:bg-[#2f2f2f] text-[#b4b4b4] transition-colors"
                title="Regenerate"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            <button className="p-1.5 rounded-md hover:bg-[#2f2f2f] text-[#b4b4b4] transition-colors" title="More">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
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
        <div className="flex items-center gap-2 text-[#b4b4b4]">
          <div className="w-4 h-4 border-2 border-[#4a4a4a] border-t-[#19c59f] rounded-full animate-spin" />
          <span className="text-sm">{message}</span>
        </div>
      </div>
    </motion.div>
  );
}
