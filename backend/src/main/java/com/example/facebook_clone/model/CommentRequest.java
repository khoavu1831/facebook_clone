package com.example.facebook_clone.model;

public class CommentRequest {
    private String content;
    private String userId;
    private String parentId;  // Thêm trường parentId

    // Getters and Setters
    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
}
