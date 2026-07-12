/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, Gender, LocationPoint } from "../../types";
import { CITIES, getAge } from "../../lib/db";
import { Smartphone, Lock, User as UserIcon, Calendar, Compass, MapPin, Upload } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: (user: Omit<User, "id" | "created_at" | "is_banned">) => void;
  theme?: "light" | "dark";
}

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

export default function OnboardingScreen({
  onComplete,
  theme = "light",
}: OnboardingScreenProps) {
  const [step, setStep] = useState<"phone" | "otp" | "profile" | "location">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // Profile Form States
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<Gender>("female");
  const [avatarUrl, setAvatarUrl] = useState(AVATAR_PRESETS[0]);
  const [bio, setBio] = useState("");
  const [profileError, setProfileError] = useState("");

  // Location States
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.trim().length >= 8) {
      setStep("otp");
    }
  };

  const handleOtpVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp === "1234" || otp === "") {
      setStep("profile");
    } else {
      setOtpError("Incorrect verification code. Please try again (Hint: enter 1234 or leave blank).");
    }
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");

    if (!name.trim()) {
      setProfileError("Your full name is required.");
      return;
    }

    if (!birthDate) {
      setProfileError("Birth date is required.");
      return;
    }

    // Age calculation for 18+ App Store Compliance
    const age = getAge(birthDate);
    if (age < 18) {
      setProfileError("MeetUp Local is strictly for individuals aged 18 and older.");
      return;
    }

    setStep("location");
  };

  const handleGrantLocation = () => {
    setPermissionGranted(true);
    // Mimic API delay before resolution
    setTimeout(() => {
      // Simulate center coordinates for San Francisco
      handleComplete(CITIES[0]);
    }, 1500);
  };

  const handleComplete = (city: typeof CITIES[0]) => {
    onComplete({
      name: name.trim(),
      avatar_url: avatarUrl,
      bio: bio.trim() || "No bio added yet.",
      birth_date: birthDate,
      gender,
      last_location: {
        lat: city.lat,
        lng: city.lng,
        label: city.name,
      },
      search_radius_km: 15,
      notification_settings: {
        all: true,
        joinRequests: true,
        chatMessages: true,
        reminders: true,
      },
    });
  };

  return (
    <div id="onboarding-screen-container" className={`flex flex-col h-full px-6 py-8 ${
      theme === "dark" ? "bg-zinc-950 text-zinc-100" : "bg-white text-zinc-800"
    }`}>
      {/* Step Header */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-xl font-bold tracking-tight text-orange-500">MeetUp Local</span>
        <span className={`text-xs font-semibold uppercase tracking-wider ${
          theme === "dark" ? "text-zinc-500" : "text-gray-400"
        }`}>
          {step === "phone" && "Step 1 of 4"}
          {step === "otp" && "Step 2 of 4"}
          {step === "profile" && "Step 3 of 4"}
          {step === "location" && "Step 4 of 4"}
        </span>
      </div>

      {/* --- STEP 1: PHONE --- */}
      {step === "phone" && (
        <div id="step-phone" className="flex flex-col flex-grow justify-between animate-fade-in">
          <div>
            <h2 className={`text-2xl font-semibold tracking-tight mb-3 ${theme === "dark" ? "text-zinc-100" : "text-gray-900"}`}>
              Move online chats <br />to offline meets.
            </h2>
            <p className={`text-sm mb-8 leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
              Enter your mobile phone number. We'll send you a secure text message to confirm your identity.
            </p>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Smartphone size={18} />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                      theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" : "border-gray-200 bg-gray-50/50"
                    }`}
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-sm shadow-orange-500/10"
              >
                Send SMS Code
              </button>
            </form>
          </div>
          <div className={`text-center text-xs ${theme === "dark" ? "text-zinc-600" : "text-gray-400"}`}>
            By continuing, you agree to our Terms and Privacy Policy.
          </div>
        </div>
      )}

      {/* --- STEP 2: OTP --- */}
      {step === "otp" && (
        <div id="step-otp" className="flex flex-col flex-grow animate-fade-in">
          <h2 className={`text-2xl font-semibold tracking-tight mb-3 ${theme === "dark" ? "text-zinc-100" : "text-gray-900"}`}>
            Confirm your code
          </h2>
          <p className={`text-sm mb-8 leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
            We sent a verification code to <span className="font-medium text-orange-500">{phone || "+1 (555) 000-0000"}</span>.
          </p>

          <form onSubmit={handleOtpVerify} className="space-y-5">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                4-Digit OTP Code
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Lock size={18} />
                </div>
                <input
                  type="text"
                  maxLength={4}
                  required
                  pattern="[0-9]*"
                  placeholder="Enter code (Hint: 1234)"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value);
                    setOtpError("");
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-sm tracking-[0.5em] font-mono text-center focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" : "border-gray-200 bg-gray-50/50"
                  }`}
                />
              </div>
              {otpError && <p className="text-xs text-red-400 mt-2 font-medium">{otpError}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
            >
              Verify OTP
            </button>

            <button
              type="button"
              onClick={() => setStep("phone")}
              className={`w-full text-center text-xs font-medium py-1 ${
                theme === "dark" ? "text-zinc-400 hover:text-zinc-200" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Change Phone Number
            </button>
          </form>
        </div>
      )}

      {/* --- STEP 3: PROFILE --- */}
      {step === "profile" && (
        <div id="step-profile" className="flex flex-col flex-grow overflow-y-auto pr-1 animate-fade-in scrollbar-thin">
          <h2 className={`text-2xl font-semibold tracking-tight mb-2 ${theme === "dark" ? "text-zinc-100" : "text-gray-900"}`}>
            Build your profile
          </h2>
          <p className={`text-sm mb-6 leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
            Tell the community who you are so they can welcome you warmly.
          </p>

          <form onSubmit={handleProfileSubmit} className="space-y-4 pb-4">
            {profileError && (
              <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-medium border border-red-900/50">
                {profileError}
              </div>
            )}

            {/* Avatar Preset Grid */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                Select Your Avatar
              </label>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {AVATAR_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`relative rounded-full overflow-hidden aspect-square border-2 transition-all p-0.5 ${
                      avatarUrl === preset 
                        ? "border-orange-500 scale-105 shadow-md" 
                        : theme === "dark" ? "border-zinc-800 opacity-60 hover:opacity-100" : "border-transparent opacity-80 hover:opacity-100"
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
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <UserIcon size={16} />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500" : "border-gray-200 bg-gray-50/30"
                  }`}
                />
              </div>
            </div>

            {/* Birth Date */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                Birth Date (Must be 18+)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Calendar size={16} />
                </div>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-100" : "border-gray-200 bg-gray-50/30 text-gray-700"
                  }`}
                />
              </div>
            </div>

            {/* Gender */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                Gender
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["female", "male", "other"] as Gender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2.5 rounded-xl border text-xs font-medium capitalize transition-all cursor-pointer ${
                      gender === g
                        ? theme === "dark" ? "border-orange-500 bg-orange-950/20 text-orange-400 shadow-sm" : "border-orange-500 bg-orange-50 text-orange-600 shadow-sm"
                        : theme === "dark" ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900" : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
                Short Bio (Max 500 chars)
              </label>
              <textarea
                rows={3}
                maxLength={500}
                placeholder="Share your hobbies, what movies you like, or where you like to walk..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`block w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none ${
                  theme === "dark" ? "border-zinc-800 bg-zinc-900 text-zinc-200 placeholder:text-zinc-500" : "border-gray-200 bg-gray-50/30 text-gray-700"
                }`}
              />
              <div className="text-right text-[10px] text-zinc-500 mt-1">
                {bio.length}/500
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors cursor-pointer shadow-sm"
            >
              Continue Setup
            </button>
          </form>
        </div>
      )}

      {/* --- STEP 4: LOCATION --- */}
      {step === "location" && (
        <div id="step-location" className="flex flex-col flex-grow justify-between animate-fade-in">
          <div>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${
              theme === "dark" ? "bg-orange-950/40 text-orange-400" : "bg-orange-50 text-orange-500"
            }`}>
              <Compass size={32} />
            </div>
            
            <h2 className={`text-2xl font-semibold tracking-tight mb-3 ${theme === "dark" ? "text-zinc-100" : "text-gray-900"}`}>
              Where are you looking <br />to meet up?
            </h2>
            <p className={`text-sm mb-6 leading-relaxed ${theme === "dark" ? "text-zinc-400" : "text-gray-500"}`}>
              MeetUp Local requires location permission to show you local events and calculate distance accurately.
            </p>

            {permissionGranted === null ? (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={handleGrantLocation}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm shadow-orange-500/10"
                >
                  <MapPin size={16} /> Use Current Location (Simulated)
                </button>

                <div className="relative flex py-2 items-center">
                  <div className={`flex-grow border-t ${theme === "dark" ? "border-zinc-900" : "border-gray-100"}`}></div>
                  <span className="flex-shrink mx-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest">or choose city fallback</span>
                  <div className={`flex-grow border-t ${theme === "dark" ? "border-zinc-900" : "border-gray-100"}`}></div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                  {CITIES.map((city) => (
                    <button
                      key={city.name}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setPermissionGranted(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-sm font-medium transition-all ${
                        selectedCity.name === city.name && permissionGranted === false
                          ? theme === "dark" ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-orange-500 bg-orange-50 text-orange-600"
                          : theme === "dark" ? "border-zinc-800 text-zinc-300 hover:bg-zinc-850" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin size={14} className={selectedCity.name === city.name && permissionGranted === false ? "text-orange-500" : "text-gray-400"} />
                        {city.name}
                      </span>
                      <span className="text-xs text-gray-400 font-normal">California</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : permissionGranted === true ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-900/40 rounded-2xl flex flex-col items-center justify-center text-center py-6 animate-pulse">
                <Compass className="text-emerald-500 animate-spin mb-3" size={24} />
                <h3 className="text-sm font-semibold text-emerald-400">Permission Granted!</h3>
                <p className="text-xs text-emerald-500/70 mt-1">Retrieving simulated coordinates for San Francisco...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${
                  theme === "dark" ? "bg-orange-950/20 border-orange-900/50 text-orange-400" : "bg-orange-50 border-orange-100 text-orange-800"
                }`}>
                  <h3 className={`text-sm font-semibold ${theme === "dark" ? "text-orange-350" : "text-orange-800"}`}>Manual Selection: {selectedCity.name}</h3>
                  <p className="text-xs mt-1 leading-relaxed">
                    Defaulting coordinates to center of {selectedCity.name} ({selectedCity.lat}, {selectedCity.lng}).
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={() => handleComplete(selectedCity)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium py-3 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
                >
                  Enter MeetUp Local with {selectedCity.name}
                </button>
              </div>
            )}
          </div>

          <div className={`text-center text-xs mt-4 ${theme === "dark" ? "text-zinc-600" : "text-gray-400"}`}>
            We value your privacy. Your location is never shared with other users abstractly — only event distances are displayed.
          </div>
        </div>
      )}
    </div>
  );
}
