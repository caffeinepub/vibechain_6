import Map "mo:core/Map";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Set "mo:core/Set";
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

  let profiles = Map.empty<Principal, UserProfile>();
  let posts = Map.empty<Principal, List.List<VibePost>>();
  var globalPosts = List.empty<VibePost>();
  let friendRequests = Map.empty<Principal, Set.Set<Principal>>();
  let friends = Map.empty<Principal, Set.Set<Principal>>();
  let circles = Map.empty<Text, VibeCircle>();

  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  func getUserPostsInternal(user : Principal) : List.List<VibePost> {
    switch (posts.get(user)) {
      case (null) { List.empty<VibePost>() };
      case (?userPosts) { userPosts };
    };
  };

  // Required frontend functions
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
      avatarUrl = profile.avatarUrl;
      currentMood = profile.currentMood;
      bio = profile.bio;
      joined = profile.joined;
      principal = caller;
    };
    profiles.add(caller, updatedProfile);
  };

  public shared ({ caller }) func createProfile(displayName : Text, avatarUrl : Text, currentMood : Mood, bio : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create profiles");
    };
    if (profiles.containsKey(caller)) { Runtime.trap("User already exists") };
    let profile : UserProfile = {
      displayName;
      avatarUrl;
      currentMood;
      bio;
      joined = Time.now();
      principal = caller;
    };
    profiles.add(caller, profile);
  };

  public shared ({ caller }) func updateProfile(displayName : Text, avatarUrl : Text, currentMood : Mood, bio : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profiles");
    };
    switch (profiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?existing) {
        let updatedProfile : UserProfile = {
          displayName;
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
    // Public access - anyone including guests can view profiles
    switch (profiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
  };

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

  public shared ({ caller }) func sendFriendRequest(to : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send friend requests");
    };
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

  public shared ({ caller }) func acceptFriendRequest(from : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can accept friend requests");
    };
    let myRequests = getPendingRequestsInternal(caller);
    if (not myRequests.contains(from)) {
      Runtime.trap("No friend request from this user");
    };

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
    if (not myRequests.contains(from)) {
      Runtime.trap("No friend request from this user");
    };

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
    // Public access - anyone including guests can view circle members
    switch (circles.get(name)) {
      case (null) { Runtime.trap("Circle not found") };
      case (?circle) {
        circle.members.toArray();
      };
    };
  };

  public query ({ caller }) func getPostsByMood(mood : Mood) : async [VibePost] {
    // Public access - anyone including guests can view posts by mood
    let filteredPosts = List.empty<VibePost>();
    for (post in globalPosts.values()) {
      if (post.mood == mood) { filteredPosts.add(post) };
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
    // Public access - anyone including guests can view global feed
    globalPosts.toArray();
  };

  public query ({ caller }) func getFriendFeed() : async [VibePost] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view friend feed");
    };
    let userFriends = getFriendsInternal(caller);
    let friendPosts = List.empty<VibePost>();
    for (post in globalPosts.values()) {
      if (userFriends.contains(post.author)) {
        friendPosts.add(post);
      };
    };
    friendPosts.toArray();
  };

  public query ({ caller }) func getCirclesByMood(mood : Mood) : async [(Text, VibeCircleView)] {
    // Public access - anyone including guests can view circles by mood
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
};
