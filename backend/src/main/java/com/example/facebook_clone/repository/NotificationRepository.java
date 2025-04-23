package com.example.facebook_clone.repository;

import com.example.facebook_clone.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    // Lấy tất cả thông báo của một người dùng, sắp xếp theo thời gian tạo giảm dần
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);
    
    // Lấy thông báo theo trang
    Page<Notification> findByUserId(String userId, Pageable pageable);
    
    // Đếm số thông báo chưa đọc
    long countByUserIdAndReadFalse(String userId);
    
    // Lấy tất cả thông báo chưa đọc
    List<Notification> findByUserIdAndReadFalseOrderByCreatedAtDesc(String userId);
    
    // Tìm thông báo theo loại
    List<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(String userId, String type);
    
    // Tìm thông báo theo entityId
    List<Notification> findByEntityId(String entityId);
    
    // Xóa thông báo theo entityId
    void deleteByEntityId(String entityId);
}
