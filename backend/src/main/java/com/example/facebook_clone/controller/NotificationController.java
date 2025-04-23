package com.example.facebook_clone.controller;

import com.example.facebook_clone.model.Notification;
import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.UserRepository;
import com.example.facebook_clone.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private UserRepository userRepository;
    
    // Lấy tất cả thông báo của người dùng
    @GetMapping("/{userId}")
    public ResponseEntity<?> getNotifications(@PathVariable String userId) {
        try {
            List<Notification> notifications = notificationService.getNotificationsForUser(userId);
            
            // Lấy thông tin người gửi cho mỗi thông báo
            List<Map<String, Object>> notificationsWithSender = notifications.stream()
                .map(notification -> {
                    Map<String, Object> notificationData = new HashMap<>();
                    notificationData.put("notification", notification);
                    
                    if (notification.getSenderId() != null) {
                        userRepository.findById(notification.getSenderId())
                            .ifPresent(sender -> notificationData.put("sender", sender));
                    }
                    
                    return notificationData;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(notificationsWithSender);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Lấy số lượng thông báo chưa đọc
    @GetMapping("/unread-count/{userId}")
    public ResponseEntity<?> getUnreadCount(@PathVariable String userId) {
        try {
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Đánh dấu thông báo đã đọc
    @PutMapping("/mark-read/{notificationId}")
    public ResponseEntity<?> markAsRead(@PathVariable String notificationId) {
        try {
            Notification notification = notificationService.markAsRead(notificationId);
            if (notification != null) {
                return ResponseEntity.ok(notification);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Đánh dấu tất cả thông báo đã đọc
    @PutMapping("/mark-all-read/{userId}")
    public ResponseEntity<?> markAllAsRead(@PathVariable String userId) {
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Xóa thông báo
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<?> deleteNotification(@PathVariable String notificationId) {
        try {
            notificationService.deleteNotification(notificationId);
            return ResponseEntity.ok(Map.of("message", "Notification deleted"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    
    // Xóa tất cả thông báo của người dùng
    @DeleteMapping("/all/{userId}")
    public ResponseEntity<?> deleteAllNotifications(@PathVariable String userId) {
        try {
            notificationService.deleteAllNotificationsForUser(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications deleted"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
