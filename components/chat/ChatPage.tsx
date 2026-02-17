"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { InputBox } from "@/components/chat/InputBox";
import { ChatMessage, ThinkingIndicator } from "@/components/chat/ChatMessage";
import { AuthModal } from "@/components/auth/AuthModal";
import { VoiceModal } from "@/components/voice/VoiceModal";
import { MoreHorizontal, Share2, Users, FolderOpen, Pin, Archive, Flag, Trash2, X, Gift } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  createdAt?: string;
}

interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

const models = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Default model" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Complex reasoning" },
];

interface ChatPageProps {
  initialChatId?: string;
}

export function ChatPage({ initialChatId }: ChatPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | undefined>(initialChatId);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showFreeOffer, setShowFreeOffer] = useState(true);
  const [pageTitle, setPageTitle] = useState("ChatGPT");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [voiceName, setVoiceName] = useState("Maple");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedVoice = localStorage.getItem("gpt-voice");
    if (savedVoice) setVoiceName(savedVoice);
  }, [voiceModalOpen]);

  // Fetch user's chats
  const fetchChats = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch("/api/chats");
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          updatedAt: chat.updatedAt,
          createdAt: chat.createdAt,
        })));
      }
    } catch (error) {
      console.error("Failed to fetch chats:", error);
    }
  }, [session?.user?.id]);

  // Fetch chat messages if chatId is provided
  const fetchChat = useCallback(async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`);
      if (response.ok) {
        const data = await response.json();
        const chatMessages = data.chat.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role as "user" | "assistant",
          content: msg.content,
          createdAt: msg.createdAt,
        }));
        setMessages(chatMessages);
        setPageTitle(data.chat.title);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    } finally {
      setIsLoadingChat(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId);
      setIsLoadingChat(true);
      fetchChat(initialChatId);
    }
  }, [initialChatId, fetchChat]);

  // Update browser tab title
  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      const match = path.match(/^\/c\/(.+)$/);
      if (match) {
        const chatId = match[1];
        if (chatId !== activeChatId) {
          setActiveChatId(chatId);
          setMessages([]);
          setIsLoadingChat(true);
          fetchChat(chatId);
        }
      } else {
        setActiveChatId(undefined);
        setMessages([]);
        setPageTitle("ChatGPT");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [activeChatId, fetchChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSendMessage = async (messageText: string, useWebSearch?: boolean) => {
    if (!session && messages.length >= 2) {
      setAuthModalOpen(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          chatId: activeChatId,
          useWebSearch,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const chatId = response.headers.get("X-Chat-Id");
      const isNewChat = response.headers.get("X-Is-New-Chat") === "true";
      if (chatId && chatId !== activeChatId) {
        setActiveChatId(chatId);
        // Update URL to new chat
        window.history.pushState(null, "", `/c/${chatId}`);
        // Refresh chat list
        fetchChats();
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantContent += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg
        )
      );

      // Update page title after first message
      if (messages.length === 0) {
        setPageTitle(messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""));
      }

      // Poll for AI-generated title after streaming finishes (for new chats)
      if (isNewChat && chatId) {
        const pollForTitle = async () => {
          // Wait a bit for the AI title to be generated
          await new Promise(r => setTimeout(r, 3000));
          try {
            const titleRes = await fetch(`/api/chats/${chatId}`);
            if (titleRes.ok) {
              const titleData = await titleRes.json();
              const newTitle = titleData.chat.title;
              if (newTitle && newTitle !== "New chat") {
                setPageTitle(newTitle);
                // Update chat in sidebar list
                setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
              }
            }
          } catch (err) {
            console.error("Failed to poll for title:", err);
          }
        };
        pollForTitle();
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsThinking(false);
    }
  };

  // Wrapper for VoiceModal to send message and return response text for TTS
  const handleVoiceSend = async (text: string): Promise<string> => {
    if (!text.trim()) return "";

    // 1. Send user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsThinking(true);

    // Detect web search intent
    // Simple regex to check if user explicitly asks to search
    const isSearchIntent = /^(search|google|find|browse|look up)\b/i.test(text);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          chatId: activeChatId,
          useWebSearch: isSearchIntent,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Handle new chat creation if needed
      const chatId = response.headers.get("X-Chat-Id");
      if (chatId && chatId !== activeChatId) {
        setActiveChatId(chatId);
        window.history.pushState(null, "", `/c/${chatId}`);
        fetchChats();
      }

      // Read stream to build response text
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        isStreaming: true,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsThinking(false);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullResponse += chunk;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessage.id ? { ...msg, content: fullResponse } : msg
            )
          );
        }
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessage.id ? { ...msg, isStreaming: false } : msg
        )
      );

      return fullResponse;
    } catch (error) {
      console.error("Voice send error", error);
      setIsThinking(false);
      return "Sorry, I encountered an error receiving the response.";
    }
  };

  const handleNewChat = () => {
    if (!session && messages.length > 0) {
      setAuthModalOpen(true);
      return;
    }
    setMessages([]);
    setActiveChatId(undefined);
    setPageTitle("ChatGPT");
    window.history.pushState(null, "", "/");
  };

  const handleChatSelect = (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    setMessages([]);
    setIsLoadingChat(true);
    fetchChat(chatId);
    window.history.pushState(null, "", `/c/${chatId}`);
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setChats((prev) => prev.filter((c) => c.id !== chatId));
        if (activeChatId === chatId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-screen bg-[var(--bg-main)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        chats={chats}
        activeChatId={activeChatId}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
        onLoginClick={() => setAuthModalOpen(true)}
        onDeleteChat={handleDeleteChat}
      />

      {/* Main Content */}
      <main
        className={`flex-1 flex flex-col h-screen transition-all duration-200 ease-in-out ${sidebarOpen ? "ml-[260px]" : "ml-[60px]"}`}
      >
        {/* Header */}
        <header className="flex items-center px-4 py-3 min-h-[60px]">
          {/* Left side - ChatGPT dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)] font-medium"
            >
              <span className="truncate max-w-[200px]">{"ChatGPT"}</span>
              <svg
                className={`w-4 h-4 transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Model Dropdown */}
            <AnimatePresence>
              {isModelDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full left-0 mt-2 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl p-2 min-w-[240px] z-50 shadow-lg"
                >
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`flex flex-col w-full p-3 rounded-lg text-left transition-colors ${selectedModel === model.id
                        ? "bg-[var(--bg-hover)]"
                        : "hover:bg-[var(--bg-hover)]"
                        }`}
                    >
                      <span className="text-[var(--text-primary)] text-sm font-medium">
                        {model.name}
                      </span>
                      <span className="text-[var(--text-muted)] text-xs mt-0.5">
                        {model.description}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center - Free offer badge */}
          <div className="flex-1 flex justify-center">
            {session && showFreeOffer && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#5b4ba5] text-white text-sm">
                <Gift className="w-4 h-4" />
                <span>Free offer</span>
                <button
                  onClick={() => setShowFreeOffer(false)}
                  className="ml-1 hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Right side - Share and More menu */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isEmpty && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)] text-sm">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}

            {/* More menu button */}
            {!isEmpty && (
              <div className="relative">
                <button
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* More menu dropdown */}
                <AnimatePresence>
                  {isMoreMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full right-0 mt-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <div className="py-1">
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Start a group chat</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <FolderOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Move to project</span>
                          <svg className="w-4 h-4 ml-auto text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <Pin className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Pin chat</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <Archive className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Archive</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <Flag className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Report</span>
                        </button>
                        <button
                          onClick={() => activeChatId && handleDeleteChat(activeChatId)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Delete</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty && !isLoadingChat ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-32">
              {!session && (
                <h1 className="text-3xl font-semibold text-[var(--text-primary)] mb-8 text-center">
                  What are you working on?
                </h1>
              )}
              <div className="w-full max-w-3xl">
                <InputBox
                  onSend={handleSendMessage}
                  onVoiceStart={() => setVoiceModalOpen(true)}
                  onVoiceMode={() => setVoiceModalOpen(true)}
                  placeholder="Ask anything"
                  isLoggedIn={!!session}
                  userName={session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "User"}
                />
              </div>
            </div>
          ) : isLoadingChat ? (
            <div className="pb-32 max-w-3xl mx-auto px-4">
              {/* Loading skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="py-4">
                  <div className="space-y-3 animate-pulse">
                    <div className={`h-4 bg-[var(--bg-surface)] rounded ${i % 2 === 0 ? 'w-48 ml-auto' : 'w-3/4'}`} />
                    {i % 2 !== 0 && <div className="h-4 bg-[var(--bg-surface)] rounded w-1/2" />}
                    {i % 2 !== 0 && <div className="h-4 bg-[var(--bg-surface)] rounded w-2/3" />}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="pb-32">
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLast={index === messages.length - 1}
                />
              ))}
              {isThinking && <ThinkingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        {!isEmpty && (
          <div
            className={`fixed bottom-0 right-0 bg-[var(--bg-main)] border-t border-[var(--border)] p-4 transition-all duration-200 ease-in-out ${sidebarOpen ? "left-[260px]" : "left-[60px]"}`}
          >
            <div className="max-w-3xl mx-auto">
              <InputBox
                onSend={handleSendMessage}
                onVoiceStart={() => setVoiceModalOpen(true)}
                onVoiceMode={() => setVoiceModalOpen(true)}
                isLoading={isThinking}
                placeholder="Message ChatGPT..."
                isLoggedIn={false}
                userName={session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "User"}
              />
              <p className="text-center text-xs text-[var(--text-muted)] mt-3">
                ChatGPT can make mistakes. Check important info. See{" "}
                <a href="#" className="underline hover:text-[var(--text-primary)]">
                  Cookie Preferences
                </a>
                .
              </p>
            </div>
          </div>
        )}

        {/* Empty State Footer */}
        {isEmpty && (
          <div
            className={`absolute bottom-0 p-4 text-center transition-all duration-200 ease-in-out ${sidebarOpen ? "left-[260px] right-0" : "left-[60px] right-0"}`}
          >
            <p className="text-xs text-[var(--text-muted)]">
              ChatGPT can make mistakes. Check important info. See{" "}
              <a href="#" className="underline hover:text-[var(--text-primary)]">
                Cookie Preferences
              </a>
              .
            </p>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Voice Modal */}
      <VoiceModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onSend={handleVoiceSend}
        voiceName={voiceName}
      />
    </div>
  );
}
