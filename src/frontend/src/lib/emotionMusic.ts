/**
 * Emotion-to-music mapping utility for VIBECHAIN
 * Maps face-api.js expressions to VIBECHAIN moods and search queries
 */

export interface EmotionMusicEntry {
  mood: string;
  searchQuery: string;
  emoji: string;
  label: string;
}

export const EMOTION_MUSIC_MAP: Record<string, EmotionMusicEntry> = {
  happy: {
    mood: "happy",
    searchQuery: "happy upbeat songs 2024",
    emoji: "😊",
    label: "Joyful",
  },
  sad: {
    mood: "sad",
    searchQuery: "sad emotional songs",
    emoji: "😢",
    label: "Melancholy",
  },
  angry: {
    mood: "angry",
    searchQuery: "angry rock music energy",
    emoji: "😠",
    label: "Fierce",
  },
  fearful: {
    mood: "melancholic",
    searchQuery: "melancholic indie songs",
    emoji: "😨",
    label: "Anxious",
  },
  disgusted: {
    mood: "angry",
    searchQuery: "angry rock music energy",
    emoji: "🤢",
    label: "Unsettled",
  },
  surprised: {
    mood: "energetic",
    searchQuery: "energetic upbeat music",
    emoji: "😲",
    label: "Electrified",
  },
  neutral: {
    mood: "chill",
    searchQuery: "chill lo-fi music",
    emoji: "😐",
    label: "Balanced",
  },
};

/**
 * Maps a face-api.js expression string to a VIBECHAIN mood string.
 * Falls back to 'chill' if expression not found.
 */
export function emotionToMood(expression: string): string {
  return EMOTION_MUSIC_MAP[expression]?.mood ?? "chill";
}

/**
 * Gets the search query for a given expression.
 */
export function emotionToSearchQuery(expression: string): string {
  return EMOTION_MUSIC_MAP[expression]?.searchQuery ?? "chill lo-fi music";
}

/**
 * Returns all valid face-api.js expression keys.
 */
export const FACEAPI_EXPRESSIONS = [
  "happy",
  "sad",
  "angry",
  "fearful",
  "disgusted",
  "surprised",
  "neutral",
] as const;

export type FaceApiExpression = (typeof FACEAPI_EXPRESSIONS)[number];
