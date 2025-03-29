import React, { useState } from 'react';
import PostForm from '../components/Post/PostForm';
import PostList from '../components/Post/PostList';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';

function Home() {
  const initialPosts = [
    {
      id: 1,
      content: "Hi guys! My name is MaGaming, a Master's student of CS in Data Science at UBC. In the ICICS/CS building, I've spent countless days and nights acquiring advanced CS and machine learning knowledge. This place has witnessed the birth of numerous cutting-edge projects I've crafted, making it incredibly meaningful to me.",
      likes: 0,
      comments: [],
      createdAt: "2023-04-24T18:35:04",
    },
    {
      id: 2,
      content: "Just finished a great weekend camping with friends! The weather was perfect, and we had an amazing time by the lake. 🏕️",
      likes: 0,
      comments: [],
      createdAt: "2023-04-25T09:15:00",
    },
  ];

  const [posts, setPosts] = useState(initialPosts);

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  return (
    <div className="container-fluid">
      <div className="row" style={{ paddingTop: '60px' }}>
        <LeftSidebar />
        <div className="col-6 offset-3">
          <PostForm onAddPost={addPost} />
          <PostList posts={posts} setPosts={setPosts} />
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}

export default Home;