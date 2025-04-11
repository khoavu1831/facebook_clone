package com.example.facebook_clone.repository;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.example.facebook_clone.model.user;

public interface UserRepository extends MongoRepository<user, String> {
}
