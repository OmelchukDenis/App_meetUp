/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { User, Event, EventMessage } from "../../types";
import { LocalDb, CATEGORY_LABELS } from "../../lib/db";
import { ChevronLeft, Send, Users, ShieldAlert, ArrowDown } from "lucide-react";

interface ChatScreenProps {
  eventId: string;
  activeUser: User;
  onBack: () => void;
  onViewUserProfile: (userId: string) => void;
  theme?: "light" | "dark";
}

export default function ChatScreen({
  eventId,
  activeUser,
  onBack,
  onViewUserProfile,
  theme = "light",
}: ChatScreenProps) {
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load fresh database state
  const state = LocalDb.get();
  
  const event = useMemo(() => state.events.find(e => e.id === eventId), [state, eventId]);

  const messages = useMemo(() => {
    return state.messages.filter(m => m.event_id === eventId).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  }, [state, eventId]);

  // Map senders
  const sendersMap = useMemo(() => {
    const map: Record<string, User> = {};
    state.users.forEach(u => {
      map[u.id] = u;
    });
    return map;
  }, [state.users]);

  // Check if active user is indeed allowed in this chat (must be creator or accepted participant)
  const isAllowed = useMemo(() => {
    if (!event) return false;
    if (event.creator_id === activeUser.id) return true;
    const records = state.participants.filter(p => p.event_id === eventId && p.user_id === activeUser.id);
    return records.some(r => r.status === "accepted");
  }, [event, state.participants, eventId, activeUser.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !event) return;
    
    LocalDb.sendChatMessage(eventId, inputText.trim());
    setInputText("");
    
    // Smooth scroll down immediately
    setTimeout(scrollToBottom, 50);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom on load or new message
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!event || !isAllowed) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-6 text-center ${
        theme === "dark" ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-800"
      }`}>
        <ShieldAlert size={36} className="text-red-500 mb-3" />
        <h3 className="text-sm font-bold">Access Restricted</h3>
        <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
          You must be an accepted participant of <strong>"{event?.title || "this activity"}"</strong> to access the group chat room.
        </p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div id="chat-screen-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"}`}>
      {/* --- CHAT HEADER --- */}
      <header className={`border-b px-3 py-2 flex items-center gap-2.5 sticky top-0 z-15 shadow-xs ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850 text-zinc-100" : "bg-white border-zinc-100 text-zinc-800"
      }`}>
        <button
          onClick={onBack}
          className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
            theme === "dark" ? "hover:bg-zinc-850 text-zinc-100" : "hover:bg-zinc-100 text-zinc-700"
          }`}
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex-grow min-w-0">
          <h2 className={`text-xs font-extrabold truncate leading-tight ${theme === "dark" ? "text-zinc-100" : "text-zinc-800"}`}>
            {event.title}
          </h2>
          <p className="text-[9px] text-orange-600 font-bold flex items-center gap-0.5 mt-0.5">
            <Users size={8} /> Group Chat • {CATEGORY_LABELS[event.category]}
          </p>
        </div>
      </header>

      {/* --- MESSAGES LOG STREAM --- */}
      <div
        ref={scrollContainerRef}
        className="flex-grow overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin flex flex-col pb-20"
      >
        <div className={`mx-auto my-2 py-1 px-3 rounded-full text-[9px] font-bold text-center ${
          theme === "dark" ? "bg-zinc-800/80 text-zinc-400" : "bg-zinc-200/50 text-zinc-500"
        }`}>
          💬 Messages are visible only to accepted participants.
        </div>

        {messages.length > 0 ? (
          messages.map((msg) => {
            const isMe = msg.sender_id === activeUser.id;
            const sender = sendersMap[msg.sender_id];
            
            if (!sender) return null; // Fallback if sender deleted account

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 items-end max-w-[85%] ${isMe ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                {!isMe && (
                  <img
                    src={sender.avatar_url}
                    alt={sender.name}
                    onClick={() => onViewUserProfile(sender.id)}
                    className="w-7 h-7 rounded-full object-cover border border-zinc-100 shadow-xs cursor-pointer hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                )}

                {/* Bubble Column */}
                <div className="flex flex-col space-y-0.5">
                  {/* Sender Name tag */}
                  {!isMe && (
                    <span className="text-[8px] font-bold text-zinc-400 pl-1">
                      {sender.name.split(" ")[0]} {sender.id === event.creator_id && "👑"}
                    </span>
                  )}

                  {/* Text Bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-xs font-medium leading-relaxed shadow-xs ${
                      isMe
                        ? "bg-orange-500 text-white rounded-br-none"
                        : theme === "dark"
                        ? "bg-zinc-950 text-zinc-200 rounded-bl-none border border-zinc-850"
                        : "bg-white text-zinc-800 rounded-bl-none border border-zinc-100"
                    }`}
                  >
                    {msg.text}
                  </div>

                  {/* Timestamp */}
                  <span className={`text-[8px] text-zinc-400 font-medium px-1 ${isMe ? "text-right" : "text-left"}`}>
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-zinc-400 text-[11px] italic flex-grow flex items-center justify-center">
            No messages yet. Say hello to start planning the meetup! 👋
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* --- FLOATING CHAT INPUT BAR --- */}
      <form
        onSubmit={handleSendMessage}
        className={`absolute bottom-0 left-0 right-0 p-3.5 flex gap-2 z-15 border-t shadow-[0_-4px_12px_rgba(0,0,0,0.03)] ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}
      >
        <input
          type="text"
          placeholder="Send a group message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className={`flex-grow px-3 py-2 border text-xs font-semibold rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all ${
            theme === "dark"
              ? "border-zinc-800 bg-zinc-900 focus:bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
              : "border-zinc-100 bg-zinc-50 focus:bg-white text-zinc-850"
          }`}
        />
        <button
          type="submit"
          className="w-9 h-9 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-sm shadow-orange-500/10 transition-colors"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
