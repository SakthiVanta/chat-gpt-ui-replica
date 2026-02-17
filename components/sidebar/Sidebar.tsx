"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  SquarePen,
  Sparkles,
  Settings,
  HelpCircle,
  LogOut,
  Crown,
  Gift,
  FolderOpen,
  Pin,
  ChevronRight,
  X,
  Edit3,
  Share,
  Trash2,
  MoreHorizontal,
  Archive,
  Users,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { Logo } from "@/components/ui/Logo";
import { SettingsModal } from "@/components/settings/SettingsModal";

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGptsOpen, setIsGptsOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [chatMenuOpen, setChatMenuOpen] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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
    if (!chatMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setChatMenuOpen(null);
      }
    };
    // Use setTimeout to avoid the same click event closing the menu
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [chatMenuOpen]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    // Use setTimeout to avoid the same click event closing the menu
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileOpen]);

  // Collapsed sidebar
  if (!isOpen) {
    return (
      <>
        <div className="fixed left-0 top-0 h-full w-[60px] bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col items-center py-3 z-50">
          {/* Logo - changes to hamburger on hover */}
          <button
            onClick={onToggle}
            className="p-2 mb-4 rounded-lg hover:bg-[var(--bg-surface)] transition-colors group relative"
            title="Open sidebar"
          >
            <div className="relative w-6 h-6">
              <div className="group-hover:hidden">
                <Logo size={20} className="text-[var(--text-primary)]" />
              </div>
              <svg
                className="w-6 h-6 text-[var(--text-secondary)] hidden group-hover:block absolute inset-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16" />
              </svg>
            </div>
          </button>

          {/* New Chat - Fixed icon */}
          <button
            onClick={onNewChat}
            className="p-2 mb-4 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
            title="New chat"
          >
            <SquarePen className="w-5 h-5 text-[var(--text-primary)]" />
          </button>

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-2 mb-4 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
            title="Search chats"
          >
            <Search className="w-5 h-5 text-[var(--text-primary)]" />
          </button>

          {/* Create Image */}
          <button
            className="p-2 mb-auto rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
            title="Create image"
          >
            <svg className="w-5 h-5 text-[var(--text-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12s1.5-2 4-2 4 2 4 2" />
              <path d="M9 16c1-1.5 3-2 3-5" />
              <path d="M15 16c-1-1.5-3-2-3-5" />
            </svg>
          </button>

          {/* Bottom icons */}
          <div className="mt-auto flex flex-col items-center gap-2">
            {session && (
              <button className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors">
                <Sparkles className="w-5 h-5 text-[var(--text-primary)]" />
              </button>
            )}

            {session ? (
              <div className="relative" ref={profileRef}>
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
                      className="absolute bottom-full left-0 mb-2 w-64 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-[var(--border-strong)]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#19c59f] flex items-center justify-center text-white font-medium">
                            {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                              {session.user?.name || session.user?.email?.split("@")[0]}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] truncate">
                              @{session.user?.email?.split("@")[0]}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="py-1">
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <Crown className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Upgrade plan</span>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Personalization</span>
                        </button>
                        <button
                          onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left"
                        >
                          <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Settings</span>
                        </button>
                      </div>

                      <div className="border-t border-[var(--border-strong)] py-1">
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <HelpCircle className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Help</span>
                          <svg className="w-4 h-4 ml-auto text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                          <LogOut className="w-4 h-4 text-[var(--text-secondary)]" />
                          <span className="text-sm text-[var(--text-primary)]">Log out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={onLoginClick}
                className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-white text-xs hover:bg-[var(--bg-hover)] transition-colors"
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
                  className="w-full max-w-md bg-[var(--bg-surface)] rounded-xl shadow-2xl overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Search Input */}
                  <div className="flex items-center gap-3 p-4 border-b border-[var(--border-strong)]">
                    <Search className="w-5 h-5 text-[var(--text-secondary)]" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                    />
                    <button
                      onClick={() => setIsSearchOpen(false)}
                      className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
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
                      className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                    >
                      <SquarePen className="w-4 h-4 text-[var(--text-secondary)]" />
                      <span className="text-sm text-[var(--text-primary)]">New chat</span>
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
                            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                          >
                            <span className="text-sm text-[var(--text-primary)] truncate">{chat.title}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No results found</div>
                      )
                    ) : (
                      // Show recent chats when no search query
                      Object.entries(groupedChats).map(([group, groupChats]) => (
                        <div key={group}>
                          <div className="px-4 py-2 text-xs text-[var(--text-muted)] uppercase">{group}</div>
                          {groupChats.slice(0, 5).map((chat) => (
                            <button
                              key={chat.id}
                              onClick={() => {
                                onChatSelect(chat.id);
                                setIsSearchOpen(false);
                              }}
                              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                            >
                              <span className="text-sm text-[var(--text-primary)] truncate">{chat.title}</span>
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
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </>
    );
  }

  // Expanded sidebar
  return (
    <>
      <div className="fixed left-0 top-0 h-full w-[260px] bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col z-50 overflow-hidden">
        {/* Logo with Close button - STICKY TOP */}
        <div className="flex items-center justify-between p-3 flex-shrink-0">
          <div className="w-8 h-8">
            <Logo size={32} className="text-[var(--text-primary)]" />
          </div>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors group relative"
            title="Close sidebar"
          >
            <svg
              className="w-5 h-5 text-[var(--text-secondary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={2} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16" />
            </svg>
          </button>
        </div>

        {/* SCROLLABLE MIDDLE SECTION */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">

          {/* New Chat Button */}
          <div className="px-3 mb-1">
            <button
              onClick={onNewChat}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]"
            >
              <SquarePen className="w-5 h-5" />
              <span className="text-sm">New chat</span>
            </button>
          </div>

          {/* Navigation Items */}
          <div className="px-2 space-y-0.5">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]"
            >
              <Search className="w-5 h-5 text-[var(--text-secondary)]" />
              <span className="text-sm">Search chats</span>
            </button>
            <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
              {/* DALL-E / Images icon matching ChatGPT */}
              <svg className="w-5 h-5 text-[var(--text-secondary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 12s1.5-2 4-2 4 2 4 2" />
                <path d="M9 16c1-1.5 3-2 3-5" />
                <path d="M15 16c-1-1.5-3-2-3-5" />
              </svg>
              <span className="text-sm">Images</span>
            </button>
          </div>

          {/* GPTs Section - Collapsible */}
          <div className="px-3 mt-3">
            <button
              onClick={() => setIsGptsOpen(!isGptsOpen)}
              className="flex items-center gap-1 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]"
            >
              <span className="text-sm">GPTs</span>
              <motion.div
                animate={{ rotate: isGptsOpen ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="ml-0.5"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isGptsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 mt-1">
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">⚡</span>
                      </div>
                      <span className="text-sm truncate">Ethical Hacker GPT</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[10px] font-bold">C</span>
                      </div>
                      <span className="text-sm">Canva</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
                      <svg className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span className="text-sm">Explore GPTs</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Projects Section - Collapsible */}
          <div className="px-3">
            <button
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
              className="flex items-center gap-1 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]"
            >
              <span className="text-sm">Projects</span>
              <motion.div
                animate={{ rotate: isProjectsOpen ? 90 : 0 }}
                transition={{ duration: 0.15 }}
                className="ml-0.5"
              >
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              </motion.div>
            </button>
            <AnimatePresence initial={false}>
              {isProjectsOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="space-y-0.5 mt-1">
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
                      <FolderOpen className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                      <span className="text-sm">New project</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
                      <FolderOpen className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                      <span className="text-sm">prisma query</span>
                    </button>
                    <button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors text-[var(--text-primary)]">
                      <FolderOpen className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                      <span className="text-sm">ecommerce website</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Your Chats Section */}
          <div className="px-3 mt-3 pb-2">
            <h3 className="text-xs font-medium text-[var(--text-muted)] px-3 mb-1">
              Your chats
            </h3>
            <div className="space-y-0.5">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  className="group relative flex items-center min-w-0"
                >
                  <button
                    onClick={() => onChatSelect(chat.id)}
                    className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left min-w-0 ${activeChatId === chat.id
                      ? "bg-[var(--bg-surface)]"
                      : "hover:bg-[var(--bg-surface)]"
                      }`}
                  >
                    <span className="text-sm text-[var(--text-primary)] truncate flex-1">{chat.title}</span>
                  </button>

                  {/* Three dots menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (chatMenuOpen === chat.id) {
                          setChatMenuOpen(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const menuWidth = 192; // w-48 = 12rem = 192px
                          const menuHeight = 340; // approx height of context menu
                          const vw = window.innerWidth;
                          const vh = window.innerHeight;

                          // Position to the right of sidebar by default, flip if needed
                          let left = rect.right + 4;
                          if (left + menuWidth > vw) {
                            left = rect.left - menuWidth - 4;
                          }
                          if (left < 0) left = 4;

                          // Position below button, flip above if overflows viewport
                          let top = rect.top;
                          if (top + menuHeight > vh) {
                            top = vh - menuHeight - 8;
                          }
                          if (top < 8) top = 8;

                          setMenuPosition({ top, left });
                          setChatMenuOpen(chat.id);
                        }
                      }}
                      className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-all"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>{/* END SCROLLABLE MIDDLE SECTION */}

        {/* Fixed Context Menu Portal */}
        <AnimatePresence>
          {chatMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              ref={menuRef}
              className="fixed w-48 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-2xl overflow-hidden z-[100]"
              style={{ top: menuPosition.top, left: menuPosition.left }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="py-1">
                <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <Share className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Share</span>
                </button>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <Users className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Start a group</span>
                </button>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <Edit3 className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Rename</span>
                </button>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <FolderOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Move to project</span>
                  <svg className="w-3.5 h-3.5 ml-auto text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <div className="border-t border-[var(--border-strong)] my-1" />
                <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <Pin className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Pin chat</span>
                </button>
                <button className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left">
                  <Archive className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">Archive</span>
                </button>
                <div className="border-t border-[var(--border-strong)] my-1" />
                <button
                  onClick={() => {
                    onDeleteChat?.(chatMenuOpen);
                    setChatMenuOpen(null);
                  }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 hover:bg-[var(--bg-hover)] transition-colors text-left text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">Delete</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer - User Section - STICKY BOTTOM */}
        <div className="p-3 border-t border-[var(--border)] flex-shrink-0">
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
            <div className="relative" ref={profileRef}>
              {/* User Info - Compact */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-[var(--bg-surface)] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-[#19c59f] flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                  {session.user?.name?.[0] || session.user?.email?.[0] || "U"}
                </div>
                <span className="text-xs text-[var(--text-primary)] truncate flex-1 text-left">
                  {session.user?.name || session.user?.email?.split("@")[0]}
                </span>
              </button>

              {/* Profile Dropdown */}
              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-56 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-xl shadow-lg overflow-hidden z-50"
                  >
                    <div className="py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                        <Crown className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-primary)]">Upgrade plan</span>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                        <Sparkles className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-primary)]">Personalization</span>
                      </button>
                      <button
                        onClick={() => { setIsSettingsOpen(true); setIsProfileOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-primary)]">Settings</span>
                      </button>
                    </div>

                    <div className="border-t border-[var(--border-strong)] py-1">
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                        <HelpCircle className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-primary)]">Help</span>
                        <svg className="w-4 h-4 ml-auto text-[var(--text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      <button className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-[var(--bg-hover)] transition-colors text-left">
                        <LogOut className="w-4 h-4 text-[var(--text-secondary)]" />
                        <span className="text-sm text-[var(--text-primary)]">Log out</span>
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
              className="w-full max-w-md bg-[var(--bg-surface)] rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Search Input */}
              <div className="flex items-center gap-3 p-4 border-b border-[var(--border-strong)]">
                <Search className="w-5 h-5 text-[var(--text-secondary)]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
                />
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
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
                  className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <SquarePen className="w-4 h-4 text-[var(--text-secondary)]" />
                  <span className="text-sm text-[var(--text-primary)]">New chat</span>
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
                        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                      >
                        <span className="text-sm text-[var(--text-primary)] truncate">{chat.title}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-[var(--text-muted)]">No results found</div>
                  )
                ) : (
                  // Show recent chats when no search query
                  Object.entries(groupedChats).map(([group, groupChats]) => (
                    <div key={group}>
                      <div className="px-4 py-2 text-xs text-[var(--text-muted)] uppercase">{group}</div>
                      {groupChats.slice(0, 5).map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => {
                            onChatSelect(chat.id);
                            setIsSearchOpen(false);
                          }}
                          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <span className="text-sm text-[var(--text-primary)] truncate">{chat.title}</span>
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
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
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
