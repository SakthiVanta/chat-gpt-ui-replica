"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { InputBox } from "@/components/chat/InputBox";
import { ChatMessage, ThinkingIndicator } from "@/components/chat/ChatMessage";
import { AuthModal } from "@/components/auth/AuthModal";
import { MoreHorizontal, Share2, Users, FolderOpen, Pin, Archive, Flag, Trash2, X, Gift } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

const models = [
  { id: "gpt-4", name: "GPT-4", description: "Most capable model" },
  { id: "gpt-3.5", name: "GPT-3.5", description: "Faster responses" },
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
  const [selectedModel, setSelectedModel] = useState("gpt-4");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [showFreeOffer, setShowFreeOffer] = useState(true);
  const [pageTitle, setPageTitle] = useState("ChatGPT");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
        }));
        setMessages(chatMessages);
        setPageTitle(data.chat.title);
      }
    } catch (error) {
      console.error("Failed to fetch chat:", error);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    if (initialChatId) {
      setActiveChatId(initialChatId);
      fetchChat(initialChatId);
    }
  }, [initialChatId, fetchChat]);

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
      if (chatId && chatId !== activeChatId) {
        setActiveChatId(chatId);
        // Update URL to new chat
        router.push(`/c/${chatId}`);
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
    } catch (error) {
      console.error("Error sending message:", error);
      setIsThinking(false);
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
    router.push("/");
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
    router.push(`/c/${chatId}`);
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
    <div className="flex h-screen bg-[#212121]">
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
        <header className="flex items-center justify-between px-4 py-3 min-h-[60px]">
          {/* Left side - ChatGPT dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec] font-medium"
            >
              <span>{pageTitle === "ChatGPT" ? "ChatGPT" : pageTitle}</span>
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
                  className="absolute top-full left-0 mt-2 bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl p-2 min-w-[240px] z-50 shadow-lg"
                >
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setIsModelDropdownOpen(false);
                      }}
                      className={`flex flex-col w-full p-3 rounded-lg text-left transition-colors ${
                        selectedModel === model.id
                          ? "bg-[#3a3a3a]"
                          : "hover:bg-[#3a3a3a]"
                      }`}
                    >
                      <span className="text-[#ececec] text-sm font-medium">
                        {model.name}
                      </span>
                      <span className="text-[#8e8e8e] text-xs mt-0.5">
                        {model.description}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Center - Free offer badge */}
          {session && showFreeOffer && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
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
            </div>
          )}

          {/* Right side - Share and More menu */}
          <div className="flex items-center gap-2">
            {!isEmpty && (
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec] text-sm">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            )}
            
            {/* More menu button */}
            {!isEmpty && (
              <div className="relative">
                <button 
                  onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                  className="p-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]"
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
                      className="absolute top-full right-0 mt-2 w-56 bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <div className="py-1">
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                          <Users className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec]">Start a group chat</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                          <FolderOpen className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec]">Move to project</span>
                          <svg className="w-4 h-4 ml-auto text-[#b4b4b4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                          <Pin className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec]">Pin chat</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                          <Archive className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec]">Archive</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                          <Flag className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec]">Report</span>
                        </button>
                        <button 
                          onClick={() => activeChatId && handleDeleteChat(activeChatId)}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left text-red-400"
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
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-32">
              {!session && (
                <h1 className="text-3xl font-semibold text-[#ececec] mb-8 text-center">
                  What are you working on?
                </h1>
              )}
              <div className="w-full max-w-3xl">
                <InputBox
                  onSend={handleSendMessage}
                  placeholder="Ask anything"
                  isLoggedIn={!!session}
                  userName={session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "User"}
                />
              </div>
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
            className={`fixed bottom-0 right-0 bg-[#212121] border-t border-[#2f2f2f] p-4 transition-all duration-200 ease-in-out ${sidebarOpen ? "left-[260px]" : "left-[60px]"}`}
          >
            <div className="max-w-3xl mx-auto">
              <InputBox
                onSend={handleSendMessage}
                isLoading={isThinking}
                placeholder="Message ChatGPT..."
                isLoggedIn={false}
                userName={session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "User"}
              />
              <p className="text-center text-xs text-[#8e8e8e] mt-3">
                ChatGPT can make mistakes. Check important info. See{" "}
                <a href="#" className="underline hover:text-[#ececec]">
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
            <p className="text-xs text-[#8e8e8e]">
              ChatGPT can make mistakes. Check important info. See{" "}
              <a href="#" className="underline hover:text-[#ececec]">
                Cookie Preferences
              </a>
              .
            </p>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
}
