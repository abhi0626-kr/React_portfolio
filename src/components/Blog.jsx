import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_HINT_PASSWORD = '632006';

const DEFAULT_SEED_POSTS = [
  {
    id: "post-1785828018158",
    title: "Hi",
    category: "Life Update",
    status: "Completed",
    date: "Aug 2026",
    author: "Abhishek KR",
    authorAvatar: "/I%20am.png",
    excerpt: "Hi",
    content: "Hi",
    image: "/1.jpg",
    link: "",
    likes: 0,
    tags: ["LifeUpdate", "DailyLog"]
  },
  {
    id: "post-1785771302317",
    title: "Test Photo Post",
    category: "Life Update",
    status: "Completed",
    date: "Aug 2026",
    author: "Abhishek KR",
    authorAvatar: "/I%20am.png",
    excerpt: "Testing upload payload",
    content: "Testing upload payload",
    image: "/mongodb-ai-vector-search.png",
    link: "",
    likes: 0,
    tags: ["Life Update"]
  }
];

function Blog() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPostId, setEditingPostId] = useState(null);
  const [dbStatus, setDbStatus] = useState('connecting');

  // Password Protection State
  const [adminPassword, setAdminPassword] = useState(() => {
    return sessionStorage.getItem('blog_admin_password') || '';
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPasswordPreview, setShowPasswordPreview] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [postToDelete, setPostToDelete] = useState(null);

  // Interactive Quick Post input & optional attached image
  const [quickPostText, setQuickPostText] = useState('');
  const [quickPostImage, setQuickPostImage] = useState('');

  // Full Life Update Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Life Update',
    status: 'Completed',
    date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    content: '',
    image: '',
    link: '',
    tags: ''
  });

  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [postComments, setPostComments] = useState({});
  const [commentInput, setCommentInput] = useState('');

  // Fetch posts from Backend API on mount & set up real-time sync polling
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchPosts(true);

    // Live sync polling every 3 seconds so all open browser tabs & devices stay in sync
    const syncInterval = setInterval(() => {
      fetchPosts(false);
    }, 3000);

    const handleFocus = () => fetchPosts(false);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(syncInterval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const fetchPosts = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
        setDbStatus('connected');

        setLikeCounts((prev) => {
          const updated = { ...prev };
          data.forEach((p) => {
            if (updated[p.id] === undefined) {
              updated[p.id] = p.likes || 0;
            }
          });
          return updated;
        });
      } else {
        throw new Error('API returned status ' + res.status);
      }
    } catch (err) {
      console.warn('Backend API connection note: Using local persistence mode', err);
      setDbStatus('offline');
      const localStored = localStorage.getItem('abhishek_blog_posts');
      if (localStored) {
        try {
          const parsed = JSON.parse(localStored);
          setPosts(parsed.length > 0 ? parsed : DEFAULT_SEED_POSTS);
        } catch (e) {
          setPosts(DEFAULT_SEED_POSTS);
        }
      } else {
        setPosts(DEFAULT_SEED_POSTS);
        localStorage.setItem('abhishek_blog_posts', JSON.stringify(DEFAULT_SEED_POSTS));
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3200);
  };

  // Automatic client-side image compression to prevent HTTP 413 Payload Too Large
  const compressImage = (file, maxWidth = 1600, maxHeight = 1600, quality = 0.82) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = (err) => reject(err);
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper to convert & optimize device files to lightweight base64 data URLs
  const handleDeviceFileUpload = async (e, onComplete) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      showToast('Optimizing photo...');
      try {
        const compressedDataUrl = await compressImage(file);
        onComplete(compressedDataUrl);
        showToast('Photo attached & optimized! 📸');
      } catch (err) {
        console.warn('Canvas compression note, reading raw file', err);
        const reader = new FileReader();
        reader.onload = (event) => {
          onComplete(event.target.result);
          showToast('Photo attached!');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Admin password gate
  const executeAdminAction = async (actionCallback) => {
    if (adminPassword) {
      try {
        const res = await fetch('/api/verify-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: adminPassword })
        });
        if (res.ok) {
          actionCallback(adminPassword);
          return;
        }
      } catch (e) {
        if (adminPassword === DEFAULT_HINT_PASSWORD) {
          actionCallback(adminPassword);
          return;
        }
      }
    }

    setPendingAction(() => actionCallback);
    setPasswordError('');
    setPasswordInput('');
    setShowPasswordModal(true);
  };

  const handleVerifyPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordInput.trim()) return;

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput.trim() })
      });

      if (res.ok) {
        const validPass = passwordInput.trim();
        setAdminPassword(validPass);
        sessionStorage.setItem('blog_admin_password', validPass);
        setShowPasswordModal(false);
        setPasswordError('');
        showToast('Admin password verified! Access granted.');
        if (pendingAction) {
          pendingAction(validPass);
          setPendingAction(null);
        }
      } else {
        setPasswordError('Incorrect admin password. Please try again.');
      }
    } catch (err) {
      if (passwordInput.trim() === DEFAULT_HINT_PASSWORD) {
        const validPass = passwordInput.trim();
        setAdminPassword(validPass);
        sessionStorage.setItem('blog_admin_password', validPass);
        setShowPasswordModal(false);
        setPasswordError('');
        showToast('Admin access granted.');
        if (pendingAction) {
          pendingAction(validPass);
          setPendingAction(null);
        }
      } else {
        setPasswordError('Incorrect admin password. Please try again.');
      }
    }
  };

  // Toggle Like (Public Action)
  const handleToggleLike = async (e, postId) => {
    e.stopPropagation();
    const isLiked = !likedPosts[postId];
    const delta = isLiked ? 1 : -1;

    setLikedPosts((prev) => ({ ...prev, [postId]: isLiked }));
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: Math.max(0, (prev[postId] || 0) + delta)
    }));

    try {
      await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta })
      });
    } catch (err) {
      console.log('Local like state recorded', err);
    }
  };

  const handleToggleBookmark = (e, postId) => {
    e.stopPropagation();
    setBookmarkedPosts((prev) => {
      const isBookmarked = !prev[postId];
      showToast(isBookmarked ? 'Added post to saved bookmarks' : 'Removed from bookmarks');
      return { ...prev, [postId]: isBookmarked };
    });
  };

  const handleShare = (e, post) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast(`Copied link for "${post.title.slice(0, 24)}..."`);
    } else {
      showToast('Copied post link!');
    }
  };

  // Delete Post Trigger (Admin Protected)
  const handleDeletePost = (e, postItem) => {
    if (e && e.stopPropagation) e.stopPropagation();

    executeAdminAction(() => {
      setPostToDelete(postItem);
    });
  };

  // Confirm Delete Post Handler
  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    const targetPost = typeof postToDelete === 'object' ? postToDelete : posts.find((p) => p.id === postToDelete);
    const postId = targetPost ? targetPost.id : postToDelete;
    const postTitle = targetPost ? targetPost.title : 'Post';

    try {
      await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword }
      });
    } catch (err) {
      console.warn('Backend delete note', err);
    }

    const updated = posts.filter((p) => p.id !== postId);
    setPosts(updated);
    localStorage.setItem('abhishek_blog_posts', JSON.stringify(updated));
    if (selectedPost && selectedPost.id === postId) setSelectedPost(null);
    setPostToDelete(null);
    showToast(`Deleted "${postTitle.slice(0, 22)}..."`);
  };

  // Edit Post Trigger (Admin Protected)
  const handleOpenEditModal = (e, post) => {
    e.stopPropagation();

    executeAdminAction(() => {
      setEditingPostId(post.id);
      setFormData({
        title: post.title || '',
        category: post.category || 'Life Update',
        status: post.status || 'Completed',
        date: post.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        content: post.content || '',
        image: post.image || '',
        link: post.link || '',
        tags: Array.isArray(post.tags) ? post.tags.join(', ') : post.tags || ''
      });
      setShowCreateModal(true);
    });
  };

  // Open New Post Form (Admin Protected)
  const handleOpenCreateModal = () => {
    executeAdminAction(() => {
      setEditingPostId(null);
      setFormData({
        title: '',
        category: 'Life Update',
        status: 'Completed',
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        content: '',
        image: '',
        link: '',
        tags: ''
      });
      setShowCreateModal(true);
    });
  };

  // Submit Quick Post (Admin Protected)
  const handleQuickPostSubmit = () => {
    if (!quickPostText.trim()) return;

    executeAdminAction(async (currentPass) => {
      const newPostPayload = {
        title: quickPostText.slice(0, 65) + (quickPostText.length > 65 ? '...' : ''),
        category: 'Life Update',
        status: 'Completed',
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        excerpt: quickPostText,
        content: quickPostText,
        image: quickPostImage || '',
        tags: ['LifeUpdate', 'DailyLog']
      };

      await saveNewPost(newPostPayload, currentPass);
      setQuickPostText('');
      setQuickPostImage('');
    });
  };

  // Submit Detailed Form (Create or Edit)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Please provide a title and content.');
      return;
    }

    executeAdminAction(async (currentPass) => {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map((t) => t.trim().replace(/^#/, ''))
        : [formData.category];

      const postPayload = {
        title: formData.title,
        category: formData.category,
        status: formData.status,
        date: formData.date || new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        excerpt: formData.content.slice(0, 140) + (formData.content.length > 140 ? '...' : ''),
        content: formData.content,
        image: formData.image || '',
        link: formData.link || '',
        tags: tagsArray
      };

      if (editingPostId) {
        await updateExistingPost(editingPostId, postPayload, currentPass);
      } else {
        await saveNewPost(postPayload, currentPass);
      }

      setShowCreateModal(false);
      setEditingPostId(null);
    });
  };

  // Save new post via API
  const saveNewPost = async (postPayload, currentPass) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': currentPass
        },
        body: JSON.stringify(postPayload)
      });

      if (res.ok) {
        const created = await res.json();
        setPosts((prev) => [created, ...prev]);
        setLikeCounts((prev) => ({ ...prev, [created.id]: 0 }));
        showToast('Post published to Database! 🎉');
      } else {
        throw new Error('Failed server creation');
      }
    } catch (err) {
      console.warn('Fallback: saving post locally', err);
      const fallbackObj = {
        id: `local-${Date.now()}`,
        author: 'Abhishek KR',
        authorAvatar: '/I am.png',
        likes: 0,
        comments_count: 0,
        ...postPayload
      };
      const updated = [fallbackObj, ...posts];
      setPosts(updated);
      localStorage.setItem('abhishek_blog_posts', JSON.stringify(updated));
      showToast('Life update published!');
    }
  };

  // Update existing post via API
  const updateExistingPost = async (postId, postPayload, currentPass) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': currentPass
        },
        body: JSON.stringify(postPayload)
      });

      if (res.ok) {
        const updated = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)));
        if (selectedPost && selectedPost.id === postId) setSelectedPost(updated);
        showToast('Post updated successfully! ✏️');
      } else {
        throw new Error('Failed to update post');
      }
    } catch (err) {
      console.warn('Fallback: updating post locally', err);
      const updatedList = posts.map((p) => (p.id === postId ? { ...p, ...postPayload } : p));
      setPosts(updatedList);
      localStorage.setItem('abhishek_blog_posts', JSON.stringify(updatedList));
      showToast('Post updated locally!');
    }
  };

  // Fetch comments for post (Public)
  const handleToggleComments = async (e, postId) => {
    e.stopPropagation();
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);

    if (!postComments[postId]) {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`);
        if (res.ok) {
          const commentsData = await res.json();
          setPostComments((prev) => ({ ...prev, [postId]: commentsData }));
        }
      } catch (err) {
        console.log('Comments fallback mode', err);
      }
    }
  };

  // Post comment to Database (Public)
  const handleAddComment = async (postId) => {
    if (!commentInput.trim()) return;

    const newCommentObj = {
      author: 'Visitor',
      text: commentInput.trim(),
      created_at: 'Just now'
    };

    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newCommentObj]
    }));

    setCommentInput('');

    try {
      await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: 'Visitor', text: newCommentObj.text })
      });
      showToast('Comment added!');
    } catch (err) {
      showToast('Comment saved!');
    }
  };

  // Categories list
  const categoryFilters = ['All', 'Life Update', 'Internship', 'Project', 'Course', 'Self-Learning', 'Achievement'];

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.content && post.content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.tags && post.tags.some((t) => String(t).toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesCategory =
      activeCategory === 'All' ||
      post.category?.toLowerCase() === activeCategory.toLowerCase() ||
      (post.tags && post.tags.some((t) => String(t).toLowerCase() === activeCategory.toLowerCase()));

    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts[0];

  return (
    <div className="min-h-screen bg-background text-on-background pt-20 pb-16 font-body-md relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 px-6 py-3 rounded-xl bg-primary text-black font-semibold shadow-xl primary-glow flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Auth Header Status Bar */}
      <div className="max-w-container-max mx-auto px-gutter mb-4 flex justify-between items-center text-xs">
        <div className="flex items-center gap-2 text-secondary">
          <span className={`w-2 h-2 rounded-full ${adminPassword ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{adminPassword ? '🔓 Admin Mode Unlocked (Author Authorized)' : '🔒 Public View (Password Required to Post/Edit/Delete)'}</span>
        </div>

        <button
          onClick={() => {
            if (adminPassword) {
              setAdminPassword('');
              sessionStorage.removeItem('blog_admin_password');
              showToast('Admin session locked.');
            } else {
              setPendingAction(null);
              setPasswordError('');
              setPasswordInput('');
              setShowPasswordModal(true);
            }
          }}
          className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-secondary hover:text-white hover:border-primary/40 transition-all flex items-center gap-1.5"
        >
          <span className="material-symbols-outlined text-[14px]">
            {adminPassword ? 'lock_open' : 'lock'}
          </span>
          <span>{adminPassword ? 'Lock Admin Session' : 'Enter Admin Password'}</span>
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative w-full h-[460px] flex items-center justify-center overflow-hidden mb-12">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-35"
            alt="Futuristic server room neon background"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkRKnPDxaCJJF4c5C5Zt-1jhQlQnvhL-PnLfqHrAxTKdr8CJXOG7E4sApiZMEzcITiPd1NyV8pVRM7cxK7iKrw2GOafO_NiqW4zXfyap30TGlEyb8K67ZtiAjUblQ0GLZxpkEPi5tx69HA7hmGMkO1pGNrlqNeg-dpSc2As_00FK5POSHgVuFQJok0DJIPfRDkusK1FToDqDkhUBL9THkatstfQPcCaxor3elRNtO_nTkhKnomHE6n"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background" />
        </div>

        <div className="relative z-10 w-full max-w-container-max mx-auto px-gutter text-center fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-secondary mb-6 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Database: {dbStatus === 'connected' ? 'SQLite Live Sync' : 'Local Storage Mode'}
          </div>

          <h1 className="font-display-lg text-4xl md:text-6xl font-bold mb-4 text-white tracking-tight">
            Developer Blog &amp; Life Journey
          </h1>
          <p className="font-body-lg text-secondary max-w-2xl mx-auto mb-8">
            Explore public posts, achievements, and tech milestones. (Password protection active for modifications).
          </p>

          {/* Search Bar */}
          <div className="w-full max-w-xl mx-auto relative mb-8">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl py-3.5 pl-12 pr-10 text-white placeholder:text-secondary/70 focus:outline-none focus:border-primary transition-all"
              placeholder="Search posts by title, tag, or topic..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary hover:text-white"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {categoryFilters.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-black primary-glow font-bold'
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-secondary hover:text-white hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-container-max mx-auto px-gutter">
        {/* Featured Post Card if posts exist */}
        {featuredPost && (
          <section className="fade-up mb-12">
            <div
              onClick={() => setSelectedPost(featuredPost)}
              className="relative w-full h-[420px] rounded-2xl overflow-hidden glass-card group cursor-pointer border border-white/10"
            >
              {featuredPost.image && (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url('${featuredPost.image}')` }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-8 md:p-10 w-full md:w-3/4">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-semibold mb-3">
                  FEATURED • {featuredPost.category}
                </span>
                <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-white mb-3 group-hover:text-primary transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-secondary line-clamp-2 mb-5 text-sm">
                  {featuredPost.excerpt}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPost(featuredPost);
                    }}
                    className="px-6 py-2.5 bg-primary text-black font-semibold rounded-xl text-xs hover:scale-105 transition-transform primary-glow inline-flex items-center gap-2"
                  >
                    Read Story
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>

                  <button
                    onClick={(e) => handleOpenEditModal(e, featuredPost)}
                    className="px-4 py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                    title="Edit Post (Password Protected)"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>

                  <button
                    onClick={(e) => handleDeletePost(e, featuredPost.id)}
                    className="px-4 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                    title="Delete Post (Password Protected)"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Two-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Left Column: Feed & Post Creation */}
          <div className="lg:col-span-8 space-y-gutter">
            {/* Quick Post Box & Form Trigger */}
            <div className="glass-card rounded-2xl p-6 fade-up border border-white/10">
              <div className="flex gap-4 mb-4">
                <div className="w-11 h-11 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/20">
                  <img
                    className="w-full h-full object-cover"
                    alt="Abhishek KR avatar"
                    src="/I am.png"
                  />
                </div>
                <input
                  value={quickPostText}
                  onChange={(e) => setQuickPostText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleQuickPostSubmit();
                  }}
                  className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-secondary/60 text-sm"
                  placeholder="Share a life update, milestone, or note... (Password Required)"
                  type="text"
                />
              </div>

              {/* Quick Image Preview if selected */}
              {quickPostImage && (
                <div className="mb-4 relative w-full h-40 rounded-xl overflow-hidden border border-white/15">
                  <img src={quickPostImage} alt="Quick preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setQuickPostImage('')}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-white/10 flex-wrap gap-3">
                <div className="flex gap-4 text-xs text-secondary">
                  <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px] text-primary">add_circle</span>
                    <span>New Post Form</span>
                  </button>

                  {/* Device Image Picker in Quick Post */}
                  <label className="flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors">
                    <span className="material-symbols-outlined text-[18px] text-emerald-400">photo_camera</span>
                    <span>Attach Device Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleDeviceFileUpload(e, (dataUrl) => setQuickPostImage(dataUrl))}
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-xs hover:bg-white/10 transition-all"
                  >
                    Full Editor
                  </button>
                  <button
                    onClick={handleQuickPostSubmit}
                    className="px-5 py-2 bg-primary text-black font-semibold rounded-xl text-xs primary-glow hover:scale-105 transition-transform"
                  >
                    Publish Post
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            {filteredPosts.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center text-secondary border border-white/10">
                <span className="material-symbols-outlined text-[48px] mb-3 text-primary">edit_square</span>
                <h3 className="text-lg font-bold text-white mb-2">No Posts Yet</h3>
                <p className="text-sm text-secondary max-w-md mx-auto mb-6">
                  Your blog database is clean and ready. Click below to share your first life update or project milestone!
                </p>
                <button
                  onClick={handleOpenCreateModal}
                  className="px-6 py-3 bg-primary text-black font-bold rounded-xl text-xs primary-glow hover:scale-105 transition-transform inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add_circle</span>
                  Create Your First Life Update
                </button>
              </div>
            ) : (
              filteredPosts.map((post, idx) => {
                const isLiked = !!likedPosts[post.id];
                const isBookmarked = !!bookmarkedPosts[post.id];
                const currentLikes = likeCounts[post.id] ?? post.likes ?? 0;
                const commentsList = postComments[post.id] || [];

                return (
                  <article
                    key={post.id || idx}
                    onClick={() => setSelectedPost(post)}
                    className="glass-card rounded-2xl overflow-hidden fade-up cursor-pointer border border-white/10"
                    style={{ animationDelay: `${0.1 + idx * 0.08}s` }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/20">
                            <img
                              className="w-full h-full object-cover"
                              alt={post.author || 'Abhishek KR'}
                              src={post.authorAvatar || post.author_avatar || '/I am.png'}
                            />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white text-sm">{post.author || 'Abhishek KR'}</h4>
                            <p className="text-[11px] text-secondary">
                              {post.date} • <span className="text-primary font-medium">{post.category}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {post.status && (
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-secondary">
                              {post.status}
                            </span>
                          )}

                          {/* Edit Button */}
                          <button
                            onClick={(e) => handleOpenEditModal(e, post)}
                            className="p-1.5 text-secondary hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            title="Edit Post (Password Protected)"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={(e) => handleDeletePost(e, post.id)}
                            className="p-1.5 text-secondary hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
                            title="Delete Post (Password Protected)"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </div>

                      <h3 className="font-display-lg text-xl font-bold mb-2 text-white hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-secondary text-sm line-clamp-3 mb-4">
                        {post.excerpt || post.content}
                      </p>
                    </div>

                    {/* Image Attachment with Error Fallback */}
                    {post.image && (
                      <div className="w-full h-72 overflow-hidden relative border-y border-white/5 post-image-wrapper">
                        <img
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          alt={post.title}
                          src={post.image}
                          onError={(e) => {
                            const wrapper = e.target.closest('.post-image-wrapper');
                            if (wrapper) wrapper.style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    {/* Action Footer (Public) */}
                    <div className="p-5 flex items-center justify-between text-xs text-secondary">
                      <div className="flex items-center gap-6">
                        {/* Like */}
                        <button
                          onClick={(e) => handleToggleLike(e, post.id)}
                          className={`flex items-center gap-1.5 transition-colors ${
                            isLiked ? 'text-red-400 font-bold' : 'hover:text-white'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: isLiked ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                          <span>{currentLikes}</span>
                        </button>

                        {/* Comments */}
                        <button
                          onClick={(e) => handleToggleComments(e, post.id)}
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                          <span>{(post.comments_count || 0) + commentsList.length}</span>
                        </button>

                        {/* Share */}
                        <button
                          onClick={(e) => handleShare(e, post)}
                          className="flex items-center gap-1.5 hover:text-white transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">share</span>
                          <span>Share</span>
                        </button>
                      </div>

                      {/* Bookmark */}
                      <button
                        onClick={(e) => handleToggleBookmark(e, post.id)}
                        className={`material-symbols-outlined text-[20px] transition-colors ${
                          isBookmarked ? 'text-primary' : 'hover:text-white'
                        }`}
                        style={{ fontVariationSettings: isBookmarked ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        bookmark
                      </button>
                    </div>

                    {/* Inline Comments Drawer */}
                    {activeCommentsPostId === post.id && (
                      <div
                        className="p-5 bg-black/40 border-t border-white/10 space-y-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h5 className="text-xs font-semibold text-primary">Comments ({commentsList.length})</h5>
                        {commentsList.length > 0 ? (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                            {commentsList.map((c, i) => (
                              <div key={i} className="p-3 bg-white/5 rounded-xl text-xs space-y-1">
                                <div className="flex justify-between text-secondary">
                                  <span className="font-bold text-white">{c.author}</span>
                                  <span className="text-[10px]">{c.created_at || c.time}</span>
                                </div>
                                <p className="text-on-surface">{c.text}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-secondary">No comments yet. Be the first to comment!</p>
                        )}
                        <div className="flex gap-2 pt-1">
                          <input
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddComment(post.id);
                            }}
                            placeholder="Add a comment..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="px-4 py-1.5 bg-primary text-black text-xs font-bold rounded-xl hover:scale-105 transition-transform"
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* Right Column: Profile & Sidebar */}
          <aside className="lg:col-span-4 space-y-gutter">
            <div className="sticky top-24 space-y-gutter">
              {/* Profile Card */}
              <div className="glass-card rounded-2xl p-6 fade-up border border-white/10 text-center">
                <div className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-primary p-0.5 overflow-hidden">
                  <img
                    className="w-full h-full rounded-full object-cover"
                    alt="Abhishek KR profile"
                    src="/I am.png"
                  />
                </div>
                <h3 className="font-display-lg text-xl font-bold text-white mb-1">Abhishek KR</h3>
                <p className="text-xs text-secondary mb-5">AI Full Stack Developer &amp; Tech Enthusiast</p>
                <a
                  href="#home"
                  className="w-full py-2.5 rounded-xl border border-primary/40 text-primary text-xs font-semibold hover:bg-white/5 transition-all block mb-4"
                >
                  Return to Portfolio Home
                </a>
                <button
                  onClick={handleOpenCreateModal}
                  className="w-full py-2.5 rounded-xl bg-primary text-black text-xs font-bold primary-glow hover:scale-105 transition-transform"
                >
                  + Post New Life Update
                </button>
              </div>

              {/* Topics Card */}
              <div className="glass-card rounded-2xl p-6 fade-up border border-white/10">
                <h4 className="text-xs font-bold text-primary mb-4 tracking-wider uppercase">FILTER BY CATEGORY</h4>
                <div className="flex flex-wrap gap-2">
                  {['#Life Update', '#Internship', '#React', '#AI', '#Project', '#Achievement'].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        const clean = tag.replace('#', '');
                        setActiveCategory(clean);
                        showToast(`Filtered by ${tag}`);
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-secondary text-xs hover:text-white hover:border-primary/40 transition-all"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity Heatmap */}
              <div className="glass-card rounded-2xl p-6 fade-up border border-white/10">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-bold text-primary tracking-wider uppercase">ACTIVITY MATRIX</h4>
                  <span className="text-[10px] text-secondary">Last 3 Months</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 justify-items-center">
                  {Array.from({ length: 49 }).map((_, i) => {
                    const intensity = (i * 23 + 7) % 100;
                    let bgClass = 'bg-white/5';
                    if (intensity > 75) bgClass = 'bg-primary';
                    else if (intensity > 45) bgClass = 'bg-primary/60';
                    else if (intensity > 20) bgClass = 'bg-primary/20';

                    return (
                      <div
                        key={i}
                        className={`heatmap-cell ${bgClass} hover:scale-125 transition-transform cursor-pointer`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Expanded Reader Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto glass-card rounded-2xl z-10 border border-white/15 p-6 md:p-8 shadow-2xl"
            >
              <button
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>

              {selectedPost.image && (
                <div className="w-full h-64 rounded-xl overflow-hidden mb-6 relative border border-white/10 reader-image-wrapper">
                  <img
                    src={selectedPost.image}
                    alt={selectedPost.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const wrapper = e.target.closest('.reader-image-wrapper');
                      if (wrapper) wrapper.style.display = 'none';
                    }}
                  />
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/70 border border-white/10 text-primary text-xs font-semibold backdrop-blur-md">
                    {selectedPost.category}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs text-secondary">
                  <span className="font-bold text-white">{selectedPost.author || 'Abhishek KR'}</span>
                  <span>•</span>
                  <span>{selectedPost.date}</span>
                </div>

                <h2 className="font-display-lg text-2xl md:text-3xl font-bold text-white">
                  {selectedPost.title}
                </h2>

                <div className="text-secondary text-sm leading-relaxed whitespace-pre-line space-y-4 pt-2">
                  {selectedPost.content}
                </div>

                {selectedPost.tags && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    {(Array.isArray(selectedPost.tags) ? selectedPost.tags : [selectedPost.tags]).map((t) => (
                      <span key={t} className="px-3 py-1 rounded-full bg-white/5 text-primary text-xs font-medium">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-4 flex justify-between items-center border-t border-white/10 flex-wrap gap-3">
                  {selectedPost.link ? (
                    <a
                      href={selectedPost.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-black text-xs font-bold rounded-xl primary-glow hover:scale-105 transition-transform"
                    >
                      View Associated Work / Demo
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                    </a>
                  ) : <div />}

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleOpenEditModal(e, selectedPost)}
                      className="px-4 py-2.5 bg-white/10 text-white hover:bg-white/20 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit Post
                    </button>

                    <button
                      onClick={(e) => handleDeletePost(e, selectedPost.id)}
                      className="px-4 py-2.5 bg-red-500/20 text-red-400 hover:bg-red-500/40 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete Post
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sleek Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPostToDelete(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative w-full max-w-md glass-card rounded-2xl z-10 border border-red-500/30 p-6 md:p-8 shadow-2xl text-center"
            >
              {/* Warning Badge Icon */}
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <span className="material-symbols-outlined text-[32px]">delete_forever</span>
              </div>

              <h3 className="font-display-lg text-xl font-bold text-white mb-2">
                Delete Post Permanently?
              </h3>
              <p className="text-xs text-secondary mb-6 leading-relaxed">
                Are you sure you want to delete <strong className="text-white">&quot;{typeof postToDelete === 'object' ? postToDelete.title : 'this post'}&quot;</strong>? This action cannot be undone.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  className="px-5 py-2.5 bg-white/5 text-white rounded-xl text-xs font-semibold hover:bg-white/10 transition-all border border-white/10"
                >
                  Keep Post
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePost}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/30 hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  Delete Permanently
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Password Gate Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-md glass-card rounded-2xl z-10 border border-white/15 p-6 md:p-8 shadow-2xl text-center"
            >
              <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>

              <h3 className="font-display-lg text-xl font-bold text-white mb-2">
                Admin Authorization Required
              </h3>
              <p className="text-xs text-secondary mb-6">
                You must enter the Admin Password to Post, Edit, or Delete content on this blog.
              </p>

              <form onSubmit={handleVerifyPasswordSubmit} className="space-y-4 text-xs text-left">
                <div>
                  <label className="block text-secondary mb-1.5 font-semibold">Enter Password</label>
                  <div className="relative">
                    <input
                      type={showPasswordPreview ? 'text' : 'password'}
                      required
                      autoFocus
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter admin password..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordPreview((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-white transition-colors p-1"
                      title={showPasswordPreview ? 'Hide password' : 'Show password preview'}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPasswordPreview ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  {passwordError && (
                    <p className="text-red-400 text-[11px] mt-1 font-medium">{passwordError}</p>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="px-4 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl primary-glow hover:scale-105 transition-transform"
                  >
                    Unlock &amp; Proceed
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Creation / Editing Modal Form */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowCreateModal(false);
                setEditingPostId(null);
              }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl z-10 border border-white/15 p-6 md:p-8"
            >
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <h3 className="font-display-lg text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    {editingPostId ? 'edit' : 'edit_note'}
                  </span>
                  {editingPostId ? 'Edit Life Update / Post' : 'Post a Life Update / Developer Log'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPostId(null);
                  }}
                  className="text-secondary hover:text-white p-1"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-secondary mb-1.5 font-semibold">Post Title / Headline *</label>
                  <input
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Achieved OCI AI Associate Certification!"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-secondary mb-1.5 font-semibold">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="Life Update">Life Update</option>
                      <option value="Internship">Internship</option>
                      <option value="Project">Project</option>
                      <option value="Course">Course</option>
                      <option value="Self-Learning">Self-Learning</option>
                      <option value="Achievement">Achievement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-secondary mb-1.5 font-semibold">Status Badge</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-surface-container border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-primary"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Learning">Learning</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-secondary mb-1.5 font-semibold">Story / Learnings / Details *</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Describe what you built, learned, or accomplished today..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Enhanced Image Section: Device Upload + Direct URL + Live Preview */}
                <div>
                  <label className="block text-secondary mb-1.5 font-semibold">
                    Post Photo (Upload from Device or Paste Direct Image URL)
                  </label>

                  <div className="flex gap-2 items-center flex-wrap">
                    {/* Device Upload Button */}
                    <label className="cursor-pointer px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-semibold flex items-center gap-2 transition-all">
                      <span className="material-symbols-outlined text-[18px] text-emerald-400">upload_file</span>
                      <span>Upload from Device</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDeviceFileUpload(e, (dataUrl) => setFormData((prev) => ({ ...prev, image: dataUrl })))}
                      />
                    </label>

                    <span className="text-secondary text-xs">or</span>

                    {/* Direct Image URL Input */}
                    <input
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Paste direct image link (e.g. https://.../photo.png or /1.jpg)"
                      className="flex-1 min-w-[220px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                    />

                    {formData.image && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="px-3 py-2.5 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors font-medium"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Live Image Preview inside Form */}
                  {formData.image && (
                    <div className="mt-3 relative w-full h-40 rounded-xl overflow-hidden border border-white/15 bg-black/40 form-image-preview-wrapper">
                      <img
                        src={formData.image}
                        alt="Image preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const errNotice = e.target.parentElement.querySelector('.image-error-notice');
                          if (errNotice) errNotice.style.display = 'flex';
                        }}
                        onLoad={(e) => {
                          e.target.style.display = 'block';
                          const errNotice = e.target.parentElement.querySelector('.image-error-notice');
                          if (errNotice) errNotice.style.display = 'none';
                        }}
                      />
                      <div className="image-error-notice hidden absolute inset-0 items-center justify-center p-4 bg-red-950/60 text-red-200 text-xs text-center border border-red-500/30 rounded-xl">
                        <span>⚠️ Could not load image from this link. Make sure it is a direct image URL ending in .jpg/.png/.webp (or click <strong>"Upload from Device"</strong> above).</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-secondary mb-1.5 font-semibold">Tags (comma-separated)</label>
                    <input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="e.g. React, AI, Milestone"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-secondary mb-1.5 font-semibold">Project Link (optional)</label>
                    <input
                      value={formData.link}
                      onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                      placeholder="e.g. https://my-project.vercel.app"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-secondary/50 focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setEditingPostId(null);
                    }}
                    className="px-5 py-2.5 bg-white/5 text-white rounded-xl hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary text-black font-bold rounded-xl primary-glow hover:scale-105 transition-transform"
                  >
                    {editingPostId ? 'Save Changes' : 'Save & Publish Update'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default Blog;
