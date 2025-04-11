import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PostForm from '../components/Post/PostForm';
import PostList from '../components/Post/PostList';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { API_ENDPOINTS } from '../config/api';

function Home() {
  const { currentUser } = useUser();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await fetch(`${API_ENDPOINTS.POSTS}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPosts(data);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPosts();
    }
  }, [currentUser]);

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  if (loading) {
    return <div className="text-center mt-5">Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row" style={{ paddingTop: '60px' }}>
        <LeftSidebar />
        <div className="col-6 offset-3">
          {currentUser && (
            <>
              <PostForm onAddPost={addPost} user={currentUser} />
              <PostList posts={posts} setPosts={setPosts} currentUser={currentUser} />
            </>
          )}
        </div>
        <RightSidebar />
      </div>
    </div>
  );
}

export default Home;
