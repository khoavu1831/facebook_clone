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

/**
 * Service xử lý các thông báo trong hệ thống
 */
@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Tạo và gửi thông báo
     *
     * @param userId ID người nhận thông báo
     * @param senderId ID người gửi thông báo
     * @param type Loại thông báo
     * @param content Nội dung thông báo
     * @param entityId ID đối tượng liên quan
     * @return Thông báo đã tạo
     */
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

    /**
     * Tạo thông báo lời mời kết bạn
     *
     * @param userId ID người nhận lời mời
     * @param senderId ID người gửi lời mời
     * @param requestId ID lời mời kết bạn
     * @return Thông báo đã tạo
     */
    public Notification createFriendRequestNotification(String userId, String senderId, String requestId) {
        Optional<User> senderOpt = userRepository.findById(senderId);
        String content = senderOpt.isPresent()
            ? senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName() + " đã gửi cho bạn lời mời kết bạn"
            : "Bạn có lời mời kết bạn mới";

        return createNotification(userId, senderId, "FRIEND_REQUEST", content, requestId);
    }

    /**
     * Tạo thông báo chấp nhận kết bạn
     *
     * @param userId ID người nhận thông báo
     * @param senderId ID người chấp nhận kết bạn
     * @param requestId ID lời mời kết bạn
     * @return Thông báo đã tạo
     */
    public Notification createFriendAcceptNotification(String userId, String senderId, String requestId) {
        Optional<User> senderOpt = userRepository.findById(senderId);
        String content = senderOpt.isPresent()
            ? senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName() + " đã chấp nhận lời mời kết bạn của bạn"
            : "Lời mời kết bạn của bạn đã được chấp nhận";

        return createNotification(userId, senderId, "FRIEND_ACCEPT", content, requestId);
    }

    /**
     * Tạo thông báo bình luận bài viết
     *
     * @param postOwnerId ID chủ bài viết
     * @param commenterId ID người bình luận
     * @param postId ID bài viết
     * @param commentId ID bình luận
     * @return Thông báo đã tạo
     */
    public Notification createCommentNotification(String postOwnerId, String commenterId, String postId, String commentId) {
        Optional<User> commenterOpt = userRepository.findById(commenterId);
        String content = commenterOpt.isPresent()
            ? commenterOpt.get().getFirstName() + " " + commenterOpt.get().getLastName() + " đã bình luận về bài viết của bạn"
            : "Có người đã bình luận về bài viết của bạn";

        return createNotification(postOwnerId, commenterId, "COMMENT", content, commentId);
    }

    /**
     * Tạo thông báo trả lời bình luận
     *
     * @param commentOwnerId ID chủ bình luận
     * @param replierId ID người trả lời
     * @param postId ID bài viết
     * @param replyId ID bình luận trả lời
     * @return Thông báo đã tạo
     */
    public Notification createReplyNotification(String commentOwnerId, String replierId, String postId, String replyId) {
        Optional<User> replierOpt = userRepository.findById(replierId);
        String content = replierOpt.isPresent()
            ? replierOpt.get().getFirstName() + " " + replierOpt.get().getLastName() + " đã trả lời bình luận của bạn"
            : "Có người đã trả lời bình luận của bạn";

        return createNotification(commentOwnerId, replierId, "REPLY", content, replyId);
    }

    /**
     * Tạo thông báo tin nhắn mới
     *
     * @param receiverId ID người nhận tin nhắn
     * @param senderId ID người gửi tin nhắn
     * @param messageId ID tin nhắn
     * @return Thông báo đã tạo
     */
    public Notification createMessageNotification(String receiverId, String senderId, String messageId) {
        Optional<User> senderOpt = userRepository.findById(senderId);
        String content = senderOpt.isPresent()
            ? senderOpt.get().getFirstName() + " " + senderOpt.get().getLastName() + " đã gửi cho bạn một tin nhắn mới"
            : "Bạn có một tin nhắn mới";

        return createNotification(receiverId, senderId, "MESSAGE", content, messageId);
    }

    /**
     * Tạo thông báo khi có người thích bài viết
     *
     * @param postOwnerId ID chủ bài viết
     * @param likerId ID người thích
     * @param postId ID bài viết
     * @return Thông báo đã tạo hoặc null nếu không cần tạo
     */
    public Notification createLikeNotification(String postOwnerId, String likerId, String postId) {
        // Không tạo thông báo nếu người thích là chủ bài viết
        if (postOwnerId.equals(likerId)) {
            return null;
        }

        Optional<User> likerOpt = userRepository.findById(likerId);
        String content = likerOpt.isPresent()
            ? likerOpt.get().getFirstName() + " " + likerOpt.get().getLastName() + " đã thích bài viết của bạn"
            : "Có người đã thích bài viết của bạn";

        return createNotification(postOwnerId, likerId, "LIKE", content, postId);
    }

    /**
     * Tạo thông báo khi có người thích bình luận
     *
     * @param commentOwnerId ID chủ bình luận
     * @param likerId ID người thích
     * @param commentId ID bình luận
     * @return Thông báo đã tạo hoặc null nếu không cần tạo
     */
    public Notification createCommentLikeNotification(String commentOwnerId, String likerId, String commentId) {
        // Không tạo thông báo nếu người thích là chủ bình luận
        if (commentOwnerId.equals(likerId)) {
            return null;
        }

        Optional<User> likerOpt = userRepository.findById(likerId);
        String content = likerOpt.isPresent()
            ? likerOpt.get().getFirstName() + " " + likerOpt.get().getLastName() + " đã thích bình luận của bạn"
            : "Có người đã thích bình luận của bạn";

        return createNotification(commentOwnerId, likerId, "COMMENT_LIKE", content, commentId);
    }

    /**
     * Lấy tất cả thông báo của một người dùng
     *
     * @param userId ID người dùng
     * @return Danh sách thông báo
     */
    public List<Notification> getNotificationsForUser(String userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Lấy số lượng thông báo chưa đọc
     *
     * @param userId ID người dùng
     * @return Số lượng thông báo chưa đọc
     */
    public long getUnreadCount(String userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /**
     * Đánh dấu thông báo đã đọc
     *
     * @param notificationId ID thông báo
     * @return Thông báo đã cập nhật hoặc null nếu không tìm thấy
     */
    public Notification markAsRead(String notificationId) {
        Optional<Notification> notificationOpt = notificationRepository.findById(notificationId);
        if (notificationOpt.isPresent()) {
            Notification notification = notificationOpt.get();
            notification.setRead(true);
            return notificationRepository.save(notification);
        }
        return null;
    }

    /**
     * Đánh dấu tất cả thông báo của người dùng đã đọc
     *
     * @param userId ID người dùng
     */
    public void markAllAsRead(String userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUserIdAndReadFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unreadNotifications) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
    }

    /**
     * Xóa thông báo
     *
     * @param notificationId ID thông báo cần xóa
     */
    public void deleteNotification(String notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    /**
     * Xóa tất cả thông báo của một người dùng
     *
     * @param userId ID người dùng
     */
    public void deleteAllNotificationsForUser(String userId) {
        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        notificationRepository.deleteAll(notifications);
    }
}
