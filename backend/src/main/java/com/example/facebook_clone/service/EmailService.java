package com.example.facebook_clone.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendPasswordResetEmail(String to, String resetToken) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Đặt lại mật khẩu Facebook Clone");
        message.setText(
            "Xin chào,\n\n" +
            "Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản Facebook Clone của mình.\n\n" +
            "Để đặt lại mật khẩu, vui lòng nhấp vào liên kết sau:\n" +
            "http://localhost:3000/reset-password?token=" + resetToken + "\n\n" +
            "Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.\n\n" +
            "Trân trọng,\n" +
            "Đội ngũ Facebook Clone"
        );

        mailSender.send(message);
    }
} 