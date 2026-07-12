/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { AppState, User, PushNotification } from "./types";
import { LocalDb } from "./lib/db";
import { SUPABASE_SCHEMA_SQL } from "./data/supabaseSql";

// Import Screens
import OnboardingScreen from "./components/screens/OnboardingScreen";
import FeedScreen from "./components/screens/FeedScreen";
import EventDetailsScreen from "./components/screens/EventDetailsScreen";
import CreateEventScreen from "./components/screens/CreateEventScreen";
import MyEventsScreen from "./components/screens/MyEventsScreen";
import ChatScreen from "./components/screens/ChatScreen";
import ProfileScreen from "./components/screens/ProfileScreen";
import SettingsScreen from "./components/screens/SettingsScreen";

// Import Shell Simulator and Developer Companion
import MobileSimulator from "./components/MobileSimulator";
import DeveloperCompanion from "./components/DeveloperCompanion";

export default function App() {
  // Sync core database state
  const [dbState, setDbState] = useState<AppState>(() => LocalDb.get());
  const [currentScreen, setCurrentScreen] = useState<string>("feed");
  const [screenParams, setScreenParams] = useState<Record<string, any>>({});
  
  // Theme configuration
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("meetup_theme") as "light" | "dark") || "light";
  });

  const handleUpdateTheme = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("meetup_theme", newTheme);
  };

  // Dynamic Push Notification Toaster
  const [activeToast, setActiveToast] = useState<PushNotification | null>(null);
  const prevNotificationsLength = useRef<number>(dbState.notifications.length);

  // Sync React state with LocalStorage db changes
  const syncState = useCallback(() => {
    const freshState = LocalDb.get();
    setDbState(freshState);

    // If active user was deleted/missing, force onboarding
    if (!freshState.activeUserId && currentScreen !== "onboarding") {
      setCurrentScreen("onboarding");
    }
  }, [currentScreen]);

  // Read active user details
  const activeUser = useMemo(() => {
    if (!dbState.activeUserId) return null;
    return dbState.users.find(u => u.id === dbState.activeUserId) || null;
  }, [dbState]);

  // Keep routing stable: if no active user, force onboarding
  useEffect(() => {
    if (!activeUser && currentScreen !== "onboarding") {
      setCurrentScreen("onboarding");
    }
  }, [activeUser, currentScreen]);

  // Reactive Push Notification detection hook
  useEffect(() => {
    const currentNotifs = dbState.notifications;
    const prevLen = prevNotificationsLength.current;

    // If a new notification has been pushed to the top of the stream
    if (currentNotifs.length > prevLen && activeUser) {
      const latestNotif = currentNotifs[0];
      // Only display toast if it is unread, directed to the active user, and not a self-inflicted action
      if (latestNotif && latestNotif.recipient_id === activeUser.id && !latestNotif.read) {
        setActiveToast(latestNotif);
        // Auto-dismiss notification banner after 5 seconds
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
    prevNotificationsLength.current = currentNotifs.length;
  }, [dbState.notifications, activeUser]);

  // COUNT UNREAD NOTIFICATIONS
  const unreadNotificationsCount = useMemo(() => {
    if (!activeUser) return 0;
    return dbState.notifications.filter(n => n.recipient_id === activeUser.id && !n.read).length;
  }, [dbState.notifications, activeUser]);

  // NAVIGATION ACTIONS
  const handleNavigateToEventDetails = (eventId: string) => {
    setScreenParams({ eventId });
    setCurrentScreen("event_details");
  };

  const handleNavigateToUserProfile = (userId: string) => {
    setScreenParams({ userId });
    setCurrentScreen("profile");
  };

  const handleNavigateToChat = (eventId: string) => {
    setScreenParams({ eventId });
    setCurrentScreen("chat");
  };

  const handleTabClick = (tab: "feed" | "my_events" | "settings") => {
    setCurrentScreen(tab);
    setScreenParams({});
    
    // Auto-mark notifications read if they browse setting screens or feed
    if (tab === "settings" || tab === "feed") {
      LocalDb.markNotificationsRead();
      syncState();
    }
  };

  // SYSTEM SANDBOX ACTIONS (Triggered from Developer Companion)
  const handleSwitchUserSandbox = (userId: string) => {
    LocalDb.switchUser(userId);
    // Clear back stacks to prevent showing another user's detail views
    setScreenParams({});
    setCurrentScreen("feed");
    syncState();
    setActiveToast(null);
  };

  const handleResetSandboxDb = () => {
    const fresh = LocalDb.reset();
    setDbState(fresh);
    setCurrentScreen("feed");
    setScreenParams({});
    setActiveToast(null);
    prevNotificationsLength.current = fresh.notifications.length;
  };

  const handleTriggerSimulatedReminder = (eventId: string) => {
    LocalDb.triggerSimulated3hReminder(eventId);
    syncState();
  };

  // SCREEN PROFILE UPDATE ACTIONS
  const handleOnboardingComplete = (newUserData: Omit<User, "id" | "created_at" | "is_banned">) => {
    const uniqueId = `user-${Date.now()}`;
    const stateWithNewUser = LocalDb.get();
    
    const newUser: User = {
      ...newUserData,
      id: uniqueId,
      created_at: new Date().toISOString(),
      is_banned: false,
    };

    stateWithNewUser.users.push(newUser);
    stateWithNewUser.activeUserId = uniqueId;
    
    LocalDb.save(stateWithNewUser);
    syncState();
    setCurrentScreen("feed");
  };

  const handleLogout = () => {
    const stateToLogout = LocalDb.get();
    stateToLogout.activeUserId = null;
    LocalDb.save(stateToLogout);
    syncState();
    setCurrentScreen("onboarding");
  };

  const handleDeleteAccount = () => {
    if (activeUser) {
      LocalDb.deleteAccount(activeUser.id);
      syncState();
      setCurrentScreen("onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100 p-4 md:p-8 flex items-center justify-center font-sans overflow-x-hidden antialiased">
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: VISUAL SMARTPHONE SIMULATOR */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col items-center justify-center">
          <MobileSimulator
            activeUser={activeUser}
            currentScreen={currentScreen}
            onNavigateTab={handleTabClick}
            activeNotification={activeToast}
            onCloseNotification={() => setActiveToast(null)}
            theme={theme}
          >
            {/* Screen Router inside the phone frame */}
            {currentScreen === "onboarding" && (
              <OnboardingScreen onComplete={handleOnboardingComplete} theme={theme} />
            )}

            {currentScreen === "feed" && activeUser && (
              <FeedScreen
                activeUser={activeUser}
                onSelectEvent={handleNavigateToEventDetails}
                onNavigateToCreate={() => setCurrentScreen("create_event")}
                onNavigateToNotifications={() => {
                  LocalDb.markNotificationsRead();
                  syncState();
                  alert("You have read all push notifications. Notifications are logged in the Developer Companion Panel.");
                }}
                onNavigateToSettings={() => handleNavigateToUserProfile(activeUser.id)}
                unreadNotificationsCount={unreadNotificationsCount}
                theme={theme}
              />
            )}

            {currentScreen === "event_details" && activeUser && (
              <EventDetailsScreen
                eventId={screenParams.eventId}
                activeUser={activeUser}
                onBack={() => {
                  setCurrentScreen("feed");
                  syncState();
                }}
                onNavigateToChat={handleNavigateToChat}
                onViewUserProfile={handleNavigateToUserProfile}
                theme={theme}
              />
            )}

            {currentScreen === "create_event" && activeUser && (
              <CreateEventScreen
                activeUser={activeUser}
                onBack={() => {
                  setCurrentScreen("feed");
                  syncState();
                }}
                onSuccess={() => {
                  syncState();
                  setCurrentScreen("my_events");
                }}
                theme={theme}
              />
            )}

            {currentScreen === "my_events" && activeUser && (
              <MyEventsScreen
                activeUser={activeUser}
                onSelectEvent={handleNavigateToEventDetails}
                onNavigateToChat={handleNavigateToChat}
                theme={theme}
              />
            )}

            {currentScreen === "chat" && activeUser && (
              <ChatScreen
                eventId={screenParams.eventId}
                activeUser={activeUser}
                onBack={() => handleNavigateToEventDetails(screenParams.eventId)}
                onViewUserProfile={handleNavigateToUserProfile}
                theme={theme}
              />
            )}

            {currentScreen === "profile" && activeUser && (
              <ProfileScreen
                userId={screenParams.userId}
                activeUser={activeUser}
                onBack={() => {
                  // Back behavior based on stack context
                  if (screenParams.userId === activeUser.id) {
                    setCurrentScreen("settings");
                  } else if (screenParams.eventId) {
                    setCurrentScreen("event_details");
                  } else {
                    setCurrentScreen("feed");
                  }
                  syncState();
                }}
                onUserUpdate={syncState}
                onBlockCompleted={() => {
                  setCurrentScreen("feed");
                  syncState();
                }}
                theme={theme}
              />
            )}

            {currentScreen === "settings" && activeUser && (
              <SettingsScreen
                activeUser={activeUser}
                onBack={() => setCurrentScreen("feed")}
                onUserUpdate={syncState}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
                theme={theme}
                onThemeChange={handleUpdateTheme}
              />
            )}
          </MobileSimulator>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE DEVELOPER COMPANION PANEL (DESKTOP MODE) */}
        <div className="md:col-span-7 lg:col-span-8 h-[650px] flex flex-col justify-stretch">
          <DeveloperCompanion
            appState={dbState}
            activeUser={activeUser}
            onSwitchUser={handleSwitchUserSandbox}
            onResetDb={handleResetSandboxDb}
            onTriggerReminder={handleTriggerSimulatedReminder}
            schemaSql={SUPABASE_SCHEMA_SQL}
          />
        </div>

      </div>
    </div>
  );
}
