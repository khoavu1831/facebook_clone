package com.example.facebook_clone.repository;

import com.example.facebook_clone.model.Friend;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FriendRepository extends MongoRepository<Friend, String> {
    List<Friend> findByUserIdAndStatus(String userId, String status);
    List<Friend> findByFriendIdAndStatus(String friendId, String status);
    Friend findByUserIdAndFriendId(String userId, String friendId);
    List<Friend> findByUserIdOrFriendIdAndStatus(String userId, String friendId, String status);
    List<Friend> findAllByUserIdAndFriendId(String userId, String friendId);
    List<Friend> findByUserIdAndFriendIdAndStatus(String userId, String friendId, String status);
    
}
