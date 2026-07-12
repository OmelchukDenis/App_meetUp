/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LocationPoint {
  lat: number;
  lng: number;
  label?: string;
}

export type Gender = "male" | "female" | "other";
export type EventCategory = "cinema" | "sport" | "food" | "walk" | "boardgames" | "culture" | "other";
export type ParticipantStatus = "pending" | "accepted" | "declined" | "left";
export type EventStatus = "active" | "full" | "cancelled" | "completed";

export interface User {
  id: string;
  name: string;
  birth_date: string; // ISO string YYYY-MM-DD
  gender: Gender;
  avatar_url: string;
  bio: string;
  last_location: LocationPoint;
  search_radius_km: number;
  created_at: string;
  is_banned: boolean;
  notification_settings?: {
    all: boolean;
    joinRequests: boolean;
    chatMessages: boolean;
    reminders: boolean;
  };
}

export interface Event {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  category: EventCategory;
  location: LocationPoint;
  address_text: string;
  starts_at: string; // ISO string
  max_participants: number;
  allowed_gender: "any" | "male" | "female";
  min_age: number;
  max_age: number;
  status: EventStatus;
  created_at: string;
}

export interface EventParticipant {
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  requested_at: string;
  resolved_at?: string;
}

export interface EventMessage {
  id: string;
  event_id: string;
  sender_id: string;
  text: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  event_id?: string;
  reason: string;
  created_at: string;
}

export interface Block {
  blocker_id: string;
  blocked_id: string;
}

// Client simulation helper types
export interface PushNotification {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  type: "request" | "response" | "chat" | "reminder" | "cancelled";
  event_id?: string;
}

export interface AppState {
  users: User[];
  events: Event[];
  participants: EventParticipant[];
  messages: EventMessage[];
  reports: Report[];
  blocks: Block[];
  activeUserId: string | null;
  notifications: PushNotification[];
}
