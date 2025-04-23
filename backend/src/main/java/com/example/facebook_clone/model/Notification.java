package com.example.facebook_clone.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;

@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;         // ID của người nhận thông báo
    private String senderId;       // ID của người gửi thông báo (nếu có)
    private String type;           // Loại thông báo: FRIEND_REQUEST, COMMENT, REPLY, MESSAGE, FRIEND_ACCEPT
    private String content;        // Nội dung thông báo
    private String entityId;       // ID của đối tượng liên quan (post, comment, message, friend request)
    private boolean read;          // Đã đọc hay chưa
    private Date createdAt;        // Thời gian tạo thông báo
    
    public Notification() {
        this.createdAt = new Date();
        this.read = false;
    }
    
    // Constructor với các tham số cơ bản
    public Notification(String userId, String senderId, String type, String content, String entityId) {
        this.userId = userId;
        this.senderId = senderId;
        this.type = type;
        this.content = content;
        this.entityId = entityId;
        this.read = false;
        this.createdAt = new Date();
    }
    
    // Getters và Setters
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
    
    public String getSenderId() {
        return senderId;
    }
    
    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }
    
    public String getType() {
        return type;
    }
    
    public void setType(String type) {
        this.type = type;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
    
    public String getEntityId() {
        return entityId;
    }
    
    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }
    
    public boolean isRead() {
        return read;
    }
    
    public void setRead(boolean read) {
        this.read = read;
    }
    
    public Date getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }
}
