package com.example.facebook_clone.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.facebook_clone.model.Post;

public interface PostRepository extends MongoRepository<Post, String> {
    List<Post> findByUserId(String userId);
}
