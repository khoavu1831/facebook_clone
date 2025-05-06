import React, { useState, useEffect, memo, useRef, useCallback } from 'react';
import { API_ENDPOINTS } from '../../config/api';
import './PostList.css';
import SharePostModal from './SharePostModal';
import { webSocketService } from '../../services/websocket';
import { useToast } from '../../context/ToastContext';
import PostOptionsMenu from './PostOptionsMenu';
import ImageViewerModal from './ImageViewerModal';
import { useNavigate } from 'react-router-dom';
import CommentSuggestions from '../CommentSuggestions';
import { Modal, Button } from 'react-bootstrap';

/**
 * Component hiển thị nội dung bài đăng, được memo để tránh render lại không cần thiết
 * @param {Object} props - Props của component
 * @param {Object} props.post - Thông tin bài đăng
 * @param {Function} props.onImageClick - Hàm xử lý khi click vào hình ảnh
 */
const PostContent = memo(({ post, onImageClick }) => {
  const isSharedPost = post.isShared || post.shared;

  /**
   * Lấy URL đầy đủ của hình ảnh avatar
   * @param {string} path - Đường dẫn hình ảnh
   * @returns {string} URL đầy đủ của hình ảnh
   */
  const getFullImageUrl = (path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  /**
   * Lấy URL đầy đủ của media (hình ảnh, video)
   * @param {string} path - Đường dẫn media
   * @returns {string|null} URL đầy đủ của media hoặc null nếu không có
   */
  const getFullMediaUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  return (
    <div className="post-content">
      {isSharedPost && (
        <div className="shared-comment mb-3">
          <p>{post.content}</p>
        </div>
      )}

      {isSharedPost && post.originalPost ? (
        <div className="shared-post border rounded p-3">
          <div className="d-flex align-items-center mb-2">
            <img
              src={getFullImageUrl(post.originalPost.user?.avatar)}
              alt={post.originalPost.user?.firstName || 'User'}
              className="rounded-circle me-2"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            />
            <div>
              <div className="fw-bold">
                {post.originalPost.user
                  ? `${post.originalPost.user.firstName || ''} ${post.originalPost.user.lastName || ''}`
                  : 'Người dùng không xác định'}
              </div>
              <div className="text-muted small">
                {post.originalPost.createdAt
                  ? new Date(post.originalPost.createdAt).toLocaleString()
                  : ''}
              </div>
            </div>
          </div>

          <div className="original-post-content">
            <p>{post.originalPost.content}</p>

            {post.originalPost.images?.length > 0 && (
              <div className="media-grid mb-3" data-count={post.originalPost.images.length}>
                {post.originalPost.images.map((image, index) => (
                  <div
                    key={index}
                    className="media-item"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onImageClick) onImageClick(post.originalPost.images, index);
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <img
                      src={getFullMediaUrl(image)}
                      alt="Nội dung bài đăng"
                      className="img-fluid rounded"
                    />
                  </div>
                ))}
              </div>
            )}

            {post.originalPost.videos?.length > 0 && (
              <div className="media-grid mb-3" data-count={post.originalPost.videos.length}>
                {post.originalPost.videos.map((video, index) => (
                  <div key={index} className="media-item">
                    <video
                      src={getFullMediaUrl(video)}
                      controls
                      className="img-fluid rounded"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : !isSharedPost ? (
        <>
          <p>{post.content}</p>
          {post.images?.length > 0 && (
            <div className="media-grid mb-3" data-count={post.images.length}>
              {post.images.map((image, index) => (
                <div
                  key={index}
                  className="media-item"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onImageClick) onImageClick(post.images, index);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <img
                    src={getFullMediaUrl(image)}
                    alt="Nội dung bài đăng"
                    className="img-fluid rounded"
                  />
                </div>
              ))}
            </div>
          )}
          {post.videos?.length > 0 && (
            <div className="media-grid mb-3" data-count={post.videos.length}>
              {post.videos.map((video, index) => (
                <div key={index} className="media-item">
                  <video
                    src={getFullMediaUrl(video)}
                    controls
                    className="img-fluid rounded"
                  />
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="alert alert-warning">
          Bài đăng gốc không còn tồn tại
        </div>
      )}
    </div>
  );
});

/**
 * Component hiển thị bình luận
 * @param {Object} props - Props của component
 * @param {Object} props.comment - Thông tin bình luận
 * @param {string} props.postId - ID của bài đăng
 * @param {Function} props.onReply - Hàm xử lý khi trả lời bình luận
 * @param {Function} props.onDelete - Hàm xử lý khi xóa bình luận
 * @param {Object} props.currentUser - Thông tin người dùng hiện tại
 * @param {Object} props.userProfile - Thông tin profile người dùng
 * @param {Function} props.getFullImageUrl - Hàm lấy URL đầy đủ của hình ảnh
 * @param {number} props.depth - Độ sâu của bình luận (mặc định: 0)
 */
const Comment = ({ comment, postId, onReply, onDelete, currentUser, userProfile, getFullImageUrl, depth = 0 }) => {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const MAX_REPLY_DEPTH = 4; // Giới hạn độ sâu tối đa (0,1,2,3 = 4 tầng)

  // Kiểm tra xem có thể reply tiếp không
  const canReply = depth < MAX_REPLY_DEPTH;

  // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu bình luận không
  const isCommentOwner = currentUser?.id === comment.userId;

  if (!currentUser) {
    return null;
  }

  const MAX_VISIBLE_REPLIES = 0; // Mặc định không hiển thị phản hồi con
  const MAX_DEPTH = 4; // Giới hạn độ sâu của nested replies để tránh quá nhiều indent

  /**
   * Xử lý khi trả lời bình luận
   */
  const handleReply = async () => {
    if (!replyContent.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await onReply(postId, replyContent, comment.id);
      setReplyContent('');
      setShowReplyInput(false);
    } catch (error) {
      // Không cần hiển thị alert ở đây nữa vì đã được xử lý ở handleComment
      console.error('Lỗi khi trả lời bình luận:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const displayedReplies = showAllReplies
    ? comment.replies
    : comment.replies?.slice(0, MAX_VISIBLE_REPLIES);

  // Luôn hiển thị nút "Xem thêm phản hồi" nếu có phản hồi con
  const hasMoreReplies = comment.replies?.length > 0;
  const marginLeft = depth < MAX_DEPTH ? `${depth * 32}px` : `${MAX_DEPTH * 32}px`;

  return (
    <div className="comment-thread" style={{ marginLeft }}>
      <div className="comment-main d-flex gap-2 mb-2">
        <img
          src={getFullImageUrl(comment.user?.avatar)}
          alt="User"
          className="rounded-circle"
          style={{ width: '32px', height: '32px', objectFit: 'cover' }}
        />
        <div className="flex-grow-1">
          <div className="bg-light p-2 rounded comment-text">
            <div className="fw-bold">
              {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : 'Unknown User'}
            </div>
            {comment.content}
          </div>

          <div className="comment-actions mt-1 d-flex align-items-center">
            <button
              className="btn btn-link btn-sm p-0 text-muted me-2"
              onClick={() => setShowReplyInput(!showReplyInput)}
            >
              Phản hồi
            </button>
            {isCommentOwner && (
              <button
                className="btn btn-link btn-sm p-0 text-danger me-2"
                onClick={() => onDelete(postId, comment.id)}
              >
                <i className="bi bi-trash-fill"></i> Xóa
              </button>
            )}
            <small className="text-muted ms-auto">
              {new Date(comment.createdAt).toLocaleString()}
            </small>
          </div>

          {showReplyInput && (
            <div className="reply-input-container d-flex gap-2 mt-2">
              <img
                src={userProfile?.avatar ? getFullImageUrl(userProfile.avatar) : '/default-imgs/avatar.png'}
                alt="Current user"
                className="rounded-circle"
                style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = '/default-imgs/avatar.png';  // Fallback khi load ảnh lỗi
                }}
              />
              <div className="flex-grow-1">
                <div className="position-relative">
                  <input
                    type="text"
                    className="form-control form-control-sm rounded-pill"
                    placeholder={`Phản hồi ${comment.user?.firstName}...`}
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                        e.preventDefault();
                        handleReply();
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Hiển thị replies */}
      {comment.replies && comment.replies.length > 0 && (
        <>
          {!showAllReplies && (
            <div className="view-replies-wrapper">
              <button
                className="btn btn-link btn-sm text-primary mb-2 view-replies-btn"
                onClick={() => setShowAllReplies(true)}
              >
                <span className="view-replies-icon"><i className="bi bi-arrow-return-right"></i></span>
                <span className="view-replies-text">Xem {comment.replies.length} phản hồi</span>
              </button>
            </div>
          )}

          {showAllReplies && (
            <div className="replies-container">
              {displayedReplies?.map((reply, index) => (
                <Comment
                  key={reply.id || index}
                  comment={reply}
                  postId={postId}
                  onReply={onReply}
                  onDelete={onDelete}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  getFullImageUrl={getFullImageUrl}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Component hiển thị một bài đăng, được memo để tránh render lại không cần thiết
 * @param {Object} props - Props của component
 * @param {Object} props.post - Thông tin bài đăng
 * @param {Object} props.currentUser - Thông tin người dùng hiện tại
 * @param {Object} props.userProfile - Thông tin profile người dùng
 * @param {Function} props.handleLike - Hàm xử lý khi thích bài đăng
 * @param {Function} props.handleComment - Hàm xử lý khi bình luận bài đăng
 * @param {Function} props.handleShareClick - Hàm xử lý khi chia sẻ bài đăng
 * @param {Function} props.handleDeletePost - Hàm xử lý khi xóa bài đăng
 * @param {Function} props.handleEditPost - Hàm xử lý khi chỉnh sửa bài đăng
 * @param {Function} props.handleEditPostWithMedia - Hàm xử lý khi chỉnh sửa bài đăng có media
 * @param {Function} props.handleDeleteComment - Hàm xử lý khi xóa bình luận
 * @param {Object} props.commentInputs - Dữ liệu nhập vào của bình luận
 * @param {Function} props.setCommentInputs - Hàm cập nhật dữ liệu nhập vào của bình luận
 * @param {Object} props.isLoading - Trạng thái đang tải
 */
const PostItem = memo(({ post, currentUser, userProfile, handleLike, handleComment, handleShareClick, handleDeletePost, handleEditPost, handleEditPostWithMedia, handleDeleteComment, commentInputs, setCommentInputs, isLoading }) => {
  const navigate = useNavigate();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /**
   * Lấy URL đầy đủ của hình ảnh
   * @param {string} path - Đường dẫn hình ảnh
   * @returns {string} URL đầy đủ của hình ảnh
   */
  const getFullImageUrl = useCallback((path) => {
    if (!path) return '/default-imgs/avatar.png';
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_ENDPOINTS.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  }, []);

  /**
   * Xử lý khi click vào avatar
   * @param {string} userId - ID của người dùng
   */
  const handleAvatarClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  // Kiểm tra xem người dùng hiện tại có phải là chủ sở hữu bài viết không
  const isPostOwner = currentUser?.id === post.userId;

  // State cho chế độ chỉnh sửa
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [editPrivacy, setEditPrivacy] = useState(post.privacy || 'PUBLIC');
  const [editMedia, setEditMedia] = useState([]);
  const [editMediaPreview, setEditMediaPreview] = useState([]);
  const [keepImages, setKeepImages] = useState(post.images || []);
  const [keepVideos, setKeepVideos] = useState(post.videos || []);

  /**
   * Xử lý khi thêm media mới khi đang chỉnh sửa
   * @param {Event} e - Sự kiện thay đổi input
   */
  const handleEditMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setEditMedia(prevMedia => [...prevMedia, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setEditMediaPreview(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  // Dọn dẹp URL blob khi component unmount
  useEffect(() => {
    return () => {
      // Xóa các URL object đã tạo để tránh memory leak
      editMediaPreview.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [editMediaPreview]);

  /**
   * Xử lý khi xóa hình ảnh đã có
   * @param {number} index - Vị trí của hình ảnh
   */
  const handleRemoveExistingImage = (index) => {
    setKeepImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  /**
   * Xử lý khi xóa video đã có
   * @param {number} index - Vị trí của video
   */
  const handleRemoveExistingVideo = (index) => {
    setKeepVideos(prevVideos => prevVideos.filter((_, i) => i !== index));
  };

  /**
   * Xử lý khi xóa media mới thêm vào
   * @param {number} index - Vị trí của media
   */
  const handleRemoveNewMedia = (index) => {
    // Lấy URL của preview để xóa
    const previewUrl = editMediaPreview[index];
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    // Cập nhật state
    setEditMedia(prevMedia => prevMedia.filter((_, i) => i !== index));
    setEditMediaPreview(prevPreviews => prevPreviews.filter((_, i) => i !== index));
  };

  /**
   * Đặt lại trạng thái chỉnh sửa khi hủy
   */
  const resetEditState = () => {
    // Đóng form edit
    setIsEditing(false);

    // Reset các state về giá trị ban đầu
    setEditContent(post.content);
    setEditPrivacy(post.privacy || 'PUBLIC');
    setEditMedia([]);
    setEditMediaPreview([]);
    setKeepImages(post.images || []);
    setKeepVideos(post.videos || []);

    // Xóa các URL object đã tạo để tránh memory leak
    editMediaPreview.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    });
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div id={`post-${post.id}`} key={post.id} className="card mb-3">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-3">
          <img
            src={getFullImageUrl(post.user?.avatar)}
            alt="Người dùng"
            className="rounded-circle"
            style={{ width: '40px', height: '40px', objectFit: 'cover', cursor: 'pointer' }}
            onClick={() => handleAvatarClick(post.user?.id)}
          />
          <div className="flex-grow-1">
            <div
              className="fw-bold"
              style={{ cursor: 'pointer' }}
              onClick={() => handleAvatarClick(post.user?.id)}
            >
              {post.user ? `${post.user.firstName} ${post.user.lastName}` : 'Người dùng không xác định'}
            </div>
            <div className="d-flex align-items-center">
              <small className="text-secondary me-2">
                {new Date(post.createdAt).toLocaleString()}
              </small>
              <small className="text-secondary d-flex align-items-center">
                <i className={`bi ${post.privacy === 'PUBLIC' ? 'bi-globe' : 'bi-lock-fill'} me-1`}></i>
                <span className="privacy-text d-none d-sm-inline">{post.privacy === 'PUBLIC' ? 'Công khai' : 'Riêng tư'}</span>
              </small>
            </div>
          </div>

          {isPostOwner && (
            <div className="post-options">
              <PostOptionsMenu
                postId={post.id}
                onEdit={() => setIsEditing(true)}
                onDelete={() => handleDeletePost(post.id)}
              />
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="edit-post-container mb-3">
            <textarea
              className="form-control mb-2"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows="3"
              disabled={isLoading[`edit_${post.id}`]}
            ></textarea>

            {/* Hiển thị tất cả media (cả hiện có và mới thêm) */}
            {(keepImages.length > 0 || keepVideos.length > 0 || editMediaPreview.length > 0) && (
              <div className="mb-3">
                <div className="media-grid mb-2" data-count={keepImages.length + keepVideos.length + editMediaPreview.length}>
                  {/* Hiển thị hình ảnh hiện có */}
                  {keepImages.map((image, index) => (
                    <div key={`existing-img-${index}`} className="media-item position-relative">
                      <img
                        src={getFullImageUrl(image)}
                        alt={`Hình ảnh ${index + 1}`}
                        className="img-fluid rounded"
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                        style={{ width: '24px', height: '24px', padding: '0', lineHeight: '24px' }}
                        onClick={() => handleRemoveExistingImage(index)}
                        disabled={isLoading[`edit_${post.id}`]}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}

                  {/* Hiển thị video hiện có */}
                  {keepVideos.map((video, index) => (
                    <div key={`existing-video-${index}`} className="media-item position-relative">
                      <video
                        src={getFullImageUrl(video)}
                        controls
                        className="img-fluid rounded"
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                        style={{ width: '24px', height: '24px', padding: '0', lineHeight: '24px' }}
                        onClick={() => handleRemoveExistingVideo(index)}
                        disabled={isLoading[`edit_${post.id}`]}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}

                  {/* Hiển thị media mới thêm vào */}
                  {editMediaPreview.map((preview, index) => (
                    <div key={`new-media-${index}`} className="media-item position-relative">
                      {editMedia[index].type.includes('video') ? (
                        <video
                          src={preview}
                          controls
                          className="img-fluid rounded"
                        />
                      ) : (
                        <img
                          src={preview}
                          alt={`Hình ảnh mới ${index + 1}`}
                          className="img-fluid rounded"
                        />
                      )}
                      <button
                        type="button"
                        className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
                        style={{ width: '24px', height: '24px', padding: '0', lineHeight: '24px' }}
                        onClick={() => handleRemoveNewMedia(index)}
                        disabled={isLoading[`edit_${post.id}`]}
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút thêm media */}
            <div className="d-flex mb-3">
              <label htmlFor="edit-media-upload" className="btn btn-outline-secondary btn-sm">
                <i className="bi bi-image me-1"></i> Thêm ảnh/video
                <input
                  id="edit-media-upload"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleEditMediaChange}
                  style={{ display: 'none' }}
                  disabled={isLoading[`edit_${post.id}`]}
                  multiple
                />
              </label>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="privacy-selector">
                <select
                  className="form-select form-select-sm"
                  value={editPrivacy}
                  onChange={(e) => setEditPrivacy(e.target.value)}
                  aria-label="Chọn quyền riêng tư"
                  disabled={isLoading[`edit_${post.id}`]}
                >
                  <option value="PUBLIC">Công khai</option>
                  <option value="PRIVATE">Riêng tư</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={resetEditState}
                  disabled={isLoading[`edit_${post.id}`]}
                >
                  Hủy
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={async () => {
                    let success = false;
                    if (editMedia.length > 0 || keepImages.length !== (post.images?.length || 0) || keepVideos.length !== (post.videos?.length || 0)) {
                      // Nếu có thay đổi về media, sử dụng API update-with-media
                      success = await handleEditPostWithMedia(post.id, editContent, editPrivacy, editMedia, keepImages, keepVideos);
                    } else {
                      // Nếu chỉ thay đổi nội dung hoặc quyền riêng tư, sử dụng API thông thường
                      success = await handleEditPost(post.id, editContent, editPrivacy);
                    }
                    // Chỉ đóng form edit nếu cập nhật thành công
                    if (success) {
                      setIsEditing(false);
                    }
                  }}
                  disabled={isLoading[`edit_${post.id}`]}
                >
                  {isLoading[`edit_${post.id}`] ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                      Đang lưu...
                    </>
                  ) : 'Lưu'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="post-content-container"
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            <PostContent
              post={post}
              onImageClick={(images, index) => {
                setSelectedImages(images);
                setSelectedImageIndex(index);
                setShowImageViewer(true);
              }}
            />
            {post.privacy === 'PRIVATE' && (
              <div className="privacy-indicator mt-1">
                <small className="text-muted">
                  <i className="bi bi-lock-fill me-1"></i> Riêng tư
                </small>
              </div>
            )}
          </div>
        )}

        <div className="d-flex gap-3 mb-3">
          <button
            className={`btn btn-link like-button ${post.likes?.includes(currentUser.id) ? 'text-primary' : 'text-secondary'}`}
            onClick={() => handleLike(post.id)}
          >
            <img
              src={post.likes?.includes(currentUser.id) ? "/img/icons/liked.png" : "/img/icons/like.png"}
              alt="Thích"
              className="action-icon"
            />
            <span>{post.likes?.length || 0} Thích</span>
          </button>
          <button
            className="btn btn-link text-secondary"
            onClick={() => navigate(`/posts/${post.id}`)}
          >
            <img
              src="/img/icons/comment.png"
              alt="Bình luận"
              className="action-icon"
            />
            <span>{post.comments?.length || 0} Bình luận</span>
          </button>
          <button
            className="btn btn-link text-secondary"
            onClick={() => handleShareClick(post)}
          >
            <img
              src="/img/icons/share.png"
              alt="Chia sẻ"
              className="action-icon"
            />
            <span>Chia sẻ</span>
          </button>
        </div>

        <div className="comments-section">
          {post.comments?.slice(0, 2).map((comment, index) => (
              !comment.parentId && (
                <Comment
                  key={comment.id || index}
                  comment={comment}
                  postId={post.id}
                  onReply={handleComment}
                  onDelete={handleDeleteComment}
                  currentUser={currentUser}
                  userProfile={userProfile}
                  getFullImageUrl={getFullImageUrl}
                />
              )
            ))}
          {post.comments?.length > 2 && (
            <button
              className="btn btn-link text-primary mb-2"
              onClick={() => navigate(`/posts/${post.id}`)}
            >
              Xem thêm {post.comments.length - 2} bình luận
            </button>
          )}

          {/* Input để thêm comment mới */}
          <div className="d-flex gap-2 align-items-center mt-3">
            <img
              src={userProfile?.avatar ? getFullImageUrl(userProfile.avatar) : '/default-imgs/avatar.png'}
              alt="Current user"
              className="rounded-circle"
              style={{ width: '30px', height: '30px', objectFit: 'cover' }}
              onError={(e) => {
                e.target.src = '/default-imgs/avatar.png';
              }}
            />
            <div className="flex-grow-1 position-relative">
              <div className="d-flex align-items-center">
                <input
                  type="text"
                  className="form-control rounded-pill comment-input"
                  placeholder="Viết bình luận..."
                  value={commentInputs[post.id] || ''}
                  onChange={(e) => setCommentInputs(prev => ({
                    ...prev,
                    [post.id]: e.target.value
                  }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading[post.id]) {
                      handleComment(post.id, e.target.value);
                    }
                  }}
                />
                <button
                  className="btn btn-link text-primary ms-2"
                  onClick={() => !isLoading[post.id] && handleComment(post.id, commentInputs[post.id])}
                  disabled={isLoading[post.id] || !commentInputs[post.id]?.trim()}
                >
                  <i className="bi bi-send-fill"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Viewer Modal */}
      {showImageViewer && (
        <ImageViewerModal
          show={showImageViewer}
          onHide={() => setShowImageViewer(false)}
          images={selectedImages}
          initialIndex={selectedImageIndex}
          getFullImageUrl={getFullImageUrl}
        />
      )}
    </div>
  );
});

const PostList = ({ posts: initialPosts, currentUser }) => {
  const [posts, setPosts] = useState(initialPosts || []);
  const [commentInputs, setCommentInputs] = useState({});
  const [isLoading, setIsLoading] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const listRef = useRef(null);
  const subscribedPosts = useRef(new Set());
  const [isLoggedIn, setIsLoggedIn] = useState(!!currentUser);
  const { showSuccess, showError } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);

  // Sort posts by createdAt in descending order (newest first)
  useEffect(() => {
    if (Array.isArray(initialPosts)) {
      const sortedPosts = [...initialPosts].sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
      setPosts(sortedPosts.filter(post => post && post.id));
    }
  }, [initialPosts]);

  // Sort posts when receiving WebSocket updates
  const handleWebSocketUpdate = useCallback((updatedPost) => {
    setPosts(prevPosts => {
      const newPosts = prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      );
      return newPosts.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    });
  }, []);

  // Handle post highlighting when postId is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');

    if (postId) {
      // Check if we're coming from a notification click
      const isFromNotification = document.referrer.includes('/notifications') ||
                               document.referrer.includes('/friends') ||
                               document.referrer.includes('/profile');

      if (isFromNotification) {
        // Wait for posts to be loaded
      const checkAndHighlightPost = () => {
          const postElement = document.getElementById(`post-${postId}`);
        if (postElement) {
          postElement.scrollIntoView({ behavior: 'smooth' });
          postElement.classList.add('highlight-post');
          setTimeout(() => {
            postElement.classList.remove('highlight-post');
          }, 2000);
        } else {
            // If post not found yet, try again after a short delay
          setTimeout(checkAndHighlightPost, 100);
        }
      };

      checkAndHighlightPost();
    }
    }
  }, [posts]); // Re-run when posts change

  // Fetch user profile to get avatar
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        if (!currentUser?.id) return;

        const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/profile/${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserProfile(data);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [currentUser?.id]);

  const handleShareSuccess = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const handleLike = async (postId) => {
    try {
      await fetch(`${API_ENDPOINTS.POSTS}/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          userId: JSON.parse(localStorage.getItem('userData')).id
        })
      });
      // Không cần setPosts vì sẽ nhận update qua WebSocket
    } catch (error) {
      console.error('Lỗi khi thích bài đăng:', error);
      alert('Không thể thích bài đăng. Vui lòng thử lại.');
    }
  };

  const handleComment = async (postId, content, parentId = null) => {
    if (!content?.trim() || isLoading[postId]) return;

    setIsLoading(prev => ({ ...prev, [postId]: true }));
    try {
      const response = await fetch(`${API_ENDPOINTS.POSTS}/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          content: content,
          parentId: parentId,
          userId: currentUser.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        // Kiểm tra message từ backend
        if (data === "Maximum reply depth reached") {
          throw new Error("Maximum reply depth reached");
        }
        throw new Error(data || 'Lỗi kết nối mạng');
      }

      // Không cần thêm comment vào UI ngay lập tức vì sẽ nhận update qua WebSocket
      // Chỉ cần xóa nội dung input
      if (!parentId) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      }
    } catch (error) {
      console.error('Lỗi khi bình luận:', error);
      if (error.message === "Maximum reply depth reached") {
        alert('Không thể trả lời thêm. Đã đạt giới hạn độ sâu của bình luận.');
      } else {
        alert("Đã đạt giới hạn phản hồi bình luận");
      }
      throw error; // Thêm dòng này để propagate error lên component cha
    } finally {
      setIsLoading(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleShareClick = (post) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  // Xử lý xóa bài viết
  const handleDeletePost = async (postId) => {
    setPostToDelete(postId);
    setShowDeleteModal(true);
  };

  // Thực hiện xóa bài viết sau khi xác nhận
  const confirmDeletePost = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postToDelete}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền xóa bài viết này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể xóa bài viết');
      }

      // Xóa bài viết khỏi UI
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postToDelete));
      showSuccess('Xóa bài viết thành công');

      // Hủy đăng ký WebSocket
      webSocketService.unsubscribeFromPost(postToDelete);
      subscribedPosts.current.delete(postToDelete);
      
      // Đóng modal
      setShowDeleteModal(false);
      setPostToDelete(null);
    } catch (error) {
      console.error('Lỗi khi xóa bài viết:', error);
      showError(error.message || 'Không thể xóa bài viết. Vui lòng thử lại.');
      setShowDeleteModal(false);
    }
  };

  // Xử lý sửa bài viết (chỉ nội dung và quyền riêng tư)
  const handleEditPost = async (postId, content, privacy) => {
    // Cho phép nội dung trống

    // Cập nhật trạng thái loading
    setIsLoading(prev => ({ ...prev, [`edit_${postId}`]: true }));

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          content: content,
          userId: currentUser.id,
          privacy: privacy
        })
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền sửa bài viết này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể cập nhật bài viết');
      }

      const updatedPost = await response.json();

      // Cập nhật bài viết trong UI
      setPosts(prevPosts => {
        // Tìm bài viết cần cập nhật
        const postIndex = prevPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return prevPosts;

        // Tạo bản sao của mảng posts
        const newPosts = [...prevPosts];

        // Cập nhật bài viết với dữ liệu mới
        newPosts[postIndex] = {
          ...newPosts[postIndex],
          content: updatedPost.content,
          privacy: updatedPost.privacy
        };

        return newPosts;
      });

      showSuccess('Cập nhật bài viết thành công');
      return true; // Trả về true để component PostItem biết là cập nhật thành công
    } catch (error) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      showError(error.message || 'Không thể cập nhật bài viết. Vui lòng thử lại.');
      return false;
    } finally {
      // Reset trạng thái loading
      setIsLoading(prev => ({ ...prev, [`edit_${postId}`]: false }));
    }
  };

  // Xử lý sửa bài viết có kèm media
  const handleEditPostWithMedia = async (postId, content, privacy, media, keepImages, keepVideos) => {
    // Cho phép nội dung trống nếu có ít nhất một hình ảnh hoặc video
    if (!content.trim() && (!media || media.length === 0) && (!keepImages || keepImages.length === 0) && (!keepVideos || keepVideos.length === 0)) {
      showError('Bài viết phải có nội dung hoặc ít nhất một hình ảnh/video');
      return;
    }

    // Cập nhật trạng thái loading
    setIsLoading(prev => ({ ...prev, [`edit_${postId}`]: true }));

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('userId', currentUser.id);
      formData.append('privacy', privacy);

      // Thêm các hình ảnh giữ lại
      if (keepImages && keepImages.length > 0) {
        keepImages.forEach(image => {
          formData.append('keepImages', image);
        });
      }

      // Thêm các video giữ lại
      if (keepVideos && keepVideos.length > 0) {
        keepVideos.forEach(video => {
          formData.append('keepVideos', video);
        });
      }

      // Thêm các media mới
      if (media && media.length > 0) {
        media.forEach(file => {
          if (file.type.includes('image')) {
            formData.append('images', file);
          } else if (file.type.includes('video')) {
            formData.append('videos', file);
          }
        });
      }

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/update-with-media`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền sửa bài viết này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể cập nhật bài viết');
      }

      const updatedPost = await response.json();

      // Cập nhật bài viết trong UI
      setPosts(prevPosts => {
        // Tìm bài viết cần cập nhật
        const postIndex = prevPosts.findIndex(p => p.id === postId);
        if (postIndex === -1) return prevPosts;

        // Tạo bản sao của mảng posts
        const newPosts = [...prevPosts];

        // Cập nhật bài viết với dữ liệu mới
        newPosts[postIndex] = {
          ...newPosts[postIndex],
          content: updatedPost.content,
          privacy: updatedPost.privacy,
          images: updatedPost.images || [],
          videos: updatedPost.videos || []
        };

        return newPosts;
      });

      showSuccess('Cập nhật bài viết thành công');
      return true; // Trả về true để component PostItem biết là cập nhật thành công
    } catch (error) {
      console.error('Lỗi khi cập nhật bài viết:', error);
      showError(error.message || 'Không thể cập nhật bài viết. Vui lòng thử lại.');
      return false;
    } finally {
      // Reset trạng thái loading
      setIsLoading(prev => ({ ...prev, [`edit_${postId}`]: false }));
    }
  };

  // Xử lý xóa bình luận
  const handleDeleteComment = async (postId, commentId) => {
    setCommentToDelete({ postId, commentId });
    setShowDeleteCommentModal(true);
  };

  // Thực hiện xóa bình luận sau khi xác nhận
  const confirmDeleteComment = async () => {
    const { postId, commentId } = commentToDelete;
    
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/posts/${postId}/comments/${commentId}?userId=${currentUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Bạn không có quyền xóa bình luận này');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể xóa bình luận');
      }

      const updatedPost = await response.json();

      // Cập nhật bài viết với bình luận đã xóa
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId ? updatedPost : post
        )
      );

      showSuccess('Xóa bình luận thành công');
    } catch (error) {
      console.error('Lỗi khi xóa bình luận:', error);
      showError(error.message || 'Không thể xóa bình luận. Vui lòng thử lại.');
    } finally {
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    }
  };

  // WebSocket setup for real-time updates
  useEffect(() => {
    let isComponentMounted = true;
    let retryTimeout = null;
    const currentSubscribedPosts = subscribedPosts.current;

    const setupWebSocket = async () => {
      try {
        console.log('PostList: Setting up WebSocket connection');
        await webSocketService.connect();

        if (!isComponentMounted) return;

        if (posts && posts.length > 0) {
          // Unsubscribe from posts that are no longer in the list
          const currentPostIds = new Set(posts.map(post => post?.id).filter(Boolean));
          const postsToUnsubscribe = [...currentSubscribedPosts].filter(postId => !currentPostIds.has(postId));

          postsToUnsubscribe.forEach(postId => {
            console.log(`PostList: Unsubscribing from post ${postId} as it's no longer in the list`);
            webSocketService.unsubscribeFromPost(postId);
            currentSubscribedPosts.delete(postId);
          });

          // Subscribe to new posts
          for (const post of posts) {
            if (!post?.id || currentSubscribedPosts.has(post.id)) continue;

            console.log(`PostList: Subscribing to post ${post.id}`);
            currentSubscribedPosts.add(post.id);
            try {
              await webSocketService.subscribeToPost(post.id, handleWebSocketUpdate);
            } catch (error) {
              console.error(`PostList: Failed to subscribe to post ${post.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('PostList: Failed to setup WebSocket:', error);
        if (isComponentMounted) {
          retryTimeout = setTimeout(setupWebSocket, 5000);
        }
      }
    };

    setupWebSocket();

    return () => {
      console.log('PostList: Cleaning up WebSocket subscriptions');
      isComponentMounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }

      currentSubscribedPosts.forEach(postId => {
        console.log(`PostList: Unsubscribing from post ${postId} during cleanup`);
        webSocketService.unsubscribeFromPost(postId);
      });
      currentSubscribedPosts.clear();
    };
  }, [posts, handleWebSocketUpdate]);

  // Cập nhật isLoggedIn khi currentUser thay đổi
  useEffect(() => {
    setIsLoggedIn(!!currentUser);
  }, [currentUser]);

  if (!isLoggedIn) {
    return <div className="alert alert-warning">Vui lòng đăng nhập để xem bài viết</div>;
  }

  return (
    <div className="post-list-container" ref={listRef} style={{ overflowY: 'auto' }}>
      {Array.isArray(posts) && posts.map((post) => (
        post && post.id ? (
          <PostItem
            key={post.id}
            post={post}
            currentUser={currentUser}
            userProfile={userProfile}
            handleLike={handleLike}
            handleComment={handleComment}
            handleShareClick={handleShareClick}
            handleDeletePost={handleDeletePost}
            handleEditPost={handleEditPost}
            handleEditPostWithMedia={handleEditPostWithMedia}
            handleDeleteComment={handleDeleteComment}
            commentInputs={commentInputs}
            setCommentInputs={setCommentInputs}
            isLoading={isLoading}
          />
        ) : null
      ))}
      {showShareModal && selectedPost && (
        <SharePostModal
          show={showShareModal}
          onHide={() => setShowShareModal(false)}
          post={selectedPost}
          onShareSuccess={handleShareSuccess}
        />
      )}
      
      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa bài viết này?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác và sẽ xóa tất cả dữ liệu liên quan đến bài viết này.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDeletePost}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Comment Confirmation Modal */}
      <Modal show={showDeleteCommentModal} onHide={() => setShowDeleteCommentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa bình luận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn xóa bình luận này?</p>
          <p className="text-danger">Lưu ý: Hành động này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteCommentModal(false)}>
            Hủy
          </Button>
          <Button variant="danger" onClick={confirmDeleteComment}>
            Xóa
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default memo(PostList);
