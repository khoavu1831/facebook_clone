import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import './Auth.css';
import { useUser } from '../../contexts/UserContext';

/**
 * Component xử lý đăng nhập và đăng ký
 * @param {Object} props - Props của component
 * @param {boolean} props.isLogin - Xác định chế độ đăng nhập (true) hoặc đăng ký (false)
 */
function Auth({ isLogin = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // State cho xác nhận mật khẩu
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  // Regex kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Ánh xạ tháng cho tính toán ngày
  const monthMap = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
  };

  /**
   * Xử lý khi gửi form đăng nhập hoặc đăng ký
   * @param {Event} e - Sự kiện submit form
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Kiểm tra dữ liệu phía client
    if (!isLogin) {
      // Kiểm tra định dạng email
      if (!emailRegex.test(email)) {
        setError('Email đúng có dạng xxxx@xx.xx.');
        return;
      }

      // Kiểm tra độ dài mật khẩu
      if (password.length < 6) {
        setError('Mật khẩu phải có độ dài ít nhất 6 ký tự.');
        return;
      }

      // Kiểm tra xác nhận mật khẩu
      if (password !== confirmPassword) {
        setError('Mật khẩu không khớp.');
        return;
      }

      // Kiểm tra tuổi
      const birthDate = new Date(year, monthMap[month], day);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const dayDiff = today.getDate() - birthDate.getDate();

      // Điều chỉnh tuổi nếu sinh nhật chưa diễn ra trong năm nay
      const adjustedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age;

      if (adjustedAge <= 6) {
        setError('Rất tiếc, người dùng phải trên 6 tuổi.');
        return;
      }
    } else {
      // Kiểm tra định dạng email cho đăng nhập
      if (!emailRegex.test(email)) {
        setError('Email đúng có dạng xxxx@xx.xx.');
        return;
      }
    }

    try {
      // Gửi yêu cầu đến API
      const response = await fetch(
        isLogin ? '/api/auth/login' : '/api/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(
            isLogin
              ? { email, password }
              : {
                  email,
                  password,
                  firstName,
                  lastName: surname,
                  day,
                  month,
                  year,
                  gender,
                }
          ),
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Đã xảy ra lỗi');
      }

      // Tạo đối tượng dữ liệu người dùng
      const userData = {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      };

      // Lưu thông tin đăng nhập vào localStorage
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(userData));
      setCurrentUser(userData);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="card p-4 shadow" style={{ width: '400px', borderRadius: '10px' }}>
          <div className="text-center mb-3">
            <h1 className="facebook-logo">facebook</h1>
          </div>

          {/* Hiển thị thông báo lỗi nếu có */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Hiển thị các trường đăng ký nếu không phải chế độ đăng nhập */}
            {!isLogin && (
              <>
                <div className="d-flex mb-3">
                  <input
                    type="text"
                    className="form-control me-2"
                    placeholder="Tên"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    aria-label="Tên"
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Họ"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    required
                    aria-label="Họ"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Ngày sinh</label>
                  <div className="d-flex">
                    <select
                      className="form-select me-2"
                      value={day}
                      onChange={(e) => setDay(e.target.value)}
                      required
                      aria-label="Ngày"
                    >
                      <option value="">Ngày</option>
                      {[...Array(31)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <select
                      className="form-select me-2"
                      value={month}
                      onChange={(e) => setMonth(e.target.value)}
                      required
                      aria-label="Tháng"
                    >
                      <option value="">Tháng</option>
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <option key={i} value={m}>{m}</option>
                      ))}
                    </select>
                    <select
                      className="form-select"
                      value={year}
                      onChange={(e) => setYear(e.target.value)}
                      required
                      aria-label="Năm"
                    >
                      <option value="">Năm</option>
                      {[...Array(100)].map((_, i) => {
                        const yearOption = new Date().getFullYear() - i;
                        return <option key={yearOption} value={yearOption}>{yearOption}</option>;
                      })}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Giới tính</label>
                  <div className="d-flex">
                    <div className="form-check me-3">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="female"
                        value="Female"
                        checked={gender === 'Female'}
                        onChange={(e) => setGender(e.target.value)}
                        required
                      />
                      <label className="form-check-label" htmlFor="female">Nữ</label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="gender"
                        id="male"
                        value="Male"
                        checked={gender === 'Male'}
                        onChange={(e) => setGender(e.target.value)}
                      />
                      <label className="form-check-label" htmlFor="male">Nam</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Địa chỉ email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-label="Email"
              />
            </div>

            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={isLogin ? undefined : 6} // Áp dụng độ dài tối thiểu ở phía client
                aria-label="Mật khẩu"
              />
            </div>

            {!isLogin && (
              <div className="mb-3">
                <input
                  type="password"
                  className="form-control"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  aria-label="Xác nhận mật khẩu"
                />
              </div>
            )}

            <button
              type="submit"
              className={`btn w-100 ${isLogin ? 'btn-primary' : 'btn-success'}`}
            >
              {isLogin ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </form>

          <div className="text-center mt-3">
            {isLogin ? (
              <div className="links-container">
                <Link to="/forgot-password" className="text-primary">Quên mật khẩu?</Link>
                <span className="separator">|</span>
                <Link to="/register" className="text-primary">Tạo tài khoản mới</Link>
              </div>
            ) : (
              <Link to="/login" className="text-primary">Đã có tài khoản?</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;