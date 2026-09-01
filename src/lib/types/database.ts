export type UserRole = "guest" | "host";
export type EventStatus = "draft" | "published" | "past";
export type RsvpStatus = "going" | "maybe" | "cancelled";
export type ConfessionCategory = "confession" | "feedback" | "suggestion";
export type QueueItemStatus = "pending" | "playing" | "played";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface CarouselImage {
  id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  status: EventStatus;
  cover_image_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventImage {
  id: string;
  event_id: string;
  url: string;
  sort_order: number;
}

export interface Rsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  notes: string | null;
  created_at: string;
  profiles?: Pick<Profile, "display_name" | "email">;
}

export interface Confession {
  id: string;
  body: string;
  category: ConfessionCategory;
  hidden: boolean;
  created_at: string;
}

export interface Birthday {
  id: string;
  name: string;
  month: number;
  day: number;
  birth_year: number | null;
}

export interface QueueItem {
  id: string;
  spotify_track_id: string;
  track_name: string;
  artist_name: string;
  album_art_url: string | null;
  added_by: string | null;
  vote_score: number;
  status: QueueItemStatus;
  created_at: string;
}

export interface QueueVote {
  id: string;
  queue_item_id: string;
  user_id: string;
  value: -1 | 1;
}
