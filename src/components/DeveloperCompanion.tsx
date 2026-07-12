/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { AppState, User, Event, EventParticipant, Block, PushNotification, Report } from "../types";
import { LocalDb, getAge, CITIES } from "../lib/db";
import { Users, Bell, Database, Terminal, FileCode, Play, Trash2, ArrowRightLeft, Shield, Sparkles, MapPin } from "lucide-react";

interface DeveloperCompanionProps {
  appState: AppState;
  activeUser: User | null;
  onSwitchUser: (userId: string) => void;
  onResetDb: () => void;
  onTriggerReminder: (eventId: string) => void;
  schemaSql: string;
}

export default function DeveloperCompanion({
  appState,
  activeUser,
  onSwitchUser,
  onResetDb,
  onTriggerReminder,
  schemaSql,
}: DeveloperCompanionProps) {
  const [activeTab, setActiveTab] = useState<"sandbox" | "notifications" | "database" | "sql">("sandbox");
  const [selectedReminderEventId, setSelectedReminderEventId] = useState("");

  const activeEvents = useMemo(() => {
    return appState.events.filter(e => e.status === "active" || e.status === "full");
  }, [appState.events]);

  const stats = useMemo(() => {
    return {
      usersCount: appState.users.length,
      eventsCount: appState.events.length,
      participantsCount: appState.participants.length,
      notificationsCount: appState.notifications.length,
      blocksCount: appState.blocks.length,
      reportsCount: appState.reports.length,
    };
  }, [appState]);

  const handleCopySql = () => {
    navigator.clipboard.writeText(schemaSql);
    alert("Supabase SQL Schema copied to clipboard!");
  };

  return (
    <div id="dev-companion-container" className="flex flex-col h-full bg-zinc-900 text-zinc-100 rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl font-sans relative">
      {/* HEADER COMPANION */}
      <header className="px-5 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-orange-500 rounded-lg flex items-center justify-center text-xs font-black text-white">⚙️</div>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">MeetUp Local</h2>
            <p className="text-[10px] text-zinc-400 font-medium">Interactive Sandbox & Companion</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (window.confirm("Are you sure you want to restore the sandbox database? Any events or accounts you created will be reset to seed defaults.")) {
              onResetDb();
            }
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 rounded-lg text-[10px] font-bold text-zinc-300 transition-colors cursor-pointer"
        >
          <Trash2 size={11} className="text-red-400" /> Reset DB Defaults
        </button>
      </header>

      {/* COMPANION NAVIGATION */}
      <nav className="flex bg-zinc-950/60 border-b border-zinc-800 px-2.5 py-1 gap-1">
        {[
          { id: "sandbox", label: "Multi-User Sandbox", icon: <ArrowRightLeft size={12} /> },
          { id: "notifications", label: "Push Notification Feed", icon: <Bell size={12} /> },
          { id: "database", label: "Relational Inspector", icon: <Database size={12} /> },
          { id: "sql", label: "Supabase & RLS SQL", icon: <FileCode size={12} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 font-extrabold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>

      {/* COMPANION TAB PANELS */}
      <div className="flex-grow overflow-y-auto p-5 scrollbar-thin select-text min-h-0">
        
        {/* --- TAB 1: USER SANDBOX SWITCHER --- */}
        {activeTab === "sandbox" && (
          <div id="tab-sandbox" className="space-y-4 animate-fade-in">
            <div className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl space-y-1.5">
              <h3 className="text-xs font-bold text-orange-400 flex items-center gap-1.5 uppercase">
                <Sparkles size={13} /> Testing Social Interactions
              </h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                Social MVP flows (requesting, accepting, group chatting, and block reciprocity) require testing with multiple users. 
                Use this visual panel to <strong>switch active accounts instantly</strong> and observe real-time triggers, notifications, and filters!
              </p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Select Active Sandbox Profile</h4>
              
              <div className="grid grid-cols-1 gap-2">
                {appState.users.map((u) => {
                  const isActive = activeUser?.id === u.id;
                  const age = getAge(u.birth_date);
                  return (
                    <div
                      key={u.id}
                      onClick={() => onSwitchUser(u.id)}
                      className={`p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "bg-orange-500/10 border-orange-500/40 shadow-md shadow-orange-500/5"
                          : "bg-zinc-800/20 border-zinc-800 hover:bg-zinc-800/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar_url}
                          alt={u.name}
                          className={`w-9 h-9 rounded-full object-cover border-2 ${
                            isActive ? "border-orange-500" : "border-zinc-700"
                          }`}
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h5 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5">
                            {u.name}
                            <span className="text-[10px] text-zinc-400 font-medium">({age}y, {u.gender})</span>
                          </h5>
                          <p className="text-[10px] text-zinc-400 line-clamp-1 italic mt-0.5 max-w-[200px]">"{u.bio}"</p>
                          <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-semibold uppercase mt-1">
                            <MapPin size={8} /> {u.last_location.label} • Radius: {u.search_radius_km}km
                          </div>
                        </div>
                      </div>

                      {/* Active indicator badge */}
                      {isActive ? (
                        <span className="text-[8px] font-black uppercase tracking-wider px-2 py-1 bg-orange-500/25 text-orange-400 border border-orange-500/40 rounded-md">
                          ACTIVE USER
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold uppercase text-zinc-500 group-hover:text-zinc-300">
                          Switch ➔
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 2: PUSH NOTIFICATIONS --- */}
        {activeTab === "notifications" && (
          <div id="tab-notifications" className="space-y-4 animate-fade-in">
            <div className="p-3 bg-zinc-800/40 border border-zinc-800 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-orange-400 flex items-center gap-1.5 uppercase">
                🔔 Expo Push Notifications Testing Console
              </h3>
              <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                Push notifications appear in-app on the simulated smartphone screen. The list below captures all system alerts (including request creations, chat messages, event cancels, and schedule triggers).
              </p>

              {/* Action trigger simulation */}
              <div className="border-t border-zinc-800/80 pt-3 flex flex-col gap-2">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wide">Test cron: Push 3-Hour Event Reminder</span>
                <div className="flex gap-2">
                  <select
                    value={selectedReminderEventId}
                    onChange={(e) => setSelectedReminderEventId(e.target.value)}
                    className="flex-grow bg-zinc-900 border border-zinc-700 text-xs font-semibold rounded-lg px-2.5 py-1.5 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  >
                    <option value="">-- Choose active activity --</option>
                    {activeEvents.map((evt) => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.status})
                      </option>
                    ))}
                  </select>
                  <button
                    disabled={!selectedReminderEventId}
                    onClick={() => {
                      if (selectedReminderEventId) {
                        onTriggerReminder(selectedReminderEventId);
                        alert("Simulated push notification sent to all accepted event participants!");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                      selectedReminderEventId
                        ? "bg-orange-500 hover:bg-orange-600 text-white"
                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <Play size={10} /> Fire Alert
                  </button>
                </div>
              </div>
            </div>

            {/* Notification logs stream */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Push Notification Stream</h4>
              
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {appState.notifications.length > 0 ? (
                  appState.notifications.map((notif) => {
                    const recipient = appState.users.find(u => u.id === notif.recipient_id);
                    return (
                      <div
                        key={notif.id}
                        className="p-3 bg-zinc-850/30 border border-zinc-800/80 rounded-xl text-xs space-y-1"
                      >
                        <div className="flex justify-between items-center text-[9px] font-bold">
                          <span className="text-orange-400 uppercase tracking-wider">{notif.type} log</span>
                          <span className="text-zinc-500">{new Date(notif.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <h5 className="font-bold text-zinc-200">{notif.title}</h5>
                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">{notif.body}</p>
                        
                        <div className="border-t border-zinc-800/50 pt-1.5 mt-1.5 flex justify-between items-center text-[8px] font-bold text-zinc-500 uppercase">
                          <span>Recipient: {recipient ? recipient.name : "Unknown"}</span>
                          <span>{notif.read ? "✓ read" : "● sent"}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-[10px] text-zinc-500 italic text-center py-6">No push notifications generated yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- TAB 3: RELATION DATABASE INSPECTOR --- */}
        {activeTab === "database" && (
          <div id="tab-database" className="space-y-5 animate-fade-in font-mono text-[10px]">
            {/* Quick overview counters */}
            <div className="grid grid-cols-6 gap-1.5 text-center">
              {[
                { label: "users", value: stats.usersCount },
                { label: "events", value: stats.eventsCount },
                { label: "parts", value: stats.participantsCount },
                { label: "blocks", value: stats.blocksCount },
                { label: "notifs", value: stats.notificationsCount },
                { label: "reports", value: stats.reportsCount },
              ].map((stat) => (
                <div key={stat.label} className="p-1.5 bg-zinc-950 border border-zinc-800 rounded-lg">
                  <div className="text-xs font-bold text-orange-400">{stat.value}</div>
                  <div className="text-[7px] text-zinc-500 font-extrabold uppercase mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Sub-tables visualizer */}
            <div className="space-y-4">
              
              {/* TABLE: USERS */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1 pl-1">
                  <Terminal size={10} className="text-orange-500" /> SELECT * FROM users;
                </h4>
                <div className="overflow-x-auto border border-zinc-800 rounded-xl max-h-36 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse bg-zinc-950">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-[8px] font-black uppercase tracking-wider text-zinc-500">
                        <th className="p-2">id</th>
                        <th className="p-2">name</th>
                        <th className="p-2">gender</th>
                        <th className="p-2">age</th>
                        <th className="p-2">city</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 font-medium text-zinc-300">
                      {appState.users.map((u) => (
                        <tr key={u.id} className="hover:bg-zinc-900/30">
                          <td className="p-2 truncate max-w-[60px] text-zinc-500 font-bold">{u.id}</td>
                          <td className="p-2 font-bold text-zinc-200">{u.name}</td>
                          <td className="p-2 capitalize">{u.gender}</td>
                          <td className="p-2">{getAge(u.birth_date)}</td>
                          <td className="p-2">{u.last_location.label}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE: EVENTS */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1 pl-1">
                  <Terminal size={10} className="text-orange-500" /> SELECT * FROM events;
                </h4>
                <div className="overflow-x-auto border border-zinc-800 rounded-xl max-h-36 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse bg-zinc-950">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-[8px] font-black uppercase tracking-wider text-zinc-500">
                        <th className="p-2">id</th>
                        <th className="p-2">title</th>
                        <th className="p-2">creator</th>
                        <th className="p-2">status</th>
                        <th className="p-2">criteria</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 font-medium text-zinc-300">
                      {appState.events.map((e) => (
                        <tr key={e.id} className="hover:bg-zinc-900/30">
                          <td className="p-2 truncate max-w-[60px] text-zinc-500 font-bold">{e.id}</td>
                          <td className="p-2 font-bold text-zinc-200 truncate max-w-[100px]">{e.title}</td>
                          <td className="p-2 truncate max-w-[60px]">{e.creator_id.split("-")[1]}</td>
                          <td className="p-2">
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                              e.status === "active" ? "bg-emerald-950 text-emerald-400" :
                              e.status === "full" ? "bg-amber-950 text-amber-400" :
                              "bg-red-950 text-red-400"
                            }`}>
                              {e.status}
                            </span>
                          </td>
                          <td className="p-2 text-zinc-400">{e.allowed_gender}/{e.min_age}-{e.max_age}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE: PARTICIPANTS */}
              <div className="space-y-1.5">
                <h4 className="text-[9px] font-black uppercase text-zinc-400 flex items-center gap-1 pl-1">
                  <Terminal size={10} className="text-orange-500" /> SELECT * FROM event_participants;
                </h4>
                <div className="overflow-x-auto border border-zinc-800 rounded-xl max-h-32 overflow-y-auto scrollbar-thin">
                  <table className="w-full text-left border-collapse bg-zinc-950">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-[8px] font-black uppercase tracking-wider text-zinc-500">
                        <th className="p-2">event_id</th>
                        <th className="p-2">user_id</th>
                        <th className="p-2">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800 font-medium text-zinc-300">
                      {appState.participants.map((p, idx) => (
                        <tr key={idx} className="hover:bg-zinc-900/30">
                          <td className="p-2 truncate max-w-[100px] font-bold text-zinc-400">{p.event_id}</td>
                          <td className="p-2 truncate max-w-[100px]">{p.user_id}</td>
                          <td className="p-2">
                            <span className={`text-[8px] font-bold px-1 py-0.5 rounded ${
                              p.status === "accepted" ? "bg-emerald-950 text-emerald-400" :
                              p.status === "pending" ? "bg-amber-950 text-amber-400" :
                              "bg-red-950 text-red-400"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLE: BLOCKS & REPORTS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <h4 className="text-[8px] font-black uppercase text-zinc-400 pl-1">SELECT * FROM blocks;</h4>
                  <div className="border border-zinc-800 rounded-xl max-h-24 overflow-y-auto scrollbar-thin bg-zinc-950 p-2 text-[9px] text-zinc-400">
                    {appState.blocks.length > 0 ? (
                      appState.blocks.map((b, idx) => (
                        <div key={idx} className="py-1 border-b border-zinc-900 last:border-0">
                          <span className="font-bold text-zinc-300">{b.blocker_id.split("-")[1]}</span> blocked <span className="font-bold text-zinc-300">{b.blocked_id.split("-")[1]}</span>
                        </div>
                      ))
                    ) : (
                      <div className="italic text-zinc-600 text-center py-2">No blocked users.</div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-[8px] font-black uppercase text-zinc-400 pl-1">SELECT * FROM reports;</h4>
                  <div className="border border-zinc-800 rounded-xl max-h-24 overflow-y-auto scrollbar-thin bg-zinc-950 p-2 text-[9px] text-zinc-400">
                    {appState.reports.length > 0 ? (
                      appState.reports.map((r) => (
                        <div key={r.id} className="py-1 border-b border-zinc-900 last:border-0 truncate" title={r.reason}>
                          <span className="font-bold text-zinc-300">{r.reporter_id.split("-")[1]}</span> reported <span className="font-bold text-zinc-300">{r.reported_user_id.split("-")[1]}</span>: {r.reason}
                        </div>
                      ))
                    ) : (
                      <div className="italic text-zinc-600 text-center py-2">No abuse reports.</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* --- TAB 4: SUPABASE CODE COPIER --- */}
        {activeTab === "sql" && (
          <div id="tab-sql" className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div>
                <h3 className="text-xs font-bold text-orange-400 uppercase">Supabase Postgres Script</h3>
                <p className="text-[9px] text-zinc-500 font-medium">PostGIS, Schemas, Constraints & Row Level Security</p>
              </div>
              <button
                onClick={handleCopySql}
                className="px-2.5 py-1.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-[9px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                Copy SQL Script
              </button>
            </div>

            <pre className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl text-[9px] font-mono leading-relaxed text-zinc-300 max-h-80 overflow-y-auto scrollbar-thin select-all">
              {schemaSql}
            </pre>
          </div>
        )}

      </div>

      {/* FOOTER METADATA */}
      <footer className="px-5 py-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[8px] font-bold text-zinc-500 uppercase">
        <span>Model: Gemini 3.5 Flash</span>
        <span>Local Time: 2026-07-10 • San Francisco, CA</span>
      </footer>
    </div>
  );
}
