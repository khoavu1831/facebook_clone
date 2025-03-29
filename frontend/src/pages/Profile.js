import React, { useState } from 'react';

function Profile() {
  const [name, setName] = useState('Althrun Sun');
  const [email, setEmail] = useState('althrun@example.com');
  const [avatar, setAvatar] = useState('/img/logo.png');
  const [avatarPreview, setAvatarPreview] = useState('/img/logo.png');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Logic cập nhật hồ sơ sẽ được thêm sau khi có backend
    console.log('Profile updated:', { name, email, avatar });
  };

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <h1 className="mb-4">Profile</h1>
      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card">
            <div className="card-body text-center">
              <img
                src={avatarPreview}
                alt="Avatar"
                className="rounded-circle mb-3"
                style={{ width: '150px', height: '150px' }}
              />
              <label className="btn btn-primary">
                Change Avatar
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h3 className="mb-4">Update Profile</h3>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;