package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.facebook_clone.model.Friend;
import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.FriendRepository;
import com.example.facebook_clone.repository.UserRepository;
import com.example.facebook_clone.service.NotificationService;

@RestController
@RequestMapping("/api/friends")
@CrossOrigin(origins = "http://localhost:3000")
public class FriendController {

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String friendId = request.get("friendId");

            System.out.println("Sending friend request from user " + userId + " to friend " + friendId);

            if (userId == null || friendId == null) {
                System.out.println("Bad request: userId or friendId is null");
                return ResponseEntity.badRequest().body(Map.of("message", "userId and friendId are required"));
            }

            // Kiểm tra xem lời mời kết bạn đã tồn tại chưa
            Friend existingRequest = friendRepository.findByUserIdAndFriendId(userId, friendId);
            if (existingRequest != null) {
                System.out.println("Friend request already exists with status: " + existingRequest.getStatus());
                return ResponseEntity.badRequest().body(Map.of("message", "Friend request already exists"));
            }

            // Kiểm tra xem đã là bạn bè chưa
            List<Friend> acceptedFriends = friendRepository.findByUserIdAndFriendIdAndStatus(userId, friendId, "ACCEPTED");
            if (acceptedFriends != null && !acceptedFriends.isEmpty()) {
                System.out.println("Users are already friends");
                return ResponseEntity.badRequest().body(Map.of("message", "Users are already friends"));
            }

            // Tạo lời mời kết bạn mới
            Friend friendRequest = new Friend();
            friendRequest.setUserId(userId);
            friendRequest.setFriendId(friendId);
            friendRequest.setStatus("PENDING");

            Friend savedRequest = friendRepository.save(friendRequest);
            System.out.println("Created friend request with ID: " + savedRequest.getId());

            // Kiểm tra xem có bao nhiêu lời mời kết bạn trong database
            List<Friend> allFriends = friendRepository.findAll();
            System.out.println("Total friends in database: " + allFriends.size());
            for (Friend f : allFriends) {
                System.out.println("Friend: id=" + f.getId() + ", userId=" + f.getUserId() + ", friendId=" + f.getFriendId() + ", status=" + f.getStatus());
            }

            // Send WebSocket notification to the friend
            Map<String, Object> requestInfo = new HashMap<>();
            User requestUser = userRepository.findById(userId).orElse(null);
            requestInfo.put("requestId", savedRequest.getId());
            requestInfo.put("user", requestUser);
            requestInfo.put("type", "NEW_REQUEST");

            // Send to the friend's topic
            messagingTemplate.convertAndSend("/topic/friends/" + friendId, requestInfo);
            System.out.println("Sent NEW_REQUEST notification to user: " + friendId);

