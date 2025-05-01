package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.facebook_clone.model.Comment;
import com.example.facebook_clone.model.Post;
import com.example.facebook_clone.repository.PostRepository;
import com.example.facebook_clone.service.NotificationService;

/**
 * Controller xử lý các API liên quan đến bình luận
 */
@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy thông tin chi tiết của một bình luận
     *
     * @param commentId ID bình luận cần lấy
     * @return Thông tin chi tiết bình luận
     */
    @GetMapping("/{commentId}")
    public ResponseEntity<?> getCommentById(@PathVariable String commentId) {
        try {
            // Lấy tất cả bài đăng
            List<Post> allPosts = postRepository.findAll();

            // Tìm kiếm bình luận trong tất cả bài đăng
            for (Post post : allPosts) {
                if (post.getComments() != null) {
                    Comment foundComment = findCommentById(post.getComments(), commentId);
                    if (foundComment != null) {
                        // Trả về bình luận kèm ID bài đăng
                        Map<String, Object> result = new HashMap<>();
                        result.put("id", foundComment.getId());
                        result.put("content", foundComment.getContent());
                        result.put("userId", foundComment.getUserId());
                        result.put("createdAt", foundComment.getCreatedAt());
                        result.put("parentId", foundComment.getParentId());
                        result.put("postId", post.getId());

                        return ResponseEntity.ok(result);
                    }
                }
            }

            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi lấy thông tin bình luận: " + e.getMessage());
        }
    }

    /**
     * Thích hoặc bỏ thích bình luận
     *
     * @param commentId ID bình luận
     * @param request Thông tin yêu cầu (userId)
     * @return Kết quả thao tác
     */
    @PostMapping("/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable String commentId, @RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body("Cần cung cấp userId");
            }

            // Lấy tất cả bài đăng
            List<Post> allPosts = postRepository.findAll();

            // Tìm kiếm bình luận trong tất cả bài đăng
            for (Post post : allPosts) {
                if (post.getComments() != null) {
                    Comment foundComment = findCommentById(post.getComments(), commentId);
                    if (foundComment != null) {
                        // Khởi tạo danh sách thích nếu chưa có
                        if (foundComment.getLikes() == null) {
                            foundComment.setLikes(new ArrayList<>());
                        }

                        // Thêm/xóa lượt thích
                        List<String> likes = foundComment.getLikes();
                        boolean isLikeAction;
                        if (likes.contains(userId)) {
                            likes.remove(userId);
                            isLikeAction = false;
                        } else {
                            likes.add(userId);
                            isLikeAction = true;
                        }

                        // Lưu bài đăng
                        Post savedPost = postRepository.save(post);

                        // Gửi cập nhật qua WebSocket
                        messagingTemplate.convertAndSend("/topic/posts/" + post.getId(), savedPost);

                        // Tạo thông báo nếu đây là hành động thích (không phải bỏ thích)
                        if (isLikeAction && !foundComment.getUserId().equals(userId)) {
                            notificationService.createCommentLikeNotification(
                                foundComment.getUserId(),
                                userId,
                                commentId
                            );
                        }

                        // Trả về kết quả
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("liked", isLikeAction);
                        response.put("likes", likes.size());
                        return ResponseEntity.ok(response);
                    }
                }
            }

            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi thích bình luận: " + e.getMessage());
        }
    }

    /**
     * Tìm bình luận theo ID trong danh sách bình luận
     *
     * @param comments Danh sách bình luận cần tìm
     * @param commentId ID bình luận cần tìm
     * @return Bình luận tìm thấy hoặc null nếu không tìm thấy
     */
    private Comment findCommentById(List<Comment> comments, String commentId) {
        if (comments == null) return null;

        for (Comment comment : comments) {
            if (comment.getId().equals(commentId)) {
                return comment;
            }
            // Kiểm tra trong danh sách trả lời
            if (comment.getReplies() != null) {
                Comment found = findCommentById(comment.getReplies(), commentId);
                if (found != null) {
                    return found;
                }
            }
        }
        return null;
    }
}
