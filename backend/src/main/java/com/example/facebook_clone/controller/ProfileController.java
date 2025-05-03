package com.example.facebook_clone.controller;

import java.util.Map;
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

/**
 * Controller xử lý các API liên quan đến hồ sơ người dùng
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FileStorageService fileStorageService;

    /**
     * Lấy thông tin hồ sơ người dùng
     *
     * @param userId ID người dùng cần lấy thông tin
     * @return Thông tin hồ sơ người dùng
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getProfile(@PathVariable String userId) {
        try {
            Optional<User> userOptional = userRepository.findById(userId);

            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(userOptional.get());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi xử lý yêu cầu: " + e.getMessage());
        }
    }

    /**
     * Cập nhật thông tin hồ sơ người dùng
     *
     * @param userId ID người dùng cần cập nhật
     * @param name Tên đầy đủ
     * @param email Email
     * @param bio Tiểu sử
     * @param gender Giới tính
     * @param day Ngày sinh
     * @param month Tháng sinh
     * @param year Năm sinh
     * @param avatar Ảnh đại diện mới (nếu có)
     * @param coverPhoto Ảnh bìa mới (nếu có)
     * @return Thông tin người dùng đã cập nhật
     */
    @PostMapping("/update")
    public ResponseEntity<?> updateProfile(
            @RequestParam("userId") String userId,
            @RequestParam("name") String name,
            @RequestParam("email") String email,
            @RequestParam("bio") String bio,
            @RequestParam("gender") String gender,
            @RequestParam("day") String day,
            @RequestParam("month") String month,
            @RequestParam("year") String year,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "coverPhoto", required = false) MultipartFile coverPhoto) {

        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOptional.get();

            // Xử lý tên đầy đủ
            if (name.contains(" ")) {
                user.setFirstName(name.split(" ")[0]);
                user.setLastName(name.substring(name.indexOf(" ") + 1));
            } else {
                user.setFirstName(name);
                user.setLastName("");
            }

            user.setEmail(email);
            user.setBio(bio);
            user.setGender(gender);
            user.setDay(day);
            user.setMonth(month);
            user.setYear(year);

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
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Lỗi khi cập nhật hồ sơ: " + e.getMessage());
        }
    }

    @PostMapping("/update-password")
    public ResponseEntity<?> updatePassword(
            @RequestParam("userId") String userId,
            @RequestParam("currentPassword") String currentPassword,
            @RequestParam("newPassword") String newPassword) {

        try {
            Optional<User> userOptional = userRepository.findById(userId);
            if (!userOptional.isPresent()) {
                return ResponseEntity.notFound().build();
            }

            User user = userOptional.get();

            // Verify current password
            if (!user.getPassword().equals(currentPassword)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Mật khẩu hiện tại không chính xác"));
            }

            // Update password
            user.setPassword(newPassword);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được cập nhật thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Lỗi khi cập nhật mật khẩu: " + e.getMessage()));
        }
    }
}

