package com.example.facebook_clone.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String content;
    private String userId;
    private Date createdAt;
    private List<String> images;
    private List<String> videos;
    private List<String> likes;
    private List<Comment> comments;
    private String privacy = "PUBLIC"; // Mặc định là PUBLIC, có thể là PUBLIC hoặc PRIVATE

    // Các trường cho chức năng share
    private boolean isShared;
    private String originalPostId;
    private Post originalPost;

    @Transient
    private User user;

    // Constructor
    public Post() {
        this.createdAt = new Date();
        this.likes = new ArrayList<>();
        this.images = new ArrayList<>();
        this.videos = new ArrayList<>();
        this.privacy = "PUBLIC"; // Mặc định là PUBLIC
    }

    // Getters and Setters cho các trường share
    public boolean getIsShared() {
        return isShared;
    }

    public void setIsShared(boolean isShared) {
        this.isShared = isShared;
    }

    public String getOriginalPostId() {
        return originalPostId;
    }

    public void setOriginalPostId(String originalPostId) {
        this.originalPostId = originalPostId;
    }

    public Post getOriginalPost() {
        return originalPost;
    }

    public void setOriginalPost(Post originalPost) {
        this.originalPost = originalPost;
    }

    // Các getter và setter khác giữ nguyên
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public List<String> getLikes() {
        return likes;
    }

    public void setLikes(List<String> likes) {
        this.likes = likes;
    }

    public List<Comment> getComments() {
        return comments;
    }

    public void setComments(List<Comment> comments) {
        this.comments = comments;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<String> getVideos() {
        return videos;
    }

    public void setVideos(List<String> videos) {
        this.videos = videos;
    }

    public boolean isShared() {
        return isShared;
    }

    public void setShared(boolean isShared) {
        this.isShared = isShared;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getPrivacy() {
        return privacy;
    }

    public void setPrivacy(String privacy) {
        this.privacy = privacy;
    }

    // Các phương thức tiện ích
    public void addLike(String userId) {
        if (!this.likes.contains(userId)) {
            this.likes.add(userId);
        }
    }

    public void removeLike(String userId) {
        this.likes.remove(userId);
    }

    public void addComment(Comment comment) {
        if (this.comments == null) {
            this.comments = new ArrayList<>();
        }
        this.comments.add(comment);
    }

    public void addImage(String imageUrl) {
        if (this.images == null) {
            this.images = new ArrayList<>();
        }
        this.images.add(imageUrl);
    }

    public void addVideo(String videoUrl) {
        if (this.videos == null) {
            this.videos = new ArrayList<>();
        }
        this.videos.add(videoUrl);
    }
}
