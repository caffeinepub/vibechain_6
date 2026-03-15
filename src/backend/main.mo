import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Set "mo:core/Set";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
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

  type VibeCircleView = {
    name : Text;
    themeMood : Mood;
    members : [Principal];
    createdBy : Principal;
    createdAt : Int;
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

  type PlaylistView = {
    id : Text;
    name : Text;
    owner : Principal;
    tracks : [PlaylistTrack];
    createdAt : Int;
  };

  type ChatMessage = {
    id : Text;
    from : Principal;
    to : Principal;
    text : Text;
    timestamp : Int;
  };

  // 24 hours in nanoseconds
  let TWENTY_FOUR_HOURS_NS : Int = 24 * 60 * 60 * 1_000_000_000;

  let profiles : Map.Map<Principal, UserProfile> = Map.empty();
  let usernames : Map.Map<Text, Principal> = Map.empty();
  let posts : Map.Map<Principal, List.List<VibePost>> = Map.empty();
  var globalPosts : List.List<VibePost> = List.empty();
  let friendRequests : Map.Map<Principal, Set.Set<Principal>> = Map.empty();
  let friends : Map.Map<Principal, Set.Set<Principal>> = Map.empty();
  let circles : Map.Map<Text, VibeCircle> = Map.empty();
  let playlists : Map.Map<Text, Playlist> = Map.empty();
  let userPlaylistIds : Map.Map<Principal, List.List<Text>> = Map.empty();

  // New messages storage - conversation key to messages
  let messages : Map.Map<Text, List.List<ChatMessage>> = Map.empty();

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func getUserPostsInternal(user : Principal) : List.List<VibePost> {
    switch (posts.get(user)) {
      case (null) { List.empty<VibePost>() };
      case (?userPosts) { userPosts };
    };
  };

  func getPendingRequestsInternal(user : Principal) : Set.Set<Principal> {
    switch (friendRequests.get(user)) {
      case (null) { Set.empty<Principal>() };
      case (?requests) { requests };
    };
  };

  func getFriendsInternal(user : Principal) : Set.Set<Principal> {
    switch (friends.get(user)) {
      case (null) { Set.empty<Principal>() };
      case (?userFriends) { userFriends };
    };
  };

  func isFriendsWithInternal(user1 : Principal, user2 : Principal) : Bool {
    let user1Friends = getFriendsInternal(user1);
    user1Friends.contains(user2);
  };

  // ====== PROFILE FUNCTIONS ======
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    profiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile : UserProfile = {
      displayName = profile.displayName;
      username = profile.username;
      avatarUrl = profile.avatarUrl;
      currentMood = profile.currentMood;
      bio = profile.bio;
      joined = profile.joined;
      principal = caller;
    };
    profiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func isUsernameTaken(username : Text) : async Bool {
    usernames.containsKey(username);
  };

  public shared ({ caller }) func createProfile(displayName : Text, username : Text, avatarUrl : Text, currentMood : Mood, bio : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    if (profiles.containsKey(caller)) { Runtime.trap("User already exists") };
    if (usernames.containsKey(username)) { Runtime.trap("Username already taken") };

    let profile : UserProfile = {
      displayName;
      username;
      avatarUrl;
      currentMood;
      bio;
      joined = Time.now();
      principal = caller;
    };

    profiles.add(caller, profile);
    usernames.add(username, caller);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, username : Text, avatarUrl : Text, currentMood : Mood, bio : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };

    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?existing) {
        if (username != existing.username) {
          switch (usernames.get(username)) {
            case (null) {};
            case (?owner) {
              if (owner != caller) { Runtime.trap("Username already taken") };
            };
          };
          usernames.remove(existing.username);
          usernames.add(username, caller);
        };

        let updatedProfile : UserProfile = {
          displayName;
          username;
          avatarUrl;
          currentMood;
          bio;
          joined = existing.joined;
          principal = existing.principal;
        };
        profiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func getProfile(user : Principal) : async UserProfile {
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

  // ====== FRIENDS FUNCTIONS ======

  func sendFriendRequestInternal(caller : Principal, to : Principal) {
    if (caller == to) { Runtime.trap("Cannot send friend request to yourself") };
    if (isFriendsWithInternal(caller, to)) { Runtime.trap("Already friends") };

    let toRequests = getPendingRequestsInternal(to);
    if (toRequests.contains(caller)) { Runtime.trap("Friend request already sent") };

    let newRequests = Set.empty<Principal>();
    for (req in toRequests.values()) {
      newRequests.add(req);
    };
    newRequests.add(caller);
    friendRequests.add(to, newRequests);
  };

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };
    sendFriendRequestInternal(caller, to);
  };

  public shared ({ caller }) func sendFriendRequestByUsername(username : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };
    switch (usernames.get(username)) {
      case (null) { Runtime.trap("Username not found") };
      case (?to) { sendFriendRequestInternal(caller, to) };
    };
  };

  public shared ({ caller }) func acceptFriendRequest(from : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept friend requests");
    };
    let myRequests = getPendingRequestsInternal(caller);
    if (not myRequests.contains(from)) { Runtime.trap("No friend request from this user") };

    let myFriends = getFriendsInternal(caller);
    let newMyFriends = Set.empty<Principal>();
    for (friend in myFriends.values()) {
      newMyFriends.add(friend);
    };
    newMyFriends.add(from);
    friends.add(caller, newMyFriends);

    let theirFriends = getFriendsInternal(from);
    let newTheirFriends = Set.empty<Principal>();
    for (friend in theirFriends.values()) {
      newTheirFriends.add(friend);
    };
    newTheirFriends.add(caller);
    friends.add(from, newTheirFriends);

    let newRequests = Set.empty<Principal>();
    for (request in myRequests.values()) {
      if (request != from) { newRequests.add(request) };
    };
    friendRequests.add(caller, newRequests);
  };

  public shared ({ caller }) func rejectFriendRequest(from : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can reject friend requests");
    };
    let myRequests = getPendingRequestsInternal(caller);
    if (not myRequests.contains(from)) { Runtime.trap("No friend request from this user") };

    let newRequests = Set.empty<Principal>();
    for (request in myRequests.values()) {
      if (request != from) { newRequests.add(request) };
    };
    friendRequests.add(caller, newRequests);
  };

  public shared ({ caller }) func unfriend(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can unfriend");
    };
    if (not isFriendsWithInternal(caller, user)) { Runtime.trap("Not friends") };

    let updatedFriends = getFriendsInternal(caller);
    let newFriends = Set.empty<Principal>();
    for (friend in updatedFriends.values()) {
      if (friend != user) { newFriends.add(friend) };
    };
    friends.add(caller, newFriends);

    let userUpdatedFriends = getFriendsInternal(user);
    let userNewFriends = Set.empty<Principal>();
    for (friend in userUpdatedFriends.values()) {
      if (friend != caller) { userNewFriends.add(friend) };
    };
    friends.add(user, userNewFriends);
  };

  // ====== VIBE POSTS FUNCTIONS ======
  public shared ({ caller }) func createVibePost(mood : Mood, youtubeId : Text, songTitle : Text, artistName : Text, message : ?Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create vibe posts");
    };
    let post : VibePost = {
      mood;
      youtubeId;
      songTitle;
      artistName;
      message;
      timestamp = Time.now();
      author = caller;
    };

    let userPosts = getUserPostsInternal(caller);
    let newUserPosts = List.empty<VibePost>();
    newUserPosts.add(post);
    for (p in userPosts.values()) {
      newUserPosts.add(p);
    };
    posts.add(caller, newUserPosts);

    let newGlobalPosts = List.empty<VibePost>();
    newGlobalPosts.add(post);
    for (p in globalPosts.values()) {
      newGlobalPosts.add(p);
    };
    globalPosts := newGlobalPosts;
  };

  // Delete the caller's own vibe post identified by its timestamp
  public shared ({ caller }) func deleteVibePost(timestamp : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete vibe posts");
    };

    // Remove from personal posts
    let userPosts = getUserPostsInternal(caller);
    let filtered = userPosts.filter(func(p) { not (p.author == caller and p.timestamp == timestamp) });
    posts.add(caller, filtered);

    // Remove from global posts
    let filteredGlobal = globalPosts.filter(func(p) { not (p.author == caller and p.timestamp == timestamp) });
    globalPosts := filteredGlobal;
  };

  // ====== CIRCLES FUNCTIONS ======
  public shared ({ caller }) func createCircle(name : Text, themeMood : Mood) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create circles");
    };
    if (circles.containsKey(name)) { Runtime.trap("Circle name already exists") };

    let circle : VibeCircle = {
      name;
      themeMood;
      members = Set.empty<Principal>();
      createdBy = caller;
      createdAt = Time.now();
    };
    circles.add(name, circle);
  };

  public shared ({ caller }) func joinCircle(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join circles");
    };
    switch (circles.get(name)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        let updatedMembers = Set.empty<Principal>();
        for (member in circle.members.values()) {
          updatedMembers.add(member);
        };
        updatedMembers.add(caller);

        let updatedCircle : VibeCircle = {
          name = circle.name;
          themeMood = circle.themeMood;
          members = updatedMembers;
          createdBy = circle.createdBy;
          createdAt = circle.createdAt;
        };
        circles.add(name, updatedCircle);
      };
    };
  };

  public shared ({ caller }) func leaveCircle(name : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can leave circles");
    };
    switch (circles.get(name)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        let updatedMembers = Set.empty<Principal>();
        for (member in circle.members.values()) {
          if (member != caller) { updatedMembers.add(member) };
        };
        let updatedCircle : VibeCircle = {
          name = circle.name;
          themeMood = circle.themeMood;
          members = updatedMembers;
          createdBy = circle.createdBy;
          createdAt = circle.createdAt;
        };
        circles.add(name, updatedCircle);
      };
    };
  };

  public query ({ caller }) func getCircleMembers(name : Text) : async [Principal] {
    switch (circles.get(name)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        circle.members.toArray();
      };
    };
  };

  public query ({ caller }) func getPostsByMood(mood : Mood) : async [VibePost] {
    let now = Time.now();
    let filteredPosts = List.empty<VibePost>();
    for (post in globalPosts.values()) {
      if (post.mood == mood and (now - post.timestamp) <= TWENTY_FOUR_HOURS_NS) {
        filteredPosts.add(post);
      };
    };
    filteredPosts.toArray();
  };

  public query ({ caller }) func getPendingFriendRequests() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view friend requests");
    };
    let requests = getPendingRequestsInternal(caller);
    requests.toArray();
  };

  public query ({ caller }) func getFriends() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view friends");
    };
    let userFriends = getFriendsInternal(caller);
    userFriends.toArray();
  };

  public query ({ caller }) func getGlobalFeed() : async [VibePost] {
    let now = Time.now();
    let recent = List.empty<VibePost>();
    for (post in globalPosts.values()) {
      if ((now - post.timestamp) <= TWENTY_FOUR_HOURS_NS) {
        recent.add(post);
      };
    };
    recent.toArray();
  };

  public query ({ caller }) func getFriendFeed() : async [VibePost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view friend feed");
    };
    let now = Time.now();
    let userFriends = getFriendsInternal(caller);
    let friendPosts = List.empty<VibePost>();
    for (post in globalPosts.values()) {
      if (userFriends.contains(post.author) and (now - post.timestamp) <= TWENTY_FOUR_HOURS_NS) {
        friendPosts.add(post);
      };
    };
    friendPosts.toArray();
  };

  public query ({ caller }) func getCirclesByMood(mood : Mood) : async [(Text, VibeCircleView)] {
    let result = List.empty<(Text, VibeCircleView)>();
    for ((name, circle) in circles.entries()) {
      if (circle.themeMood == mood) {
        result.add((name, {
          name = circle.name;
          themeMood = circle.themeMood;
          members = circle.members.toArray();
          createdBy = circle.createdBy;
          createdAt = circle.createdAt;
        }));
      };
    };
    result.toArray();
  };

  // ====== PLAYLIST FUNCTIONS ======
  public shared ({ caller }) func createPlaylist(name : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create playlists");
    };

    let playlistId = caller.toText() # "_" # name;

    switch (playlists.get(playlistId)) {
      case (?_existing) { Runtime.trap("Playlist already exists") };
      case (null) {
        let playlist : Playlist = {
          id = playlistId;
          name;
          owner = caller;
          tracks = List.empty<PlaylistTrack>();
          createdAt = Time.now();
        };
        playlists.add(playlistId, playlist);

        let currentIds = switch (userPlaylistIds.get(caller)) {
          case (null) { List.empty<Text>() };
          case (?ids) { ids };
        };
        let newIds = List.empty<Text>();
        newIds.add(playlistId);
        for (id in currentIds.values()) {
          newIds.add(id);
        };
        userPlaylistIds.add(caller, newIds);

        playlistId;
      };
    };
  };

  public shared ({ caller }) func addToPlaylist(playlistId : Text, track : PlaylistTrack) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to playlists");
    };

    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Only the owner can add tracks");
        };

        let updatedTracks = List.empty<PlaylistTrack>();
        for (existingTrack in playlist.tracks.values()) {
          updatedTracks.add(existingTrack);
        };
        updatedTracks.add(track);

        let updatedPlaylist : Playlist = {
          id = playlist.id;
          name = playlist.name;
          owner = playlist.owner;
          tracks = updatedTracks;
          createdAt = playlist.createdAt;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func addToFriendPlaylist(playlistId : Text, track : PlaylistTrack) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add to playlists");
    };

    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (playlist.owner == caller) {} else if (not isFriendsWithInternal(caller, playlist.owner)) {
          Runtime.trap("Unauthorized: Must be friends to add to this playlist");
        };

        let updatedTracks = List.empty<PlaylistTrack>();
        for (existingTrack in playlist.tracks.values()) {
          updatedTracks.add(existingTrack);
        };
        updatedTracks.add(track);

        let updatedPlaylist : Playlist = {
          id = playlist.id;
          name = playlist.name;
          owner = playlist.owner;
          tracks = updatedTracks;
          createdAt = playlist.createdAt;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func removeFromPlaylist(playlistId : Text, index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from playlists");
    };

    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Only the owner can remove tracks");
        };

        let tracksArray = playlist.tracks.toArray();
        if (index >= tracksArray.size()) {
          Runtime.trap("Invalid index");
        };

        let newTracksArray = Array.tabulate(
          tracksArray.size() - 1,
          func(i) {
            if (i < index) { tracksArray[i] } else { tracksArray[i + 1] };
          },
        );

        let newTracks = List.empty<PlaylistTrack>();
        for (track in newTracksArray.values()) {
          newTracks.add(track);
        };

        let updatedPlaylist : Playlist = {
          id = playlist.id;
          name = playlist.name;
          owner = playlist.owner;
          tracks = newTracks;
          createdAt = playlist.createdAt;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func removeFromFriendPlaylist(playlistId : Text, index : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove from friend playlists");
    };

    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (playlist.owner != caller and not isFriendsWithInternal(caller, playlist.owner)) {
          Runtime.trap("Unauthorized: Must be the owner or a friend to remove from this playlist");
        };

        let tracksArray = playlist.tracks.toArray();
        if (index >= tracksArray.size()) {
          Runtime.trap("Invalid index");
        };

        let newTracksArray = Array.tabulate(
          tracksArray.size() - 1,
          func(i) {
            if (i < index) { tracksArray[i] } else { tracksArray[i + 1] };
          },
        );

        let newTracks = List.empty<PlaylistTrack>();
        for (track in newTracksArray.values()) {
          newTracks.add(track);
        };

        let updatedPlaylist : Playlist = {
          id = playlist.id;
          name = playlist.name;
          owner = playlist.owner;
          tracks = newTracks;
          createdAt = playlist.createdAt;
        };
        playlists.add(playlistId, updatedPlaylist);
      };
    };
  };

  public shared ({ caller }) func deletePlaylist(playlistId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete playlists");
    };

    switch (playlists.get(playlistId)) {
      case (null) { Runtime.trap("Playlist not found") };
      case (?playlist) {
        if (playlist.owner != caller) {
          Runtime.trap("Unauthorized: Only the owner can delete this playlist");
        };

        playlists.remove(playlistId);

        switch (userPlaylistIds.get(caller)) {
          case (null) {};
          case (?playlistIds) {
            let filteredIds = List.empty<Text>();
            for (id in playlistIds.values()) {
              if (id != playlistId) {
                filteredIds.add(id);
              };
            };
            userPlaylistIds.add(caller, filteredIds);
          };
        };
      };
    };
  };

  public shared ({ caller }) func getMyPlaylists() : async [PlaylistView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in to access playlists");
    };

    let playlistIds = switch (userPlaylistIds.get(caller)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };

    let myPlaylists = List.empty<PlaylistView>();
    for (playlistId in playlistIds.values()) {
      switch (playlists.get(playlistId)) {
        case (?playlist) {
          myPlaylists.add({
            id = playlist.id;
            name = playlist.name;
            owner = playlist.owner;
            tracks = playlist.tracks.toArray();
            createdAt = playlist.createdAt;
          });
        };
        case (null) {};
      };
    };
    myPlaylists.toArray();
  };

  public shared ({ caller }) func getFriendPlaylists(friend : Principal) : async [PlaylistView] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in to access playlists");
    };
    if (not (isFriendsWithInternal(caller, friend))) {
      Runtime.trap("Not friends");
    };

    let playlistIds = switch (userPlaylistIds.get(friend)) {
      case (null) { List.empty<Text>() };
      case (?ids) { ids };
    };

    let friendPlaylists = List.empty<PlaylistView>();
    for (playlistId in playlistIds.values()) {
      switch (playlists.get(playlistId)) {
        case (?playlist) {
          friendPlaylists.add({
            id = playlist.id;
            name = playlist.name;
            owner = playlist.owner;
            tracks = playlist.tracks.toArray();
            createdAt = playlist.createdAt;
          });
        };
        case (null) {};
      };
    };
    friendPlaylists.toArray();
  };

  // ====== CHAT MESSAGE FUNCTIONS ======

  func getConversationKey(p1 : Principal, p2 : Principal) : Text {
    let p1Text = p1.toText();
    let p2Text = p2.toText();
    if (p1Text < p2Text) { p1Text # "|" # p2Text } else {
      p2Text # "|" # p1Text;
    };
  };

  public shared ({ caller }) func sendMessage(to : Principal, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    if (caller == to) { Runtime.trap("Cannot message yourself") };

    let userFriends = getFriendsInternal(caller);
    if (not userFriends.contains(to)) {
      Runtime.trap("Not friends with the recipient");
    };

    let timestamp = Time.now();
    let messageId = (timestamp).toText() # "_" # caller.toText();

    let message : ChatMessage = {
      id = messageId;
      from = caller;
      to;
      text;
      timestamp;
    };

    let convKey = getConversationKey(caller, to);

    let currentMessages = switch (messages.get(convKey)) {
      case (null) { List.empty<ChatMessage>() };
      case (?existing) { existing };
    };
    let newMessages = List.empty<ChatMessage>();
    newMessages.add(message);
    for (msg in currentMessages.values()) {
      newMessages.add(msg);
    };
    messages.add(convKey, newMessages);
  };

  public shared ({ caller }) func getConversation(friend : Principal) : async [ChatMessage] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view conversations");
    };

    if (caller == friend) { Runtime.trap("Cannot get conversation with yourself") };

    if (not isFriendsWithInternal(caller, friend)) {
      Runtime.trap("Not friends with conversation partner");
    };

    let convKey = getConversationKey(caller, friend);

    switch (messages.get(convKey)) {
      case (null) { [] };
      case (?chatList) {
        let reversed = List.empty<ChatMessage>();
        for (msg in chatList.values()) {
          reversed.add(msg);
        };
        reversed.toArray();
      };
    };
  };

  public shared ({ caller }) func deleteMessage(messageId : Text, friend : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    if (not isFriendsWithInternal(caller, friend)) {
      Runtime.trap("Not friends with conversation partner");
    };

    let convKey = getConversationKey(caller, friend);

    switch (messages.get(convKey)) {
      case (null) {
        Runtime.trap("Conversation not found");
      };
      case (?chatList) {
        let maybeMessage = chatList.find(func(msg) { msg.id == messageId });

        switch (maybeMessage) {
          case (null) {
            Runtime.trap("Message not found");
          };
          case (?message) {
            if (message.from != caller and message.to != caller) {
              Runtime.trap("Unauthorized: You must be a sender or recipient of the message");
            };

            let filteredMessages = chatList.filter(func(msg) { msg.id != messageId });
            messages.add(convKey, filteredMessages);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteConversation(friend : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete conversations");
    };

    if (not isFriendsWithInternal(caller, friend)) {
      Runtime.trap("Not friends with conversation partner");
    };

    let convKey = getConversationKey(caller, friend);

    switch (messages.get(convKey)) {
      case (null) {
        Runtime.trap("Conversation not found");
      };
      case (?_) {
        messages.remove(convKey);
      };
    };
  };
};
