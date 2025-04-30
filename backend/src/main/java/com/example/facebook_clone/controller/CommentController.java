package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping("/{commentId}")
    public ResponseEntity<?> getCommentById(@PathVariable String commentId) {
        try {
            // Find all posts
            List<Post> allPosts = postRepository.findAll();

            // Search for the comment in all posts
            for (Post post : allPosts) {
                if (post.getComments() != null) {
                    Comment foundComment = findCommentById(post.getComments(), commentId);
                    if (foundComment != null) {
                        // Return comment with post ID
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
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<?> likeComment(@PathVariable String commentId, @RequestBody Map<String, String> request) {
        try {
            String userId = request.get("userId");
            if (userId == null) {
                return ResponseEntity.badRequest().body("UserId is required");
            }

            // Find all posts
            List<Post> allPosts = postRepository.findAll();

            // Search for the comment in all posts
            for (Post post : allPosts) {
                if (post.getComments() != null) {
                    Comment foundComment = findCommentById(post.getComments(), commentId);
                    if (foundComment != null) {
                        // Initialize likes list if null
                        if (foundComment.getLikes() == null) {
                            foundComment.setLikes(new ArrayList<>());
                        }

                        // Toggle like
                        List<String> likes = foundComment.getLikes();
                        boolean isLikeAction;
                        if (likes.contains(userId)) {
                            likes.remove(userId);
                            isLikeAction = false;
                        } else {
                            likes.add(userId);
                            isLikeAction = true;
                        }

                        // Save post
                        Post savedPost = postRepository.save(post);

                        // Send WebSocket update
                        messagingTemplate.convertAndSend("/topic/posts/" + post.getId(), savedPost);

                        // Create notification if this is a like action (not unlike)
                        if (isLikeAction && !foundComment.getUserId().equals(userId)) {
                            notificationService.createCommentLikeNotification(
                                foundComment.getUserId(),
                                userId,
                                commentId
                            );
                        }

                        // Return success response
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
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private Comment findCommentById(List<Comment> comments, String commentId) {
        if (comments == null) return null;

        for (Comment comment : comments) {
            if (comment.getId().equals(commentId)) {
                return comment;
            }
            // Check in replies
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
