/** TypeScript mirrors of the backend Pydantic schemas. */

export type UserRole = "user" | "admin";
export type ConversationMode =
  | "free_talk"
  | "roleplay"
  | "interview"
  | "pronunciation"
  | "grammar_drill";
export type ProficiencyLevel =
  | "beginner"
  | "elementary"
  | "intermediate"
  | "upper_intermediate"
  | "advanced";
export type AchievementTier = "bronze" | "silver" | "gold" | "platinum";
export type ThemePreference = "light" | "dark" | "system";

export interface Profile {
  avatar_url: string | null;
  bio: string | null;
  native_language: string | null;
  country: string | null;
  target_accent: string;
  proficiency: ProficiencyLevel;
  daily_goal_minutes: number;
}

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  profile: Profile | null;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export type AvatarStyle = "female" | "male" | "professor" | "madam";

export interface Settings {
  theme: ThemePreference;
  avatar_style: AvatarStyle;
  tts_voice: string;
  speech_rate: number;
  auto_play_replies: boolean;
  show_corrections_live: boolean;
  interrupt_enabled: boolean;
  email_notifications: boolean;
  daily_reminder: boolean;
  reminder_time: string;
}

export interface ErrorHighlight {
  wrong: string;
  correction: string;
  reason: string;
}
export interface VocabSuggestion {
  word: string;
  meaning: string;
  example: string;
}
export interface Scores {
  confidence: number;
  pronunciation: number;
  fluency: number;
  grammar: number;
  overall: number;
}
export interface TutorFeedback {
  has_errors: boolean;
  original: string;
  corrected: string;
  native: string;
  grammar_explanation: string;
  pronunciation_tips: string;
  highlights: ErrorHighlight[];
  vocabulary: VocabSuggestion[];
  scores: Scores;
}

export interface Correction {
  original_text: string;
  corrected_text: string;
  native_text: string;
  grammar_explanation: string | null;
  pronunciation_tips: string | null;
  highlights: ErrorHighlight[];
  vocabulary_suggestions: VocabSuggestion[];
  confidence_score: number;
  pronunciation_score: number;
  fluency_score: number;
  grammar_score: number;
  overall_score: number;
}

export type MessageRole = "user" | "assistant" | "system";
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  audio_url: string | null;
  transcript_confidence: number | null;
  created_at: string;
  correction: Correction | null;
}

export interface Conversation {
  id: string;
  title: string;
  mode: ConversationMode;
  message_count: number;
  duration_seconds: number;
  avg_overall_score: number | null;
  created_at: string;
  updated_at: string;
}
export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface ChatTurnResponse {
  conversation_id: string;
  user_message: Message;
  assistant_message: Message;
  feedback: TutorFeedback;
  reply_audio_url: string | null;
}

export interface Progress {
  total_sessions: number;
  total_minutes: number;
  total_words_spoken: number;
  total_corrections: number;
  current_streak_days: number;
  longest_streak_days: number;
  last_practice_date: string | null;
  avg_confidence: number;
  avg_pronunciation: number;
  avg_fluency: number;
  avg_grammar: number;
  avg_overall: number;
  xp: number;
  level: number;
}

export interface Achievement {
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: AchievementTier;
  xp_reward: number;
  threshold: number;
}
export interface UserAchievement {
  unlocked_at: string;
  achievement: Achievement;
}

export interface DailyStat {
  date: string;
  sessions: number;
  minutes: number;
  words_spoken: number;
  corrections: number;
  xp_earned: number;
  avg_overall: number;
}

export interface VoiceRecording {
  id: string;
  conversation_id: string | null;
  audio_url: string | null;
  transcript: string;
  duration_seconds: number;
  word_count: number;
  stt_confidence: number;
  overall_score: number | null;
  created_at: string;
}

export interface LiveCounters {
  total_users: number;
  online_users: number;
  active_today: number;
  new_this_week: number;
}

export interface AdminOverview {
  total_users: number;
  online_users: number;
  active_today: number;
  total_conversations: number;
  total_voice_messages: number;
  total_corrections: number;
  avg_session_seconds: number;
}
export interface TimeseriesPoint {
  label: string;
  value: number;
}
export interface AdminAnalytics {
  user_growth: TimeseriesPoint[];
  conversations_per_day: TimeseriesPoint[];
  corrections_per_day: TimeseriesPoint[];
  avg_score_per_day: TimeseriesPoint[];
}
export interface AdminUser extends User {
  total_sessions: number;
  xp: number;
  level: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
