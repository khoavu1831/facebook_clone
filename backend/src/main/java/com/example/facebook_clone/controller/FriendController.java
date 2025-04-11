package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request) {
        String userId = request.get("userId");
        String friendId = request.get("friendId");

        Friend existingRequest = friendRepository.findByUserIdAndFriendId(userId, friendId);
        if (existingRequest != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Friend request already exists"));
        }

        Friend friendRequest = new Friend();
        friendRequest.setUserId(userId);
        friendRequest.setFriendId(friendId);
        friendRequest.setStatus("PENDING");
        
        Friend savedRequest = friendRepository.save(friendRequest);
        return ResponseEntity.ok(savedRequest);
    }

    @PostMapping("/respond")
    public ResponseEntity<?> respondToFriendRequest(@RequestBody Map<String, String> request) {
        String requestId = request.get("requestId");
        String response = request.get("response"); // "ACCEPTED" or "REJECTED"

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
        }

        return ResponseEntity.ok(savedRequest);
    }

    @DeleteMapping("/{userId}/{friendId}")
    public ResponseEntity<?> unfriend(@PathVariable String userId, @PathVariable String friendId) {
        // Xóa mối quan hệ theo cả hai chiều
        Friend friendship1 = friendRepository.findByUserIdAndFriendId(userId, friendId);
        Friend friendship2 = friendRepository.findByUserIdAndFriendId(friendId, userId);
        
        if (friendship1 != null) {
            friendRepository.delete(friendship1);
        }
        if (friendship2 != null) {
            friendRepository.delete(friendship2);
        }
        
        return ResponseEntity.ok().build();
    }

    @GetMapping("/list/{userId}")
    public ResponseEntity<?> getFriendsList(@PathVariable String userId) {
        // Chỉ lấy các mối quan hệ có trạng thái ACCEPTED
        List<Friend> friends = friendRepository.findByUserIdAndStatus(userId, "ACCEPTED");
        
        List<String> friendIds = friends.stream()
                .map(Friend::getFriendId)
                .collect(Collectors.toList());

        List<User> friendUsers = userRepository.findAllById(friendIds);
        
        return ResponseEntity.ok(friendUsers);
    }

    @GetMapping("/requests/{userId}")
    public ResponseEntity<?> getPendingRequests(@PathVariable String userId) {
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
    }

    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<?> getFriendSuggestions(@PathVariable String userId) {
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
    }
}



