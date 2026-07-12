/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { User, Event } from "../../types";
import { LocalDb, CATEGORY_LABELS, getAge } from "../../lib/db";
import { ChevronRight, Calendar, MapPin, Users, MessageSquare, AlertCircle, RefreshCw, Layers } from "lucide-react";

interface MyEventsScreenProps {
  activeUser: User;
  onSelectEvent: (eventId: string) => void;
  onNavigateToChat: (eventId: string) => void;
  theme?: "light" | "dark";
}

const CATEGORY_ICONS: Record<string, string> = {
  cinema: "🎬",
  sport: "🏋️‍♂️",
  food: "🍜",
  walk: "🚶‍♂️",
  boardgames: "🎲",
  culture: "🎨",
  other: "✨",
};

export default function MyEventsScreen({
  activeUser,
  onSelectEvent,
  onNavigateToChat,
  theme = "light",
}: MyEventsScreenProps) {
  const [activeTab, setActiveTab] = useState<"going" | "created" | "past">("going");

  // Read raw state
  const state = LocalDb.get();

  const myEventsData = useMemo(() => {
    const now = new Date();
    
    // 1. Get user participation links
    const myParticipations = state.participants.filter(p => p.user_id === activeUser.id);
    const joinedEventIds = new Set(myParticipations.filter(p => p.status === "accepted").map(p => p.event_id));

    // 2. Map all events with metadata (creator info & pending counts)
    const hydratedEvents = state.events.map(evt => {
      const creator = state.users.find(u => u.id === evt.creator_id)!;
      const parts = state.participants.filter(p => p.event_id === evt.id);
      const acceptedCount = parts.filter(p => p.status === "accepted").length;
      const pendingCount = parts.filter(p => p.status === "pending").length;

      const eventDate = new Date(evt.starts_at);
      const isPast = eventDate < now || evt.status === "completed";

      return {
        event: evt,
        creator: creator || activeUser,
        acceptedCount,
        pendingCount,
        isPast,
      };
    });

    // 3. Segment into tab categories
    const going = hydratedEvents.filter(item => 
      joinedEventIds.has(item.event.id) && 
      item.event.creator_id !== activeUser.id && 
      !item.isPast && 
      item.event.status !== "cancelled"
    );

    const created = hydratedEvents.filter(item => 
      item.event.creator_id === activeUser.id && 
      !item.isPast
    );

    const past = hydratedEvents.filter(item => 
      item.isPast || 
      item.event.status === "completed" || 
      (joinedEventIds.has(item.event.id) && item.event.status === "cancelled") ||
      (item.event.creator_id === activeUser.id && item.event.status === "cancelled")
    );

    return { going, created, past };
  }, [state.events, state.participants, state.users, activeUser.id]);

  const listToRender = myEventsData[activeTab];

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div id="my-events-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"}`}>
      {/* --- SCREEN HEADER --- */}
      <header className={`border-b px-4 py-3.5 sticky top-0 z-10 flex items-center justify-between shrink-0 ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850 text-zinc-100" : "bg-white border-zinc-100 text-zinc-800"
      }`}>
        <div className="flex items-center gap-2">
          <Layers size={18} className="text-orange-500" />
          <h1 className="text-sm font-bold">My Social Calendar</h1>
        </div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          {listToRender.length} Events
        </span>
      </header>

      {/* --- TAB SWAPPER --- */}
      <div className={`p-3 sticky top-[49px] z-10 border-b shrink-0 ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
      }`}>
        <div className={`grid grid-cols-3 gap-1 rounded-xl p-1 ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}>
          {(["going", "created", "past"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                activeTab === tab
                  ? theme === "dark"
                    ? "bg-zinc-850 text-orange-400 shadow-sm"
                    : "bg-white text-orange-600 shadow-sm"
                  : theme === "dark"
                  ? "text-zinc-500 hover:text-zinc-300"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab === "going" && "I'm Going"}
              {tab === "created" && "I Created"}
              {tab === "past" && "Past Meets"}
            </button>
          ))}
        </div>
      </div>

      {/* --- ACTIVITIES STREAM --- */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3 pb-24 scrollbar-thin">
        {listToRender.length > 0 ? (
          listToRender.map(({ event, creator, acceptedCount, pendingCount, isPast }) => (
            <div
              key={event.id}
              className={`border rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer ${
                theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
              }`}
              onClick={() => onSelectEvent(event.id)}
            >
              {/* Category Icon Stamp */}
              <div className="absolute right-3 top-3 text-3xl opacity-10 pointer-events-none select-none">
                {CATEGORY_ICONS[event.category]}
              </div>

              {/* Status Row */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                  theme === "dark" ? "bg-orange-950/40 text-orange-400" : "bg-orange-50/70 text-orange-600"
                }`}>
                  {CATEGORY_ICONS[event.category]} {CATEGORY_LABELS[event.category]}
                </span>
                
                {event.status === "cancelled" ? (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-red-500/10 text-red-400 rounded">
                    Cancelled
                  </span>
                ) : event.status === "completed" ? (
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 bg-zinc-500/10 text-zinc-400 rounded">
                    Completed
                  </span>
                ) : (
                  <span className="text-[9px] font-semibold text-zinc-400">
                    {acceptedCount}/{event.max_participants} joined
                  </span>
                )}
              </div>

              {/* Title & Details */}
              <h3 className={`text-sm font-bold leading-tight line-clamp-1 pr-6 ${
                theme === "dark" ? "text-zinc-100" : "text-zinc-800"
              }`}>{event.title}</h3>
              
              <div className="flex flex-col gap-1 mt-2">
                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  <Calendar size={11} className="text-zinc-400" />
                  <span>{formatDate(event.starts_at)}</span>
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] font-medium ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                  <MapPin size={11} className="text-zinc-400" />
                  <span className="truncate pr-8">{event.address_text.split(",")[0]}</span>
                </div>
              </div>

              {/* ACTION / NOTIFICATION BAR IN CARD */}
              {(pendingCount > 0 && activeTab === "created") && (
                <div className={`mt-3 p-2 rounded-xl flex items-center justify-between border ${
                  theme === "dark" ? "bg-amber-950/20 border-amber-900/55" : "bg-amber-50 border-amber-100"
                }`}>
                  <div className={`flex items-center gap-1.5 text-[10px] font-extrabold animate-pulse ${
                    theme === "dark" ? "text-amber-400" : "text-amber-800"
                  }`}>
                    <AlertCircle size={12} className="text-amber-600" />
                    <span>{pendingCount} pending request{pendingCount > 1 ? "s" : ""}</span>
                  </div>
                  <span className={`text-[9px] font-bold hover:underline ${
                    theme === "dark" ? "text-amber-500" : "text-amber-600"
                  }`}>Review ➔</span>
                </div>
              )}

              {/* Separator & Footer Links if active & approved */}
              {event.status !== "cancelled" && event.status !== "completed" && (
                <div className={`border-t mt-3 pt-3 flex justify-between items-center ${
                  theme === "dark" ? "border-zinc-900" : "border-zinc-100"
                }`}>
                  {/* Organizer Details */}
                  <div className="flex items-center gap-1.5">
                    <img
                      src={creator.avatar_url}
                      alt={creator.name}
                      className="w-5 h-5 rounded-full object-cover border border-zinc-100"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[9px] font-bold text-zinc-500">
                      {isPast ? "Hosted by " : ""}{creator.id === activeUser.id ? "Me" : creator.name.split(" ")[0]}
                    </span>
                  </div>

                  {/* Chat Button shortcut */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // Don't trigger card selection
                      onNavigateToChat(event.id);
                    }}
                    className="px-2.5 py-1 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-bold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <MessageSquare size={10} />
                    Chat Room
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          /* Empty state */
          <div className={`text-center py-16 px-6 border border-dashed rounded-2xl ${
            theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
          }`}>
            <Calendar size={32} className="mx-auto text-zinc-300 mb-3" />
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
              {activeTab === "going" && "You aren't going anywhere yet"}
              {activeTab === "created" && "You haven't created activities"}
              {activeTab === "past" && "No past activities"}
            </h3>
            <p className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              {activeTab === "going" && "Discover cinema visits, gym sessions, board games or group dinners in your local feed stream!"}
              {activeTab === "created" && "Be the initiator! Tap the '+' button to host your own Cinema, Walk, Dinner, or Board Game evening."}
              {activeTab === "past" && "Past local socialize history will keep trace here for you."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
