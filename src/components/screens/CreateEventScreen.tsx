/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { User, EventCategory } from "../../types";
import { LocalDb, CATEGORY_LABELS, CITIES } from "../../lib/db";
import { ChevronLeft, Info, Calendar, Users, MapPin, AlignLeft, ShieldCheck, Heart } from "lucide-react";

interface CreateEventScreenProps {
  activeUser: User;
  onBack: () => void;
  onSuccess: () => void;
  theme?: "light" | "dark";
}

const CATEGORY_EMOJIS: Record<EventCategory, string> = {
  cinema: "🎬",
  sport: "🏋️‍♂️",
  food: "🍜",
  walk: "🚶‍♂️",
  boardgames: "🎲",
  culture: "🎨",
  other: "✨",
};

export default function CreateEventScreen({
  activeUser,
  onBack,
  onSuccess,
  theme = "light",
}: CreateEventScreenProps) {
  // Setup default starting time: tomorrow at 7:00 PM
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);
  
  // Format to standard datetime-local input value YYYY-MM-DDThh:mm
  const formatForInput = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<EventCategory>("cinema");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState(formatForInput(tomorrow));
  const [maxParticipants, setMaxParticipants] = useState(4);
  const [allowedGender, setAllowedGender] = useState<"any" | "male" | "female">("any");
  const [minAge, setMinAge] = useState(20);
  const [maxAge, setMaxAge] = useState(40);
  
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [venueName, setVenueName] = useState("");
  
  const [formError, setFormError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    // Input Validations
    if (!title.trim()) {
      setFormError("Activity title is required.");
      return;
    }

    if (!description.trim() || description.length < 15) {
      setFormError("Activity plan description must be at least 15 characters.");
      return;
    }

    if (!startsAt) {
      setFormError("Please select a meeting time.");
      return;
    }

    // Verify date is in the future
    const selectedDate = new Date(startsAt);
    if (selectedDate.getTime() < Date.now()) {
      setFormError("Meeting time must be scheduled in the future!");
      return;
    }

    if (!venueName.trim()) {
      setFormError("Please specify a public venue address.");
      return;
    }

    if (minAge > maxAge) {
      setFormError("Minimum age cannot exceed maximum age.");
      return;
    }

    // Compose final address
    const finalAddress = `${venueName.trim()}, ${selectedCity.address}`;

    // Create the event record
    LocalDb.createEvent({
      title: title.trim(),
      category,
      description: description.trim(),
      starts_at: selectedDate.toISOString(),
      max_participants: maxParticipants,
      allowed_gender: allowedGender,
      min_age: minAge,
      max_age: maxAge,
      address_text: finalAddress,
      location: {
        lat: selectedCity.lat + (Math.random() - 0.5) * 0.005, // Slight scatter to simulate local locations
        lng: selectedCity.lng + (Math.random() - 0.5) * 0.005,
      },
    });

    onSuccess();
  };

  return (
    <div id="create-event-container" className={`flex flex-col h-full relative ${theme === "dark" ? "bg-zinc-900" : "bg-white"}`}>
      {/* --- HEADER --- */}
      <header className={`border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850 text-zinc-100" : "bg-white border-zinc-100 text-zinc-800"
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors ${
              theme === "dark" ? "hover:bg-zinc-850 text-zinc-100" : "hover:bg-zinc-100 text-zinc-700"
            }`}
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-sm font-bold">Create Activity</h1>
        </div>
        <span className="text-[10px] text-zinc-400 font-bold uppercase">MVP Builder</span>
      </header>

      {/* --- FORM SCROLL --- */}
      <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-5 space-y-4 scrollbar-thin pb-24">
        {formError && (
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl text-xs font-semibold border border-red-900/50 flex items-center gap-1.5 animate-bounce">
            <Info size={14} /> {formError}
          </div>
        )}

        {/* Title */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
            What are we doing?
          </label>
          <input
            type="text"
            required
            maxLength={100}
            placeholder="e.g., Board Games at Central Coffee"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`block w-full px-3 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 ${
              theme === "dark" 
                ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-900" 
                : "border-zinc-200 bg-zinc-50/20 text-zinc-800 focus:bg-white"
            }`}
          />
        </div>

        {/* Category Icons */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
            Activity Category
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat as EventCategory)}
                className={`py-2 px-1 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  category === cat
                    ? theme === "dark" ? "border-orange-500 bg-orange-950/20 text-orange-400 shadow-xs" : "border-orange-500 bg-orange-50/70 text-orange-600 shadow-xs"
                    : theme === "dark" ? "border-zinc-800 text-zinc-400 hover:bg-zinc-900" : "border-zinc-100 text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                <span className="text-lg">{CATEGORY_EMOJIS[cat as EventCategory]}</span>
                <span className="text-[8px] font-bold text-center leading-none truncate w-full">{label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
            Activity Details & Plan
          </label>
          <div className="relative">
            <AlignLeft size={14} className="absolute left-3 top-3 text-zinc-400" />
            <textarea
              rows={3}
              required
              maxLength={1000}
              placeholder="Detail your plan. e.g. 'Meeting at the front desk, playing Settlers of Catan. Open to beginners, I will bring the board!'"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none ${
                theme === "dark" 
                  ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-900" 
                  : "border-zinc-200 bg-zinc-50/20 text-zinc-700 focus:bg-white"
              }`}
            />
          </div>
          <div className="text-right text-[9px] text-zinc-400 mt-0.5 font-medium">{description.length}/1000</div>
        </div>

        {/* Starts At (Date & Time) */}
        <div>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
            Meeting Date & Time
          </label>
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="datetime-local"
              required
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                theme === "dark" 
                  ? "border-zinc-800 bg-zinc-900 text-zinc-100 focus:bg-zinc-900" 
                  : "border-zinc-200 bg-zinc-50/20 text-zinc-750 focus:bg-white"
              }`}
            />
          </div>
        </div>

        {/* Location Selector */}
        <div className={`space-y-2 border-t pt-3 ${theme === "dark" ? "border-zinc-900" : "border-zinc-50"}`}>
          <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
            Activity Location
          </label>
          
          <div className="grid grid-cols-5 gap-1">
            {CITIES.map((city) => (
              <button
                key={city.name}
                type="button"
                onClick={() => setSelectedCity(city)}
                className={`py-1.5 border rounded-lg text-[9px] font-bold cursor-pointer transition-all ${
                  selectedCity.name === city.name
                    ? theme === "dark" ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-orange-500 bg-orange-50 text-orange-600"
                    : theme === "dark" ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-zinc-100 text-zinc-500 hover:bg-zinc-50"
                }`}
              >
                {city.name.split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="relative">
            <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              required
              placeholder="e.g. Starbucks Metreon, Lobby"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              className={`block w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 ${
                theme === "dark" 
                  ? "border-zinc-800 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500 focus:bg-zinc-900" 
                  : "border-zinc-200 bg-zinc-50/20 text-zinc-700 focus:bg-white"
              }`}
            />
          </div>
          <p className="text-[9px] text-zinc-400 font-medium pl-1 italic">
            Will meet at: {venueName ? `${venueName}, ` : ""}{selectedCity.address}
          </p>
        </div>

        {/* Max Participants Slider */}
        <div className={`border-t pt-3 ${theme === "dark" ? "border-zinc-900" : "border-zinc-50"}`}>
          <div className="flex justify-between items-center mb-1">
            <label className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
              Max Group Size
            </label>
            <span className="text-xs font-bold text-orange-600">{maxParticipants} people</span>
          </div>
          <input
            type="range"
            min="2"
            max="12"
            value={maxParticipants}
            onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
            className="w-full accent-orange-500 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[8px] text-zinc-400 font-bold">
            <span>2 (Duet)</span>
            <span>6 (Cosy Group)</span>
            <span>12 (Big Social)</span>
          </div>
        </div>

        {/* Demographics Constraints */}
        <div className={`space-y-3 border-t pt-3 pb-2 ${theme === "dark" ? "border-zinc-900" : "border-zinc-50"}`}>
          {/* Allowed Gender */}
          <div>
            <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
              Allowed Gender
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(["any", "female", "male"] as const).map((genderOption) => (
                <button
                  key={genderOption}
                  type="button"
                  onClick={() => setAllowedGender(genderOption)}
                  className={`py-2 rounded-xl border text-[10px] font-bold capitalize transition-all cursor-pointer ${
                    allowedGender === genderOption
                      ? theme === "dark" ? "border-orange-500 bg-orange-950/20 text-orange-400" : "border-orange-500 bg-orange-50 text-orange-600"
                      : theme === "dark" ? "border-zinc-800 text-zinc-500 hover:bg-zinc-900" : "border-zinc-100 text-zinc-500 hover:bg-zinc-50"
                  }`}
                >
                  {genderOption === "any" ? "Any Gender" : `${genderOption} only`}
                </button>
              ))}
            </div>
          </div>

          {/* Age Sliders */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"}`}>
                Target Age Range
              </label>
              <span className="text-xs font-bold text-orange-600">{minAge} - {maxAge} years</span>
            </div>
            <div className="flex gap-3 items-center">
              <div className="flex-grow">
                <span className="text-[8px] text-zinc-400 font-bold uppercase font-mono">Min Age</span>
                <input
                  type="range"
                  min="18"
                  max="60"
                  value={minAge}
                  onChange={(e) => setMinAge(Math.min(parseInt(e.target.value), maxAge))}
                  className="w-full accent-orange-500 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
              <div className="flex-grow">
                <span className="text-[8px] text-zinc-400 font-bold uppercase font-mono">Max Age</span>
                <input
                  type="range"
                  min="18"
                  max="99"
                  value={maxAge}
                  onChange={(e) => setMaxAge(Math.max(parseInt(e.target.value), minAge))}
                  className="w-full accent-orange-500 h-1 bg-zinc-100 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Public Warning Sticky Box */}
        <div className={`p-3 border rounded-xl flex gap-2.5 ${
          theme === "dark" ? "bg-amber-950/20 border-amber-900/50 text-amber-400" : "bg-amber-50 border-amber-100 text-amber-800"
        }`}>
          <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[10px] leading-relaxed font-medium">
            <span className={`font-bold block ${theme === "dark" ? "text-amber-200" : "text-amber-900"}`}>Safety Priority: Public Spaces Only</span>
            MeetUp Local is about safe, casual, low-friction meetings. Always schedule activities in commercial and well-lit venues (cinemas, coffee shops, active parks). Avoid meeting in private homes.
          </div>
        </div>

        {/* Spacer */}
        <div className="h-6"></div>
      </form>

      {/* --- FOOTER BUTTON --- */}
      <footer className={`absolute bottom-0 left-0 right-0 p-4 z-15 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] border-t ${
        theme === "dark" ? "bg-zinc-950 border-zinc-850" : "bg-white border-zinc-100"
      }`}>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-orange-500/10 active:scale-98"
        >
          <Heart size={14} /> Publish Activity
        </button>
      </footer>
    </div>
  );
}
