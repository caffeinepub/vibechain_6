const YT_API_KEY = "AIzaSyAl4GDKvlrNjYjZXeZ-YnNKOz4U0JqoVvo";

export interface YTSearchResult {
  youtubeId: string;
  title: string;
  artist: string;
  thumbnail: string;
}

export async function searchYouTube(
  query: string,
  maxResults = 20,
): Promise<YTSearchResult[]> {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${YT_API_KEY}&maxResults=${maxResults}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("YouTube search failed");
  const data = await res.json();
  return (data.items || []).map(
    (item: {
      id: { videoId: string };
      snippet: {
        title: string;
        channelTitle: string;
        thumbnails: { medium: { url: string } };
      };
    }) => ({
      youtubeId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
    }),
  );
}

export const MOOD_QUERIES: Record<string, string> = {
  happy: "happy upbeat songs 2024",
  sad: "sad emotional songs",
  energetic: "energetic workout music",
  calm: "calm relaxing music",
  melancholic: "melancholic indie songs",
  romantic: "romantic love songs",
  angry: "angry rock music",
  chill: "chill lo-fi music",
};

export const MOOD_CONFIG: Record<
  string,
  { emoji: string; label: string; color: string; gradient: string }
> = {
  happy: {
    emoji: "😊",
    label: "Happy",
    color: "oklch(0.85 0.2 85)",
    gradient: "from-yellow-400/20 to-orange-400/10",
  },
  sad: {
    emoji: "😢",
    label: "Sad",
    color: "oklch(0.55 0.18 240)",
    gradient: "from-blue-500/20 to-indigo-500/10",
  },
  energetic: {
    emoji: "⚡",
    label: "Energetic",
    color: "oklch(0.75 0.25 35)",
    gradient: "from-orange-500/20 to-red-400/10",
  },
  calm: {
    emoji: "🌊",
    label: "Calm",
    color: "oklch(0.65 0.15 200)",
    gradient: "from-teal-400/20 to-cyan-400/10",
  },
  melancholic: {
    emoji: "🌧️",
    label: "Melancholic",
    color: "oklch(0.5 0.15 260)",
    gradient: "from-violet-500/20 to-purple-500/10",
  },
  romantic: {
    emoji: "💜",
    label: "Romantic",
    color: "oklch(0.65 0.22 350)",
    gradient: "from-pink-500/20 to-rose-400/10",
  },
  angry: {
    emoji: "🔥",
    label: "Angry",
    color: "oklch(0.6 0.25 20)",
    gradient: "from-red-500/20 to-orange-500/10",
  },
  chill: {
    emoji: "🌙",
    label: "Chill",
    color: "oklch(0.6 0.18 180)",
    gradient: "from-emerald-500/20 to-teal-500/10",
  },
};

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
