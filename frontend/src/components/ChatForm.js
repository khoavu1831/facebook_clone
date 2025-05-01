import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "./ChatForm.css";

/**
 * Component hiển thị form chat với Gemini AI
 */
function ChatForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  /**
   * Bật/tắt cửa sổ chat
   */
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Cuộn xuống cuối cùng của cửa sổ chat
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Cuộn xuống cuối cùng khi tin nhắn thay đổi
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Xử lý khi gửi tin nhắn
   * @param {Event} e - Sự kiện submit form
   */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Thêm tin nhắn của người dùng vào danh sách
    const userMessage = { role: "user", content: input };
    setMessages([...messages, userMessage]);
    setInput("");

    try {
      // Gửi tin nhắn đến API
      const response = await axios.post("/api/chat", {
        message: input,
      }, {
        withCredentials: true
      });

      // Thêm phản hồi từ Gemini vào danh sách tin nhắn
      const geminiMessage = { role: "assistant", content: response.data.reply };
      setMessages((prev) => [...prev, geminiMessage]);
    } catch (error) {
      console.error("Lỗi khi gửi tin nhắn:", error);
      // Hiển thị thông báo lỗi
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Lỗi: Không thể kết nối đến server." },
      ]);
    }
  };

  return (
    <div className="chat-container">
      {/* Nút mở cửa sổ chat */}
      {!isOpen && (
        <button
          className="chat-toggle-btn"
          onClick={toggleChat}
          aria-label="Mở cửa sổ chat với Gemini"
        >
          <img
            src="/img/icons/messenger.png"
            alt="Biểu tượng chat"
            style={{ width: "48px", height: "48px" }}
          />
        </button>
      )}

      {/* Cửa sổ chat */}
      {isOpen && (
        <div className="chat-window">
          {/* Phần tiêu đề chat */}
          <div className="chat-header">
            <h5>Chat với Gemini</h5>
            <button
              className="chat-close-btn"
              onClick={toggleChat}
              aria-label="Đóng cửa sổ chat"
            >
              ×
            </button>
          </div>

          {/* Phần nội dung chat */}
          <div className="chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.content}
              </div>
            ))}
            {/* Tham chiếu để cuộn xuống cuối cùng */}
            <div ref={messagesEndRef} />
          </div>

          {/* Phần nhập tin nhắn */}
          <div className="chat-footer">
            <form onSubmit={handleSend}>
              <input
                type="text"
                className="form-control"
                placeholder="Nhập tin nhắn..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Nhập tin nhắn"
              />
              <button
                type="submit"
                className="btn btn-primary"
                aria-label="Gửi tin nhắn"
              >
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatForm;