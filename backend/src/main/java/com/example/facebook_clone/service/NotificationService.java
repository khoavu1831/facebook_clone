package com.example.facebook_clone.service;

import com.example.facebook_clone.model.Notification;
import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.NotificationRepository;
import com.example.facebook_clone.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Tạo và gửi thông báo
    public Notification createNotification(String userId, String senderId, String type, String content, String entityId) {
        Notification notification = new Notification(userId, senderId, type, content, entityId);
        notification = notificationRepository.save(notification);

        // Lấy thông tin người gửi để hiển thị trong thông báo
        Optional<User> senderOpt = userRepository.findById(senderId);

        // Gửi thông báo qua WebSocket
        Map<String, Object> notificationData = new HashMap<>();
        notificationData.put("notification", notification);
        if (senderOpt.isPresent()) {
            notificationData.put("sender", senderOpt.get());
        }

        messagingTemplate.convertAndSend("/topic/notifications/" + userId, notificationData);

        return notification;
    }

    // Tạo thông báo lời mời kết bạn
    public Notification createFriendRequestNotification(String userId, String senderId, String requestId) {
        Optional<User> senderOpt = userRepository.findById(senderId);
        String content = senderOpt.isPresent()
            ? senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName() + " sent you a friend request"
            : "You have a new friend request";

        return createNotification(userId, senderId, "FRIEND_REQUEST", content, requestId);
    }

    // Tạo thông báo chấp nhận kết bạn
    public Notification createFriendAcceptNotification(String userId, String senderId, String requestId) {
        Optional<User> senderOpt = userRepository.findById(senderId);
        String content = senderOpt.isPresent()
            ? senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName() + " accepted your friend request"
            : "Your friend request has been accepted";

        return createNotification(userId, senderId, "FRIEND_ACCEPT", content, requestId);
    }

    // Tạo thông báo bình luận bài viết
    public Notification createCommentNotification(String postOwnerId, String commenterId, String postId, String commentId) {
        Optional<User> commenterOpt = userRepository.findById(commenterId);
        String content = commenterOpt.isPresent()
            ? commenterOpt.get().getFirstName() + " " + commenterOpt.get().getLastName() + " commented on your post"
            : "Someone commented on your post";

        return createNotification(postOwnerId, commenterId, "COMMENT", content, commentId);
    }

    // Tạo thông báo trả lời bình luận
    public Notification createReplyNotification(String commentOwnerId, String replierId, String postId, String replyId) {
        Optional<User> replierOpt = userRepository.findById(replierId);
        String content = replierOpt.isPresent()
            ? replierOpt.get().getFirstName() + " " + replierOpt.get().getLastName() + " replied to your comment"
            : "Someone replied to your comment";

        return createNotification(commentOwnerId, replierId, "REPLY", content, replyId);
    }

    // Tạo thông báo tin nhắn mới
    public Notification createMessageNotification(String receiverId, String senderId, String messageId) {
        Optional<User> senderOpt = userRepository.findById(senderId);
        String content = senderOpt.isPresent()
            ? senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName() + " sent you a new message"
            : "You have a new message";

        return createNotification(receiverId, senderId, "MESSAGE", content, messageId);
    }

    // Tạo thông báo khi có người thích bài viết
    public Notification createLikeNotification(String postOwnerId, String likerId, String postId) {
        // Không tạo thông báo nếu người thích là chủ bài viết
        if (postOwnerId.equals(likerId)) {
            return null;
        }

        Optional<User> likerOpt = userRepository.findById(likerId);
        String content = likerOpt.isPresent()
            ? likerOpt.get().getFirstName() + " " + likerOpt.get().getLastName() + " liked your post"
            : "Someone liked your post";

        return createNotification(postOwnerId, likerId, "LIKE", content, postId);
    }

    // Lấy tất cả thông báo của một người dùng
    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    // Lấy số lượng thông báo chưa đọc
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    // Đánh dấu thông báo đã đọc
    public Notification markAsRead(String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setRead(true);
            return notificationRepository.save(notification);
        }
        return null;
    }

    // Đánh dấu tất cả thông báo của người dùng đã đọc
    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    // Xóa thông báo
    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    // Xóa tất cả thông báo của một người dùng
    public void deleteAllNotificationsForUser(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notificationRepository.deleteAll(notifications);
    }
}
