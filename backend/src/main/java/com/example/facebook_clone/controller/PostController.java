package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.facebook_clone.model.Comment;
import com.example.facebook_clone.model.CommentRequest;
import com.example.facebook_clone.model.Post;
import com.example.facebook_clone.model.SharePostRequest;
import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.PostRepository;
import com.example.facebook_clone.repository.UserRepository;
import com.example.facebook_clone.service.FileStorageService;
import com.example.facebook_clone.service.UserService;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Thêm UserService
    @Autowired
    private UserService userService;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "videos", required = false) MultipartFile[] videos,
            @RequestParam("userId") String userId) {
        
        Post post = new Post();
        post.setContent(content);
        post.setUserId(userId);

        // Xử lý images
        if (images != null && images.length > 0) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile image : images) {
                String fileName = fileStorageService.storeFile(image);
                imageUrls.add("/uploads/" + fileName);
            }
            post.setImages(imageUrls);
        }

        // Xử lý videos
        if (videos != null && videos.length > 0) {
            List<String> videoUrls = new ArrayList<>();
            for (MultipartFile video : videos) {
                String fileName = fileStorageService.storeFile(video);
                videoUrls.add("/uploads/" + fileName);
            }
            post.setVideos(videoUrls);
        }

        Post savedPost = postRepository.save(post);
        
        // Populate user information
        Optional<User> userOptional = userRepository.findById(userId);
        userOptional.ifPresent(savedPost::setUser);

        return ResponseEntity.ok(savedPost);
    }

    @GetMapping
    public ResponseEntity<List<Post>> getAllPosts() {
        List<Post> posts = postRepository.findAll();
        posts.forEach(post -> {
            // Populate user information
            Optional<User> userOptional = userRepository.findById(post.getUserId());
            userOptional.ifPresent(post::setUser);
        });
        return ResponseEntity.ok(posts);
    }

    private void populatePostData(Post post) {
        // Add user info to the post
        Optional<User> postUserOptional = userRepository.findById(post.getUserId());
        postUserOptional.ifPresent(post::setUser);

        // Add user info to comments
        if (post.getComments() != null) {
            post.getComments().forEach(comment -> {
                Optional<User> commentUserOptional = userRepository.findById(comment.getUserId());
                commentUserOptional.ifPresent(comment::setUser);
            });
        }

        // If it's a shared post, populate original post info
        if (post.isShared() && post.getOriginalPostId() != null) {
            Optional<Post> originalPostOptional = postRepository.findById(post.getOriginalPostId());
            if (originalPostOptional.isPresent()) {
                Post originalPost = originalPostOptional.get();
                // Recursively populate the original post data
                populatePostData(originalPost);
                post.setOriginalPost(originalPost);
            }
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id) {
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> likePost(@PathVariable String postId, @RequestBody Map<String, String> request) {
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));
            
            // Update likes
            String userId = request.get("userId");
            List<String> likes = new ArrayList<>(post.getLikes());
            if (likes.contains(userId)) {
                likes.remove(userId);
            } else {
                likes.add(userId);
            }
            post.setLikes(likes);

            // Save and populate
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);
            
            // Send WebSocket update
            System.out.println("Sending WebSocket update for post: " + postId);
            messagingTemplate.convertAndSend("/topic/posts/" + postId, savedPost);
            
            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable String postId, @RequestBody CommentRequest request) {
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            Comment comment = new Comment();
            comment.setId(UUID.randomUUID().toString());
            comment.setUserId(request.getUserId());
            comment.setContent(request.getContent());
            comment.setCreatedAt(new Date());

            // Xử lý reply comment
            if (request.getParentId() != null && !request.getParentId().isEmpty()) {
                Comment parentComment = findCommentById(post.getComments(), request.getParentId());
                if (parentComment == null) {
                    return ResponseEntity.badRequest().body("Parent comment not found");
                }
                
                comment.setParentId(request.getParentId());
                if (parentComment.getReplies() == null) {
                    parentComment.setReplies(new ArrayList<>());
                }
                parentComment.getReplies().add(comment);
            } else {
                if (post.getComments() == null) {
                    post.setComments(new ArrayList<>());
                }
                post.getComments().add(comment);
            }

            // Populate user data
            Optional<User> userOptional = userRepository.findById(request.getUserId());
            userOptional.ifPresent(comment::setUser);

            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);
            
            // Send WebSocket update
            messagingTemplate.convertAndSend("/topic/posts/" + postId, savedPost);
            
            return ResponseEntity.ok(savedPost);
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

    @PostMapping("/share")
    public ResponseEntity<?> sharePost(@RequestBody SharePostRequest request) {
        try {
            Post originalPost = postRepository.findById(request.getOriginalPostId())
                    .orElseThrow(() -> new RuntimeException("Original post not found"));

            Post sharedPost = new Post();
            sharedPost.setContent(request.getContent());
            sharedPost.setUserId(request.getUserId());
            sharedPost.setCreatedAt(new Date());
            sharedPost.setShared(true);
            sharedPost.setOriginalPostId(request.getOriginalPostId());

            Post savedPost = postRepository.save(sharedPost);
            // Populate full post data before returning
            populatePostData(savedPost);
            
            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
