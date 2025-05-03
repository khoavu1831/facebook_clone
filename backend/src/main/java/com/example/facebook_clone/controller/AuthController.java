package com.example.facebook_clone.controller;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.UserRepository;
import com.example.facebook_clone.security.JwtUtil;
import com.example.facebook_clone.service.EmailService;

/**
 * Controller xử lý các API liên quan đến xác thực người dùng
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Đăng ký tài khoản mới
     *
     * @param user Thông tin người dùng đăng ký
     * @return Thông tin người dùng và token đăng nhập
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            // Kiểm tra email đã tồn tại
            if (userRepository.findByEmail(user.getEmail()) != null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email đã tồn tại"));
            }

            // Lưu user mới
            User savedUser = userRepository.save(user);

            // Tạo JWT token
            String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getRole());

            // Tạo response
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedUser.getId());
            response.put("email", savedUser.getEmail());
            response.put("firstName", savedUser.getFirstName());
            response.put("lastName", savedUser.getLastName());
            response.put("role", savedUser.getRole());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi đăng ký: " + e.getMessage()));
        }
    }

    /**
     * Đăng nhập vào hệ thống
     *
     * @param credentials Thông tin đăng nhập (email, password)
     * @return Thông tin người dùng và token đăng nhập
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            // Kiểm tra thông tin đăng nhập đầy đủ
            if (credentials.get("email") == null || credentials.get("password") == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp email và mật khẩu"));
            }

            User user = userRepository.findByEmail(credentials.get("email"));

            // Kiểm tra user tồn tại và mật khẩu đúng
            if (user == null || !user.getPassword().equals(credentials.get("password"))) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thông tin đăng nhập không chính xác"));
            }

            // Tạo JWT token
            String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

            // Tạo response
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("email", user.getEmail());
            response.put("firstName", user.getFirstName());
            response.put("lastName", user.getLastName());
            response.put("role", user.getRole());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi đăng nhập: " + e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp email"));
            }

            User user = userRepository.findByEmail(email);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email không tồn tại trong hệ thống"));
            }

            // Generate reset token
            String resetToken = UUID.randomUUID().toString();
            user.setResetToken(resetToken);
            userRepository.save(user);

            // Send reset email
            emailService.sendPasswordResetEmail(email, resetToken);

            return ResponseEntity.ok(Map.of("message", "Vui lòng kiểm tra email của bạn để đặt lại mật khẩu"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi xử lý yêu cầu: " + e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String newPassword = request.get("newPassword");

            if (token == null || newPassword == null || newPassword.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng cung cấp token và mật khẩu mới"));
            }

            User user = userRepository.findByResetToken(token);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Token không hợp lệ hoặc đã hết hạn"));
            }

            // Update password and clear reset token
            user.setPassword(newPassword);
            user.setResetToken(null);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Mật khẩu đã được đặt lại thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Lỗi khi đặt lại mật khẩu: " + e.getMessage()));
        }
    }
}
