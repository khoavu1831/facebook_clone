import React, { useState, useEffect, memo, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import './ImageViewerModal.css';

/**
 * Component hiển thị modal xem hình ảnh, được memo để tránh re-render không cần thiết
 * @param {Object} props - Props của component
 * @param {boolean} props.show - Trạng thái hiển thị modal
 * @param {Function} props.onHide - Hàm xử lý khi đóng modal
 * @param {Array} props.images - Danh sách hình ảnh
 * @param {number} props.initialIndex - Chỉ số ban đầu của hình ảnh (mặc định: 0)
 * @param {Function} props.getFullImageUrl - Hàm lấy URL đầy đủ của hình ảnh
 */
const ImageViewerModal = memo(({ show, onHide, images, initialIndex = 0, getFullImageUrl }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const imageRef = useRef(null);

  // Đặt lại chỉ số hiện tại khi modal được mở
  useEffect(() => {
    if (show) {
      setCurrentIndex(initialIndex);
    }
  }, [show, initialIndex]);

  // Đặt lại trạng thái tải khi hình ảnh thay đổi, nhưng chỉ khi chưa tải hình ảnh này trước đó
  useEffect(() => {
    if (currentIndex in loadedImages) {
      // Hình ảnh đã được tải trước đó, không cần đặt trạng thái tải
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [currentIndex, loadedImages]);

  /**
   * Tải trước các hình ảnh liền kề để tránh tải liên tục
   */
  useEffect(() => {
    if (!show || !images || images.length <= 1) return;

    /**
     * Tải trước hình ảnh
     * @param {number} index - Chỉ số của hình ảnh
     */
    const preloadImage = (index) => {
      if (index >= 0 && index < images.length && !(index in loadedImages)) {
        const img = new Image();
        const imgSrc = getFullImageUrl ? getFullImageUrl(images[index]) : images[index];
        img.src = imgSrc;
        img.onload = () => {
          // Đánh dấu là đã tải
          setLoadedImages(prev => ({
            ...prev,
            [index]: true
          }));
        };
      }
    };

    // Tải trước hình ảnh tiếp theo
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    // Tải trước hình ảnh trước đó
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;

    preloadImage(nextIndex);
    preloadImage(prevIndex);
  }, [show, currentIndex, images, loadedImages, getFullImageUrl]);

  /**
   * Xử lý khi chuyển đến hình ảnh trước đó
   * @param {Event} e - Sự kiện
   */
  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  /**
   * Xử lý khi chuyển đến hình ảnh tiếp theo
   * @param {Event} e - Sự kiện
   */
  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };

  /**
   * Xử lý khi hình ảnh được tải xong
   */
  const handleImageLoad = () => {
    setIsLoading(false);
    // Đánh dấu hình ảnh này đã được tải
    setLoadedImages(prev => ({
      ...prev,
      [currentIndex]: true
    }));
  };

  // Nếu không có hình ảnh hoặc mảng rỗng, không render
  if (!images || images.length === 0) {
    return null;
  }

  // Lấy hình ảnh hiện tại và URL của nó
  const currentImage = images[currentIndex];
  const imageUrl = getFullImageUrl ? getFullImageUrl(currentImage) : currentImage;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      dialogClassName="image-viewer-modal"
      contentClassName="image-viewer-content"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {images.length > 1 && (
            <div className="image-counter">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div className="image-container">
          {/* Hiển thị spinner khi đang tải hình ảnh */}
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}
          {/* Hình ảnh chính */}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Nội dung bài đăng"
            className={`full-image ${isLoading ? 'loading' : 'loaded'}`}
            onLoad={handleImageLoad}
            onClick={(e) => e.stopPropagation()}
          />

          {/* Nút điều hướng chỉ hiển thị khi có nhiều hình ảnh */}
          {images.length > 1 && (
            <>
              <button
                className="nav-button prev-button"
                onClick={handlePrev}
                aria-label="Ảnh trước"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <button
                className="nav-button next-button"
                onClick={handleNext}
                aria-label="Ảnh tiếp theo"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </>
          )}
        </div>
      </Modal.Body>
    </Modal>
  );
});

export default ImageViewerModal;
