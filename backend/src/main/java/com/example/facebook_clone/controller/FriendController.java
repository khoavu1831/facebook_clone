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

/**
 * Controller xử lý các API liên quan đến bạn bè
 */
@RestController
@RequestMapping("/api/friends")
public class FriendController {

    @Autowired
    private FriendRepository friendRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    /**
     * Gửi lời mời kết bạn
     *
     * @param request Thông tin yêu cầu (userId, friendId)
     * @return Thông tin lời mời kết bạn đã tạo
     */
    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            String friendId = request.get("friendId");

            if (userId == null || friendId == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cần cung cấp userId và friendId"));
            }

            // Kiểm tra xem lời mời kết bạn đã tồn tại chưa
            Friend existingRequest = friendRepository.findByUserIdAndFriendId(userId, friendId);
            if (existingRequest != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lời mời kết bạn đã tồn tại"));
            }

            // Kiểm tra xem đã là bạn bè chưa
            List<Friend> acceptedFriends = friendRepository.findByUserIdAndFriendIdAndStatus(userId, friendId, "ACCEPTED");
            if (acceptedFriends != null && !acceptedFriends.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Hai người dùng đã là bạn bè"));
            }

            // Tạo lời mời kết bạn mới
            Friend friendRequest = new Friend();
            friendRequest.setUserId(userId);
            friendRequest.setFriendId(friendId);
            friendRequest.setStatus("PENDING");

            Friend savedRequest = friendRepository.save(friendRequest);

            // Gửi thông báo WebSocket cho người nhận lời mời
            Map<String, Object> requestInfo = new HashMap<>();
            User requestUser = userRepository.findById(userId).orElse(null);
            requestInfo.put("requestId", savedRequest.getId());
            requestInfo.put("user", requestUser);
            requestInfo.put("type", "NEW_REQUEST");

            // Gửi đến topic của người nhận lời mời
            messagingTemplate.convertAndSend("/topic/friends/" + friendId, requestInfo);

            // Tạo thông báo cho lời mời kết bạn
            notificationService.createFriendRequestNotification(friendId, userId, savedRequest.getId());

