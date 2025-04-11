package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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

@RestController
@RequestMapping("/api/posts")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private UserRepository userRepository;

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
                // Lưu đường dẫn tương đối
                imageUrls.add("/uploads/" + fileName);
            }
            post.setImages(imageUrls);
        }

        // Xử lý videos tương tự
        if (videos != null && videos.length > 0) {
            List<String> videoUrls = new ArrayList<>();
            for (MultipartFile video : videos) {
                String fileName = fileStorageService.storeFile(video);
                videoUrls.add("/uploads/" + fileName);
            }
            post.setVideos(videoUrls);
        }

        Post savedPost = postRepository.save(post);
        
        // Populate user information before returning
        Optional<User> userOptional = userRepository.findById(userId);
        userOptional.ifPresent(savedPost::setUser);

        return ResponseEntity.ok(savedPost);
    }

    @GetMapping
    public ResponseEntity<?> getPosts(@RequestParam(required = false) String userId) {
        List<Post> posts;
        if (userId != null) {
            posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else {
            posts = postRepository.findAllByOrderByCreatedAtDesc();
        }

        // Populate user information for all posts
        for (Post post : posts) {
            populatePostData(post);
        }

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
            String userId = request.get("userId");
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            List<String> likes = post.getLikes();
            if (likes.contains(userId)) {
                likes.remove(userId);
            } else {
                likes.add(userId);
            }
            post.setLikes(likes);

            Post savedPost = postRepository.save(post);
            // Populate full post data before returning
            populatePostData(savedPost);
            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @PostMapping("/{postId}/comments") // Thay đổi từ "comment" thành "comments"
    public ResponseEntity<?> addComment(@PathVariable String postId, @RequestBody CommentRequest request) {
        try {
            Post post = postRepository.findById(postId)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            Comment comment = new Comment();
            comment.setUserId(request.getUserId());
            comment.setContent(request.getContent());
            comment.setCreatedAt(new Date());

            List<Comment> comments = post.getComments();
            if (comments == null) {
                comments = new ArrayList<>();
            }
            comments.add(comment);
            post.setComments(comments);

            Post savedPost = postRepository.save(post);
            // Populate full post data before returning
            populatePostData(savedPost);
            return ResponseEntity.ok(savedPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
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
