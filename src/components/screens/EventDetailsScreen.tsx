/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from "react";
import { User, Event, EventParticipant, ParticipantStatus } from "../../types";
import { LocalDb, CATEGORY_LABELS, getAge, getDistanceKm } from "../../lib/db";
import { ChevronLeft, Calendar, MapPin, Users, Info, Shield, MessageSquare, AlertTriangle, ShieldAlert, LogOut, Check, X, RefreshCw, AlertCircle } from "lucide-react";

interface EventDetailsScreenProps {
  eventId: string;
  activeUser: User;
  onBack: () => void;
  onNavigateToChat: (eventId: string) => void;
  onViewUserProfile: (userId: string) => void;
  theme?: "light" | "dark";
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  cinema: "from-purple-500 to-indigo-600",
  sport: "from-amber-500 to-red-600",
  food: "from-orange-500 to-pink-600",
  walk: "from-emerald-500 to-teal-600",
  boardgames: "from-cyan-500 to-blue-600",
  culture: "from-fuchsia-500 to-purple-600",
  other: "from-zinc-500 to-zinc-700",
};

const CATEGORY_EMOJIS: Record<string, string> = {
  cinema: "🎬",
  sport: "🏋️‍♂️",
  food: "🍜",
  walk: "🚶‍♂️",
  boardgames: "🎲",
  culture: "🎨",
  other: "✨",
};

