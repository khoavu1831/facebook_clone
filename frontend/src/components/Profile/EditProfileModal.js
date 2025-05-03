import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Form, Row, Col, Tabs, Tab } from 'react-bootstrap';
import { API_ENDPOINTS } from '../../config/api';
import './EditProfileModal.css';
import Cropper from 'react-easy-crop';

const EditProfileModal = ({
  show,
  onHide,
  userData,
  onProfileUpdate,
  onSuccess,
  onError
}) => {
  // Personal information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Image editing
  const [avatar, setAvatar] = useState(null);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPreview, setCoverPreview] = useState('');

  // Crop state
  const [avatarCrop, setAvatarCrop] = useState({ x: 0, y: 0 });
  const [coverCrop, setCoverCrop] = useState({ x: 0, y: 0 });
  const [avatarZoom, setAvatarZoom] = useState(1);
  const [coverZoom, setCoverZoom] = useState(1);
  const [avatarCroppedArea, setAvatarCroppedArea] = useState(null);
  const [coverCroppedArea, setCoverCroppedArea] = useState(null);

  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [errors, setErrors] = useState({});

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState({});

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setBio(userData.bio || '');
      setEmail(userData.email || '');
      setGender(userData.gender || '');
      setDay(userData.day || '');
      setMonth(userData.month || '');
      setYear(userData.year || '');

      // Set image previews with cache busting
      const timestamp = new Date().getTime();

      let avatarUrl = '/default-imgs/avatar.png';
      if (userData.avatar) {
        if (userData.avatar.startsWith('http')) {
          avatarUrl = userData.avatar.includes('?')
            ? `${userData.avatar}&t=${timestamp}`
            : `${userData.avatar}?t=${timestamp}`;
        } else {
          avatarUrl = `${API_ENDPOINTS.BASE_URL}${userData.avatar.startsWith('/') ? '' : '/'}${userData.avatar}?t=${timestamp}`;
        }
      }

      let coverUrl = '/default-imgs/cover.jpg';
      if (userData.coverPhoto) {
        if (userData.coverPhoto.startsWith('http')) {
          coverUrl = userData.coverPhoto.includes('?')
            ? `${userData.coverPhoto}&t=${timestamp}`
            : `${userData.coverPhoto}?t=${timestamp}`;
        } else {
          coverUrl = `${API_ENDPOINTS.BASE_URL}${userData.coverPhoto.startsWith('/') ? '' : '/'}${userData.coverPhoto}?t=${timestamp}`;
        }
      }

      console.log('Setting avatar preview URL:', avatarUrl);
      console.log('Setting cover preview URL:', coverUrl);

      setAvatarPreview(avatarUrl);
      setCoverPreview(coverUrl);
    }
  }, [userData, show]);

  // Reset form when modal is closed
  useEffect(() => {
    if (!show) {
      // Clean up blob URLs
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (coverPreview && coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(coverPreview);
      }
    }
  }, [show, avatarPreview, coverPreview]);

  const validateForm = () => {
    const newErrors = {};

    if (!firstName.trim()) newErrors.firstName = 'Tên là bắt buộc';
    if (!lastName.trim()) newErrors.lastName = 'Họ là bắt buộc';
    if (!email.trim()) newErrors.email = 'Email là bắt buộc';
    if (email && !/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email không hợp lệ';

    // Date validation
    if (day && month && year) {
      const birthDate = new Date(`${month} ${day}, ${year}`);
      if (isNaN(birthDate.getTime())) {
        newErrors.date = 'Ngày sinh không hợp lệ';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!currentPassword.trim()) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
    }
    if (!newPassword.trim()) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
    } else if (newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!confirmNewPassword.trim()) {
      newErrors.confirmNewPassword = 'Vui lòng xác nhận mật khẩu mới';
    } else if (confirmNewPassword !== newPassword) {
      newErrors.confirmNewPassword = 'Mật khẩu xác nhận không khớp';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper function to create a blob from a cropped image
  const createCroppedImage = useCallback(async (imageSrc, pixelCrop, rotation = 0) => {
    if (!pixelCrop || !pixelCrop.width || !pixelCrop.height) {
      console.error('Invalid crop area', pixelCrop);
      return null;
    }

    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.src = imageSrc;

      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set dimensions
          canvas.width = pixelCrop.width;
          canvas.height = pixelCrop.height;

          // Draw the cropped image
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Draw the image at the correct position
          ctx.drawImage(
            image,
            pixelCrop.x,
            pixelCrop.y,
            pixelCrop.width,
            pixelCrop.height,
            0,
            0,
            pixelCrop.width,
            pixelCrop.height
          );

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error('Canvas to Blob conversion failed');
                reject(new Error('Failed to create image blob'));
                return;
              }
              resolve(blob);
            },
            'image/jpeg',
            0.95
          );
        } catch (err) {
          console.error('Error in canvas operations:', err);
          reject(err);
        }
      };

      image.onerror = (err) => {
        console.error('Error loading image:', err);
        reject(new Error('Failed to load image'));
      };
    });
  }, []);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      const blobUrl = URL.createObjectURL(file);
      setAvatarPreview(blobUrl);
      setActiveTab('avatar');
      // Reset crop area when changing image
      setAvatarCrop({ x: 0, y: 0 });
      setAvatarZoom(1);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverPhoto(file);
      const blobUrl = URL.createObjectURL(file);
      setCoverPreview(blobUrl);
      setActiveTab('cover');
      // Reset crop area when changing image
      setCoverCrop({ x: 0, y: 0 });
      setCoverZoom(1);
    }
  };

  // Crop complete handlers
  const onAvatarCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    console.log('Avatar crop complete:', croppedAreaPixels);
    if (croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
      setAvatarCroppedArea(croppedAreaPixels);
    } else {
      console.error('Invalid avatar crop area:', croppedAreaPixels);
    }
  }, []);

  const onCoverCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    console.log('Cover crop complete:', croppedAreaPixels);
    if (croppedAreaPixels && croppedAreaPixels.width > 0 && croppedAreaPixels.height > 0) {
      setCoverCroppedArea(croppedAreaPixels);
    } else {
      console.error('Invalid cover crop area:', croppedAreaPixels);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', userData.id);
      formData.append('name', `${firstName} ${lastName}`);
      formData.append('email', email);
      formData.append('bio', bio);
      formData.append('gender', gender);
      formData.append('day', day);
      formData.append('month', month);
      formData.append('year', year);

      // Process avatar image if it exists and has been cropped
      if (avatar && avatarPreview && avatarCroppedArea) {
        try {
          const croppedAvatarBlob = await createCroppedImage(
            avatarPreview,
            avatarCroppedArea
          );

          if (croppedAvatarBlob) {
            formData.append('avatar', croppedAvatarBlob, 'avatar.jpg');
            console.log('Avatar blob created successfully');
          } else {
            console.log('Using original avatar file as fallback');
            formData.append('avatar', avatar);
          }
        } catch (error) {
          console.error('Error cropping avatar:', error);
          // Fallback to original file if cropping fails
          console.log('Using original avatar file after error');
          formData.append('avatar', avatar);
        }
      } else if (avatar) {
        // Use original file if no cropping was done
        console.log('Using original avatar file (no cropping)');
        formData.append('avatar', avatar);
      }

      // Process cover image if it exists and has been cropped
      if (coverPhoto && coverPreview && coverCroppedArea) {
        try {
          console.log('Attempting to crop cover photo with:', coverCroppedArea);
          const croppedCoverBlob = await createCroppedImage(
            coverPreview,
            coverCroppedArea
          );

          if (croppedCoverBlob) {
            console.log('Cover photo blob created successfully');
            formData.append('coverPhoto', croppedCoverBlob, 'cover.jpg');
          } else {
            console.log('Using original cover photo as fallback');
            formData.append('coverPhoto', coverPhoto);
          }
        } catch (error) {
          console.error('Error cropping cover photo:', error);
          // Fallback to original file if cropping fails
          console.log('Using original cover photo after error');
          formData.append('coverPhoto', coverPhoto);
        }
      } else if (coverPhoto) {
        // Use original file if no cropping was done
        console.log('Using original cover photo (no cropping)');
        formData.append('coverPhoto', coverPhoto);
      }

      // Submit the form data
      await submitFormData(formData);
    } catch (error) {
      console.error('Error preparing form data:', error);
      if (onError) onError('An error occurred while preparing your profile data');
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('userId', userData.id);
      formData.append('currentPassword', currentPassword);
      formData.append('newPassword', newPassword);

      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.PROFILE}/update-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể cập nhật mật khẩu');
      }

      if (onSuccess) {
        onSuccess('Mật khẩu đã được cập nhật thành công');
      }

      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordErrors({});
      setActiveTab('personal');
    } catch (error) {
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitFormData = async (formData) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}${API_ENDPOINTS.PROFILE}/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('userToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const updatedProfile = await response.json();

      // Create updated user data object
      const updatedUserData = {
        ...userData,
        firstName,
        lastName,
        email,
        bio,
        gender,
        day,
        month,
        year,
        avatar: updatedProfile.avatar,
        coverPhoto: updatedProfile.coverPhoto
      };

      // Call the onProfileUpdate callback with the updated data
      if (onProfileUpdate) {
        onProfileUpdate(updatedUserData);
      }

      if (onSuccess) {
        onSuccess('Profile updated successfully');
      }

      onHide();
    } catch (error) {
      console.error('Error updating profile:', error);
      if (onError) {
        onError(error.message || 'Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      className="edit-profile-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa hồ sơ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mb-4 profile-tabs"
        >
          <Tab eventKey="personal" title="Thông tin cá nhân">
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tên</Form.Label>
                    <Form.Control
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      isInvalid={!!errors.firstName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.firstName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ</Form.Label>
                    <Form.Control
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      isInvalid={!!errors.lastName}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.lastName}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  isInvalid={!!errors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Giới thiệu</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <Form.Text className="text-muted">
                  Hãy chia sẻ một chút về bản thân
                </Form.Text>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Giới tính</Form.Label>
                <div>
                  <Form.Check
                    inline
                    type="radio"
                    label="Nam"
                    name="gender"
                    id="male"
                    checked={gender === 'Male'}
                    onChange={() => setGender('Male')}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="Nữ"
                    name="gender"
                    id="female"
                    checked={gender === 'Female'}
                    onChange={() => setGender('Female')}
                  />
                  <Form.Check
                    inline
                    type="radio"
                    label="Khác"
                    name="gender"
                    id="other"
                    checked={gender === 'Other'}
                    onChange={() => setGender('Other')}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Ngày sinh</Form.Label>
                <Row>
                  <Col md={4}>
                    <Form.Select
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      isInvalid={!!errors.date}
                    >
                      <option value="">Ngày</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      isInvalid={!!errors.date}
                    >
                      <option value="">Tháng</option>
                      {['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'].map((m, i) => (
                        <option key={i} value={m}>{m}</option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col md={4}>
                    <Form.Select
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      isInvalid={!!errors.date}
                    >
                      <option value="">Năm</option>
                      {[...Array(100)].map((_, i) => {
                        const yearOption = new Date().getFullYear() - i;
                        return <option key={yearOption} value={yearOption}>{yearOption}</option>;
                      })}
                    </Form.Select>
                  </Col>
                </Row>
                {errors.date && (
                  <div className="text-danger mt-1">{errors.date}</div>
                )}
              </Form.Group>
            </Form>
          </Tab>

          <Tab eventKey="password" title="Đổi mật khẩu">
            <Form onSubmit={handlePasswordChange}>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu hiện tại</Form.Label>
                <Form.Control
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  isInvalid={!!passwordErrors.currentPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {passwordErrors.currentPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  isInvalid={!!passwordErrors.newPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {passwordErrors.newPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  isInvalid={!!passwordErrors.confirmNewPassword}
                />
                <Form.Control.Feedback type="invalid">
                  {passwordErrors.confirmNewPassword}
                </Form.Control.Feedback>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </Form>
          </Tab>

          <Tab eventKey="avatar" title="Ảnh đại diện">
            <div className="image-editor-container">
              <div className="current-image-preview mb-4">
                <h5>Ảnh đại diện hiện tại</h5>
                {!avatar && (
                  <img
                    src={avatarPreview}
                    alt="Ảnh đại diện hiện tại"
                    className="current-avatar-preview"
                    onError={(e) => {
                      e.target.src = '/default-imgs/avatar.png';
                    }}
                  />
                )}
              </div>

              <div className="image-editor-controls">
                <Form.Group className="mb-3">
                  <Form.Label>Tải lên ảnh đại diện mới</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </Form.Group>

                {avatar && (
                  <>
                    <div className="avatar-editor-wrapper">
                      <div style={{ position: 'relative', height: '300px', width: '100%' }}>
                        <Cropper
                          image={avatarPreview}
                          crop={avatarCrop}
                          zoom={avatarZoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setAvatarCrop}
                          onCropComplete={onAvatarCropComplete}
                          onZoomChange={setAvatarZoom}
                        />
                      </div>
                    </div>

                    <Form.Group className="mt-3">
                      <Form.Label>Thu phóng: {avatarZoom.toFixed(1)}x</Form.Label>
                      <Form.Range
                        min={1}
                        max={3}
                        step={0.1}
                        value={avatarZoom}
                        onChange={(e) => setAvatarZoom(parseFloat(e.target.value))}
                      />
                    </Form.Group>
                  </>
                )}
              </div>
            </div>
          </Tab>

          <Tab eventKey="cover" title="Ảnh bìa">
            <div className="image-editor-container">
              <div className="current-image-preview mb-4">
                <h5>Ảnh bìa hiện tại</h5>
                {!coverPhoto && (
                  <img
                    src={coverPreview}
                    alt="Ảnh bìa hiện tại"
                    className="current-cover-preview"
                    onError={(e) => {
                      e.target.src = '/default-imgs/cover.jpg';
                    }}
                  />
                )}
              </div>

              <div className="image-editor-controls">
                <Form.Group className="mb-3">
                  <Form.Label>Tải lên ảnh bìa mới</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handleCoverChange}
                  />
                </Form.Group>

                {coverPhoto && (
                  <>
                    <div className="cover-editor-wrapper">
                      <div style={{ position: 'relative', height: '250px', width: '100%' }}>
                        <Cropper
                          image={coverPreview}
                          crop={coverCrop}
                          zoom={coverZoom}
                          aspect={2.5}
                          showGrid={false}
                          onCropChange={setCoverCrop}
                          onCropComplete={onCoverCropComplete}
                          onZoomChange={setCoverZoom}
                        />
                      </div>
                    </div>

                    <Form.Group className="mt-3">
                      <Form.Label>Thu phóng: {coverZoom.toFixed(1)}x</Form.Label>
                      <Form.Range
                        min={1}
                        max={3}
                        step={0.1}
                        value={coverZoom}
                        onChange={(e) => setCoverZoom(parseFloat(e.target.value))}
                      />
                    </Form.Group>
                  </>
                )}
              </div>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditProfileModal;
