# VIBECHAIN

## Current State
Playlists exist: users can create, manage, and play their own playlists. Friends can view and play each other's playlists via the Friends page. The `AddToPlaylistModal` (triggered by the "+" on any song card) only lists the caller's own playlists. The backend `addToPlaylist` rejects any caller who is not the playlist owner.

## Requested Changes (Diff)

### Add
- Backend function `addToFriendPlaylist(playlistId, track)` that allows a friend (caller) to add a track to a playlist owned by another user, gated on friendship check.
- `AddToPlaylistModal`: second section "Friends' Playlists" that loads playlists for all friends and lets the user add the song to any of them.

### Modify
- `AddToPlaylistModal`: load friend list and their playlists; display in a collapsible "Friends' Playlists" section below the existing "My Playlists" section.
- FriendsPage playlist modal: retain existing Play/Expand behavior; optionally surface per-track play button (no change required).

### Remove
- Nothing removed.

## Implementation Plan
1. Add `addToFriendPlaylist(playlistId: Text, track: PlaylistTrack)` to `main.mo` — checks caller is a user, looks up playlist owner, verifies friendship, then appends track.
2. Regenerate `backend.d.ts` (via generate step).
3. Update `AddToPlaylistModal.tsx` to fetch friend list + their playlists and display a "Friends' Playlists" section with add buttons.
