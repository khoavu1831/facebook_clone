package com.example.facebook_clone.model;

import java.util.Date;
import javax.persistence.Transient;

public class Comment {
    private String userId;
    private String content;
    private Date createdAt;
    
    @Transient
    private User user;  // Thêm trường user

    // Constructor
    public Comment() {
        this.createdAt = new Date();
    }

    // Getters and setters
    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    // Other getters and setters remain the same
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public Date getCreatedAt() { return createdAt; }
    public void setCreatedAt(Date createdAt) { this.createdAt = createdAt; }
}