            return ResponseEntity.ok(savedRequest);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi khi gửi lời mời kết bạn: " + e.getMessage()));
        }
    }

    /**
     * Phản hồi lời mời kết bạn
     *
     * @param request Thông tin yêu cầu (requestId, response)
     * @return Thông tin lời mời kết bạn đã cập nhật
     */
    @PostMapping("/respond")
    public ResponseEntity<?> respondToFriendRequest(@RequestBody Map<String, String> request) {
        try {
            String requestId = request.get("requestId");
            String response = request.get("response"); // "ACCEPTED" hoặc "REJECTED"

            if (requestId == null || response == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Cần cung cấp requestId và response"));
            }

            if (!"ACCEPTED".equals(response) && !"REJECTED".equals(response)) {
                return ResponseEntity.badRequest().body(Map.of("message", "response phải là ACCEPTED hoặc REJECTED"));
            }

            // Tìm kiếm lời mời kết bạn
            Friend friendRequest = friendRepository.findById(requestId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy lời mời kết bạn"));

            if ("REJECTED".equals(response)) {
                // Khi từ chối, xóa lời mời kết bạn thay vì cập nhật trạng thái
                // Điều này cho phép người gửi lời mời có thể gửi lại lời mời trong tương lai
                String userId = friendRequest.getUserId(); // Người gửi lời mời
                String friendId = friendRequest.getFriendId(); // Người nhận lời mời
                
                // Thông báo cho người gửi lời mời rằng lời mời đã bị từ chối
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "REQUEST_REJECTED");
                notification.put("requestId", requestId);
                messagingTemplate.convertAndSend("/topic/friends/" + userId, notification);
                
                // Xóa lời mời kết bạn
                friendRepository.delete(friendRequest);
                
                return ResponseEntity.ok(Map.of("message", "Đã từ chối lời mời kết bạn"));
            } else {
                // Nếu chấp nhận, giữ nguyên logic hiện tại
                friendRequest.setStatus(response);
                Friend savedRequest = friendRepository.save(friendRequest);

                // Nếu chấp nhận lời mời kết bạn, tạo thêm một bản ghi Friend mới
                // để thể hiện mối quan hệ hai chiều
                try {
                    Friend reverseRequest = new Friend();
                    reverseRequest.setUserId(friendRequest.getFriendId());  // Đảo ngược userId và friendId
                    reverseRequest.setFriendId(friendRequest.getUserId());
                    reverseRequest.setStatus("ACCEPTED");
                    friendRepository.save(reverseRequest);

                    // Lấy thông tin người dùng cho cả hai người
                    User requestUser = userRepository.findById(friendRequest.getUserId()).orElse(null);
                    User friendUser = userRepository.findById(friendRequest.getFriendId()).orElse(null);

                    // Gửi thông báo WebSocket cho cả hai người dùng
                    if (requestUser != null && friendUser != null) {
                        // Thông báo cho người gửi lời mời
                        Map<String, Object> notificationForRequester = new HashMap<>();
                        notificationForRequester.put("type", "REQUEST_ACCEPTED");
                        notificationForRequester.put("friend", friendUser);
                        messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getUserId(), notificationForRequester);

                        // Tạo thông báo cho việc chấp nhận kết bạn
                        notificationService.createFriendAcceptNotification(friendRequest.getUserId(), friendRequest.getFriendId(), friendRequest.getId());

                        // Thông báo cho người chấp nhận lời mời
                        Map<String, Object> notificationForAccepter = new HashMap<>();
                        notificationForAccepter.put("type", "FRIEND_ADDED");
                        notificationForAccepter.put("friend", requestUser);
                        messagingTemplate.convertAndSend("/topic/friends/" + friendRequest.getFriendId(), notificationForAccepter);
                    }
                } catch (Exception e) {
                    // Ghi nhận lỗi nhưng vẫn tiếp tục xử lý
                }

                return ResponseEntity.ok(savedRequest);
            }
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi khi phản hồi lời mời kết bạn: " + e.getMessage()));
        }
    }

    /**
     * Hủy kết bạn
     *
     * @param userId ID người dùng
     * @param friendId ID bạn bè cần hủy kết bạn
     * @return Kết quả hủy kết bạn
     */
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

            // Gửi thông báo WebSocket cho cả hai người dùng
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "UNFRIENDED");
            notification.put("userId", userId);
            notification.put("friendId", friendId);

            messagingTemplate.convertAndSend("/topic/friends/" + userId, notification);
            messagingTemplate.convertAndSend("/topic/friends/" + friendId, notification);

            return ResponseEntity.ok(Map.of("message", "Đã hủy kết bạn thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi khi hủy kết bạn: " + e.getMessage()));
        }
    }

    /**
     * Lấy danh sách bạn bè
     *
     * @param userId ID người dùng cần lấy danh sách bạn bè
     * @return Danh sách bạn bè
     */
    @GetMapping("/list/{userId}")
    public ResponseEntity<?> getFriendsList(@PathVariable String userId) {
        try {
            // Chỉ lấy các mối quan hệ có trạng thái ACCEPTED
            List<Friend> friends = friendRepository.findByUserIdAndStatus(userId, "ACCEPTED");

            if (friends.isEmpty()) {
                // Trả về mảng rỗng nếu không có bạn bè
                return ResponseEntity.ok(new ArrayList<User>());
            }

            List<String> friendIds = friends.stream()
                    .map(Friend::getFriendId)
                    .collect(Collectors.toList());

            List<User> friendUsers = userRepository.findAllById(friendIds);

            // Đảm bảo trả về một mảng, ngay cả khi không tìm thấy user nào
            List<User> result = friendUsers != null ? friendUsers : new ArrayList<>();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi khi lấy danh sách bạn bè: " + e.getMessage()));
        }
    }

    /**
     * Lấy danh sách lời mời kết bạn đang chờ
     *
     * @param userId ID người dùng cần lấy danh sách lời mời
     * @return Danh sách lời mời kết bạn
     */
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
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi khi lấy danh sách lời mời kết bạn: " + e.getMessage()));
        }
    }

    /**
     * Lấy danh sách gợi ý kết bạn
     *
     * @param userId ID người dùng cần lấy gợi ý kết bạn
     * @return Danh sách gợi ý kết bạn
     */
    @GetMapping("/suggestions/{userId}")
    public ResponseEntity<?> getFriendSuggestions(@PathVariable String userId) {
        try {
            // Lấy danh sách bạn bè hiện tại (chỉ lấy những người đã ACCEPTED)
            List<Friend> friends = friendRepository.findByUserIdOrFriendIdAndStatus(userId, userId, "ACCEPTED");
            Set<String> friendIds = friends.stream()
                    .map(friend -> friend.getUserId().equals(userId) ? friend.getFriendId() : friend.getUserId())
                    .collect(Collectors.toSet());

            // Lấy danh sách lời mời kết bạn đang chờ (PENDING) mà người dùng đã gửi
            List<Friend> pendingRequests = friendRepository.findByUserIdAndStatus(userId, "PENDING");
            Set<String> pendingRequestIds = pendingRequests.stream()
                    .map(Friend::getFriendId)
                    .collect(Collectors.toSet());

            // Thêm userId vào set để loại trừ
            friendIds.add(userId);

            // Lấy tất cả user trừ những người đã là bạn và những người đang có lời mời PENDING
            List<User> allUsers = userRepository.findAll();
            List<User> suggestions = allUsers.stream()
                    .filter(user -> !friendIds.contains(user.getId()) && !pendingRequestIds.contains(user.getId()))
                    .limit(10)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Lỗi khi lấy gợi ý kết bạn: " + e.getMessage()));
        }
    }
}
