package com.example.facebook_clone.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.UserRepository;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        // Kiểm tra email đã tồn tại
        if (userRepository.findByEmail(user.getEmail()) != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email already exists"));
        }

        // Lưu user mới
        User savedUser = userRepository.save(user);

        // Tạo response
        Map<String, Object> response = new HashMap<>();
        response.put("id", savedUser.getId());
        response.put("email", savedUser.getEmail());
        response.put("firstName", savedUser.getFirstName());
        response.put("lastName", savedUser.getLastName());
        response.put("role", savedUser.getRole());
        response.put("token", "dummy-token-" + savedUser.getId()); // Token giả

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        User user = userRepository.findByEmail(credentials.get("email"));

        // Kiểm tra user tồn tại và mật khẩu đúng
        if (user == null || !user.getPassword().equals(credentials.get("password"))) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thông tin đăng nhập không chính xác."));
        }

        // Tạo response
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("email", user.getEmail());
        response.put("firstName", user.getFirstName());
        response.put("lastName", user.getLastName());
        response.put("role", user.getRole());
        response.put("token", "dummy-token-" + user.getId()); // Token giả

        return ResponseEntity.ok(response);
    }
}
