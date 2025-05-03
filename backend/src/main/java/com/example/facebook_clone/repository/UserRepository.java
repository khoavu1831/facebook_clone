package com.example.facebook_clone.repository;

import com.example.facebook_clone.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UserRepository extends MongoRepository<User, String> {
    User findByEmail(String email);
    User findByResetToken(String resetToken);
}