"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Image as ImageIcon,
  LayoutGrid,
  Sparkles,
  Pencil,
  Settings,
  HelpCircle,
  LogOut,
  Crown,
  Gift,
  FolderOpen,
  Pin,
  Box,
  Hexagon,
  ChevronDown,
  X,
  MessageSquare,
  Edit3,
  Share,
  Trash2,
  MoreHorizontal,
  Archive,
  Flag,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

interface ChatListItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  chats: ChatListItem[];
  activeChatId?: string;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onLoginClick: () => void;
  onDeleteChat?: (chatId: string) => void;
}

export function Sidebar({
  isOpen,
  onToggle,
  chats,
  activeChatId,
  onChatSelect,
  onNewChat,
  onLoginClick,
  onDeleteChat,
}: SidebarProps) {
  const { data: session } = useSession();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatListItem[]>([]);
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Group chats by date
  const groupedChats = groupChatsByDate(chats);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, chats]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Close chat menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setChatMenuOpen(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Collapsed sidebar
  if (!isOpen) {
    return (
      <div className="fixed left-0 top-0 h-full w-[60px] bg-[#171717] border-r border-[#2f2f2f] flex flex-col items-center py-3 z-50">
        {/* Logo - changes to hamburger on hover */}
        <button
          onClick={onToggle}
          className="p-2 mb-4 rounded-lg hover:bg-[#2f2f2f] transition-colors group relative"
          title="Open sidebar"
        >
          <div className="relative w-6 h-6">
            <div className="group-hover:hidden">
              <Image src="/logo.png" alt="Logo" width={24} height={24} />
            </div>
            <svg
              className="w-6 h-6 text-white hidden group-hover:block absolute inset-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </div>
        </button>

        {/* New Chat - Fixed icon */}
        <button
          onClick={onNewChat}
          className="p-2 mb-4 rounded-lg hover:bg-[#2f2f2f] transition-colors"
          title="New chat"
        >
          <Pencil className="w-5 h-5 text-white" />
        </button>

        {/* Search */}
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 mb-4 rounded-lg hover:bg-[#2f2f2f] transition-colors"
          title="Search chats"
        >
          <Search className="w-5 h-5 text-white" />
        </button>

        {/* Create Image */}
        <button
          className="p-2 mb-auto rounded-lg hover:bg-[#2f2f2f] transition-colors"
          title="Create image"
        >
          <ImageIcon className="w-5 h-5 text-white" />
        </button>

        {/* Bottom icons */}
        <div className="mt-auto flex flex-col items-center gap-2">
          {session && (
            <button className="p-2 rounded-lg hover:bg-[#2f2f2f] transition-colors">
              <Sparkles className="w-5 h-5 text-white" />
            </button>
          )}

          {session ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-8 h-8 rounded-full bg-[#19c59f] flex items-center justify-center text-white text-sm font-medium hover:ring-2 hover:ring-[#19c59f]/50 transition-all"
              >
                {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-64 bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-[#4a4a4a]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#19c59f] flex items-center justify-center text-white font-medium">
                          {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {session.user?.name || session.user?.email?.split("@")[0]}
                          </p>
                          <p className="text-xs text-[#8e8e8e] truncate">
                            @{session.user?.email?.split("@")[0]}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <Crown className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Upgrade plan</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <Sparkles className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Personalization</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <Settings className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-[#4a4a4a] py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <HelpCircle className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Help</span>
                        <svg className="w-4 h-4 ml-auto text-[#b4b4b4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <LogOut className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="w-8 h-8 rounded-full bg-[#2f2f2f] flex items-center justify-center text-white text-xs hover:bg-[#3a3a3a] transition-colors"
            >
              ?
            </button>
          )}
        </div>

        {/* Search Modal */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
              onClick={() => setIsSearchOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-md bg-[#2f2f2f] rounded-xl shadow-2xl overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Search Input */}
                <div className="flex items-center gap-3 p-4 border-b border-[#4a4a4a]">
                  <Search className="w-5 h-5 text-[#b4b4b4]" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 bg-transparent text-[#ececec] placeholder:text-[#8e8e8e] outline-none"
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="p-1 rounded hover:bg-[#3a3a3a] text-[#b4b4b4]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search Results */}
                <div className="max-h-96 overflow-y-auto py-2">
                  {/* New chat option */}
                  <button
                    onClick={() => {
                      onNewChat();
                      setIsSearchOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-[#b4b4b4]" />
                    <span className="text-sm text-[#ececec]">New chat</span>
                  </button>

                  {/* Results */}
                  {searchQuery.trim() ? (
                    searchResults.length > 0 ? (
                      searchResults.map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => {
                            onChatSelect(chat.id);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec] truncate">{chat.title}</span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-[#8e8e8e]">No results found</div>
                    )
                  ) : (
                    // Show recent chats when no search query
                    Object.entries(groupedChats).map(([group, groupChats]) => (
                      <div key={group}>
                        <div className="px-4 py-2 text-xs text-[#8e8e8e] uppercase">{group}</div>
                        {groupChats.slice(0, 5).map((chat) => (
                          <button
                            key={chat.id}
                            onClick={() => {
                              onChatSelect(chat.id);
                              setIsSearchOpen(false);
                            }}
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors"
                          >
                            <MessageSquare className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec] truncate">{chat.title}</span>
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Expanded sidebar
  return (
    <>
      <div className="fixed left-0 top-0 h-full w-[260px] bg-[#171717] border-r border-[#2f2f2f] flex flex-col z-50">
        {/* Logo with Close button */}
        <div className="flex items-center justify-between p-3">
          <div className="w-8 h-8">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-[#2f2f2f] transition-colors group relative"
            title="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-[#b4b4b4]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16" />
            </svg>
          </button>
        </div>

        {/* New Chat Button */}
        <div className="px-3 mb-4">
          <button
            onClick={onNewChat}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]"
          >
            <Pencil className="w-5 h-5" />
            <span className="text-sm">New chat</span>
          </button>
        </div>

        {/* Navigation Items */}
        <div className="px-2 space-y-0.5">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]"
          >
            <Search className="w-5 h-5 text-[#b4b4b4]" />
            <span className="text-sm">Search chats</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
            <ImageIcon className="w-5 h-5 text-[#b4b4b4]" />
            <span className="text-sm">Images</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
            <LayoutGrid className="w-5 h-5 text-[#b4b4b4]" />
            <span className="text-sm">Apps</span>
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
            <Box className="w-5 h-5 text-[#b4b4b4]" />
            <span className="text-sm">Codex</span>
          </button>
        </div>

        {/* GPTs Section */}
        <div className="px-4 mt-4">
          <h3 className="text-xs font-medium text-[#8e8e8e] uppercase tracking-wider mb-2">
            GPTs
          </h3>
          <div className="space-y-0.5">
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
              <Hexagon className="w-5 h-5 text-[#b4b4b4]" />
              <span className="text-sm">Ethical Hacker GPT</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
              <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              <span className="text-sm">Canva</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
              <Box className="w-5 h-5 text-[#b4b4b4]" />
              <span className="text-sm">Explore GPTs</span>
            </button>
          </div>
        </div>

        {/* Projects Section */}
        <div className="px-4 mt-4">
          <h3 className="text-xs font-medium text-[#8e8e8e] uppercase tracking-wider mb-2">
            Projects
          </h3>
          <div className="space-y-0.5">
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
              <FolderOpen className="w-5 h-5 text-[#b4b4b4]" />
              <span className="text-sm">New project</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
              <FolderOpen className="w-5 h-5 text-[#b4b4b4]" />
              <span className="text-sm">prisma query</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[#2f2f2f] transition-colors text-[#ececec]">
              <FolderOpen className="w-5 h-5 text-[#b4b4b4]" />
              <span className="text-sm">ecommerce website</span>
            </button>
          </div>
        </div>

        {/* Your Chats Section */}
        <div className="px-4 mt-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-medium text-[#8e8e8e] uppercase tracking-wider mb-2">
            Your chats
          </h3>
          <div className="space-y-0.5">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="group relative flex items-center"
              >
                <button
                  onClick={() => onChatSelect(chat.id)}
                  className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                    activeChatId === chat.id
                      ? "bg-[#2f2f2f]"
                      : "hover:bg-[#2f2f2f]"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-[#b4b4b4] flex-shrink-0" />
                  <span className="text-sm text-[#ececec] truncate flex-1">{chat.title}</span>
                </button>
                
                {/* Three dots menu */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setChatMenuOpen(chatMenuOpen === chat.id ? null : chat.id);
                    }}
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[#3a3a3a] text-[#b4b4b4] transition-all"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>

                  {/* Context Menu */}
                  <AnimatePresence>
                    {chatMenuOpen === chat.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute right-0 top-full mt-1 w-52 bg-[#2f2f2f] border border-[#4a4a4a] rounded-lg shadow-lg overflow-hidden z-50"
                      >
                        <div className="py-1">
                          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left">
                            <Share className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec]">Share</span>
                          </button>
                          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left">
                            <Users className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec]">Start a group chat</span>
                          </button>
                          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left">
                            <Edit3 className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec]">Rename</span>
                          </button>
                          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left">
                            <FolderOpen className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec]">Move to project</span>
                            <svg className="w-4 h-4 ml-auto text-[#b4b4b4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left">
                            <Pin className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec]">Pin chat</span>
                          </button>
                          <button className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left">
                            <Archive className="w-4 h-4 text-[#b4b4b4]" />
                            <span className="text-sm text-[#ececec]">Archive</span>
                          </button>
                          <button
                            onClick={() => onDeleteChat?.(chat.id)}
                            className="flex items-center gap-3 w-full px-4 py-2 hover:bg-[#3a3a3a] transition-colors text-left text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer - User Section */}
        <div className="p-3 border-t border-[#2f2f2f]">
          {!session ? (
            <div className="space-y-3">
              <button
                onClick={onLoginClick}
                className="w-full py-2.5 px-4 rounded-full bg-white text-black font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Gift className="w-4 h-4" />
                Claim offer
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* User Info */}
              <div 
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#2f2f2f] cursor-pointer"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
              >
                <div className="w-8 h-8 rounded-full bg-[#19c59f] flex items-center justify-center text-white font-medium">
                  {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session.user?.name || session.user?.email?.split("@")[0]}
                  </p>
                  <p className="text-xs text-[#8e8e8e]">Free</p>
                </div>
                <ChevronDown className="w-4 h-4 text-[#b4b4b4]" />
              </div>

              {/* Claim Offer Button */}
              <button className="w-full py-2.5 px-4 rounded-full border border-[#4a4a4a] text-[#ececec] font-medium hover:bg-[#2f2f2f] transition-opacity flex items-center justify-center gap-2">
                <Gift className="w-4 h-4" />
                Claim offer
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-20 left-3 w-56 bg-[#2f2f2f] border border-[#4a4a4a] rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <Crown className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Upgrade plan</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <Sparkles className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Personalization</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <Settings className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-[#4a4a4a] py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <HelpCircle className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Help</span>
                        <svg className="w-4 h-4 ml-auto text-[#b4b4b4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[#3a3a3a] transition-colors text-left">
                        <LogOut className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec]">Log out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Search Modal for Expanded Sidebar */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20"
            onClick={() => setIsSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-[#2f2f2f] rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-[#4a4a4a]">
                <Search className="w-5 h-5 text-[#b4b4b4]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[#ececec] placeholder:text-[#8e8e8e] outline-none"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded hover:bg-[#3a3a3a] text-[#b4b4b4]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search Results */}
              <div className="max-h-96 overflow-y-auto py-2">
                {/* New chat option */}
                <button
                  onClick={() => {
                    onNewChat();
                    setIsSearchOpen(false);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors"
                >
                  <Pencil className="w-4 h-4 text-[#b4b4b4]" />
                  <span className="text-sm text-[#ececec]">New chat</span>
                </button>

                {/* Results */}
                {searchQuery.trim() ? (
                  searchResults.length > 0 ? (
                    searchResults.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => {
                          onChatSelect(chat.id);
                          setIsSearchOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 text-[#b4b4b4]" />
                        <span className="text-sm text-[#ececec] truncate">{chat.title}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-[#8e8e8e]">No results found</div>
                  )
                ) : (
                  // Show recent chats when no search query
                  Object.entries(groupedChats).map(([group, groupChats]) => (
                    <div key={group}>
                      <div className="px-4 py-2 text-xs text-[#8e8e8e] uppercase">{group}</div>
                      {groupChats.slice(0, 5).map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => {
                            onChatSelect(chat.id);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[#3a3a3a] transition-colors"
                        >
                          <MessageSquare className="w-4 h-4 text-[#b4b4b4]" />
                          <span className="text-sm text-[#ececec] truncate">{chat.title}</span>
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onToggle}
      />
    </>
  );
}

function groupChatsByDate(chats: ChatListItem[]) {
  const groups: Record<string, ChatListItem[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    "Previous 30 Days": [],
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt);
    if (chatDate >= today) {
      groups["Today"].push(chat);
    } else if (chatDate >= yesterday) {
      groups["Yesterday"].push(chat);
    } else if (chatDate >= sevenDaysAgo) {
      groups["Previous 7 Days"].push(chat);
    } else if (chatDate >= thirtyDaysAgo) {
      groups["Previous 30 Days"].push(chat);
    }
  });

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key];
    }
  });

  return groups;
}
