/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { User, PushNotification } from "../types";
import { Compass, Calendar, User as UserIcon, Wifi, Battery, Signal, Bell, MessageSquare } from "lucide-react";

interface MobileSimulatorProps {
  activeUser: User | null;
  currentScreen: string;
  onNavigateTab: (tab: "feed" | "my_events" | "settings") => void;
  children: React.ReactNode;
  activeNotification: PushNotification | null;
  onCloseNotification: () => void;
  theme?: "light" | "dark";
}

export default function MobileSimulator({
  activeUser,
  currentScreen,
  onNavigateTab,
  children,
  activeNotification,
  onCloseNotification,
  theme = "light",
}: MobileSimulatorProps) {
  const [timeStr, setTimeStr] = useState("12:00 PM");

  // Keep simulated status bar clock updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000 * 60);
    return () => clearInterval(interval);
  }, []);

  // Determine if we should show the bottom tab bar inside the mobile phone
  const showTabBar = ["feed", "my_events", "settings"].includes(currentScreen) && activeUser !== null;

  return (
    <div id="phone-shell-wrapper" className="relative flex flex-col items-center justify-center p-4">
      {/* PHONE CASING CONTAINER */}
      <div className="w-[320px] h-[650px] bg-neutral-900 rounded-[44px] p-2.5 shadow-2xl border-4 border-neutral-800 relative flex flex-col overflow-hidden ring-1 ring-white/10">
        {/* Dynamic Ear Speaker & Camera Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-900 rounded-full z-40 flex items-center justify-center">
          {/* Lens */}
          <div className="w-2.5 h-2.5 bg-neutral-950 rounded-full mr-4 border border-neutral-800"></div>
          {/* Speaker mesh */}
          <div className="w-8 h-1 bg-neutral-800 rounded-full"></div>
        </div>

        {/* SCREEN FRAME */}
        <div className={`w-full h-full rounded-[34px] overflow-hidden relative flex flex-col z-30 select-none ${theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-800"}`}>
          {/* SIMULATED iOS STATUS BAR */}
          <div className={`h-10 backdrop-blur-md px-5 flex items-end justify-between pb-1.5 text-[10px] font-bold z-35 shrink-0 select-none ${theme === "dark" ? "bg-zinc-950/90 text-zinc-100" : "bg-white/90 text-zinc-800"}`}>
            {/* Time */}
            <span>{timeStr}</span>
            
            {/* Icons */}
            <div className="flex items-center gap-1.5">
              <Signal size={10} className={theme === "dark" ? "text-zinc-100" : "text-zinc-800"} />
              <Wifi size={10} className={theme === "dark" ? "text-zinc-100" : "text-zinc-800"} />
              <div className="flex items-center gap-0.5">
                <Battery size={13} className={theme === "dark" ? "text-zinc-100" : "text-zinc-800"} />
                <span className={`text-[8px] font-extrabold ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>100%</span>
              </div>
            </div>
          </div>

          {/* ACTIVE CONTENT VIEW */}
          <div className={`flex-grow min-h-0 relative flex flex-col ${theme === "dark" ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-800"}`}>
            {children}

            {/* --- SIMULATED IN-APP TOAST/PUSH PULL-DOWN --- */}
            {activeNotification && (
              <div
                onClick={() => {
                  onNavigateTab("my_events");
                  onCloseNotification();
                }}
                className="absolute top-12 left-2.5 right-2.5 bg-zinc-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-white/15 flex items-start gap-2.5 z-50 cursor-pointer animate-slide-down"
              >
                <div className="p-1.5 bg-orange-500 rounded-lg text-white">
                  {activeNotification.type === "chat" ? <MessageSquare size={14} /> : <Bell size={14} />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wide">MeetUp Local</span>
                    <span className="text-[8px] text-zinc-400 font-medium">now</span>
                  </div>
                  <h4 className="text-[10px] font-bold truncate mt-0.5 text-zinc-100">{activeNotification.title}</h4>
                  <p className="text-[9px] text-zinc-300 line-clamp-2 mt-0.5 leading-tight">{activeNotification.body}</p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseNotification();
                  }}
                  className="text-zinc-500 hover:text-zinc-300 text-xs font-bold px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* SIMULATED BOTTOM TAB NAVIGATION BAR */}
          {showTabBar && (
            <footer className={`h-14 px-6 flex items-center justify-between z-30 shrink-0 ${theme === "dark" ? "bg-zinc-950 border-t border-zinc-800" : "bg-white border-t border-zinc-100"}`}>
              {/* Discover tab */}
              <button
                onClick={() => onNavigateTab("feed")}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                  currentScreen === "feed"
                    ? "text-orange-500"
                    : theme === "dark"
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Compass size={18} />
                <span className="text-[8px] font-extrabold uppercase tracking-wider">Discover</span>
              </button>

              {/* My Events tab */}
              <button
                onClick={() => onNavigateTab("my_events")}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                  currentScreen === "my_events"
                    ? "text-orange-500"
                    : theme === "dark"
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Calendar size={18} />
                <span className="text-[8px] font-extrabold uppercase tracking-wider">Activities</span>
              </button>

              {/* Profile/Settings tab */}
              <button
                onClick={() => onNavigateTab("settings")}
                className={`flex flex-col items-center gap-0.5 cursor-pointer transition-colors ${
                  currentScreen === "settings"
                    ? "text-orange-500"
                    : theme === "dark"
                    ? "text-zinc-500 hover:text-zinc-300"
                    : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <UserIcon size={18} />
                <span className="text-[8px] font-extrabold uppercase tracking-wider">My Profile</span>
              </button>
            </footer>
          )}

          {/* SIMULATED iOS BOTTOM HOME INDICATOR BAR */}
          <div className={`h-4 flex items-center justify-center shrink-0 select-none z-30 ${theme === "dark" ? "bg-zinc-950" : "bg-white"}`}>
            <div className={`w-24 h-1 rounded-full mb-1 ${theme === "dark" ? "bg-zinc-700" : "bg-zinc-300"}`}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
