package com.example.facebook_clone.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.UserRepository;
import com.example.facebook_clone.service.FileStorageService;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            
            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(userOptional.get());
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing request: " + e.getMessage());
        }
    }

    @PostMapping("/update")
    public ResponseEntity<?> updateProfile(
            @RequestParam("userId") String userId,
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("bio") String bio,
            @RequestParam("gender") String gender,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "coverPhoto", required = false) MultipartFile coverPhoto) {
        
        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOptional.get();
            user.setFirstName(name.split(" ")[0]);
            user.setLastName(name.substring(name.indexOf(" ") + 1));
            user.setEmail(email);
            user.setBio(bio);
            user.setGender(gender);

            // Chỉ cập nhật ảnh đại diện nếu có file mới
            if (avatar != null && !avatar.isEmpty()) {
                String avatarFileName = fileStorageService.storeFile(avatar);
                user.setAvatar("/uploads/" + avatarFileName);
            }

            // Chỉ cập nhật ảnh bìa nếu có file mới
            if (coverPhoto != null && !coverPhoto.isEmpty()) {
                String coverFileName = fileStorageService.storeFile(coverPhoto);
                user.setCoverPhoto("/uploads/" + coverFileName);
            }

            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser);
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating profile: " + e.getMessage());
        }
    }
}





