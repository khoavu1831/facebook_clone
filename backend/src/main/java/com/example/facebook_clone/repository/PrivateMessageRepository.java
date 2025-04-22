package com.example.facebook_clone.repository;

import com.example.facebook_clone.model.PrivateMessage;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface PrivateMessageRepository extends MongoRepository<PrivateMessage, String> {
    // Find messages between two users (in both directions)
    List<PrivateMessage> findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
            String senderId1, String receiverId1, String senderId2, String receiverId2);
    
    // Find unread messages for a specific receiver
    List<PrivateMessage> findByReceiverIdAndReadFalse(String receiverId);
    
    // Count unread messages for a specific receiver from a specific sender
    long countByReceiverIdAndSenderIdAndReadFalse(String receiverId, String senderId);
}
