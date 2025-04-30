import React, { useState, useEffect, memo, useRef } from 'react';
import { Modal } from 'react-bootstrap';
import './ImageViewerModal.css';

// Sử dụng memo để tránh re-render không cần thiết
const ImageViewerModal = memo(({ show, onHide, images, initialIndex = 0, getFullImageUrl }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState({});
  const imageRef = useRef(null);

  // Reset current index when modal is opened
  useEffect(() => {
    if (show) {
      setCurrentIndex(initialIndex);
    }
  }, [show, initialIndex]);

  // Reset loading state when image changes, but only if we haven't loaded this image before
  useEffect(() => {
    if (currentIndex in loadedImages) {
      // Image already loaded before, don't set loading state
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
  }, [currentIndex, loadedImages]);

  // Preload adjacent images to prevent continuous loading
  useEffect(() => {
    if (!show || !images || images.length <= 1) return;

    // Preload next and previous images
    const preloadImage = (index) => {
      if (index >= 0 && index < images.length && !(index in loadedImages)) {
        const img = new Image();
        const imgSrc = getFullImageUrl ? getFullImageUrl(images[index]) : images[index];
        img.src = imgSrc;
        img.onload = () => {
          // Mark as loaded
          setLoadedImages(prev => ({
            ...prev,
            [index]: true
          }));
        };
      }
    };

    // Preload next image
    const nextIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
    // Preload previous image
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;

    preloadImage(nextIndex);
    preloadImage(prevIndex);
  }, [show, currentIndex, images, loadedImages, getFullImageUrl]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    // Mark this image as loaded
    setLoadedImages(prev => ({
      ...prev,
      [currentIndex]: true
    }));
  };

  // If no images or empty array, don't render
  if (!images || images.length === 0) {
    return null;
  }

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
          {isLoading && (
            <div className="loading-spinner">
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Đang tải...</span>
              </div>
            </div>
          )}
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Post content"
            className={`full-image ${isLoading ? 'loading' : 'loaded'}`}
            onLoad={handleImageLoad}
            onClick={(e) => e.stopPropagation()}
          />

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
