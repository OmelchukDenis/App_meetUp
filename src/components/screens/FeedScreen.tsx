/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { User, Event, EventCategory, LocationPoint } from "../../types";
import { LocalDb, CATEGORY_LABELS, getAge } from "../../lib/db";
import { Filter, Search, SlidersHorizontal, MapPin, Calendar, Users, ChevronRight, Bell, MessageSquare, Plus, RefreshCw } from "lucide-react";

interface FeedScreenProps {
  activeUser: User;
  onSelectEvent: (eventId: string) => void;
  onNavigateToCreate: () => void;
  onNavigateToNotifications: () => void;
  onNavigateToSettings: () => void;
  unreadNotificationsCount: number;
  theme?: "light" | "dark";
}

const CATEGORY_ICONS: Record<EventCategory, string> = {
  cinema: "🎬",
  sport: "🏋️‍♂️",
  food: "🍜",
  walk: "🚶‍♂️",
  boardgames: "🎲",
  culture: "🎨",
  other: "✨",
};

export default function FeedScreen({
  activeUser,
  onSelectEvent,
  onNavigateToCreate,
  onNavigateToNotifications,
  onNavigateToSettings,
  unreadNotificationsCount,
  theme = "light",
}: FeedScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState<EventCategory | "all">("all");
  const [maxDistance, setMaxDistance] = useState<number>(activeUser.search_radius_km || 15);
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "tomorrow" | "weekend">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Retrieve and filter events using our business-logic database query
  const eventResults = useMemo(() => {
    return LocalDb.queryEvents(activeUser.id, {
      category: selectedCategory,
      maxDistanceKm: maxDistance,
      dateFilter,
    }).filter((item) => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.event.title.toLowerCase().includes(query) ||
        item.event.description.toLowerCase().includes(query) ||
        item.event.address_text.toLowerCase().includes(query)
      );
    });
  }, [activeUser.id, selectedCategory, maxDistance, dateFilter, searchQuery]);

  // Aggregate participant count and status mapping for the feed
  const participantsCountMap = useMemo(() => {
    const db = LocalDb.get();
    const map: Record<string, { accepted: number; total: number; isJoined: boolean; isPending: boolean }> = {};

    db.events.forEach((evt) => {
      const parts = db.participants.filter((p) => p.event_id === evt.id);
      const acceptedCount = parts.filter((p) => p.status === "accepted").length;
      
      const userPart = parts.find((p) => p.user_id === activeUser.id);
      const isJoined = userPart?.status === "accepted";
      const isPending = userPart?.status === "pending";

      map[evt.id] = {
        accepted: acceptedCount,
        total: parts.length,
        isJoined,
        isPending,
      };
    });

    return map;
  }, [dbStateTriggerSync(), activeUser.id]);

  // Minor trigger helper to sync on database modifications
  function dbStateTriggerSync() {
    return LocalDb.get().participants.length + LocalDb.get().events.length;
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${timeStr}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${timeStr}`;
    } else {
      return `${date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} at ${timeStr}`;
    }
  };

  return (
    <div id="feed-screen-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"}`}>
      {/* --- APP HEADER --- */}
      <header className={`border-b px-4 py-3 sticky top-0 z-10 flex items-center justify-between shrink-0 ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850 text-zinc-100" : "bg-white border-zinc-100 text-zinc-800"
      }`}>
        <div className="flex items-center gap-2.5">
          <img
            src={activeUser.avatar_url}
            alt={activeUser.name}
            onClick={onNavigateToSettings}
            className="w-8 h-8 rounded-full object-cover border border-orange-100 shadow-sm cursor-pointer hover:scale-105 transition-all"
            referrerPolicy="no-referrer"
          />
          <div>
            <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <MapPin size={10} className="text-orange-500" /> {activeUser.last_location.label || "Nearby"}
            </div>
            <h1 className="text-sm font-semibold">MeetUp Local</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Create Button */}
          <button
            onClick={onNavigateToCreate}
            className="w-8 h-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full flex items-center justify-center cursor-pointer shadow-sm transition-transform active:scale-95"
            title="Create Event"
          >
            <Plus size={16} />
          </button>
          
          {/* Notifications */}
          <button
            onClick={onNavigateToNotifications}
            className={`w-8 h-8 rounded-full flex items-center justify-center relative cursor-pointer ${
              theme === "dark" ? "hover:bg-zinc-800 text-zinc-300" : "hover:bg-zinc-100 text-zinc-600"
            }`}
          >
            <Bell size={18} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse"></span>
            )}
          </button>
        </div>
      </header>

      {/* --- QUICK SEARCH & FILTER EXPANDER --- */}
      <div className={`border-b p-3 space-y-2 shrink-0 ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
      }`}>
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs border rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all ${
                theme === "dark"
                  ? "bg-zinc-900 border-zinc-800 text-zinc-100 focus:bg-zinc-900"
                  : "bg-zinc-50 border-zinc-100 text-zinc-700 focus:bg-white"
              }`}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
              showFilters || dateFilter !== "all" || maxDistance !== activeUser.search_radius_km
                ? "border-orange-200 bg-orange-50/10 text-orange-400"
                : theme === "dark"
                ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                : "border-zinc-100 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <SlidersHorizontal size={12} />
            Filters
          </button>
        </div>

        {/* --- EXPANDED FILTER PANEL --- */}
        {showFilters && (
          <div className={`py-2.5 px-1 border-t space-y-3.5 animate-fade-in ${
            theme === "dark" ? "border-zinc-800" : "border-zinc-50"
          }`}>
            {/* Search Radius */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Search Distance</span>
                <span className="text-xs font-bold text-orange-600">{maxDistance} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                className="w-full accent-orange-500 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-bold mt-0.5">
                <span>1 km</span>
                <span>25 km</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Date Filters */}
            <div>
              <span className={`block text-xs font-semibold mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>When</span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["all", "today", "tomorrow", "weekend"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`py-1.5 rounded-lg border text-[10px] font-bold capitalize transition-all cursor-pointer ${
                      dateFilter === filter
                        ? "border-orange-500 bg-orange-50/10 text-orange-400"
                        : theme === "dark"
                        ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900"
                        : "border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- CATEGORY SELECTOR (Horizontal Scroll) --- */}
      <div className={`border-b py-2.5 px-3 flex items-center gap-2 overflow-x-auto scrollbar-none sticky top-[98px] z-10 shrink-0 ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
      }`}>
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
            selectedCategory === "all"
              ? "bg-orange-500 text-white shadow-sm shadow-orange-500/15"
              : theme === "dark"
              ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
              : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
          }`}
        >
          All Activities
        </button>
        {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat as EventCategory)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap flex items-center gap-1 transition-all cursor-pointer ${
              selectedCategory === cat
                ? "bg-orange-500 text-white shadow-sm shadow-orange-500/15"
                : theme === "dark"
                ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <span>{CATEGORY_ICONS[cat as EventCategory]}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* --- FEED STREAM --- */}
      <div className="flex-grow overflow-y-auto px-4 py-4 space-y-3.5 scrollbar-thin pb-24">
        {eventResults.length > 0 ? (
          eventResults.map(({ event, creator, distance }) => {
            const partInfo = participantsCountMap[event.id] || { accepted: 1, total: 1, isJoined: false, isPending: false };
            const isFull = event.status === "full" || partInfo.accepted >= event.max_participants;
            const age = getAge(creator.birth_date);

            return (
              <div
                key={event.id}
                onClick={() => onSelectEvent(event.id)}
                className={`border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
                }`}
              >
                {/* Category Watermark Icon */}
                <div className="absolute right-3 top-3 text-4xl opacity-10 pointer-events-none select-none">
                  {CATEGORY_ICONS[event.category]}
                </div>

                {/* Card Top: Tags & Distance */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                    theme === "dark" ? "bg-orange-950/40 text-orange-400" : "bg-orange-50 text-orange-600"
                  }`}>
                    {CATEGORY_ICONS[event.category]} {CATEGORY_LABELS[event.category]}
                  </span>
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-0.5 ${
                    theme === "dark" ? "bg-zinc-900 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    <MapPin size={8} /> {distance} km away
                  </span>
                  {partInfo.isJoined && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md">
                      Joined
                    </span>
                  )}
                  {partInfo.isPending && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-md">
                      Pending
                    </span>
                  )}
                  {isFull && !partInfo.isJoined && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-red-500/10 text-red-400 rounded-md">
                      Full
                    </span>
                  )}
                </div>

                {/* Card Body: Title & Descr */}
                <h3 className={`text-sm font-bold leading-snug line-clamp-1 pr-8 ${
                  theme === "dark" ? "text-zinc-100" : "text-zinc-800"
                }`}>
                  {event.title}
                </h3>
                <p className={`text-xs mt-1 line-clamp-2 leading-relaxed ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}>
                  {event.description}
                </p>

                {/* Card Mid: Dates */}
                <div className={`flex items-center gap-2 mt-3 text-[11px] font-medium ${
                  theme === "dark" ? "text-zinc-400" : "text-zinc-500"
                }`}>
                  <Calendar size={12} className="text-zinc-400" />
                  <span>{formatDate(event.starts_at)}</span>
                </div>

                {/* Separator */}
                <div className={`border-t my-3 ${theme === "dark" ? "border-zinc-800" : "border-zinc-100"}`}></div>

                {/* Card Bottom: Creator & Participants */}
                <div className="flex items-center justify-between">
                  {/* Creator Info */}
                  <div className="flex items-center gap-2">
                    <img
                      src={creator.avatar_url}
                      alt={creator.name}
                      className="w-6 h-6 rounded-full object-cover border border-zinc-100"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>{creator.name}</div>
                      <div className="text-[9px] text-zinc-400 font-medium capitalize">Creator, {age}y, {creator.gender}</div>
                    </div>
                  </div>

                  {/* Joined count */}
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
                    theme === "dark" ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-100/50"
                  }`}>
                    <Users size={11} className="text-zinc-400" />
                    <span className={`text-[10px] font-bold ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>
                      {partInfo.accepted}/{event.max_participants}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          /* --- EMPTY STATE --- */
          <div className={`text-center py-12 px-6 border border-dashed rounded-2xl ${
            theme === "dark" ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
          }`}>
            <SlidersHorizontal size={32} className="mx-auto text-zinc-300 mb-3" />
            <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>No events found</h3>
            <p className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              No matching activities in this range. Try clearing category selection, expanding your search radius, or create a brand new event!
            </p>
            <div className="mt-5 flex justify-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategory("all");
                  setDateFilter("all");
                  setMaxDistance(50);
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer ${
                  theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-600"
                }`}
              >
                Reset Filters
              </button>
              <button
                onClick={onNavigateToCreate}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Create Event
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
