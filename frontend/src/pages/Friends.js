import React, { useState } from 'react';

function Friends() {
  const [friends, setFriends] = useState([
    { id: 1, name: 'Melody', isFriend: true },
    { id: 2, name: 'Ken Wang', isFriend: true },
    { id: 3, name: 'Leona', isFriend: false },
  ]);

  const handleFriendAction = (id) => {
    setFriends(friends.map((friend) =>
      friend.id === id ? { ...friend, isFriend: !friend.isFriend } : friend
    ));
  };

  return (
    <div className="container" style={{ paddingTop: '60px' }}>
      <h1 className="mb-4">Friends</h1>
      <div className="row">
        {friends.map((friend) => (
          <div key={friend.id} className="col-md-4 mb-3">
            <div className="card">
              <div className="card-body d-flex align-items-center gap-3">
                <img
                  src="/img/logo.png"
                  alt={friend.name}
                  className="rounded-circle"
                  style={{ width: '50px', height: '50px' }}
                />
                <div className="flex-grow-1">
                  <h5 className="mb-0">{friend.name}</h5>
                </div>
                <button
                  className={`btn ${friend.isFriend ? 'btn-danger' : 'btn-primary'}`}
                  onClick={() => handleFriendAction(friend.id)}
                >
                  {friend.isFriend ? 'Unfriend' : 'Add Friend'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Friends;