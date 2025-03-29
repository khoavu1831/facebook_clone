import React, { useState } from 'react';

function Admin() {
  const [users, setUsers] = useState([
    { id: 1, name: 'Althrun Sun', email: 'althrun@example.com' },
    { id: 2, name: 'Melody', email: 'melody@example.com' },
  ]);

  const [posts, setPosts] = useState([
    { id: 1, content: 'Hi guys! My name is Althrun Sun...', createdAt: '2023-04-24T18:35:04' },
    { id: 2, content: 'Just finished a great weekend camping...', createdAt: '2023-04-25T09:15:00' },
  ]);

  const handleDeleteUser = (id) => {
    setUsers(users.filter((user) => user.id !== id));
  };

  const handleDeletePost = (id) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <h1 className="mb-4">Admin Dashboard</h1>
      <div className="row">
        {/* Manage Users */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h3 className="mb-4">Manage Users</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Manage Posts */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-body">
              <h3 className="mb-4">Manage Posts</h3>
              <table className="table">
                <thead>
                  <tr>
                    <th>Content</th>
                    <th>Created At</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.content.substring(0, 50)}...</td>
                      <td>{new Date(post.createdAt).toLocaleString()}</td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeletePost(post.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Admin;