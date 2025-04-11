package com.example.facebook_clone.model;

import java.util.List;

public class SharePostRequest {
    private String userId;
    private String originalPostId;
    private String content;
    private String sharedContent;
    private List<String> sharedImages;
    private List<String> sharedVideos;

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }
    
    public String getOriginalPostId() {
        return originalPostId;
    }

    public void setOriginalPostId(String originalPostId) {
        this.originalPostId = originalPostId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSharedContent() {
        return sharedContent;
    }

    public void setSharedContent(String sharedContent) {
        this.sharedContent = sharedContent;
    }

    public List<String> getSharedImages() {
        return sharedImages;
    }

    public void setSharedImages(List<String> sharedImages) {
        this.sharedImages = sharedImages;
    }

    public List<String> getSharedVideos() {
        return sharedVideos;
    }

    public void setSharedVideos(List<String> sharedVideos) {
        this.sharedVideos = sharedVideos;
    }
}