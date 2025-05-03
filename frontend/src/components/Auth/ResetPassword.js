import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import './Auth.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi khi đặt lại mật khẩu');
      }

      setSuccess('Mật khẩu đã được đặt lại thành công');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="card p-4 shadow" style={{ width: '400px', borderRadius: '10px' }}>
          <div className="text-center mb-3">
            <h1 className="facebook-logo">facebook</h1>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                aria-label="Mật khẩu mới"
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                aria-label="Xác nhận mật khẩu mới"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

          <div className="text-center mt-3">
            <button
              className="btn btn-link text-primary"
              onClick={() => navigate('/login')}
            >
              Quay lại đăng nhập
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword; 