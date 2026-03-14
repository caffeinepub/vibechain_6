import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface VibePost {
    songTitle: string;
    mood: Mood;
    author: Principal;
    youtubeId: string;
    message?: string;
    timestamp: bigint;
    artistName: string;
}
export interface PlaylistView {
    id: string;
    owner: Principal;
    tracks: Array<PlaylistTrack>;
    name: string;
    createdAt: bigint;
}
export interface PlaylistTrack {
    songTitle: string;
    youtubeId: string;
    artistName: string;
}
export interface ChatMessage {
    id: string;
    to: Principal;
    from: Principal;
    text: string;
    timestamp: bigint;
}
export interface UserProfile {
    bio: string;
    principal: Principal;
    username: string;
    displayName: string;
    currentMood: Mood;
    joined: bigint;
    avatarUrl: string;
}
export interface VibeCircleView {
    members: Array<Principal>;
    themeMood: Mood;
    name: string;
    createdAt: bigint;
    createdBy: Principal;
}
export enum Mood {
    sad = "sad",
    melancholic = "melancholic",
    happy = "happy",
    angry = "angry",
    romantic = "romantic",
    calm = "calm",
    chill = "chill",
    energetic = "energetic"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptFriendRequest(from: Principal): Promise<void>;
    addToFriendPlaylist(playlistId: string, track: PlaylistTrack): Promise<void>;
    addToPlaylist(playlistId: string, track: PlaylistTrack): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCircle(name: string, themeMood: Mood): Promise<void>;
    createPlaylist(name: string): Promise<string>;
    createProfile(displayName: string, username: string, avatarUrl: string, currentMood: Mood, bio: string): Promise<void>;
    createVibePost(mood: Mood, youtubeId: string, songTitle: string, artistName: string, message: string | null): Promise<void>;
    deletePlaylist(playlistId: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCircleMembers(name: string): Promise<Array<Principal>>;
    getCirclesByMood(mood: Mood): Promise<Array<[string, VibeCircleView]>>;
    getConversation(friend: Principal): Promise<Array<ChatMessage>>;
    getFriendFeed(): Promise<Array<VibePost>>;
    getFriendPlaylists(friend: Principal): Promise<Array<PlaylistView>>;
    getFriends(): Promise<Array<Principal>>;
    getGlobalFeed(): Promise<Array<VibePost>>;
    getMyPlaylists(): Promise<Array<PlaylistView>>;
    getPendingFriendRequests(): Promise<Array<Principal>>;
    getPostsByMood(mood: Mood): Promise<Array<VibePost>>;
    getProfile(user: Principal): Promise<UserProfile>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isUsernameTaken(username: string): Promise<boolean>;
    joinCircle(name: string): Promise<void>;
    leaveCircle(name: string): Promise<void>;
    rejectFriendRequest(from: Principal): Promise<void>;
    removeFromPlaylist(playlistId: string, index: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendFriendRequest(to: Principal): Promise<void>;
    sendFriendRequestByUsername(username: string): Promise<void>;
    sendMessage(to: Principal, text: string): Promise<void>;
    unfriend(user: Principal): Promise<void>;
    updateProfile(displayName: string, username: string, avatarUrl: string, currentMood: Mood, bio: string): Promise<void>;
}
