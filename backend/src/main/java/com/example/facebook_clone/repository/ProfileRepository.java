package com.example.facebook_clone.repository;

import com.example.facebook_clone.model.Profile;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface ProfileRepository extends MongoRepository<Profile, String> {
    Profile findByUserId(String userId);
}