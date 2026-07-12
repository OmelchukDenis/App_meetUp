/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { User, Gender } from "../../types";
import { LocalDb, getAge } from "../../lib/db";
import { ChevronLeft, ShieldAlert, Ban, EyeOff, Edit, Save, Camera, Check, RefreshCw } from "lucide-react";

interface ProfileScreenProps {
  userId: string; // ID of the user to view
  activeUser: User;
  onBack: () => void;
  onUserUpdate: () => void; // Trigger refresh of activeUser state
  onBlockCompleted: () => void; // Exit view after block
  theme?: "light" | "dark";
}

const REPORT_REASONS = [
  "Inappropriate avatar or profile picture",
  "Harassment, threats, or aggressive behavior",
  "Spam, advertisements, or solicitation",
  "Promoting illegal or dangerous activities",
  "Safety concerns (dangerous venue or behavior)",
  "Other terms of service violation",
];

const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
];

export default function ProfileScreen({
  userId,
  activeUser,
  onBack,
  onUserUpdate,
  onBlockCompleted,
  theme = "light",
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Database reactivity
  const state = LocalDb.get();

  const userToView = useMemo(() => {
    return state.users.find((u) => u.id === userId) || activeUser;
  }, [state.users, userId, activeUser]);

  const isMe = userToView.id === activeUser.id;

  // Edit States (Me Only)
  const [editName, setEditName] = useState(userToView.name);
  const [editBio, setEditBio] = useState(userToView.bio);
  const [editGender, setEditGender] = useState<Gender>(userToView.gender);
  const [editBirthDate, setEditBirthDate] = useState(userToView.birth_date);
  const [editAvatar, setEditAvatar] = useState(userToView.avatar_url);
  const [editError, setEditError] = useState("");

  // Report States (Not Me Only)
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const age = getAge(userToView.birth_date);

  const isBlocked = useMemo(() => {
    return state.blocks.some(
      (b) => (b.blocker_id === activeUser.id && b.blocked_id === userId) ||
             (b.blocker_id === userId && b.blocked_id === activeUser.id)
    );
  }, [state.blocks, activeUser.id, userId]);

  // Submit profile edits
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");

    if (!editName.trim()) {
      setEditError("Name is required");
      return;
    }

    if (!editBirthDate) {
      setEditError("Birth date is required");
      return;
    }

    // Verify age constraint (18+ requirement in compliance with guidelines)
    const calculatedAge = getAge(editBirthDate);
    if (calculatedAge < 18) {
      setEditError("MeetUp Local is strictly 18+. You must select a valid birth date.");
      return;
    }

    LocalDb.updateUser({
      ...activeUser,
      name: editName.trim(),
      bio: editBio.trim(),
      gender: editGender,
      birth_date: editBirthDate,
      avatar_url: editAvatar,
    });

    setIsEditing(false);
    onUserUpdate();
  };

  // Moderation Handlers
  const handleBlockUser = () => {
    if (isBlocked) {
      if (window.confirm(`Unblock ${userToView.name}? You will be able to see each other's events again.`)) {
        LocalDb.unblockUser(userId);
        onUserUpdate();
      }
    } else {
      if (window.confirm(`Block ${userToView.name}? Neither of you will see each other's events, chats, or profiles. This action is mutual.`)) {
        LocalDb.blockUser(userId);
        alert(`${userToView.name} has been blocked.`);
        onBlockCompleted();
      }
    }
  };

  const handleReportUser = (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedReason === "Other terms of service violation" 
      ? `Other: ${customReason.trim()}` 
      : selectedReason;

    if (!finalReason) {
      alert("Please select a reason for reporting");
      return;
    }

    // Submit report
    LocalDb.reportUser(userId, finalReason);
    
    setShowReportModal(false);
    alert(`Thank you. Your report regarding ${userToView.name} has been submitted to the moderation desk. They have been blocked automatically for your comfort.`);
    
    onBlockCompleted();
  };

  return (
    <div id="profile-screen-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}>
      {/* --- FLOATING HEADER --- */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/25 to-transparent">
        <button
          type="button"
          onClick={onBack}
          className={`w-8 h-8 rounded-full backdrop-blur-xs flex items-center justify-center shadow-md hover:scale-105 transition-transform cursor-pointer ${
            theme === "dark" ? "bg-zinc-950/90 text-zinc-100" : "bg-white/90 text-zinc-800"
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        
        {isMe ? (
          <button
            type="button"
            onClick={() => {
              if (isEditing) {
                // Trigger save
                const btn = document.getElementById("hidden-submit-profile-btn");
                btn?.click();
              } else {
                setIsEditing(true);
              }
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 hover:scale-105 transition-all ${
              theme === "dark" ? "bg-zinc-950/95 text-orange-400" : "bg-white/95 text-orange-600"
            }`}
          >
            {isEditing ? <Save size={12} /> : <Edit size={12} />}
            {isEditing ? "Save" : "Edit Profile"}
          </button>
        ) : (
          <div className="flex gap-1.5">
            {/* Block Button */}
            <button
              onClick={handleBlockUser}
              className={`w-8 h-8 rounded-full backdrop-blur-xs flex items-center justify-center shadow-md hover:scale-105 transition-all cursor-pointer ${
                isBlocked ? "bg-red-500 text-white" : "bg-white/90 text-zinc-700"
              }`}
              title={isBlocked ? "Unblock User" : "Block User"}
            >
              <Ban size={15} />
            </button>
          </div>
        )}
      </header>

      {/* --- PROFILE CARD AREA --- */}
      <div className="flex-grow overflow-y-auto scrollbar-none pb-24">
        {/* Banner Picture background */}
        <div className="h-40 bg-orange-100 flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-400 to-pink-500">
          <div className="text-7xl opacity-15 select-none font-bold">MEETUP</div>
        </div>

        {/* Profile Details Container */}
        <div className={`rounded-t-3xl -mt-6 relative z-5 px-6 pt-5 pb-4 space-y-5 ${
          theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-800"
        }`}>
          {/* Main User Avatar */}
          <div className="flex justify-center -mt-16 relative">
            <div className="relative">
              <img
                src={isEditing ? editAvatar : userToView.avatar_url}
                alt={userToView.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-zinc-100"
                referrerPolicy="no-referrer"
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black/50 transition-colors">
                  <Camera size={20} />
                </div>
              )}
            </div>
          </div>

          {/* --- VIEW MODE --- */}
          {!isEditing ? (
            <div id="profile-view-mode" className="space-y-4 animate-fade-in">
              {/* User Identity Header */}
              <div className="text-center">
                <h2 className="text-lg font-bold flex items-center justify-center gap-1.5">
                  {userToView.name}
                  <span className="text-sm font-semibold text-zinc-400">({age})</span>
                </h2>
                <div className="flex items-center justify-center gap-1.5 mt-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md capitalize ${
                    theme === "dark" ? "bg-zinc-900 text-zinc-400" : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {userToView.gender}
                  </span>
                  {isMe && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-orange-500/10 text-orange-400 rounded-md">
                      My Profile
                    </span>
                  )}
                  {isBlocked && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-red-500/10 text-red-450 rounded-md">
                      Blocked
                    </span>
                  )}
                </div>
              </div>

              {/* Bio block */}
              <div className={`space-y-1.5 border-t pt-4 ${theme === "dark" ? "border-zinc-900" : "border-zinc-100"}`}>
                <h3 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">About Me</h3>
                <p className={`text-xs leading-relaxed p-3 rounded-xl border ${
                  theme === "dark" ? "bg-zinc-900/40 text-zinc-300 border-zinc-850" : "bg-zinc-50/50 text-zinc-600 border-zinc-100/50"
                }`}>
                  {userToView.bio}
                </p>
              </div>

              {/* Security Actions if NOT me */}
              {!isMe && (
                <div className={`border-t pt-5 space-y-2.5 ${theme === "dark" ? "border-zinc-900" : "border-zinc-100"}`}>
                  <button
                    onClick={() => setShowReportModal(true)}
                    className={`w-full py-3 border font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      theme === "dark" 
                        ? "border-red-950 bg-red-950/20 hover:bg-red-950/35 text-red-400" 
                        : "border-red-100 bg-red-50/20 hover:bg-red-50 text-red-600"
                    }`}
                  >
                    <ShieldAlert size={14} /> Report safety concern on {userToView.name}
                  </button>
                  <p className="text-[9px] text-zinc-400 text-center leading-relaxed max-w-xs mx-auto italic">
                    MeetUp Local is a secure space. Reporting or blocking a profile hides all common items reciprocally and immediately notifies moderators.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* --- EDIT MODE (Me Only) --- */
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
              <button type="submit" id="hidden-submit-profile-btn" className="hidden" />

              {editError && (
                <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold border border-red-900/50">
                  {editError}
                </div>
              )}

              {/* Custom Preset Avatar Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                  Choose New Avatar
                </label>
                <div className="grid grid-cols-8 gap-1">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditAvatar(preset)}
                      className={`relative rounded-full overflow-hidden aspect-square border-2 p-0.5 transition-all ${
                        editAvatar === preset ? "border-orange-500 scale-105" : "border-transparent opacity-75 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={preset}
                        alt={`preset-${idx}`}
                        className="w-full h-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-100" : "border-zinc-200 bg-white text-zinc-800"
                  }`}
                />
              </div>

              {/* Birth Date */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Birth Date
                </label>
                <input
                  type="date"
                  required
                  value={editBirthDate}
                  onChange={(e) => setEditBirthDate(e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                    theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-white text-zinc-755"
                  }`}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["female", "male", "other"] as Gender[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setEditGender(g)}
                      className={`py-2 rounded-lg border text-[10px] font-bold capitalize transition-all cursor-pointer ${
                        editGender === g
                          ? theme === "dark" ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-orange-500 bg-orange-50 text-orange-600"
                          : theme === "dark" ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Profile Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none ${
                    theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-300" : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className={`flex-grow py-2.5 border rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    theme === "dark" ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900" : "border-zinc-100 hover:bg-zinc-50 text-zinc-500"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-grow py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-orange-500/10 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* --- REPORT DIALOG / MODAL (App Store Compliance Requirement) --- */}
      {showReportModal && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end justify-center animate-fade-in">
          <form
            onSubmit={handleReportUser}
            className={`w-full rounded-t-3xl p-5 space-y-4 max-h-[90%] overflow-y-auto ${
              theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-800"
            }`}
          >
            <div className={`flex justify-between items-center pb-2 border-b ${theme === "dark" ? "border-zinc-850" : "border-zinc-100"}`}>
              <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-red-500">
                <ShieldAlert size={16} /> Safety Report Flow
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer ${
                  theme === "dark" ? "bg-zinc-900 hover:bg-zinc-800 text-zinc-300" : "bg-zinc-100 hover:bg-zinc-200"
                }`}
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              We take safety very seriously on MeetUp Local. Your report will be sent to our moderators. The user <span className="font-bold text-orange-500">{userToView.name}</span> will be auto-blocked for your comfort.
            </p>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Reason for report
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`w-full flex items-center justify-between text-left px-3 py-2 border rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      selectedReason === reason
                        ? "border-red-500 bg-red-500/10 text-red-400"
                        : theme === "dark" ? "border-zinc-850 text-zinc-400 hover:bg-zinc-900" : "border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <span>{reason}</span>
                    {selectedReason === reason && <Check size={12} className="text-red-500" />}
                  </button>
                ))}
              </div>
            </div>

            {selectedReason === "Other terms of service violation" && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">
                  Describe the violation
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detail what happened..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className={`block w-full px-3 py-2 border rounded-xl text-xs font-medium focus:ring-1 focus:ring-orange-500 resize-none ${
                    theme === "dark" ? "border-zinc-850 bg-zinc-900 text-zinc-200" : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className={`flex-grow py-3 border rounded-xl text-xs font-bold cursor-pointer ${
                  theme === "dark" ? "border-zinc-800 text-zinc-400" : "border-zinc-100 text-zinc-500"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-grow py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer"
              >
                Submit Report & Block
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
