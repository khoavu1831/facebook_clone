package com.example.facebook_clone.model;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.persistence.Transient;

public class Comment {
    private String id;
    private String userId;
    private String content;
    private Date createdAt;
    private String parentId;
    private List<Comment> replies;
    private int depth;  // Thêm trường depth để theo dõi độ sâu của comment
    private List<String> likes; // Danh sách người dùng đã thích bình luận

    @Transient
    private User user;

    public Comment() {
        this.id = UUID.randomUUID().toString();
        this.createdAt = new Date();
        this.replies = new ArrayList<>();
        this.likes = new ArrayList<>();
        this.depth = 0;
    }

    public void addReply(Comment reply) {
        if (this.replies == null) {
            this.replies = new ArrayList<>();
        }
        reply.setParentId(this.id);
        reply.setDepth(this.depth + 1);
        this.replies.add(reply);
    }

    // Thêm getters và setters cho depth
    public int getDepth() {
        return depth;
    }

    public void setDepth(int depth) {
        this.depth = depth;
    }

    // Thêm getters và setters mới
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public List<Comment> getReplies() {
        return replies;
    }

    public void setReplies(List<Comment> replies) {
        this.replies = replies;
    }

    // Các getters và setters khác giữ nguyên
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }

    public List<String> getLikes() { return likes; }
    public void setLikes(List<String> likes) { this.likes = likes; }
}