export default function EventDetailsScreen({
  eventId,
  activeUser,
  onBack,
  onNavigateToChat,
  onViewUserProfile,
  theme = "light",
}: EventDetailsScreenProps) {
  const [loadingAction, setLoadingAction] = useState(false);

  // Retrieve current database snapshot reactively
  const db = LocalDb.get();

  // Find targeted event
  const event = useMemo(() => {
    return db.events.find((e) => e.id === eventId) || null;
  }, [db.events, eventId]);

  if (!event) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-6 text-center ${
        theme === "dark" ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-800"
      }`}>
        <AlertTriangle size={32} className="text-red-500 mb-2" />
        <h3 className="text-sm font-bold">Activity Not Found</h3>
        <p className="text-xs text-zinc-400 mt-1">This activity might have been deleted by the organizer.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-xl text-xs font-bold"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Find creator details
  const creator = useMemo(() => {
    return db.users.find((u) => u.id === event.creator_id) || activeUser;
  }, [db.users, event.creator_id, activeUser]);

  const isCreator = event.creator_id === activeUser.id;

  // Retrieve participants
  const participants = useMemo(() => {
    return db.participants.filter((p) => p.event_id === eventId);
  }, [db.participants, eventId]);

  // Map participant categories
  const acceptedParticipants = useMemo(() => {
    return participants
      .filter((p) => p.status === "accepted")
      .map((p) => {
        const u = db.users.find((user) => user.id === p.user_id);
        return { participant: p, user: u || activeUser };
      });
  }, [participants, db.users, activeUser]);

  const pendingRequests = useMemo(() => {
    return participants
      .filter((p) => p.status === "pending")
      .map((p) => {
        const u = db.users.find((user) => user.id === p.user_id);
        return { participant: p, user: u || activeUser };
      });
  }, [participants, db.users, activeUser]);

  // Find current user's registration status
  const myStatus = useMemo(() => {
    if (isCreator) return "accepted";
    const record = participants.find((p) => p.user_id === activeUser.id);
    return record ? record.status : "none";
  }, [isCreator, participants, activeUser.id]);

  // Check if current event is full
  const isFull = useMemo(() => {
    return acceptedParticipants.length >= event.max_participants;
  }, [acceptedParticipants.length, event.max_participants]);

  // Calculate coordinates distance
  const distance = getDistanceKm(
    activeUser.last_location.lat,
    activeUser.last_location.lng,
    event.location.lat,
    event.location.lng
  );

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ACTIONS
  const handleRequestJoin = () => {
    setLoadingAction(true);
    setTimeout(() => {
      LocalDb.requestToJoin(eventId);
      setLoadingAction(false);
    }, 400);
  };

  const handleLeaveEvent = () => {
    if (!window.confirm("Are you sure you want to leave this activity?")) return;
    setLoadingAction(true);
    setTimeout(() => {
      LocalDb.leaveEvent(eventId);
      setLoadingAction(false);
    }, 400);
  };

  const handleResolveRequest = (userId: string, approve: boolean) => {
    LocalDb.resolveParticipantRequest(eventId, userId, approve);
  };

  const handleCancelEvent = () => {
    if (!window.confirm("WARNING: Are you sure you want to cancel this event? All participants will be notified and this action cannot be undone.")) return;
    LocalDb.cancelEvent(eventId);
  };

  const handleDuplicateEvent = () => {
    // Generate new starts_at for tomorrow
    const tomorrowNew = new Date();
    tomorrowNew.setDate(tomorrowNew.getDate() + 1);
    tomorrowNew.setHours(19, 0, 0, 0);

    const { id, creator_id, status, created_at, ...eventData } = event;
    LocalDb.createEvent({
      ...eventData,
      starts_at: tomorrowNew.toISOString(),
      title: `${event.title} (Duplicate)`,
    });
    alert("Activity duplicated! A new event has been created for tomorrow evening.");
    onBack();
  };

  return (
    <div id="event-details-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"}`}>
      {/* --- FLOATING HEADER --- */}
      <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/40 to-transparent">
        <button
          onClick={onBack}
          className={`w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer ${
            theme === "dark" ? "bg-zinc-950/90 text-zinc-100" : "bg-white/90 text-zinc-800"
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {isCreator && event.status !== "cancelled" && (
          <button
            onClick={handleCancelEvent}
            className="px-3 py-1.5 rounded-full bg-red-500/90 hover:bg-red-600 backdrop-blur-sm text-white text-[10px] font-extrabold shadow-md cursor-pointer transition-all"
          >
            Cancel Activity
          </button>
        )}
      </header>

      {/* --- SCREEN CONTENT SCROLL --- */}
      <div className="flex-grow overflow-y-auto scrollbar-none pb-28">
        {/* Banner Graphic */}
        <div className={`h-40 bg-gradient-to-tr ${CATEGORY_GRADIENTS[event.category] || "from-zinc-500 to-zinc-700"} flex items-center justify-center relative overflow-hidden`}>
          <div className="text-6xl filter drop-shadow-md select-none">{CATEGORY_EMOJIS[event.category]}</div>
          {/* Subtle details */}
          <div className="absolute bottom-3 left-4 text-white text-[11px] font-bold bg-black/25 backdrop-blur-xs px-2.5 py-1 rounded-md">
            Starts in {Math.max(1, Math.ceil((new Date(event.starts_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
          </div>
        </div>

        {/* Core Event Box */}
        <div className={`rounded-t-3xl -mt-4 relative z-10 p-5 space-y-4 shadow-xs ${
          theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-800"
        }`}>
          {/* Category & Status */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${
              theme === "dark" ? "bg-orange-950/40 text-orange-400" : "bg-orange-50 text-orange-600"
            }`}>
              {CATEGORY_EMOJIS[event.category]} {CATEGORY_LABELS[event.category]}
            </span>
            <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-lg ${
              event.status === "active" ? (theme === "dark" ? "bg-emerald-950/40 text-emerald-400" : "bg-emerald-50 text-emerald-600") :
              event.status === "full" ? (theme === "dark" ? "bg-amber-950/40 text-amber-400" : "bg-amber-50 text-amber-600") :
              event.status === "cancelled" ? "bg-red-500/20 text-red-400" :
              "bg-zinc-100 text-zinc-500"
            }`}>
              {event.status}
            </span>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold leading-snug">{event.title}</h2>

          {/* Constraints tags */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
              theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-100"
            }`}>
              👥 Ages: {event.min_age} - {event.max_age}
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border capitalize ${
              theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-100"
            }`}>
              🛡️ Gender: {event.allowed_gender === "any" ? "Anyone welcome" : `${event.allowed_gender} only`}
            </span>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border ${
              theme === "dark" ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-100"
            }`}>
              📍 {distance} km away
            </span>
          </div>

          <div className={`border-t pt-3.5 space-y-3 ${theme === "dark" ? "border-zinc-900" : "border-zinc-100"}`}>
            {/* Meetup Date */}
            <div className="flex items-start gap-3 text-xs">
              <Calendar size={15} className="text-zinc-400 mt-0.5" />
              <div>
                <div className={`font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>Date & Time</div>
                <div className="mt-0.5 text-zinc-400 font-medium">{formatDate(event.starts_at)}</div>
              </div>
            </div>

            {/* Meetup Location */}
            <div className="flex items-start gap-3 text-xs">
              <MapPin size={15} className="text-zinc-400 mt-0.5" />
              <div>
                <div className={`font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>Venue & Address</div>
                <div className="mt-0.5 text-zinc-400 font-medium">{event.address_text}</div>
                <div className="text-[10px] font-semibold text-orange-500 mt-1">💡 Public Location • Safety First</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className={`p-5 mt-3 space-y-2 border-y ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Activity Plan</h3>
          <p className={`text-xs leading-relaxed whitespace-pre-wrap ${theme === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>{event.description}</p>
        </div>

        {/* Creator Info Card */}
        <div className={`p-5 mt-3 space-y-3 border-b ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>Organizer</h3>
          <div
            onClick={() => onViewUserProfile(creator.id)}
            className={`flex items-center justify-between p-3 border rounded-xl transition-all cursor-pointer ${
              theme === "dark" ? "border-zinc-850 hover:bg-zinc-900/50" : "border-zinc-100 hover:bg-zinc-50/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <img
                src={creator.avatar_url}
                alt={creator.name}
                className="w-10 h-10 rounded-full object-cover border border-zinc-100"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className={`text-xs font-bold flex items-center gap-1 ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                  {creator.name} <span className="text-[10px] text-zinc-400 font-medium">({getAge(creator.birth_date)})</span>
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5 line-clamp-1">{creator.bio}</p>
              </div>
            </div>
            <Users size={14} className="text-zinc-400" />
          </div>
        </div>

        {/* Accepted Participants Grid */}
        <div className={`p-5 mt-3 space-y-3 border-b ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <div className="flex justify-between items-center">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-zinc-500" : "text-zinc-400"}`}>
              Who is going ({acceptedParticipants.length}/{event.max_participants})
            </h3>
            {event.status === "completed" && (
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${theme === "dark" ? "bg-zinc-800 text-zinc-400" : "bg-zinc-100 text-zinc-500"}`}>
                Past Event
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-5 gap-3 pt-1">
            {acceptedParticipants.map(({ user }) => (
              <div
                key={user.id}
                onClick={() => onViewUserProfile(user.id)}
                className="flex flex-col items-center gap-1 cursor-pointer hover:scale-105 transition-all"
              >
                <div className="relative">
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-100 shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  {user.id === event.creator_id && (
                    <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[7px] font-extrabold border border-white" title="Host">
                      👑
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-bold truncate w-full text-center ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>
                  {user.name.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* --- CREATOR SPECIAL CONTROL DASHBOARD --- */}
        {isCreator && (
          <div className={`p-5 mt-3 space-y-4 border-b ${
            theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
          }`}>
            <div className={`flex justify-between items-center border-b pb-2 ${theme === "dark" ? "border-zinc-900" : "border-zinc-50"}`}>
              <h3 className="text-xs font-extrabold text-orange-600 uppercase tracking-wider">
                Organizer Dashboard
              </h3>
              <div className="flex gap-1.5">
                {event.status === "completed" && (
                  <button
                    onClick={handleDuplicateEvent}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all ${
                      theme === "dark" ? "bg-zinc-900 text-zinc-300 hover:bg-zinc-800" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                    }`}
                  >
                    🔄 Duplicate Past Event
                  </button>
                )}
              </div>
            </div>

            {/* Pending Requests list */}
            <div>
              <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                Pending Join Requests ({pendingRequests.length})
              </h4>

              {pendingRequests.length > 0 ? (
                <div className="space-y-2.5">
                  {pendingRequests.map(({ user }) => {
                    const reqAge = getAge(user.birth_date);
                    return (
                      <div
                        key={user.id}
                        className={`p-3 border rounded-xl flex items-center justify-between ${
                          theme === "dark" ? "border-zinc-850 bg-zinc-900/50" : "border-zinc-100 bg-zinc-50/50"
                        }`}
                      >
                        <div
                          onClick={() => onViewUserProfile(user.id)}
                          className="flex items-center gap-2.5 flex-grow cursor-pointer"
                        >
                          <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-100"
                            referrerPolicy="no-referrer"
                          />
                          <div className="max-w-[140px]">
                            <div className={`text-xs font-bold truncate ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>
                              {user.name} <span className="text-[10px] text-zinc-400 font-medium">({reqAge})</span>
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate capitalize">
                              {user.gender} • {user.bio}
                            </div>
                          </div>
                        </div>

                        {/* Approve / Decline Actions */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleResolveRequest(user.id, false)}
                            className="w-7 h-7 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                            title="Decline"
                          >
                            <X size={14} />
                          </button>
                          <button
                            onClick={() => handleResolveRequest(user.id, true)}
                            className="w-7 h-7 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                            title="Accept"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 italic">No pending requests. Active participants will show up in the grid above.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* --- FLOATING ACTION FOOTER BAR --- */}
      {event.status !== "cancelled" && (
        <footer className={`absolute bottom-0 left-0 right-0 p-4 flex gap-3 z-15 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] border-t ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          {isCreator ? (
            /* Creator controls */
            <button
              onClick={() => onNavigateToChat(event.id)}
              className="flex-grow bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-sm shadow-orange-500/10 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <MessageSquare size={16} /> Open Organizer Group Chat
            </button>
          ) : (
            /* Requester controls */
            <>
              {myStatus === "none" && (
                <button
                  disabled={isFull || loadingAction}
                  onClick={handleRequestJoin}
                  className={`flex-grow font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFull
                      ? (theme === "dark" ? "bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed" : "bg-zinc-100 text-zinc-400 cursor-not-allowed border border-zinc-200")
                      : "bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-500/10"
                  }`}
                >
                  {isFull ? "Event is Full 👥" : "Request to Join Activity"}
                </button>
              )}

              {myStatus === "pending" && (
                <div className="flex-grow flex gap-2">
                  <div className={`flex-grow border rounded-xl px-4 py-3 flex items-center justify-center gap-1.5 text-xs font-bold animate-pulse ${
                    theme === "dark" ? "bg-amber-950/40 text-amber-400 border-amber-900/50" : "bg-amber-50 text-amber-700 border-amber-200/50"
                  }`}>
                    <Info size={14} /> Pending Creator Approval
                  </div>
                  <button
                    onClick={handleLeaveEvent}
                    className={`px-4 py-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-400" : "bg-zinc-100 hover:bg-zinc-200 text-zinc-500 hover:text-zinc-700"
                    }`}
                    title="Cancel Request"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {myStatus === "accepted" && (
                <div className="flex-grow flex gap-2">
                  <button
                    onClick={() => onNavigateToChat(event.id)}
                    className="flex-grow bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/10"
                  >
                    <MessageSquare size={16} /> Open Event Group Chat
                  </button>
                  <button
                    onClick={handleLeaveEvent}
                    className={`px-3 border rounded-xl flex items-center justify-center cursor-pointer transition-colors ${
                      theme === "dark" ? "bg-red-950/40 border-red-900 text-red-400" : "bg-red-50 hover:bg-red-100 text-red-500 border border-red-100"
                    }`}
                    title="Leave Event"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              )}

              {myStatus === "declined" && (
                <div className={`flex-grow border rounded-xl py-3 flex items-center justify-center gap-1.5 text-xs font-bold ${
                  theme === "dark" ? "bg-red-950/40 border-red-900 text-red-400" : "bg-red-50 text-red-600 border border-red-100"
                }`}>
                  <ShieldAlert size={14} /> Request Was Declined
                </div>
              )}

              {myStatus === "left" && (
                <button
                  disabled={isFull || loadingAction}
                  onClick={handleRequestJoin}
                  className="flex-grow bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Request to Re-Join Activity
                </button>
              )}
            </>
          )}
        </footer>
      )}
    </div>
  );
}
