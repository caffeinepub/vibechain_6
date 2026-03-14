import Map "mo:core/Map";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Set "mo:core/Set";

module {
  type Mood = {
    #happy;
    #sad;
    #energetic;
    #calm;
    #melancholic;
    #romantic;
    #angry;
    #chill;
  };

  type UserProfile = {
    displayName : Text;
    username : Text;
    avatarUrl : Text;
    currentMood : Mood;
    bio : Text;
    joined : Int;
    principal : Principal;
  };

  type VibePost = {
    mood : Mood;
    youtubeId : Text;
    songTitle : Text;
    artistName : Text;
    message : ?Text;
    timestamp : Int;
    author : Principal;
  };

  type VibeCircle = {
    name : Text;
    themeMood : Mood;
    members : Set.Set<Principal>;
    createdBy : Principal;
    createdAt : Int;
  };

  type FriendRequest = {
    from : Principal;
    to : Principal;
    timestamp : Int;
  };

  type PlaylistTrack = {
    youtubeId : Text;
    songTitle : Text;
    artistName : Text;
  };

  type Playlist = {
    id : Text;
    name : Text;
    owner : Principal;
    tracks : List.List<PlaylistTrack>;
    createdAt : Int;
  };

  type OldActor = {
    profiles : Map.Map<Principal, UserProfile>;
    usernames : Map.Map<Text, Principal>;
    posts : Map.Map<Principal, List.List<VibePost>>;
    globalPosts : List.List<VibePost>;
    friendRequests : Map.Map<Principal, Set.Set<Principal>>;
    friends : Map.Map<Principal, Set.Set<Principal>>;
    circles : Map.Map<Text, VibeCircle>;
  };

  type NewActor = {
    profiles : Map.Map<Principal, UserProfile>;
    usernames : Map.Map<Text, Principal>;
    posts : Map.Map<Principal, List.List<VibePost>>;
    globalPosts : List.List<VibePost>;
    friendRequests : Map.Map<Principal, Set.Set<Principal>>;
    friends : Map.Map<Principal, Set.Set<Principal>>;
    circles : Map.Map<Text, VibeCircle>;
    playlists : Map.Map<Text, Playlist>;
    userPlaylistIds : Map.Map<Principal, List.List<Text>>;
  };

  public func run(old : OldActor) : NewActor {
    { old with playlists = Map.empty<Text, Playlist>(); userPlaylistIds = Map.empty<Principal, List.List<Text>>() };
  };
};