            // Create notification for friend request
            notificationService.createFriendRequestNotification(friendId, userId, savedRequest.getId());

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            System.err.println("Error sending friend request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String requestId = request.get("requestId");
            String response = request.get("response"); // "ACCEPTED" or "REJECTED"

            System.out.println("Responding to friend request: " + requestId + " with response: " + response);

            if (requestId == null || response == null) {
                System.out.println("Bad request: requestId or response is null");
                return ResponseEntity.badRequest().body(Map.of("message", "requestId and response are required"));
            }

            if (!"ACCEPTED".equals(response) && !"REJECTED".equals(response)) {
                System.out.println("Bad request: response must be ACCEPTED or REJECTED, got: " + response);
                return ResponseEntity.badRequest().body(Map.of("message", "response must be ACCEPTED or REJECTED"));
            }

            // Tìm kiếm lời mời kết bạn
            System.out.println("Finding friend request with ID: " + requestId);
            Friend friendRequest = friendRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Friend request not found"));

            System.out.println("Found friend request: userId=" + friendRequest.getUserId() + ", friendId=" + friendRequest.getFriendId() + ", status=" + friendRequest.getStatus());

            // Cập nhật trạng thái lời mời kết bạn
            friendRequest.setStatus(response);
            Friend savedRequest = friendRepository.save(friendRequest);
            System.out.println("Updated friend request status to: " + response);

            // Nếu chấp nhận lời mời kết bạn, tạo thêm một bản ghi Friend mới
            // để thể hiện mối quan hệ hai chiều
            if ("ACCEPTED".equals(response)) {
                try {
                    System.out.println("Creating reverse friend relationship");
                    Friend reverseRequest = new Friend();
                    reverseRequest.setUserId(friendRequest.getFriendId());  // Đảo ngược userId và friendId
                    reverseRequest.setFriendId(friendRequest.getUserId());
                    reverseRequest.setStatus("ACCEPTED");
                    Friend savedReverseRequest = friendRepository.save(reverseRequest);
                    System.out.println("Created reverse friend relationship with ID: " + savedReverseRequest.getId());

                    // Kiểm tra xem có bao nhiêu bạn bè trong database
                    List<Friend> allFriends = friendRepository.findAll();
                    System.out.println("Total friends in database: " + allFriends.size());
                    for (Friend f : allFriends) {
                        System.out.println("Friend: id=" + f.getId() + ", userId=" + f.getUserId() + ", friendId=" + f.getFriendId() + ", status=" + f.getStatus());
                    }

                    // Get user information for both users
                    User requestUser = userRepository.findById(friendRequest.getUserId()).orElse(null);
                    User friendUser = userRepository.findById(friendRequest.getFriendId()).orElse(null);

                    System.out.println("Request user: " + (requestUser != null ? requestUser.getId() : "null"));
                    System.out.println("Friend user: " + (friendUser != null ? friendUser.getId() : "null"));

                    // Send WebSocket notification to both users
                    if (requestUser != null && friendUser != null) {
                        // Notification for the user who sent the request
                        Map<String, Object> notificationForRequester = new HashMap<>();
                        notificationForRequester.put("type", "REQUEST_ACCEPTED");
                        notificationForRequester.put("friend", friendUser);
                        messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getUserId(), notificationForRequester);
                        System.out.println("Sent REQUEST_ACCEPTED notification to user: " + friendRequest.getUserId());

                        // Create notification for friend accept
                        notificationService.createFriendAcceptNotification(friendRequest.getUserId(), friendRequest.getFriendId(), friendRequest.getId());

                        // Notification for the user who accepted the request
                        Map<String, Object> notificationForAccepter = new HashMap<>();
                        notificationForAccepter.put("type", "FRIEND_ADDED");
                        notificationForAccepter.put("friend", requestUser);
                        messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getFriendId(), notificationForAccepter);
                        System.out.println("Sent FRIEND_ADDED notification to user: " + friendRequest.getFriendId());
                    }
                } catch (Exception e) {
                    System.err.println("Error creating reverse friend relationship: " + e.getMessage());
                    e.printStackTrace();
                }
            } else if ("REJECTED".equals(response)) {
                // Notification for the user who sent the request that it was rejected
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "REQUEST_REJECTED");
                notification.put("requestId", requestId);
                messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getUserId(), notification);
                System.out.println("Sent REQUEST_REJECTED notification to user: " + friendRequest.getUserId());
            }

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            System.err.println("Error responding to friend request: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{userId}/{friendId}")
    public ResponseEntity<?> unfriend(@PathVariable String userId, @PathVariable String friendId) {
        try {
            // Xóa mối quan hệ theo cả hai chiều
            // Sử dụng findAll thay vì findOne để tránh lỗi khi có nhiều bản ghi trùng lặp
            List<Friend> friendships1 = friendRepository.findAllByUserIdAndFriendId(userId, friendId);
            List<Friend> friendships2 = friendRepository.findAllByUserIdAndFriendId(friendId, userId);

            // Xóa tất cả các bản ghi tìm thấy
            if (!friendships1.isEmpty()) {
                friendRepository.deleteAll(friendships1);
            }
            if (!friendships2.isEmpty()) {
                friendRepository.deleteAll(friendships2);
            }

            // Send WebSocket notification to both users
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "UNFRIENDED");
            notification.put("userId", userId);
            notification.put("friendId", friendId);

            messagingTemplate.convertAndSend("/topic/friends/" + userId, notification);
            messagingTemplate.convertAndSend("/topic/friends/" + friendId, notification);

            return ResponseEntity.ok(Map.of("message", "Unfriended successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/list/{userId}")
    public ResponseEntity<?> getFriendsList(@PathVariable String userId) {
        try {
            System.out.println("\n===== GETTING FRIENDS LIST FOR USER: " + userId + " =====");

            // Kiểm tra tất cả các mối quan hệ bạn bè trong database
            List<Friend> allFriends = friendRepository.findAll();
            System.out.println("Total friend relationships in database: " + allFriends.size());
            for (Friend f : allFriends) {
                System.out.println("Friend relationship: id=" + f.getId() + ", userId=" + f.getUserId() + ", friendId=" + f.getFriendId() + ", status=" + f.getStatus());
            }

            // Chỉ lấy các mối quan hệ có trạng thái ACCEPTED
            List<Friend> friends = friendRepository.findByUserIdAndStatus(userId, "ACCEPTED");

            // Log thông tin để debug
            System.out.println("Found " + friends.size() + " friends with ACCEPTED status for user " + userId);
            for (Friend f : friends) {
                System.out.println("Accepted friend: id=" + f.getId() + ", userId=" + f.getUserId() + ", friendId=" + f.getFriendId());
            }

            if (friends.isEmpty()) {
                System.out.println("No friends found with ACCEPTED status for user " + userId);
                // Trả về mảng rỗng nếu không có bạn bè
                return ResponseEntity.ok(new ArrayList<User>());
            }

            List<String> friendIds = friends.stream()
                    .map(Friend::getFriendId)
                    .collect(Collectors.toList());

            System.out.println("Friend IDs: " + friendIds);

            // Kiểm tra tất cả người dùng trong database
            List<User> allUsers = userRepository.findAll();
            System.out.println("Total users in database: " + allUsers.size());
            for (User u : allUsers) {
                System.out.println("User: id=" + u.getId() + ", name=" + u.getFirstName() + " " + u.getLastName());
            }

            List<User> friendUsers = userRepository.findAllById(friendIds);

            System.out.println("Found " + friendUsers.size() + " friend users");
            for (User u : friendUsers) {
                System.out.println("Friend user: id=" + u.getId() + ", name=" + u.getFirstName() + " " + u.getLastName());
            }

            // Đảm bảo trả về một mảng, ngay cả khi không tìm thấy user nào
            List<User> result = friendUsers != null ? friendUsers : new ArrayList<User>();
            System.out.println("Returning " + result.size() + " friends");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error getting friends list: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/requests/{userId}")
    public ResponseEntity<?> getPendingRequests(@PathVariable String userId) {
        try {
            List<Friend> pendingRequests = friendRepository.findByFriendIdAndStatus(userId, "PENDING");

            // Tạo map để lưu thông tin user và request id
            List<Map<String, Object>> result = new ArrayList<>();

            for (Friend request : pendingRequests) {
                User requestUser = userRepository.findById(request.getUserId()).orElse(null);
                if (requestUser != null) {
                    Map<String, Object> requestInfo = new HashMap<>();
                    requestInfo.put("requestId", request.getId());
                    requestInfo.put("user", requestUser);
                    result.add(requestInfo);
                }
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<?> getFriendSuggestions(@PathVariable String userId) {
        try {
            // Lấy danh sách bạn bè hiện tại
            List<Friend> friends = friendRepository.findByUserIdOrFriendIdAndStatus(userId, userId, "ACCEPTED");
            Set<String> friendIds = friends.stream()
                    .map(friend -> friend.getUserId().equals(userId) ? friend.getFriendId() : friend.getUserId())
                    .collect(Collectors.toSet());

            // Thêm userId vào set để loại trừ
            friendIds.add(userId);

            // Lấy tất cả user trừ những người đã là bạn
            List<User> allUsers = userRepository.findAll();
            List<User> suggestions = allUsers.stream()
                    .filter(user -> !friendIds.contains(user.getId()))
                    .limit(10)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }
}



