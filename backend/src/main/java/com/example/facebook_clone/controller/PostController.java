package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
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

/**
 * Controller xử lý các API liên quan đến bài đăng
 */
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

    // UserService không được sử dụng trực tiếp trong controller này

    @Autowired
    private NotificationService notificationService;

    // Không sử dụng baseUrl

    /**
     * Tạo bài đăng mới
     *
     * @param content Nội dung bài đăng
     * @param images Mảng hình ảnh đính kèm
     * @param videos Mảng video đính kèm
     * @param userId ID người dùng tạo bài đăng
     * @param privacy Quyền riêng tư của bài đăng (PUBLIC/PRIVATE)
     * @return Bài đăng đã được lưu
     */
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

        // Xử lý hình ảnh
        if (images != null && images.length > 0) {
            List<String> imageUrls = new ArrayList<>();
            for (MultipartFile image : images) {
                String fileName = fileStorageService.storeFile(image);
                imageUrls.add("/uploads/" + fileName);
            }
            post.setImages(imageUrls);
        }

        // Xử lý video
        if (videos != null && videos.length > 0) {
            List<String> videoUrls = new ArrayList<>();
            for (MultipartFile video : videos) {
                String fileName = fileStorageService.storeFile(video);
                videoUrls.add("/uploads/" + fileName);
            }
            post.setVideos(videoUrls);
        }

        Post savedPost = postRepository.save(post);

        // Thêm thông tin người dùng vào bài đăng
        Optional<User> userOptional = userRepository.findById(userId);
        userOptional.ifPresent(savedPost::setUser);

        return ResponseEntity.ok(savedPost);
    }

    /**
     * Lấy tất cả bài đăng
     *
     * @param userId ID người dùng đang xem (để kiểm tra quyền riêng tư)
     * @return Danh sách bài đăng
     */
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
            // Thêm thông tin người dùng vào bài đăng
            Optional<User> userOptional = userRepository.findById(post.getUserId());
            userOptional.ifPresent(post::setUser);

            // Xử lý bài đăng được chia sẻ
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

    /**
     * Lấy bài đăng của một người dùng cụ thể
     *
     * @param userId ID người dùng sở hữu bài đăng
     * @param viewerId ID người dùng đang xem (để kiểm tra quyền riêng tư)
     * @return Danh sách bài đăng
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Post>> getUserPosts(@PathVariable String userId, @RequestParam(required = false) String viewerId) {
        List<Post> posts;

        if (userId.equals(viewerId)) {
            // Nếu xem trang cá nhân của chính mình, hiển thị tất cả bài đăng
            posts = postRepository.findByUserId(userId);
        } else {
            // Nếu xem trang cá nhân của người khác, chỉ hiển thị bài đăng công khai
            posts = postRepository.findByUserId(userId).stream()
                .filter(post -> "PUBLIC".equals(post.getPrivacy()))
                .collect(Collectors.toList());
        }

        posts.forEach(this::populatePostData);
        return ResponseEntity.ok(posts);
    }

    /**
     * Tìm kiếm bài đăng theo nội dung
     *
     * @param query Từ khóa tìm kiếm
     * @param userId ID người dùng đang tìm kiếm (để kiểm tra quyền riêng tư)
     * @return Danh sách bài đăng phù hợp
     */
    @GetMapping("/search")
    public ResponseEntity<List<Post>> searchPosts(@RequestParam String query, @RequestParam(required = false) String userId) {
        List<Post> allPosts;

        if (userId != null) {
            // Lấy tất cả bài viết công khai và bài viết riêng tư của người dùng hiện tại
            allPosts = postRepository.findAll().stream()
                .filter(post ->
                    post.getUserId().equals(userId) || // Bài viết của mình
                    "PUBLIC".equals(post.getPrivacy()) // Bài viết công khai của người khác
                )
                .collect(Collectors.toList());
        } else {
            // Nếu không có userId, chỉ lấy bài viết công khai
            allPosts = postRepository.findAll().stream()
                .filter(post -> "PUBLIC".equals(post.getPrivacy()))
                .collect(Collectors.toList());
        }

        // Lọc bài viết theo nội dung chứa query (không phân biệt chữ hoa/thường)
        List<Post> filteredPosts = allPosts.stream()
            .filter(post -> post.getContent() != null &&
                post.getContent().toLowerCase().contains(query.toLowerCase()))
            .collect(Collectors.toList());

        // Thêm thông tin người dùng vào các bài đăng
        filteredPosts.forEach(this::populatePostData);

        return ResponseEntity.ok(filteredPosts);
    }

    /**
     * Lấy thông tin chi tiết của một bài đăng
     *
     * @param postId ID bài đăng cần lấy
     * @param viewerId ID người dùng đang xem (để kiểm tra quyền riêng tư)
     * @return Thông tin chi tiết bài đăng
     */
    @GetMapping("/{postId}")
    public ResponseEntity<?> getPostById(@PathVariable String postId, @RequestParam(required = false) String viewerId) {
        try {
            Optional<Post> postOptional = postRepository.findById(postId);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Kiểm tra quyền riêng tư - chỉ kiểm tra cho bài đăng PRIVATE
            // Nếu bài đăng là PRIVATE, chỉ chủ sở hữu mới có thể xem
            if ("PRIVATE".equals(post.getPrivacy()) && (viewerId == null || !post.getUserId().equals(viewerId))) {
                return ResponseEntity.status(403).body("Bạn không có quyền xem bài đăng này");
            }

            populatePostData(post);
            return ResponseEntity.ok(post);
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi lấy thông tin bài đăng: " + e.getMessage());
        }
    }

    /**
     * Thêm thông tin người dùng vào bài đăng và bình luận
     *
     * @param post Bài đăng cần thêm thông tin
     */
    private void populatePostData(Post post) {
        // Thêm thông tin người dùng vào bài đăng
        Optional<User> postUserOptional = userRepository.findById(post.getUserId());
        postUserOptional.ifPresent(post::setUser);

        // Thêm thông tin người dùng vào bình luận
        if (post.getComments() != null) {
            post.getComments().forEach(comment -> {
                Optional<User> commentUserOptional = userRepository.findById(comment.getUserId());
                commentUserOptional.ifPresent(comment::setUser);
            });
        }

        // Nếu là bài đăng được chia sẻ, thêm thông tin bài đăng gốc
        if (post.isShared() && post.getOriginalPostId() != null) {
            Optional<Post> originalPostOptional = postRepository.findById(post.getOriginalPostId());
            if (originalPostOptional.isPresent()) {
                Post originalPost = originalPostOptional.get();
                // Đệ quy thêm thông tin cho bài đăng gốc
                populatePostData(originalPost);
                post.setOriginalPost(originalPost);
            }
        }
    }

    /**
     * Xóa bài đăng
     *
     * @param id ID bài đăng cần xóa
     * @param userId ID người dùng thực hiện xóa
     * @return Kết quả xóa
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id, @RequestParam String userId) {
        try {
            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(id);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Cho phép admin xóa bất kỳ bài đăng nào
            if (userId.equals("admin")) {
                postRepository.deleteById(id);
                return ResponseEntity.ok().build();
            }

            // Kiểm tra xem người dùng có phải là chủ sở hữu không
            if (!post.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("Bạn không có quyền xóa bài đăng này");
            }

            postRepository.deleteById(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi xóa bài đăng: " + e.getMessage());
        }
    }

    /**
     * Thích hoặc bỏ thích bài đăng
     *
     * @param postId ID bài đăng
     * @param request Thông tin yêu cầu (userId)
     * @return Bài đăng đã cập nhật
     */
    @PostMapping("/{postId}/like")
    public ResponseEntity<?> likePost(@PathVariable String postId, @RequestBody Map<String, String> request) {
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

            // Cập nhật danh sách thích
            String userId = request.get("userId");
            List<String> likes = new ArrayList<>(post.getLikes());
            if (likes.contains(userId)) {
                likes.remove(userId);
            } else {
                likes.add(userId);
            }
            post.setLikes(likes);

            // Lưu và thêm thông tin người dùng
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi cập nhật qua WebSocket
            messagingTemplate.convertAndSend("/topic/posts/" + postId, savedPost);

            // Tạo thông báo khi có người thích bài viết
            // Kiểm tra xem hành động là thích hay bỏ thích
            boolean isLikeAction = likes.contains(userId);
            if (isLikeAction) {
                notificationService.createLikeNotification(post.getUserId(), userId, postId);
            }

            return ResponseEntity.ok(savedPost);
        } catch (RuntimeException e) {
            // Xử lý lỗi không tìm thấy bài đăng
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Xử lý các lỗi khác
            return ResponseEntity.badRequest().body("Lỗi khi thích bài đăng: " + e.getMessage());
        }
    }
    /**
     * Thêm bình luận vào bài đăng
     *
     * @param postId ID bài đăng
     * @param request Thông tin bình luận
     * @return Bài đăng đã cập nhật
     */
    @PostMapping("/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable String postId, @RequestBody CommentRequest request) {
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng"));

            // Kiểm tra độ sâu của comment
            if (request.getParentId() != null && !request.getParentId().isEmpty()) {
                Comment parentComment = findCommentById(post.getComments(), request.getParentId());
                if (parentComment == null) {
                    return ResponseEntity.badRequest().body("Không tìm thấy bình luận cha");
                }

                // Tính độ sâu của comment
                int depth = calculateCommentDepth(post.getComments(), request.getParentId());
                if (depth >= 3) { // 3 là max depth cho phép (tổng 3 tầng: 0,1,2,3)
                    return ResponseEntity.badRequest().body("Đã đạt độ sâu tối đa cho phép");
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

            // Thêm thông tin người dùng vào bình luận
            Optional<User> userOptional = userRepository.findById(request.getUserId());
            userOptional.ifPresent(comment::setUser);

            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi cập nhật qua WebSocket
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
        } catch (RuntimeException e) {
            // Xử lý lỗi không tìm thấy bài đăng
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Xử lý các lỗi khác
            return ResponseEntity.badRequest().body("Lỗi khi thêm bình luận: " + e.getMessage());
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

    /**
     * Tính độ sâu của bình luận
     *
     * @param comments Danh sách bình luận
     * @param commentId ID bình luận cần tính độ sâu
     * @return Độ sâu của bình luận
     */
    private int calculateCommentDepth(List<Comment> comments, String commentId) {
        int depth = 0;
        Comment comment = findCommentById(comments, commentId);

        while (comment != null && comment.getParentId() != null) {
            depth++;
            comment = findCommentById(comments, comment.getParentId());
        }

        return depth;
    }

    /**
     * Chia sẻ bài đăng
     *
     * @param request Thông tin yêu cầu chia sẻ
     * @return Bài đăng đã chia sẻ
     */
    @PostMapping("/share")
    public ResponseEntity<?> sharePost(@RequestBody SharePostRequest request) {
        try {
            // Kiểm tra bài đăng gốc tồn tại
            postRepository.findById(request.getOriginalPostId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy bài đăng gốc"));

            // Tạo bài đăng chia sẻ mới
            Post sharedPost = new Post();
            sharedPost.setContent(request.getContent());
            sharedPost.setUserId(request.getUserId());
            sharedPost.setCreatedAt(new Date());
            sharedPost.setShared(true);
            sharedPost.setOriginalPostId(request.getOriginalPostId());

            Post savedPost = postRepository.save(sharedPost);
            // Thêm thông tin người dùng và bài đăng gốc
            populatePostData(savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (RuntimeException e) {
            // Xử lý lỗi không tìm thấy bài đăng gốc
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            // Xử lý các lỗi khác
            return ResponseEntity.badRequest().body("Lỗi khi chia sẻ bài đăng: " + e.getMessage());
        }
    }

    /**
     * Cập nhật bài đăng
     *
     * @param id ID bài đăng cần cập nhật
     * @param request Thông tin cập nhật
     * @return Bài đăng đã cập nhật
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePost(@PathVariable String id, @RequestBody Map<String, String> request) {
        try {
            String content = request.get("content");
            String userId = request.get("userId");
            String privacy = request.get("privacy");

            if (userId == null) {
                return ResponseEntity.badRequest().body("Cần cung cấp userId");
            }

            // Nội dung có thể trống hoặc null

            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(id);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Kiểm tra xem người dùng có phải là chủ sở hữu không
            if (!post.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("Bạn không có quyền cập nhật bài đăng này");
            }

            // Cập nhật nội dung bài viết
            post.setContent(content);

            // Cập nhật quyền riêng tư nếu có
            if (privacy != null) {
                post.setPrivacy(privacy);
            }

            // Lưu và thêm thông tin người dùng
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi cập nhật qua WebSocket
            messagingTemplate.convertAndSend("/topic/posts/" + id, savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi cập nhật bài đăng: " + e.getMessage());
        }
    }

    /**
     * Cập nhật bài đăng kèm media
     *
     * @param id ID bài đăng cần cập nhật
     * @param content Nội dung mới
     * @param userId ID người dùng thực hiện cập nhật
     * @param privacy Quyền riêng tư mới
     * @param images Mảng hình ảnh mới
     * @param videos Mảng video mới
     * @param keepImages Mảng đường dẫn hình ảnh cần giữ lại
     * @param keepVideos Mảng đường dẫn video cần giữ lại
     * @return Bài đăng đã cập nhật
     */
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
            // Nội dung có thể trống nếu có hình ảnh hoặc video
            // Kiểm tra xem bài viết có tồn tại không
            Optional<Post> postOptional = postRepository.findById(id);
            if (!postOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            Post post = postOptional.get();

            // Kiểm tra xem người dùng có phải là chủ sở hữu không
            if (!post.getUserId().equals(userId)) {
                return ResponseEntity.status(403).body("Bạn không có quyền cập nhật bài đăng này");
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

            // Lưu và thêm thông tin người dùng
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi cập nhật qua WebSocket
            messagingTemplate.convertAndSend("/topic/posts/" + id, savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi cập nhật bài đăng với media: " + e.getMessage());
        }
    }

    /**
     * Xóa bình luận
     *
     * @param postId ID bài đăng chứa bình luận
     * @param commentId ID bình luận cần xóa
     * @param userId ID người dùng thực hiện xóa
     * @return Bài đăng đã cập nhật
     */
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
                return ResponseEntity.status(403).body("Bạn không có quyền xóa bình luận này");
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

            // Lưu và thêm thông tin người dùng
            Post savedPost = postRepository.save(post);
            populatePostData(savedPost);

            // Gửi cập nhật qua WebSocket
            messagingTemplate.convertAndSend("/topic/posts/" + postId, savedPost);

            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            // Xử lý lỗi
            return ResponseEntity.badRequest().body("Lỗi khi xóa bình luận: " + e.getMessage());
        }
    }
}
