import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface UserProfile {
    bio: string;
    principal: Principal;
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
export interface VibePost {
    songTitle: string;
    mood: Mood;
    author: Principal;
    youtubeId: string;
    message?: string;
    timestamp: bigint;
    artistName: string;
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
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createCircle(name: string, themeMood: Mood): Promise<void>;
    createProfile(displayName: string, avatarUrl: string, currentMood: Mood, bio: string): Promise<void>;
    createVibePost(mood: Mood, youtubeId: string, songTitle: string, artistName: string, message: string | null): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCircleMembers(name: string): Promise<Array<Principal>>;
    getCirclesByMood(mood: Mood): Promise<Array<[string, VibeCircleView]>>;
    getFriendFeed(): Promise<Array<VibePost>>;
    getFriends(): Promise<Array<Principal>>;
    getGlobalFeed(): Promise<Array<VibePost>>;
    getPendingFriendRequests(): Promise<Array<Principal>>;
    getPostsByMood(mood: Mood): Promise<Array<VibePost>>;
    getProfile(user: Principal): Promise<UserProfile>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    joinCircle(name: string): Promise<void>;
    leaveCircle(name: string): Promise<void>;
    rejectFriendRequest(from: Principal): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    sendFriendRequest(to: Principal): Promise<void>;
    unfriend(user: Principal): Promise<void>;
    updateProfile(displayName: string, avatarUrl: string, currentMood: Mood, bio: string): Promise<void>;
}
