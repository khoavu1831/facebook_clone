import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Auth({ isLogin = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLogin) {
      console.log('Login', { email, password });
    } else {
      console.log('Register', { firstName, surname, email, password, day, month, year, gender });
    }
    navigate('/'); // Chuyển hướng về trang chủ sau khi đăng nhập/đăng ký
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="card p-4 shadow" style={{ width: '400px', borderRadius: '10px' }}>
        {/* Logo */}
        <div className="text-center mb-3">
          <h1 className="facebook-logo">facebook</h1>
        </div>

        {/* Tiêu đề */}
        <h2 className="text-center mb-4">
          {isLogin ? 'Log in to Facebook' : 'Create a new account'}
        </h2>
        {!isLogin && <p className="text-center text-muted mb-4">It's quick and easy.</p>}

        <form onSubmit={handleSubmit}>
          {/* Form đăng ký */}
          {!isLogin && (
            <>
              <div className="d-flex mb-3">
                <input
                  type="text"
                  className="form-control me-2"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Surname"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                />
              </div>

              {/* Date of Birth */}
              <div className="mb-3">
                <label className="form-label">Date of birth</label>
                <div className="d-flex">
                  <select
                    className="form-select me-2"
                    value={day}
                    onChange={(e) => setDay(e.target.value)}
                    required
                  >
                    <option value="">Day</option>
                    {[...Array(31)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>{i + 1}</option>
                    ))}
                  </select>
                  <select
                    className="form-select me-2"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                  >
                    <option value="">Month</option>
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <option key={i} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    className="form-select"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  >
                    <option value="">Year</option>
                    {[...Array(100)].map((_, i) => {
                      const yearOption = 2025 - i;
                      return <option key={yearOption} value={yearOption}>{yearOption}</option>;
                    })}
                  </select>
                </div>
              </div>

              {/* Gender */}
              <div className="mb-3">
                <label className="form-label">Gender</label>
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
                    <label className="form-check-label" htmlFor="female">Female</label>
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
                      required
                    />
                    <label className="form-check-label" htmlFor="male">Male</label>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Email hoặc số điện thoại */}
          <div className="mb-3">
            <input
              type={isLogin ? 'text' : 'email'}
              className="form-control"
              placeholder={isLogin ? 'Email address or phone number' : 'Mobile number or email address'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <input
              type="password"
              className="form-control"
              placeholder={isLogin ? 'Password' : 'New password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Nút Submit */}
          <button
            type="submit"
            className={`btn w-100 ${isLogin ? 'btn-primary' : 'btn-success'}`}
          >
            {isLogin ? 'Log in' : 'Sign Up'}
          </button>
        </form>

        {/* Liên kết chuyển đổi giữa đăng nhập và đăng ký */}
        <div className="text-center mt-3">
          {isLogin ? (
            <div className="links-container">
              <a href="#" className="text-primary">Forgotten account?</a>
              <span className="separator"> | </span>
              <Link to="/register" className="text-primary">Sign up for Facebook</Link>
            </div>
          ) : (
            <>
              {/* <p className="text-muted small">
                People who use our service may have uploaded your contact information to Facebook.{' '}
                <a href="#" className="text-primary">Learn more.</a>
              </p>
              <p className="text-muted small">
                By clicking Sign Up, you agree to our <a href="#" className="text-primary">Terms</a>,{' '}
                <a href="#" className="text-primary">Privacy Policy</a> and{' '}
                <a href="#" className="text-primary">Cookies Policy</a>. You may receive SMS notifications from us and can opt out at any time.
              </p> */}
              <Link to="/login" className="text-primary">Already have an account?</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Auth;