package com.example.facebook_clone.controller;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
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
import com.example.facebook_clone.repository.PostRepository;
import com.example.facebook_clone.service.FileStorageService;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:3000")
public class PostController {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private FileStorageService fileStorageService;

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
                String fileName = image.getOriginalFilename();
                fileStorageService.storeFile(image);
                imageUrls.add("/uploads/" + fileName);
            }
            post.setImages(imageUrls);
        }

        // Xử lý videos
        if (videos != null && videos.length > 0) {
            List<String> videoUrls = new ArrayList<>();
            for (MultipartFile video : videos) {
                String fileName = video.getOriginalFilename();
                fileStorageService.storeFile(video);
                videoUrls.add("/uploads/" + fileName);
            }
            post.setVideos(videoUrls);
        }

        Post savedPost = postRepository.save(post);
        return ResponseEntity.ok(savedPost);
    }

    @GetMapping
    public ResponseEntity<?> getPosts(@RequestParam(required = false) String userId) {
        List<Post> posts;
        if (userId != null) {
            posts = postRepository.findByUserIdOrderByCreatedAtDesc(userId);
        } else {
            posts = postRepository.findAll();
        }
        return ResponseEntity.ok(posts);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePost(@PathVariable String id) {
        postRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<?> likePost(@PathVariable String id, @RequestBody Map<String, String> body) {
        String userId = body.get("userId");
        Post post = postRepository.findById(id).orElse(null);
        
        if (post == null) {
            return ResponseEntity.notFound().build();
        }

        List<String> likes = post.getLikes();
        if (likes.contains(userId)) {
            likes.remove(userId);
        } else {
            likes.add(userId);
        }
        
        post.setLikes(likes);
        postRepository.save(post);
        
        return ResponseEntity.ok(post);
    }
    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable String id, @RequestBody CommentRequest request) {
        try {
            // Tìm post theo id
            Post post = postRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Post not found"));

            // Tạo comment mới
            Comment comment = new Comment();
            comment.setUserId(request.getUserId());
            comment.setContent(request.getContent());
            comment.setCreatedAt(new Date());

            // Thêm comment vào post
            List<Comment> comments = post.getComments();
            if (comments == null) {
                comments = new ArrayList<>();
            }
            comments.add(comment);
            post.setComments(comments);

            // Lưu post đã cập nhật
            Post updatedPost = postRepository.save(post);
            return ResponseEntity.ok(updatedPost);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
