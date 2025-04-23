package com.example.facebook_clone.controller;

import com.example.facebook_clone.model.PrivateMessage;
import com.example.facebook_clone.model.PrivateMessageRequest;
import com.example.facebook_clone.model.User;
import com.example.facebook_clone.repository.PrivateMessageRepository;
import com.example.facebook_clone.repository.UserRepository;
import com.example.facebook_clone.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/messages")
public class PrivateMessageController {

    @Autowired
    private PrivateMessageRepository privateMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private NotificationService notificationService;

    // Send a new message
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody PrivateMessageRequest request) {
        try {
            // Validate request
            if (request.getSenderId() == null || request.getReceiverId() == null || request.getContent() == null) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }

            // Create new message
            PrivateMessage message = new PrivateMessage();
            message.setSenderId(request.getSenderId());
            message.setReceiverId(request.getReceiverId());
            message.setContent(request.getContent());
            message.setTimestamp(new Date());
            message.setRead(false);

            // Save message
            PrivateMessage savedMessage = privateMessageRepository.save(message);

            // Get sender information to include in the notification
            Optional<User> senderOpt = userRepository.findById(request.getSenderId());
            if (senderOpt.isPresent()) {
                User sender = senderOpt.get();
                Map<String, Object> messageData = new HashMap<>();
                messageData.put("message", savedMessage);
                messageData.put("sender", sender);
                messageData.put("type", "NEW_MESSAGE");

                // Send WebSocket notification to receiver
                messagingTemplate.convertAndSend("/topic/messages/" + request.getReceiverId(), messageData);

                // Create notification for new message
                notificationService.createMessageNotification(
                    request.getReceiverId(),
                    request.getSenderId(),
                    savedMessage.getId()
                );
            }

            return ResponseEntity.ok(savedMessage);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get conversation history between two users
    @GetMapping("/conversation")
    public ResponseEntity<?> getConversation(
            @RequestParam String userId1,
            @RequestParam String userId2) {
        try {
            List<PrivateMessage> messages = privateMessageRepository
                .findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
                    userId1, userId2, userId2, userId1);

            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Mark messages as read
    @PutMapping("/read")
    public ResponseEntity<?> markAsRead(
            @RequestParam String receiverId,
            @RequestParam String senderId) {
        try {
            List<PrivateMessage> unreadMessages = privateMessageRepository
                .findByReceiverIdAndReadFalse(receiverId);

            for (PrivateMessage message : unreadMessages) {
                if (message.getSenderId().equals(senderId)) {
                    message.setRead(true);
                    privateMessageRepository.save(message);
                }
            }

            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Get unread message counts for a user
    @GetMapping("/unread/{userId}")
    public ResponseEntity<?> getUnreadCounts(@PathVariable String userId) {
        try {
            List<PrivateMessage> unreadMessages = privateMessageRepository
                .findByReceiverIdAndReadFalse(userId);

            Map<String, Long> unreadCounts = new HashMap<>();

            for (PrivateMessage message : unreadMessages) {
                String senderId = message.getSenderId();
                unreadCounts.put(senderId,
                    unreadCounts.getOrDefault(senderId, 0L) + 1);
            }

            return ResponseEntity.ok(unreadCounts);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
