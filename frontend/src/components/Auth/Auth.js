import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Thêm import Link

function Auth({ isLogin = true }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Chỉ dùng cho đăng ký
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic xử lý đăng ký/đăng nhập sẽ được thêm sau khi có backend
    console.log(isLogin ? 'Login' : 'Register', { email, password, name });
    navigate('/'); // Chuyển hướng về trang chủ sau khi đăng nhập/đăng ký
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
      <div className="card p-4" style={{ width: '400px' }}>
        <h2 className="text-center mb-4">{isLogin ? 'Login' : 'Register'}</h2>
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <div className="text-center mt-3">
          <p>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Link to={isLogin ? '/register' : '/login'} className="text-primary">
              {isLogin ? 'Register' : 'Login'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;