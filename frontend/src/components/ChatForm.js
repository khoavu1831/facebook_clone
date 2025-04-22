import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ChatForm.css";

function ChatForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      console.log('Sending chat message to API');
      const response = await axios.post("/api/chat", {
        message: input,
      }, {
        withCredentials: true
      });

      const geminiMessage = { role: "assistant", content: response.data.reply };
      setMessages((prev) => [...prev, geminiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lỗi: Không thể kết nối đến server." },
      ]);
    }
  };

  return (
    <div className="chat-container">
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={toggleChat}>
          <img
            src="/img/icons/messenger.png"
            alt="Chat Icon"
            style={{ width: "48px", height: "48px" }}
          />
        </button>
      )}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <h5>Chat với Gemini</h5>
            <button className="chat-close-btn" onClick={toggleChat}>
              ×
            </button>
          </div>
          <div className="chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-footer">
            <input
              type="text"
              className="form-control"
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button onClick={handleSend} className="btn btn-primary">
              Gửi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatForm;