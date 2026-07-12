/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User } from "../../types";
import { LocalDb, CITIES } from "../../lib/db";
import { ChevronLeft, Sliders, Bell, MessageSquare, LogOut, Trash2, Smartphone, HelpCircle, Compass, MapPin } from "lucide-react";

interface SettingsScreenProps {
  activeUser: User;
  onBack: () => void;
  onUserUpdate: () => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  theme: "light" | "dark";
  onThemeChange: (theme: "light" | "dark") => void;
}

export default function SettingsScreen({
  activeUser,
  onBack,
  onUserUpdate,
  onLogout,
  onDeleteAccount,
  theme,
  onThemeChange,
}: SettingsScreenProps) {
  const [radius, setRadius] = useState(activeUser.search_radius_km || 15);
  
  // Notification states
  const [allNotifs, setAllNotifs] = useState(activeUser.notification_settings?.all ?? true);
  const [joinRequests, setJoinRequests] = useState(activeUser.notification_settings?.joinRequests ?? true);
  const [chatMessages, setChatMessages] = useState(activeUser.notification_settings?.chatMessages ?? true);
  const [reminders, setReminders] = useState(activeUser.notification_settings?.reminders ?? true);

  const handleRadiusChange = (newRadius: number) => {
    setRadius(newRadius);
    LocalDb.updateUser({
      ...activeUser,
      search_radius_km: newRadius,
    });
    onUserUpdate();
  };

  const handleAllNotifsChange = (enabled: boolean) => {
    setAllNotifs(enabled);
    LocalDb.updateUser({
      ...activeUser,
      notification_settings: {
        all: enabled,
        joinRequests: enabled ? joinRequests : false,
        chatMessages: enabled ? chatMessages : false,
        reminders: enabled ? reminders : false,
      },
    });
    onUserUpdate();
  };

  const handleJoinRequestsChange = (enabled: boolean) => {
    setJoinRequests(enabled);
    LocalDb.updateUser({
      ...activeUser,
      notification_settings: {
        all: allNotifs,
        joinRequests: enabled,
        chatMessages,
        reminders,
      },
    });
    onUserUpdate();
  };

  const handleChatMessagesChange = (enabled: boolean) => {
    setChatMessages(enabled);
    LocalDb.updateUser({
      ...activeUser,
      notification_settings: {
        all: allNotifs,
        joinRequests,
        chatMessages: enabled,
        reminders,
      },
    });
    onUserUpdate();
  };

  const handleRemindersChange = (enabled: boolean) => {
    setReminders(enabled);
    LocalDb.updateUser({
      ...activeUser,
      notification_settings: {
        all: allNotifs,
        joinRequests,
        chatMessages,
        reminders: enabled,
      },
    });
    onUserUpdate();
  };

  const handleDeleteClick = () => {
    if (window.confirm("CRITICAL WARNING: Are you sure you want to delete your account? This will permanently wipe your profile, activities, and messages from this local workspace. This action is irreversible.")) {
      onDeleteAccount();
    }
  };

  return (
    <div id="settings-screen-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-50"}`}>
      {/* --- HEADER --- */}
      <header className={`px-4 py-3 flex items-center justify-between sticky top-0 z-10 border-b ${
        theme === "dark" ? "bg-zinc-950 border-zinc-800 text-zinc-100" : "bg-white border-zinc-100 text-zinc-800"
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              theme === "dark" ? "hover:bg-zinc-800 text-zinc-100" : "hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-sm font-bold">App Settings</h1>
        </div>
      </header>

      {/* --- SETTINGS MENU LIST --- */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 scrollbar-thin pb-8">
        {/* SECTION 1: SEARCH PREFERENCES */}
        <div className={`border rounded-2xl p-4 space-y-3 shadow-xs ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Compass size={14} className="text-orange-500" />
            <h3 className={theme === "dark" ? "text-zinc-200" : "text-zinc-800"}>Discovery Preferences</h3>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <span className={`text-xs font-semibold ${theme === "dark" ? "text-zinc-400" : "text-zinc-600"}`}>Search Radius</span>
              <span className="text-xs font-bold text-orange-600">{radius} km</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={radius}
              onChange={(e) => handleRadiusChange(parseInt(e.target.value))}
              className="w-full accent-orange-500 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[8px] text-zinc-400 font-bold mt-0.5">
              <span>1 km</span>
              <span>25 km</span>
              <span>50 km</span>
            </div>
          </div>

          <div className={`flex items-center justify-between pt-2 text-xs font-medium border-t ${
            theme === "dark" ? "text-zinc-400 border-zinc-800/60" : "text-zinc-500 border-zinc-50"
          }`}>
            <span className="flex items-center gap-1"><MapPin size={12} /> Target City</span>
            <span className={`font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-700"}`}>{activeUser.last_location.label || "San Francisco"}</span>
          </div>
        </div>

        {/* SECTION 1.5: APPEARANCE (DARK THEME TOGGLE) */}
        <div className={`border rounded-2xl p-4 space-y-3 shadow-xs ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Sliders size={14} className="text-orange-500" />
            <h3 className={theme === "dark" ? "text-zinc-200" : "text-zinc-800"}>Appearance</h3>
          </div>

          <div className="flex items-center justify-between py-1">
            <div>
              <h4 className={`text-xs font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>Dark Theme</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Apply high-contrast dark colors</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={theme === "dark"}
                onChange={(e) => onThemeChange(e.target.checked ? "dark" : "light")}
                className="sr-only peer"
              />
              <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 ${
                theme === "dark" ? "bg-zinc-850" : "bg-zinc-200"
              }`}></div>
            </label>
          </div>
        </div>

        {/* SECTION 2: EXPO PUSH NOTIFICATIONS */}
        <div className={`border rounded-2xl p-4 space-y-3 shadow-xs ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <Bell size={14} className="text-orange-500" />
            <h3 className={theme === "dark" ? "text-zinc-200" : "text-zinc-800"}>Expo Push Notifications</h3>
          </div>

          {/* Toggle All */}
          <div className="flex items-center justify-between py-1">
            <div>
              <h4 className={`text-xs font-bold ${theme === "dark" ? "text-zinc-200" : "text-zinc-800"}`}>Enable Push Notifications</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">Allow MeetUp Local to send alerts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={allNotifs}
                onChange={(e) => handleAllNotifsChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className={`w-9 h-5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 ${
                theme === "dark" ? "bg-zinc-850" : "bg-zinc-200"
              }`}></div>
            </label>
          </div>

          {/* Sub-toggles */}
          {allNotifs && (
            <div className={`space-y-3 pt-2.5 border-t animate-fade-in ${
              theme === "dark" ? "border-zinc-800" : "border-zinc-50"
            }`}>
              {/* Join Requests */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <h5 className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>Join Activity Requests</h5>
                  <p className="text-[9px] text-zinc-400">Notify me of requests or approvals</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={joinRequests}
                    onChange={(e) => handleJoinRequestsChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-8 h-4.5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-400 ${
                    theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  }`}></div>
                </label>
              </div>

              {/* Chat messages */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <h5 className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>New Group Messages</h5>
                  <p className="text-[9px] text-zinc-400">Notify me of new messages in chats</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chatMessages}
                    onChange={(e) => handleChatMessagesChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-8 h-4.5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-400 ${
                    theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  }`}></div>
                </label>
              </div>

              {/* Event reminders */}
              <div className="flex items-center justify-between py-0.5">
                <div>
                  <h5 className={`text-[11px] font-bold ${theme === "dark" ? "text-zinc-300" : "text-zinc-700"}`}>3-Hour Reminders</h5>
                  <p className="text-[9px] text-zinc-400">Alert me 3h before activities start</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={reminders}
                    onChange={(e) => handleRemindersChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-8 h-4.5 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-orange-400 ${
                    theme === "dark" ? "bg-zinc-800" : "bg-zinc-200"
                  }`}></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 3: SYSTEM/HELP */}
        <div className={`border rounded-2xl p-4 space-y-3.5 shadow-xs ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
            <HelpCircle size={14} className="text-orange-500" />
            <h3 className={theme === "dark" ? "text-zinc-200" : "text-zinc-800"}>Help & Support</h3>
          </div>

          <div className={`space-y-2.5 text-xs font-semibold pl-0.5 ${theme === "dark" ? "text-zinc-300" : "text-zinc-600"}`}>
            <a href="#rules" className="flex items-center justify-between hover:text-orange-500 transition-colors">
              <span>Community Guidelines</span>
              <span>➔</span>
            </a>
            <a href="#safety" className="flex items-center justify-between hover:text-orange-500 transition-colors">
              <span>Personal Safety Guide</span>
              <span>➔</span>
            </a>
            <a href="#terms" className="flex items-center justify-between hover:text-orange-500 transition-colors">
              <span>Terms & Privacy Policy</span>
              <span>➔</span>
            </a>
          </div>
        </div>

        {/* SECTION 4: DESTRUCTIVE ACTIONS */}
        <div className={`border rounded-2xl p-4 space-y-2 shadow-xs ${
          theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
        }`}>
          <button
            onClick={onLogout}
            className={`w-full py-3 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              theme === "dark" ? "bg-zinc-900 hover:bg-zinc-850 text-zinc-300" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <LogOut size={14} /> Log out of account
          </button>
        </div>

        {/* Delete Account text below the block */}
        <div className="text-center pt-2 pb-6">
          <button
            onClick={handleDeleteClick}
            className={`text-xs font-semibold cursor-pointer transition-colors ${
              theme === "dark" ? "text-zinc-500 hover:text-zinc-400" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            Delete Profile Permanently
          </button>
        </div>
      </div>
    </div>
  );
}
