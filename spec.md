# VIBECHAIN

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- User authentication via Google OAuth and Apple ID (frontend OAuth flow + backend session)
- Mood selector UI (Happy, Sad, Energetic, Calm, Melancholic, Romantic, Angry, Chill) that drives music discovery
- YouTube Data API v3 integration (search songs by mood keywords)
- Music player: plays YouTube audio/video via YouTube IFrame Player API
  - Mini player bar with play/pause, next, previous buttons
  - Linear progress buffer bar with click-to-seek / skip functionality
  - Song title, artist, thumbnail display
- Song search bar to find tracks by name/artist
- Vibe Feed: users post their current mood + song + optional message; friends see it in real-time feed
- Vibe Circles: group rooms based on shared moods (join/leave)
- Friend system: add friends, share vibe/song to their feed
- User profiles: display name, current mood, vibe history
- Backend stores: users, vibes (mood + song posts), friendships, vibe circle memberships

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Motoko backend: user profiles, vibe posts CRUD, friend requests, vibe circles, session management
2. Select: authorization, http-outcalls components
3. Frontend:
   - Auth screens (Google/Apple OAuth)
   - Mood selector dashboard
   - YouTube search integration (frontend calls YouTube Data API v3)
   - YouTube IFrame player with mini player bar
   - Progress/buffer bar with seek/skip
   - Vibe Feed page
   - Friends page
   - Vibe Circles page
   - Persistent mini player across pages
