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

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String friendId = request.get("friendId");

            if (userId == null || friendId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "userId and friendId are required"));
            }

            Friend existingRequest = friendRepository.findByUserIdAndFriendId(userId, friendId);
            if (existingRequest != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Friend request already exists"));
            }

            Friend friendRequest = new Friend();
            friendRequest.setUserId(userId);
            friendRequest.setFriendId(friendId);
            friendRequest.setStatus("PENDING");

            Friend savedRequest = friendRepository.save(friendRequest);

            // Send WebSocket notification to the friend
            Map<String, Object> requestInfo = new HashMap<>();
            User requestUser = userRepository.findById(userId).orElse(null);
            requestInfo.put("requestId", savedRequest.getId());
            requestInfo.put("user", requestUser);
            requestInfo.put("type", "NEW_REQUEST");

            // Send to the friend's topic
            messagingTemplate.convertAndSend("/topic/friends/" + friendId, requestInfo);

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String requestId = request.get("requestId");
            String response = request.get("response"); // "ACCEPTED" or "REJECTED"

            if (requestId == null || response == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "requestId and response are required"));
            }

            if (!"ACCEPTED".equals(response) && !"REJECTED".equals(response)) {
                return ResponseEntity.badRequest().body(Map.of("message", "response must be ACCEPTED or REJECTED"));
            }

            Friend friendRequest = friendRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Friend request not found"));

            friendRequest.setStatus(response);
            Friend savedRequest = friendRepository.save(friendRequest);

            // Nếu chấp nhận lời mời kết bạn, tạo thêm một bản ghi Friend mới
            // để thể hiện mối quan hệ hai chiều
            if ("ACCEPTED".equals(response)) {
                Friend reverseRequest = new Friend();
                reverseRequest.setUserId(friendRequest.getFriendId());  // Đảo ngược userId và friendId
                reverseRequest.setFriendId(friendRequest.getUserId());
                reverseRequest.setStatus("ACCEPTED");
                friendRepository.save(reverseRequest);

                // Get user information for both users
                User requestUser = userRepository.findById(friendRequest.getUserId()).orElse(null);
                User friendUser = userRepository.findById(friendRequest.getFriendId()).orElse(null);

                // Send WebSocket notification to both users
                if (requestUser != null && friendUser != null) {
                    // Notification for the user who sent the request
                    Map<String, Object> notificationForRequester = new HashMap<>();
                    notificationForRequester.put("type", "REQUEST_ACCEPTED");
                    notificationForRequester.put("friend", friendUser);
                    messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getUserId(), notificationForRequester);

                    // Notification for the user who accepted the request
                    Map<String, Object> notificationForAccepter = new HashMap<>();
                    notificationForAccepter.put("type", "FRIEND_ADDED");
                    notificationForAccepter.put("friend", requestUser);
                    messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getFriendId(), notificationForAccepter);
                }
            } else if ("REJECTED".equals(response)) {
                // Notification for the user who sent the request that it was rejected
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "REQUEST_REJECTED");
                notification.put("requestId", requestId);
                messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getUserId(), notification);
            }

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
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
            // Chỉ lấy các mối quan hệ có trạng thái ACCEPTED
            List<Friend> friends = friendRepository.findByUserIdAndStatus(userId, "ACCEPTED");

            List<String> friendIds = friends.stream()
                    .map(Friend::getFriendId)
                    .collect(Collectors.toList());

            List<User> friendUsers = userRepository.findAllById(friendIds);

            return ResponseEntity.ok(friendUsers);
        } catch (Exception e) {
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



