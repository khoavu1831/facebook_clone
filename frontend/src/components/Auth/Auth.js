import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_ENDPOINTS } from '../../config/api';
import './Auth.css';
import { useUser } from '../../contexts/UserContext';

function Auth({ isLogin = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [gender, setGender] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(
        isLogin ? API_ENDPOINTS.LOGIN : API_ENDPOINTS.REGISTER,
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
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const userData = {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role
      };

      // Save to localStorage
      localStorage.setItem('userToken', data.token);
      localStorage.setItem('userData', JSON.stringify(userData));

      // Update context
      setCurrentUser(userData);

      // Redirect to home
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="card p-4 shadow" style={{ width: '400px', borderRadius: '10px' }}>
          {/* Logo */}
          <div className="text-center mb-3">
            <h1 className="facebook-logo">facebook</h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Registration fields */}
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
                        const yearOption = new Date().getFullYear() - i;
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
                      />
                      <label className="form-check-label" htmlFor="male">Male</label>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Email field */}
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password field */}
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              className={`btn w-100 ${isLogin ? 'btn-primary' : 'btn-success'}`}
            >
              {isLogin ? 'Log in' : 'Sign Up'}
            </button>
          </form>

          {/* Links */}
          <div className="text-center mt-3">
            {isLogin ? (
              <div className="links-container">
                <Link to="/forgot-password" className="text-primary">Forgotten account?</Link>
                <span className="separator">|</span>
                <Link to="/register" className="text-primary">Create new account</Link>
              </div>
            ) : (
              <Link to="/login" className="text-primary">Already have an account?</Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
