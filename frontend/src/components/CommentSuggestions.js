import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const CommentSuggestions = ({ postContent, imageUrl, onSelectSuggestion }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!postContent && !imageUrl) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${API_ENDPOINTS.BASE_URL}/api/chat/suggest-comment`, {
          postContent,
          imageUrl
        }, {
          withCredentials: true
        });
        
        // Phân tách các gợi ý (được phân cách bằng dấu |)
        const suggestionList = response.data.suggestions.split('|').map(s => s.trim()).filter(s => s);
        setSuggestions(suggestionList);
      } catch (error) {
        console.error('Lỗi khi lấy gợi ý bình luận:', error);
        setError('Không thể lấy gợi ý bình luận');
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [postContent, imageUrl]);

  if (loading) return <div className="text-center"><small>Đang tạo gợi ý...</small></div>;
  if (error) return null; // Ẩn component nếu có lỗi
  if (suggestions.length === 0) return null;

  return (
    <div className="comment-suggestions mt-2 mb-2">
      <small className="text-muted d-block mb-1">Gợi ý bình luận:</small>
      <div className="d-flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className="btn btn-sm btn-light rounded-pill"
            onClick={() => onSelectSuggestion(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CommentSuggestions;