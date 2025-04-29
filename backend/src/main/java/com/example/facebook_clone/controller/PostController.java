package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
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
import com.example.facebook_clone.service.NotificationService;
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

    @Autowired
    private NotificationService notificationService;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

    @PostMapping
    public ResponseEntity<?> createPost(
            @RequestParam("content") String content,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "videos", required = false) MultipartFile[] videos,
            @RequestParam("userId") String userId,
            @RequestParam(value = "privacy", required = false, defaultValue = "PUBLIC") String privacy) {

        Post post = new Post();
        post.setContent(content);
        post.setUserId(userId);
        post.setPrivacy(privacy);

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
    public ResponseEntity<List<Post>> getAllPosts(@RequestParam(value = "userId", required = false) String userId) {
        List<Post> posts;

        if (userId != null) {
            // Lấy tất cả bài viết công khai của người khác và tất cả bài viết của mình
            posts = postRepository.findAll().stream()
                .filter(post ->
                    post.getUserId().equals(userId) || // Bài viết của mình
                    "PUBLIC".equals(post.getPrivacy()) // Bài viết công khai của người khác
                )
                .collect(Collectors.toList());
        } else {
            // Nếu không có userId, chỉ lấy bài viết công khai
            posts = postRepository.findAll().stream()
                .filter(post -> "PUBLIC".equals(post.getPrivacy()))
                .collect(Collectors.toList());
        }

        posts.forEach(post -> {
            // Populate user information
            Optional<User> userOptional = userRepository.findById(post.getUserId());
            userOptional.ifPresent(post::setUser);

            if (post.getOriginalPostId() != null) {
                Post originalPost = postRepository.findById(post.getOriginalPostId()).orElse(null);
                if (originalPost != null) {
                    post.setOriginalPost(originalPost);
                    Optional<User> userOptionalOriginalPost = userRepository.findById(originalPost.getUserId());
                    userOptionalOriginalPost.ifPresent(originalPost::setUser);
                }
            }
        });

        return ResponseEntity.ok(posts);
    }

    // Add new endpoint for profile posts
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getUserPosts(@PathVariable String userId, @RequestParam(required = false) String viewerId) {
        List<Post> posts;

        if (userId.equals(viewerId)) {
            // If viewing own profile, show all posts
            posts = postRepository.findByUserId(userId);
        } else {
            // If viewing other's profile, show only public posts
            posts = postRepository.findByUserId(userId).stream()
                .filter(post -> "PUBLIC".equals(post.getPrivacy()))
                .collect(Collectors.toList());
        }

        posts.forEach(this::populatePostData);
        return ResponseEntity.ok(posts);
    }

    // Add endpoint to get a single post by ID
    @GetMapping("/{postId}")
    public ResponseEntity<?> getPostById(@PathVariable String postId, @RequestParam(required = false) String viewerId) {
        try {
            Optional<Post> postOptional = postRepository.findById(postId);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Check privacy settings - only check for PRIVATE posts
            // If post is PRIVATE, only the owner can view it
            if ("PRIVATE".equals(post.getPrivacy()) && (viewerId == null || !post.getUserId().equals(viewerId))) {
                return ResponseEntity.status(403).body("You don't have permission to view this post");
            }

            populatePostData(post);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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
    public ResponseEntity<?> deletePost(@PathVariable String id, @RequestParam String userId) {
        try {
            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(id);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Kiểm tra xem người dùng có phải là chủ sở hữu không
            if (!post.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("You don't have permission to delete this post");
            }

            postRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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

            // Tạo thông báo khi có người thích bài viết
            // Kiểm tra xem hành động là thích hay bỏ thích
            boolean isLikeAction = likes.contains(userId);
            if (isLikeAction) {
                notificationService.createLikeNotification(post.getUserId(), userId, postId);
            }

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

            // Kiểm tra độ sâu của comment
            if (request.getParentId() != null && !request.getParentId().isEmpty()) {
                Comment parentComment = findCommentById(post.getComments(), request.getParentId());
                if (parentComment == null) {
                    return ResponseEntity.badRequest().body("Parent comment not found");
                }

                // Tính độ sâu của comment
                int depth = calculateCommentDepth(post.getComments(), request.getParentId());
                if (depth >= 3) { // 3 là max depth cho phép (tổng 3 tầng: 0,1,2,3)
                    return ResponseEntity.badRequest().body("Maximum reply depth reached");
                }
            }

            Comment comment = new Comment();
            comment.setId(UUID.randomUUID().toString());
            comment.setUserId(request.getUserId());
            comment.setContent(request.getContent());
            comment.setCreatedAt(new Date());

            // Xử lý reply comment
            if (request.getParentId() != null && !request.getParentId().isEmpty()) {
                Comment parentComment = findCommentById(post.getComments(), request.getParentId());
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

            // Send WebSocket update to all users
            messagingTemplate.convertAndSend("/topic/posts/" + postId, savedPost);

            // Tạo thông báo nếu đây là bình luận mới (không phải reply)
            if (request.getParentId() == null || request.getParentId().isEmpty()) {
                // Chỉ tạo thông báo nếu người bình luận không phải là chủ bài viết
                if (!request.getUserId().equals(post.getUserId())) {
                    notificationService.createCommentNotification(
                        post.getUserId(),
                        request.getUserId(),
                        postId,
                        comment.getId()
                    );
                }
            } else {
                // Đây là reply, tìm comment gốc để lấy userId
                Comment parentComment = findCommentById(post.getComments(), request.getParentId());
                if (parentComment != null && !request.getUserId().equals(parentComment.getUserId())) {
                    notificationService.createReplyNotification(
                        parentComment.getUserId(),
                        request.getUserId(),
                        postId,
                        comment.getId()
                    );
                }
            }

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

    // Thêm method mới để tính độ sâu của comment
    private int calculateCommentDepth(List<Comment> comments, String commentId) {
        int depth = 0;
        Comment comment = findCommentById(comments, commentId);

        while (comment != null && comment.getParentId() != null) {
            depth++;
            comment = findCommentById(comments, comment.getParentId());
        }

        return depth;
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            String userId = request.get("userId");
            String privacy = request.get("privacy");

            if (userId == null) {
                return ResponseEntity.badRequest().body("UserId is required");
            }

            // Content can be empty or null

            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(id);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Kiểm tra xem người dùng có phải là chủ sở hữu không
            if (!post.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("You don't have permission to update this post");
            }

            // Cập nhật nội dung bài viết
            post.setContent(content);

            // Cập nhật quyền riêng tư nếu có
            if (privacy != null) {
                post.setPrivacy(privacy);
            }

            // Lưu và populate dữ liệu
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi WebSocket update
            messagingTemplate.convertAndSend("/topic/posts/" + id, savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/update-with-media")
    public ResponseEntity<?> updatePostWithMedia(
            @PathVariable String id,
            @RequestParam(value = "content", required = false) String content,
            @RequestParam("userId") String userId,
            @RequestParam(value = "privacy", required = false) String privacy,
            @RequestParam(value = "images", required = false) MultipartFile[] images,
            @RequestParam(value = "videos", required = false) MultipartFile[] videos,
            @RequestParam(value = "keepImages", required = false) String[] keepImages,
            @RequestParam(value = "keepVideos", required = false) String[] keepVideos) {

        try {
            // Content can be empty or null if there are images or videos
            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(id);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Kiểm tra xem người dùng có phải là chủ sở hữu không
            if (!post.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("You don't have permission to update this post");
            }

            // Cập nhật nội dung bài viết
            post.setContent(content);

            // Cập nhật quyền riêng tư nếu có
            if (privacy != null) {
                post.setPrivacy(privacy);
            }

            // Xử lý hình ảnh giữ lại
            List<String> updatedImages = new ArrayList<>();
            if (keepImages != null && keepImages.length > 0) {
                for (String imagePath : keepImages) {
                    if (post.getImages() != null && post.getImages().contains(imagePath)) {
                        updatedImages.add(imagePath);
                    }
                }
            }

            // Xử lý video giữ lại
            List<String> updatedVideos = new ArrayList<>();
            if (keepVideos != null && keepVideos.length > 0) {
                for (String videoPath : keepVideos) {
                    if (post.getVideos() != null && post.getVideos().contains(videoPath)) {
                        updatedVideos.add(videoPath);
                    }
                }
            }

            // Xử lý hình ảnh mới
            if (images != null && images.length > 0) {
                for (MultipartFile image : images) {
                    if (!image.isEmpty()) {
                        String fileName = fileStorageService.storeFile(image);
                        updatedImages.add("/uploads/" + fileName);
                    }
                }
            }

            // Xử lý video mới
            if (videos != null && videos.length > 0) {
                for (MultipartFile video : videos) {
                    if (!video.isEmpty()) {
                        String fileName = fileStorageService.storeFile(video);
                        updatedVideos.add("/uploads/" + fileName);
                    }
                }
            }

            // Cập nhật danh sách hình ảnh và video
            post.setImages(updatedImages);
            post.setVideos(updatedVideos);

            // Lưu và populate dữ liệu
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi WebSocket update
            messagingTemplate.convertAndSend("/topic/posts/" + id, savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{postId}/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable String postId, @PathVariable String commentId, @RequestParam String userId) {
        try {
            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(postId);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Tìm bình luận cần xóa
            Comment commentToDelete = findCommentById(post.getComments(), commentId);
            if (commentToDelete == null) {
                return ResponseEntity.notFound().build();
            }

            // Kiểm tra xem người dùng có phải là chủ sở hữu bình luận không
            if (!commentToDelete.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("You don't have permission to delete this comment");
            }

            // Xóa bình luận
            if (commentToDelete.getParentId() == null) {
                // Nếu là bình luận gốc, xóa khỏi danh sách bình luận của bài viết
                post.getComments().removeIf(c -> c.getId().equals(commentId));
            } else {
                // Nếu là bình luận con, tìm bình luận cha và xóa khỏi danh sách replies
                Comment parentComment = findCommentById(post.getComments(), commentToDelete.getParentId());
                if (parentComment != null && parentComment.getReplies() != null) {
                    parentComment.getReplies().removeIf(r -> r.getId().equals(commentId));
                }
            }

            // Lưu và populate dữ liệu
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi WebSocket update
            messagingTemplate.convertAndSend("/topic/posts/" + postId, savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
