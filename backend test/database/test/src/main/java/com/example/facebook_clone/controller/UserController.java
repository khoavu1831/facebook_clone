package com.example.facebook_clone.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.facebook_clone.model.user;
import com.example.facebook_clone.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {
    @Autowired
    private UserRepository userRepository;

    // API lấy danh sách tất cả người dùng
    @GetMapping
    public List<user> getAllUsers() {
        return userRepository.findAll();
    }

    // API thêm mới người dùng
    @PostMapping
    public user addUser(@RequestBody user user) {
        return userRepository.save(user);
    }

    // API lấy người dùng theo ID
    @GetMapping("/{id}")
    public user getUserById(@PathVariable String id) {
        return userRepository.findById(id).orElse(null);
    }
}
