# VIBECHAIN

## Current State
VIBECHAIN has user profiles, vibe feed, vibe circles, friend management (add by @username, accept/reject). There is no playlist feature -- users cannot save songs to a playlist, and there is no way to view or play a friend's playlist.

## Requested Changes (Diff)

### Add
- `Playlist` type: a named list of tracks (youtubeId, songTitle, artistName) owned by a user
- Backend: `createPlaylist`, `addToPlaylist`, `removeFromPlaylist`, `getMyPlaylists`, `getFriendPlaylists` (only callable if the two users are friends), `deletePlaylist`
- Frontend: Playlist page (tab in nav) -- user can see their own playlists, create new playlists, add songs to them
- On any song card / search result, an "Add to Playlist" button that opens a modal to pick which playlist (or create one)
- Friends page: each friend row shows a "View Playlist" button that opens that friend's playlists and allows playing them
- Playing a playlist loads all its tracks into the mini player queue

### Modify
- `FriendsPage`: add "View Playlist" button per friend row
- `App.tsx` / nav: add Playlist tab
- `SongCard`: add "Add to Playlist" action

### Remove
- Nothing removed

## Implementation Plan
1. Add `PlaylistTrack`, `Playlist` types to Motoko backend
2. Add backend functions: createPlaylist, addToPlaylist, removeFromPlaylist, deletePlaylist, getMyPlaylists, getFriendPlaylists
3. Regenerate backend.d.ts
4. Create `PlaylistPage.tsx` -- lists user's playlists, allows creating new ones, shows tracks, play-all button
5. Create `FriendPlaylistModal.tsx` -- shows a friend's playlists and play buttons
6. Update `FriendsPage.tsx` -- add "Playlist" button per friend that opens the modal
7. Update `SongCard.tsx` or `DashboardPage.tsx` -- add "Add to Playlist" flow
8. Update `App.tsx` nav to include Playlist tab
