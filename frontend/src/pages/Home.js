import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PostForm from '../components/Post/PostForm';
import PostList from '../components/Post/PostList';
import LeftSidebar from '../components/LeftSidebar';
import RightSidebar from '../components/RightSidebar';
import { API_ENDPOINTS } from '../config/api';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useUser();

  useEffect(() => {
    // Debug log for currentUser
    console.log("currentUser from context:", currentUser);

    // Only proceed if we have a valid user
    if (!currentUser?.id) {
      console.log("Waiting for user data to load...");
      return;
    }

    const fetchPosts = async () => {
      try {
        // Check if user is authenticated
        if (!currentUser?.id) {
          console.log("No user ID found, waiting for user data to load");
          return; // Just return instead of redirecting
        }

        const response = await fetch(`${API_ENDPOINTS.POSTS}?userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('userToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched posts:", data); // Debug log for posts
          setPosts(Array.isArray(data) ? data.filter(post => post && post.id) : []);
        } else {
          console.error('Failed to fetch posts');
          setPosts([]);
        }
      } catch (error) {
        console.error('Error fetching posts:', error);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentUser]); // Add currentUser as dependency

  if (!currentUser) {
    return <div>Please log in to continue</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container-fluid">
      <div className="row" style={{ paddingTop: '60px' }}>
        <LeftSidebar />
        <div className="col-6 offset-3">
          {currentUser && (
            <>
              <PostForm
                onAddPost={(newPost) => setPosts([newPost, ...posts])}
                currentUser={currentUser} // Pass currentUser to PostForm
              />
              <PostList
                posts={posts}
                currentUser={currentUser}
                userData={currentUser} // For backward compatibility
              />
            </>
          )}
        </div>
        <RightSidebar />
      </div>
    </div>
  );
};

export default Home;
