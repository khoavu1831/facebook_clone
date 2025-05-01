package com.example.facebook_clone.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/chat")
@PropertySource("classpath:secrets.properties")
public class ChatController {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody ChatRequest request) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
                + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        String body = "{\"contents\": [{\"parts\": [{\"text\": \"" + request.getMessage() + "\"}]}]}";
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        // Parse response and extract the reply (simplified)
        // In a real app, use a JSON parser like Jackson
        String reply = extractReply(response.getBody());

        return ResponseEntity.ok(new ChatResponse(reply));
    }

    private String extractReply(String responseBody) {
        try {
            // Dùng Jackson hoặc Gson để parse JSON
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(responseBody);
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (Exception e) {
            return "Lỗi khi xử lý phản hồi từ Gemini";
        }
    }

    @PostMapping("/suggest-comment")
    public ResponseEntity<?> suggestComment(@RequestBody SuggestCommentRequest request) {
        String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="
                + geminiApiKey;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");

        // Tạo prompt cho Gemini
        String prompt = "Gợi ý 3 bình luận ngắn gọn, tích cực và phù hợp cho bài đăng sau (mỗi bình luận không quá 50 ký tự, phân tách bằng dấu |): ";
        
        if (request.getPostContent() != null) {
            prompt += "Nội dung bài đăng: " + request.getPostContent();
        }
        
        if (request.getImageUrl() != null) {
            prompt += " Bài đăng có hình ảnh: " + request.getImageUrl();
        }

        String body = "{\"contents\": [{\"parts\": [{\"text\": \"" + prompt + "\"}]}]}";
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        String suggestions = extractReply(response.getBody());

        return ResponseEntity.ok(new CommentSuggestionResponse(suggestions));
    }
}

class ChatRequest {
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

class ChatResponse {
    private String reply;

    public ChatResponse(String reply) {
        this.reply = reply;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }
}

class SuggestCommentRequest {
    private String postContent;
    private String imageUrl;

    public String getPostContent() {
        return postContent;
    }

    public void setPostContent(String postContent) {
        this.postContent = postContent;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }
}

class CommentSuggestionResponse {
    private String suggestions;

    public CommentSuggestionResponse(String suggestions) {
        this.suggestions = suggestions;
    }

    public String getSuggestions() {
        return suggestions;
    }

    public void setSuggestions(String suggestions) {
        this.suggestions = suggestions;
    }
}
