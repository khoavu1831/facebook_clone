package com.example.facebook_clone.repository;

import com.example.facebook_clone.model.Post;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.util.List;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserIdOrderByCreatedAtDesc(String userId);
    
    @Query("{ 'userId': { $in: ?0 } }")
    List<Post> findByUserIdInOrderByCreatedAtDesc(List<String> userIds);
}