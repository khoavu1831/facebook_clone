package com.example.facebook_clone.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    // Sử dụng khóa bí mật mạnh hơn với HMAC-SHA
    private Key secretKey;

    // Thời gian hết hạn token: 30 ngày (tương tự Facebook)
    @Value("${jwt.expiration:2592000000}")
    private long jwtExpirationMs; // Mặc định 30 ngày

    // Khởi tạo khóa bí mật
    public JwtUtil() {
        this.secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS512);
    }

    // Tạo token từ thông tin người dùng
    public String generateToken(String userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        claims.put("email", email);
        claims.put("role", role);

        return createToken(claims, userId);
    }

    // Tạo token với claims và subject
    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(subject)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
                .signWith(secretKey)
                .compact();
    }

    // Lấy tất cả claims từ token
    public Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // Lấy một claim cụ thể từ token
    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // Lấy userId từ token
    public String extractUserId(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    // Lấy ngày hết hạn từ token
    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    // Kiểm tra token đã hết hạn chưa
    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    // Xác thực token
    public Boolean validateToken(String token) {
        try {
            return !isTokenExpired(token);
        } catch (Exception e) {
            return false;
        }
    }
}
