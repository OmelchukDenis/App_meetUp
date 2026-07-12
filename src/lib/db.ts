/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppState, User, Event, EventParticipant, EventMessage, Report, Block, PushNotification, Gender, EventCategory, EventStatus, LocationPoint } from "../types";

// Standard coordinates for testing
export const CITIES = [
  { name: "San Francisco", lat: 37.7749, lng: -122.4194, address: "Civic Center, San Francisco, CA" },
  { name: "Oakland", lat: 37.8044, lng: -122.2711, address: "Lake Merritt, Oakland, CA" },
  { name: "Berkeley", lat: 37.8715, lng: -122.2730, address: "UC Berkeley, Berkeley, CA" },
  { name: "San Jose", lat: 37.3382, lng: -121.8863, address: "Downtown San Jose, CA" },
  { name: "Marin County", lat: 37.9735, lng: -122.5311, address: "San Rafael, Marin, CA" },
];

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  cinema: "Cinema & Movies",
  sport: "Gym & Sports",
  food: "Dinner & Food",
  walk: "Walks & Outdoors",
  boardgames: "Board Games",
  culture: "Culture & Museum",
  other: "Other Activity",
};

// Calculate age from birthdate string (YYYY-MM-DD)
export function getAge(birthDateString: string): number {
  const today = new Date();
  const birthDate = new Date(birthDateString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Haversine formula for spherical distance in km
export function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return parseFloat(distance.toFixed(1));
}

// Seed data
const initialUsers: User[] = [
  {
    id: "user-alex",
    name: "Alex Rivera",
    birth_date: "2000-04-12", // 26 years old in 2026
    gender: "female",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    bio: "Love indie films, board games, and trying new coffee shops. Let's make offline friends! ✨",
    last_location: { lat: 37.7749, lng: -122.4194, label: "San Francisco" },
    search_radius_km: 15,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    notification_settings: { all: true, joinRequests: true, chatMessages: true, reminders: true },
  },
  {
    id: "user-sam",
    name: "Sam Chen",
    birth_date: "1997-08-15", // 29 years old in 2026
    gender: "male",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    bio: "Gym regular, outdoor walker, and amateur chef. Looking for gym buddies and casual dinner groups. 🏋️‍♂️🍳",
    last_location: { lat: 37.8044, lng: -122.2711, label: "Oakland" },
    search_radius_km: 20,
    created_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    notification_settings: { all: true, joinRequests: true, chatMessages: true, reminders: true },
  },
  {
    id: "user-taylor",
    name: "Taylor Vance",
    birth_date: "2003-11-22", // 23 years old in 2026
    gender: "other",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    bio: "Local artist & street photographer. Looking for museum buddies, walking groups, and people to discuss philosophy. 🎨📷",
    last_location: { lat: 37.8715, lng: -122.2730, label: "Berkeley" },
    search_radius_km: 25,
    created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    notification_settings: { all: true, joinRequests: true, chatMessages: true, reminders: true },
  },
  {
    id: "user-chloe",
    name: "Chloe Smith",
    birth_date: "1994-01-30", // 32 years old in 2026
    gender: "female",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150",
    bio: "Foodie who loves trying out new restaurants. Moved here recently, looking to build a neat local group! 🍜🍣",
    last_location: { lat: 37.7749, lng: -122.4194, label: "San Francisco" },
    search_radius_km: 10,
    created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    notification_settings: { all: true, joinRequests: true, chatMessages: true, reminders: true },
  },
  {
    id: "user-jordan",
    name: "Jordan Patel",
    birth_date: "1981-06-05", // 45 years old in 2026
    gender: "male",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    bio: "Recently moved to the area. Looking to find casual walking partners or board game players. Age is just a number! 🎲🚶‍♂️",
    last_location: { lat: 37.3382, lng: -121.8863, label: "San Jose" },
    search_radius_km: 30,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    is_banned: false,
    notification_settings: { all: true, joinRequests: true, chatMessages: false, reminders: true },
  },
];

// Starts tomorrow at 19:00 (7 PM)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(19, 0, 0, 0);

// Starts Saturday at 10:00 (10 AM)
const saturday = new Date();
const currentDay = saturday.getDay();
const daysTillSaturday = (6 - currentDay + 7) % 7;
saturday.setDate(saturday.getDate() + (daysTillSaturday || 7));
saturday.setHours(10, 0, 0, 0);

// Starts Friday at 18:30 (6:30 PM)
const friday = new Date();
const daysTillFriday = (5 - currentDay + 7) % 7;
friday.setDate(friday.getDate() + (daysTillFriday || 7));
friday.setHours(18, 30, 0, 0);

const initialEvents: Event[] = [
  {
    id: "event-movie",
    creator_id: "user-alex",
    title: "Indie Sci-Fi Movie Night",
    description: "Going to see the new indie space sci-fi movie at Alamo Drafthouse. Looking for 3 fellow movie buffs to join me, and we can grab a quick drink afterward to chat about it! 🎬🌌",
    category: "cinema",
    location: { lat: 37.7562, lng: -122.4190, label: "Alamo Drafthouse, SF" },
    address_text: "2550 Mission St, San Francisco, CA 94110",
    starts_at: tomorrow.toISOString(),
    max_participants: 4,
    allowed_gender: "any",
    min_age: 20,
    max_age: 35,
    status: "active",
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "event-gym",
    creator_id: "user-sam",
    title: "Chest Day & Spotting Partner",
    description: "Hit Fitness SF Mid-Market. Looking for a reliable lifting partner to spot on bench press, trade motivation, and keep a consistent routine! Public gym setting. 💪🏋️‍♂️",
    category: "sport",
    location: { lat: 37.7766, lng: -122.4168, label: "Fitness SF, SF" },
    address_text: "1001 Brannan St, San Francisco, CA 94103",
    starts_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    max_participants: 2,
    allowed_gender: "male",
    min_age: 25,
    max_age: 40,
    status: "active",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "event-walk",
    creator_id: "user-taylor",
    title: "Lake Merritt Walk & Talk",
    description: "Saturday morning walk around Lake Merritt (approx. 5k). Let's meet by the boathouse, grab some matcha or coffee, and enjoy a nice morning walking and chatting! 🚶‍♂️☕️🍃",
    category: "walk",
    location: { lat: 37.8005, lng: -122.2588, label: "Lake Merritt Boathouse, Oakland" },
    address_text: "568 Bellevue Ave, Oakland, CA 94610",
    starts_at: saturday.toISOString(),
    max_participants: 6,
    allowed_gender: "any",
    min_age: 18,
    max_age: 30,
    status: "active",
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "event-hotpot",
    creator_id: "user-chloe",
    title: "Girls Hot Pot Night out!",
    description: "Craving spicy hot pot! Booking a table at Dragon Beaux. Looking for 3 friendly ladies to join for a feast of hot broth, noodles, and amazing conversation. 🍜🌶️✨",
    category: "food",
    location: { lat: 37.7818, lng: -122.4834, label: "Dragon Beaux, SF" },
    address_text: "5700 Geary Blvd, San Francisco, CA 94121",
    starts_at: friday.toISOString(),
    max_participants: 4,
    allowed_gender: "female",
    min_age: 25,
    max_age: 45,
    status: "active",
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Pre-seeded relationships and messages
const initialParticipants: EventParticipant[] = [
  // Creators must be accepted
  { event_id: "event-movie", user_id: "user-alex", status: "accepted", requested_at: tomorrow.toISOString() },
  { event_id: "event-gym", user_id: "user-sam", status: "accepted", requested_at: tomorrow.toISOString() },
  { event_id: "event-walk", user_id: "user-taylor", status: "accepted", requested_at: saturday.toISOString() },
  { event_id: "event-hotpot", user_id: "user-chloe", status: "accepted", requested_at: friday.toISOString() },
  
  // Sam joined Alex's movie event (accepted)
  { event_id: "event-movie", user_id: "user-sam", status: "accepted", requested_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  // Taylor requested to join Alex's movie event (pending)
  { event_id: "event-movie", user_id: "user-taylor", status: "pending", requested_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  // Alex joined Taylor's walk (accepted)
  { event_id: "event-walk", user_id: "user-alex", status: "accepted", requested_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() },
  // Sam joined Taylor's walk (accepted)
  { event_id: "event-walk", user_id: "user-sam", status: "accepted", requested_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
];

const initialMessages: EventMessage[] = [
  {
    id: "msg-1",
    event_id: "event-movie",
    sender_id: "user-alex",
    text: "Hey Sam! Thanks for joining. Are you excited for the film?",
    created_at: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "msg-2",
    event_id: "event-movie",
    sender_id: "user-sam",
    text: "Definitely! I've been reading reviews and it sounds amazing. See you tomorrow!",
    created_at: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
  },
];

const initialBlocks: Block[] = [
  // Jordan is blocked by Sam (just for illustration of hiding events/profiles)
  { blocker_id: "user-sam", blocked_id: "user-jordan" },
];

export class LocalDb {
  private static KEY = "meetup_local_db_state";

  static get(): AppState {
    const data = localStorage.getItem(this.KEY);
    if (data) {
      try {
        const state = JSON.parse(data) as AppState;
        // Run reactive checks (auto-marking full or completed)
        return this.syncAndGet(state);
      } catch (e) {
        console.error("Failed to parse local storage, resetting", e);
      }
    }
    
    // Seed initial state
    const defaultState: AppState = {
      users: initialUsers,
      events: initialEvents,
      participants: initialParticipants,
      messages: initialMessages,
      reports: [],
      blocks: initialBlocks,
      activeUserId: "user-alex", // Start as Alex RIVERAs
      notifications: [
        {
          id: "notif-1",
          recipient_id: "user-alex",
          title: "New Join Request!",
          body: "Taylor Vance requested to join your 'Indie Sci-Fi Movie Night'.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false,
          type: "request",
          event_id: "event-movie",
        }
      ],
    };
    this.save(defaultState);
    return defaultState;
  }

  static save(state: AppState) {
    localStorage.setItem(this.KEY, JSON.stringify(state));
  }

  // Sync state: enforce business rules before returning
  private static syncAndGet(state: AppState): AppState {
    let changed = false;
    const now = new Date();

    // 1. Auto-complete events when starts_at is in the past
    const updatedEvents = state.events.map((evt) => {
      const startsAt = new Date(evt.starts_at);
      if (evt.status === "active" && startsAt < now) {
        changed = true;
        return { ...evt, status: "completed" as EventStatus };
      }
      return evt;
    });

    if (changed) {
      state.events = updatedEvents;
      this.save(state);
    }
    return state;
  }

  // Reset database to default seed data
  static reset(): AppState {
    localStorage.removeItem(this.KEY);
    return this.get();
  }

  // --- USER OPERATIONS ---
  static updateUser(user: User): AppState {
    const state = this.get();
    state.users = state.users.map(u => u.id === user.id ? user : u);
    this.save(state);
    return state;
  }

  static getActiveUser(state?: AppState): User | null {
    const activeState = state || this.get();
    if (!activeState.activeUserId) return null;
    return activeState.users.find(u => u.id === activeState.activeUserId) || null;
  }

  static switchUser(userId: string): AppState {
    const state = this.get();
    state.activeUserId = userId;
    this.save(state);
    return state;
  }

  static deleteAccount(userId: string): AppState {
    const state = this.get();
    // Remove user and any associations
    state.users = state.users.filter(u => u.id !== userId);
    state.events = state.events.filter(e => e.creator_id !== userId);
    state.participants = state.participants.filter(p => p.user_id !== userId);
    state.messages = state.messages.filter(m => m.sender_id !== userId);
    state.blocks = state.blocks.filter(b => b.blocker_id !== userId && b.blocked_id !== userId);
    
    if (state.activeUserId === userId) {
      state.activeUserId = state.users[0]?.id || null;
    }
    this.save(state);
    return state;
  }

  // --- EVENT OPERATIONS ---
  static createEvent(eventData: Omit<Event, "id" | "creator_id" | "status" | "created_at">): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    const newEvent: Event = {
      ...eventData,
      id: `event-${Date.now()}`,
      creator_id: activeUser.id,
      status: "active",
      created_at: new Date().toISOString(),
    };

    state.events.push(newEvent);

    // Business rule: Creator is always an accepted participant
    state.participants.push({
      event_id: newEvent.id,
      user_id: activeUser.id,
      status: "accepted",
      requested_at: new Date().toISOString(),
    });

    this.save(state);
    return state;
  }

  static cancelEvent(eventId: string): AppState {
    const state = this.get();
    const event = state.events.find(e => e.id === eventId);
    if (!event) return state;

    event.status = "cancelled";

    // Notify all accepted participants (except creator)
    const acceptedParticipants = state.participants.filter(p => p.event_id === eventId && p.status === "accepted" && p.user_id !== event.creator_id);
    acceptedParticipants.forEach(p => {
      this.createNotificationInternal(state, {
        recipient_id: p.user_id,
        title: "Event Cancelled",
        body: `The event '${event.title}' has been cancelled by the creator.`,
        type: "cancelled",
        event_id: eventId,
      });
    });

    this.save(state);
    return state;
  }

  // --- PARTICIPANT OPERATIONS ---
  static requestToJoin(eventId: string): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    const event = state.events.find(e => e.id === eventId);
    if (!activeUser || !event) return state;

    // Check if duplicate request
    const existing = state.participants.find(p => p.event_id === eventId && p.user_id === activeUser.id);
    if (existing) {
      if (existing.status === "left" || existing.status === "declined") {
        existing.status = "pending";
        existing.requested_at = new Date().toISOString();
      } else {
        return state; // Already pending or accepted
      }
    } else {
      state.participants.push({
        event_id: eventId,
        user_id: activeUser.id,
        status: "pending",
        requested_at: new Date().toISOString(),
      });
    }

    // Push notification to creator
    this.createNotificationInternal(state, {
      recipient_id: event.creator_id,
      title: "New Join Request!",
      body: `${activeUser.name} requested to join your event '${event.title}'.`,
      type: "request",
      event_id: eventId,
    });

    this.save(state);
    return state;
  }

  static resolveParticipantRequest(eventId: string, userId: string, approve: boolean): AppState {
    const state = this.get();
    const event = state.events.find(e => e.id === eventId);
    if (!event) return state;

    const participant = state.participants.find(p => p.event_id === eventId && p.user_id === userId);
    if (!participant) return state;

    participant.status = approve ? "accepted" : "declined";
    participant.resolved_at = new Date().toISOString();

    // Notify requester
    this.createNotificationInternal(state, {
      recipient_id: userId,
      title: approve ? "Request Approved! 🎉" : "Request Declined",
      body: approve 
        ? `You were accepted to join '${event.title}'! You can now access the group chat.`
        : `Your request to join '${event.title}' was declined by the creator.`,
      type: "response",
      event_id: eventId,
    });

    // Business rule: Event auto-marks "full" when accepted participants reach max_participants
    const acceptedCount = state.participants.filter(p => p.event_id === eventId && p.status === "accepted").length;
    if (acceptedCount >= event.max_participants) {
      event.status = "full";
    }

    this.save(state);
    return state;
  }

  static leaveEvent(eventId: string): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    const participant = state.participants.find(p => p.event_id === eventId && p.user_id === activeUser.id);
    if (participant) {
      participant.status = "left";
      participant.resolved_at = new Date().toISOString();
    }

    // If event was previously full, mark it back to active
    const event = state.events.find(e => e.id === eventId);
    if (event && event.status === "full") {
      const acceptedCount = state.participants.filter(p => p.event_id === eventId && p.status === "accepted").length;
      if (acceptedCount < event.max_participants) {
        event.status = "active";
      }
    }

    this.save(state);
    return state;
  }

  // --- CHAT MESSAGES ---
  static sendChatMessage(eventId: string, text: string): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    const newMsg: EventMessage = {
      id: `msg-${Date.now()}`,
      event_id: eventId,
      sender_id: activeUser.id,
      text,
      created_at: new Date().toISOString(),
    };

    state.messages.push(newMsg);

    // Notify all other accepted participants in real-time!
    const otherParticipants = state.participants.filter(
      p => p.event_id === eventId && p.status === "accepted" && p.user_id !== activeUser.id
    );

    otherParticipants.forEach(p => {
      this.createNotificationInternal(state, {
        recipient_id: p.user_id,
        title: `New Message in ${state.events.find(e => e.id === eventId)?.title}`,
        body: `${activeUser.name}: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"`,
        type: "chat",
        event_id: eventId,
      });
    });

    this.save(state);
    return state;
  }

  // --- REPORT & BLOCK ---
  static reportUser(reportedUserId: string, reason: string, eventId?: string): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    const newReport: Report = {
      id: `report-${Date.now()}`,
      reporter_id: activeUser.id,
      reported_user_id: reportedUserId,
      event_id: eventId,
      reason,
      created_at: new Date().toISOString(),
    };

    state.reports.push(newReport);
    
    // Auto-block the reported user for a safe experience
    const alreadyBlocked = state.blocks.some(
      b => b.blocker_id === activeUser.id && b.blocked_id === reportedUserId
    );
    if (!alreadyBlocked) {
      state.blocks.push({
        blocker_id: activeUser.id,
        blocked_id: reportedUserId,
      });
    }

    this.save(state);
    return state;
  }

  static blockUser(blockedUserId: string): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    const alreadyBlocked = state.blocks.some(
      b => b.blocker_id === activeUser.id && b.blocked_id === blockedUserId
    );

    if (!alreadyBlocked) {
      state.blocks.push({
        blocker_id: activeUser.id,
        blocked_id: blockedUserId,
      });
    }

    this.save(state);
    return state;
  }

  static unblockUser(blockedUserId: string): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    state.blocks = state.blocks.filter(
      b => !(b.blocker_id === activeUser.id && b.blocked_id === blockedUserId)
    );

    this.save(state);
    return state;
  }

  // --- NOTIFICATIONS ---
  static markNotificationsRead(): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    state.notifications = state.notifications.map(n => 
      n.recipient_id === activeUser.id ? { ...n, read: true } : n
    );

    this.save(state);
    return state;
  }

  static clearNotifications(): AppState {
    const state = this.get();
    const activeUser = this.getActiveUser(state);
    if (!activeUser) return state;

    state.notifications = state.notifications.filter(n => n.recipient_id !== activeUser.id);
    this.save(state);
    return state;
  }

  private static createNotificationInternal(
    state: AppState,
    notif: Omit<PushNotification, "id" | "timestamp" | "read">
  ) {
    // Check user's notification settings
    const recipient = state.users.find(u => u.id === notif.recipient_id);
    if (recipient && recipient.notification_settings) {
      const settings = recipient.notification_settings;
      if (!settings.all) return; // Notification disabled globally
      if (notif.type === "request" && !settings.joinRequests) return;
      if (notif.type === "response" && !settings.joinRequests) return;
      if (notif.type === "chat" && !settings.chatMessages) return;
    }

    const newNotif: PushNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    state.notifications.unshift(newNotif);
  }

  // Force trigger a simulated 3h Reminder
  static triggerSimulated3hReminder(eventId: string): AppState {
    const state = this.get();
    const event = state.events.find(e => e.id === eventId);
    if (!event) return state;

    const accepted = state.participants.filter(p => p.event_id === eventId && p.status === "accepted");
    accepted.forEach(p => {
      this.createNotificationInternal(state, {
        recipient_id: p.user_id,
        title: "Upcoming Event Reminder ⏰",
        body: `Reminder: '${event.title}' starts in 3 hours at ${event.address_text}!`,
        type: "reminder",
        event_id: eventId,
      });
    });

    this.save(state);
    return state;
  }

  // --- QUERY FILTERING ---
  // Core business rules implemented here
  static queryEvents(
    userId: string,
    filters: {
      category: EventCategory | "all";
      maxDistanceKm: number;
      dateFilter: "all" | "today" | "tomorrow" | "weekend";
    }
  ): { event: Event; creator: User; distance: number; matchCriteria: boolean; failReason?: string }[] {
    const state = this.get();
    const user = state.users.find(u => u.id === userId);
    if (!user) return [];

    const userAge = getAge(user.birth_date);
    const userGender = user.gender;

    // Get list of blocked user IDs (either blocker or blocked)
    const blockedUserIds = new Set<string>();
    state.blocks.forEach(b => {
      if (b.blocker_id === userId) blockedUserIds.add(b.blocked_id);
      if (b.blocked_id === userId) blockedUserIds.add(b.blocker_id);
    });

    return state.events
      .map(evt => {
        const creator = state.users.find(u => u.id === evt.creator_id)!;
        const distance = getDistanceKm(
          user.last_location.lat,
          user.last_location.lng,
          evt.location.lat,
          evt.location.lng
        );

        // Check if blocked
        const isBlocked = blockedUserIds.has(evt.creator_id);

        // Check category
        const categoryMatch = filters.category === "all" || evt.category === filters.category;

        // Check distance
        const distanceMatch = distance <= filters.maxDistanceKm;

        // Check event active / full
        const statusMatch = evt.status === "active" || evt.status === "full";

        // Check dates
        let dateMatch = true;
        const evtDate = new Date(evt.starts_at);
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        if (filters.dateFilter === "today") {
          dateMatch = evtDate.toDateString() === today.toDateString();
        } else if (filters.dateFilter === "tomorrow") {
          dateMatch = evtDate.toDateString() === tomorrow.toDateString();
        } else if (filters.dateFilter === "weekend") {
          // Friday, Saturday, Sunday
          const day = evtDate.getDay();
          dateMatch = day === 5 || day === 6 || day === 0;
        }

        // Check demographics constraints (GENDER AND AGE)
        // Business rule: users see only events where they fit min_age/max_age and allowed_gender
        const genderMatch =
          evt.allowed_gender === "any" ||
          evt.allowed_gender === userGender;

        const ageMatch = userAge >= evt.min_age && userAge <= evt.max_age;

        let failReason = "";
        if (isBlocked) failReason = "Blocked user";
        else if (!genderMatch) failReason = `Gender mismatch (Requires: ${evt.allowed_gender}, User is: ${userGender})`;
        else if (!ageMatch) failReason = `Age mismatch (Event: ${evt.min_age}-${evt.max_age}, User is: ${userAge})`;
        else if (!categoryMatch) failReason = "Category filter";
        else if (!distanceMatch) failReason = `Outside radius (${distance} km > ${filters.maxDistanceKm} km)`;
        else if (!dateMatch) failReason = "Date filter";
        else if (!statusMatch) failReason = `Event status is ${evt.status}`;

        const matchCriteria =
          !isBlocked &&
          genderMatch &&
          ageMatch &&
          categoryMatch &&
          distanceMatch &&
          dateMatch &&
          statusMatch;

        return {
          event: evt,
          creator,
          distance,
          matchCriteria,
          failReason: matchCriteria ? undefined : failReason,
        };
      })
      .filter(item => {
        // In a real database search, gender/age/block mismatches are completely hidden from the feed.
        // We will return everything that matches the core requirements, but let our view filter it out.
        // The user feed must hide events created by blocked users and events where they don't match criteria.
        return item.matchCriteria;
      })
      .sort((a, b) => a.distance - b.distance); // Sorted by distance
  }
}
