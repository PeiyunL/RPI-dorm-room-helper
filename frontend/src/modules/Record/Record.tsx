import React, { useState, useEffect, useCallback } from 'react';
import { 
  Trash2, 
  Edit3,
  History,
  Bookmark,
  Heart,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  X,
  AlertCircle
} from 'lucide-react';

// Mock PocketBase for demo
const pb = {
  authStore: { model: { id: 'user123', username: 'demo_user', name: 'Demo User' } },
  collection: (name: string) => ({
    getList: async () => ({ items: [] }),
    getFullList: async () => [],
    create: async (data: any) => ({ id: Date.now().toString(), ...data, created: new Date().toISOString() }),
    update: async (id: string, data: any) => ({ id, ...data }),
    delete: async (id: string) => {}
  }),
  files: {
    getUrl: (record: any, filename: string) => `https://via.placeholder.com/150`
  }
};

interface Author {
  id: string;
  username: string;
  name: string;
  avatar?: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  created: string;
  updated: string;
  category: string;
  likes_count: number;
  comments_count: number;
  image?: string;
  expand?: {
    author?: Author;
  };
}

interface Like {
  id: string;
  user: string;
  post: string;
  created: string;
}

interface Bookmark {
  id: string;
  user: string;
  post: string;
  created: string;
}

interface Comment {
  id: string;
  user: string;
  post: string;
  content: string;
  created: string;
  updated: string;
  expand?: {
    user?: Author;
  };
}

export default function Record() {
  const [tabValue, setTabValue] = useState(0);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [userLikes, setUserLikes] = useState<Map<string, Like>>(new Map());
  const [userBookmarks, setUserBookmarks] = useState<Map<string, Bookmark>>(new Map());
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [currentEditPost, setCurrentEditPost] = useState<Post | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [postComments, setPostComments] = useState<Map<string, Comment[]>>(new Map());
  const [commentText, setCommentText] = useState<Map<string, string>>(new Map());
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set());
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [commentMenuOpen, setCommentMenuOpen] = useState<string | null>(null);
  const [deleteCommentDialogOpen, setDeleteCommentDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<{ commentId: string; postId: string } | null>(null);

  const currentUser = pb.authStore.model;

  const fetchMyPosts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('posts').getList(1, 50, {
        filter: `author = "${currentUser.id}"`,
        sort: '-created',
        expand: 'author'
      });
      setMyPosts(records.items as Post[]);
    } catch (error) {
      console.error('Error fetching my posts:', error);
      showSnackbar('Failed to load your posts', 'error');
      setMyPosts([]);
    }
  }, [currentUser]);

  const fetchUserLikes = useCallback(async () => {
    if (!currentUser) return;
    try {
      const likes = await pb.collection('likes').getFullList<Like>({
        filter: `user = "${currentUser.id}"`
      });
      const likesMap = new Map<string, Like>();
      likes.forEach((like: Like) => {
        likesMap.set(like.post, like);
      });
      setUserLikes(likesMap);
    } catch (error) {
      console.error('Error fetching likes:', error);
      setUserLikes(new Map());
    }
  }, [currentUser]);

  const fetchUserBookmarks = useCallback(async () => {
    if (!currentUser) return;
    try {
      const bookmarks = await pb.collection('bookmarks').getFullList<Bookmark>({
        filter: `user = "${currentUser.id}"`
      });
      const bookmarksMap = new Map<string, Bookmark>();
      bookmarks.forEach((bookmark: Bookmark) => {
        bookmarksMap.set(bookmark.post, bookmark);
      });
      setUserBookmarks(bookmarksMap);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setUserBookmarks(new Map());
    }
  }, [currentUser]);

  const fetchBookmarkedPosts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const bookmarks = await pb.collection('bookmarks').getFullList<any>({
        filter: `user = "${currentUser.id}"`,
        expand: 'post.author',
        sort: '-created'
      });
      const posts = bookmarks
        .map((bookmark: any) => bookmark.expand?.post)
        .filter((post): post is Post => post !== undefined);
      setBookmarkedPosts(posts);
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      showSnackbar('Failed to load bookmarked posts', 'error');
      setBookmarkedPosts([]);
    }
  }, [currentUser]);

  const fetchLikedPosts = useCallback(async () => {
    if (!currentUser) return;
    try {
      const likes = await pb.collection('likes').getFullList<any>({
        filter: `user = "${currentUser.id}"`,
        expand: 'post.author',
        sort: '-created'
      });
      const posts = likes
        .map((like: any) => like.expand?.post)
        .filter((post): post is Post => post !== undefined);
      setLikedPosts(posts);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      showSnackbar('Failed to load liked posts', 'error');
      setLikedPosts([]);
    }
  }, [currentUser]);

  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => new Set(prev).add(postId));
    try {
      const comments = await pb.collection('comments').getFullList<Comment>({
        filter: `post = "${postId}"`,
        sort: '-created',
        expand: 'user'
      });
      setPostComments(prev => new Map(prev).set(postId, comments));
    } catch (error) {
      console.error('Error fetching comments:', error);
      showSnackbar('Failed to load comments', 'error');
    } finally {
      setLoadingComments(prev => {
        const newSet = new Set(prev);
        newSet.delete(postId);
        return newSet;
      });
    }
  };

  const handleToggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments);
    if (expandedComments.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      if (!postComments.has(postId)) {
        await fetchComments(postId);
      }
    }
    setExpandedComments(newExpanded);
  };

  const handleAddComment = async (postId: string) => {
    if (!currentUser) {
      showSnackbar('Please log in to comment', 'warning');
      return;
    }
    const text = commentText.get(postId)?.trim();
    if (!text) {
      showSnackbar('Comment cannot be empty', 'warning');
      return;
    }
    try {
      const comment = await pb.collection('comments').create<Comment>({
        user: currentUser.id,
        post: postId,
        content: text
      }, { expand: 'user' });
      setPostComments(prev => {
        const comments = prev.get(postId) || [];
        return new Map(prev).set(postId, [comment, ...comments]);
      });
      setCommentText(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });
      const updatePostCommentCount = (posts: Post[]) => 
        posts.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p);
      setMyPosts(updatePostCommentCount);
      setBookmarkedPosts(updatePostCommentCount);
      setLikedPosts(updatePostCommentCount);
      showSnackbar('Comment added', 'success');
    } catch (error) {
      console.error('Error adding comment:', error);
      showSnackbar('Failed to add comment', 'error');
    }
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
    setCommentMenuOpen(null);
  };

  const handleSaveEditComment = async (commentId: string, postId: string) => {
    if (!editCommentText.trim()) {
      showSnackbar('Comment cannot be empty', 'warning');
      return;
    }
    try {
      const updatedComment = await pb.collection('comments').update<Comment>(commentId, {
        content: editCommentText
      }, { expand: 'user' });
      setPostComments(prev => {
        const comments = prev.get(postId) || [];
        const updatedComments = comments.map(c => 
          c.id === commentId ? updatedComment : c
        );
        return new Map(prev).set(postId, updatedComments);
      });
      setEditingCommentId(null);
      setEditCommentText('');
      showSnackbar('Comment updated', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showSnackbar('Failed to update comment', 'error');
    }
  };

  const handleDeleteCommentClick = (commentId: string, postId: string) => {
    setCommentToDelete({ commentId, postId });
    setDeleteCommentDialogOpen(true);
    setCommentMenuOpen(null);
  };

  const handleConfirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await pb.collection('comments').delete(commentToDelete.commentId);
      setPostComments(prev => {
        const comments = prev.get(commentToDelete.postId) || [];
        const updatedComments = comments.filter(c => c.id !== commentToDelete.commentId);
        return new Map(prev).set(commentToDelete.postId, updatedComments);
      });
      const updatePostCommentCount = (posts: Post[]) => 
        posts.map(p => p.id === commentToDelete.postId ? { ...p, comments_count: Math.max(0, (p.comments_count || 0) - 1) } : p);
      setMyPosts(updatePostCommentCount);
      setBookmarkedPosts(updatePostCommentCount);
      setLikedPosts(updatePostCommentCount);
      setDeleteCommentDialogOpen(false);
      setCommentToDelete(null);
      showSnackbar('Comment deleted', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showSnackbar('Failed to delete comment', 'error');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchUserLikes(), fetchUserBookmarks()]);
        switch (tabValue) {
          case 0:
            await fetchMyPosts();
            break;
          case 1:
            await fetchBookmarkedPosts();
            break;
          case 2:
            await fetchLikedPosts();
            break;
        }
      } catch (error) {
        console.error('Error loading data:', error);
        showSnackbar('Failed to load data', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      loadData();
    }
  }, [tabValue, currentUser, fetchUserLikes, fetchUserBookmarks, fetchMyPosts, fetchBookmarkedPosts, fetchLikedPosts]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
    setTimeout(() => setSnackbar({ ...snackbar, open: false }), 4000);
  };

  const handleToggleBookmark = async (post: Post) => {
    if (!currentUser) {
      showSnackbar('Please log in to bookmark posts', 'warning');
      return;
    }
    try {
      const existingBookmark = userBookmarks.get(post.id);
      if (existingBookmark) {
        await pb.collection('bookmarks').delete(existingBookmark.id);
        const newBookmarks = new Map(userBookmarks);
        newBookmarks.delete(post.id);
        setUserBookmarks(newBookmarks);
        if (tabValue === 1) {
          setBookmarkedPosts(bookmarkedPosts.filter(p => p.id !== post.id));
        }
        showSnackbar('Bookmark removed', 'success');
      } else {
        const bookmark = await pb.collection('bookmarks').create<Bookmark>({
          user: currentUser.id,
          post: post.id
        });
        const newBookmarks = new Map(userBookmarks);
        newBookmarks.set(post.id, bookmark);
        setUserBookmarks(newBookmarks);
        showSnackbar('Post bookmarked', 'success');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      showSnackbar('Failed to update bookmark', 'error');
    }
  };

  const handleToggleLike = async (post: Post) => {
    if (!currentUser) {
      showSnackbar('Please log in to like posts', 'warning');
      return;
    }
    try {
      const existingLike = userLikes.get(post.id);
      if (existingLike) {
        await pb.collection('likes').delete(existingLike.id);
        const newLikes = new Map(userLikes);
        newLikes.delete(post.id);
        setUserLikes(newLikes);
        const updatedPost = await pb.collection('posts').update<Post>(post.id, {
          likes_count: Math.max(0, post.likes_count - 1)
        });
        if (tabValue === 2) {
          setLikedPosts(likedPosts.filter(p => p.id !== post.id));
        }
        if (tabValue === 0) {
          setMyPosts(myPosts.map(p => p.id === post.id ? updatedPost : p));
        }
        showSnackbar('Like removed', 'success');
      } else {
        const like = await pb.collection('likes').create<Like>({
          user: currentUser.id,
          post: post.id
        });
        const newLikes = new Map(userLikes);
        newLikes.set(post.id, like);
        setUserLikes(newLikes);
        const updatedPost = await pb.collection('posts').update<Post>(post.id, {
          likes_count: post.likes_count + 1
        });
        if (tabValue === 0) {
          setMyPosts(myPosts.map(p => p.id === post.id ? updatedPost : p));
        }
        showSnackbar('Post liked', 'success');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      showSnackbar('Failed to update like', 'error');
    }
  };

  const handleEditPost = (post: Post) => {
    setCurrentEditPost(post);
    setEditFormData({
      title: post.title,
      content: post.content,
      category: post.category
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!currentEditPost) return;
    if (!editFormData.title.trim() || !editFormData.content.trim()) {
      showSnackbar('Title and content cannot be empty', 'warning');
      return;
    }
    try {
      const updatedPost = await pb.collection('posts').update<Post>(currentEditPost.id, {
        title: editFormData.title,
        content: editFormData.content,
        category: editFormData.category
      });
      setMyPosts(myPosts.map(post => 
        post.id === currentEditPost.id ? { ...updatedPost, expand: post.expand } : post
      ));
      setBookmarkedPosts(bookmarkedPosts.map(post => 
        post.id === currentEditPost.id ? { ...updatedPost, expand: post.expand } : post
      ));
      setLikedPosts(likedPosts.map(post => 
        post.id === currentEditPost.id ? { ...updatedPost, expand: post.expand } : post
      ));
      setEditDialogOpen(false);
      setCurrentEditPost(null);
      showSnackbar('Post updated successfully', 'success');
    } catch (error) {
      console.error('Error updating post:', error);
      showSnackbar('Failed to update post', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    try {
      await pb.collection('posts').delete(postToDelete);
      setMyPosts(myPosts.filter(post => post.id !== postToDelete));
      setBookmarkedPosts(bookmarkedPosts.filter(post => post.id !== postToDelete));
      setLikedPosts(likedPosts.filter(post => post.id !== postToDelete));
      setDeleteConfirmOpen(false);
      setPostToDelete(null);
      showSnackbar('Post deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting post:', error);
      showSnackbar('Failed to delete post', 'error');
    }
  };

  const PostCard = ({ post, isMyPost = false }: { post: Post, isMyPost?: boolean }) => {
    const isLiked = userLikes.has(post.id);
    const isBookmarked = userBookmarks.has(post.id);
    const authorName = post.expand?.author?.name || post.expand?.author?.username || 'Unknown User';
    const commentsExpanded = expandedComments.has(post.id);
    const comments = postComments.get(post.id) || [];
    const isLoadingComments = loadingComments.has(post.id);
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mb-4 overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
              {post.category || 'General'}
            </span>
            <span className="text-sm text-gray-500 font-medium">
              {formatDate(post.created)}
            </span>
          </div>
          
          <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
          
          <div className="flex items-center mb-3">
            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-2">
              {authorName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-gray-600 font-medium">{authorName}</span>
          </div>
          
          <p className="text-gray-700 mb-4 leading-relaxed">{post.content}</p>
          
          {post.image && (
            <div className="mb-4 rounded-lg overflow-hidden">
              <img
                src={pb.files.getUrl(post, post.image)}
                alt={post.title}
                className="w-full max-h-96 object-cover"
              />
            </div>
          )}
        </div>
        
        <div className="border-t border-gray-200" />
        
        <div className="px-6 py-3 flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleToggleLike(post)}
              className={`p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 ${isLiked ? 'text-red-500' : 'text-gray-600'}`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <span className="text-sm font-medium min-w-[20px]">{post.likes_count || 0}</span>
            
            <button
              onClick={() => handleToggleComments(post.id)}
              className="p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 text-gray-600 ml-2"
            >
              {commentsExpanded ? <ChevronUp className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
            </button>
            <span className="text-sm font-medium min-w-[20px]">{post.comments_count || 0}</span>
            
            <button
              onClick={() => handleToggleBookmark(post)}
              className={`p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 ml-2 ${isBookmarked ? 'text-blue-500' : 'text-gray-600'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          {isMyPost && (
            <div className="flex gap-1">
              <button
                onClick={() => handleEditPost(post)}
                className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-transform hover:scale-110"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setPostToDelete(post.id);
                  setDeleteConfirmOpen(true);
                }}
                className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-transform hover:scale-110"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        
        {commentsExpanded && (
          <>
            <div className="border-t border-gray-200" />
            <div className="p-4 bg-gray-50">
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentText.get(post.id) || ''}
                  onChange={(e) => setCommentText(prev => new Map(prev).set(post.id, e.target.value))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(post.id);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleAddComment(post.id)}
                  disabled={!commentText.get(post.id)?.trim()}
                  className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-transform hover:scale-105"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {isLoadingComments ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              ) : comments.length > 0 ? (
                <div className="space-y-3">
                  {comments.map((comment) => {
                    const commentAuthor = comment.expand?.user;
                    const commentAuthorName = commentAuthor?.name || commentAuthor?.username || 'Unknown User';
                    const isMyComment = currentUser && comment.user === currentUser.id;
                    const isEditing = editingCommentId === comment.id;
                    
                    return (
                      <div key={comment.id} className="bg-white rounded-lg p-3 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                            {commentAuthorName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-sm">{commentAuthorName}</span>
                                <span className="text-xs text-gray-500">{formatDate(comment.created)}</span>
                                {comment.updated !== comment.created && (
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">Edited</span>
                                )}
                              </div>
                              {isMyComment && !isEditing && (
                                <div className="relative">
                                  <button
                                    onClick={() => setCommentMenuOpen(commentMenuOpen === comment.id ? null : comment.id)}
                                    className="p-1 hover:bg-gray-100 rounded"
                                  >
                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                  </button>
                                  {commentMenuOpen === comment.id && (
                                    <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                      <button
                                        onClick={() => handleStartEditComment(comment)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteCommentClick(comment.id, post.id)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm text-red-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            {isEditing ? (
                              <div>
                                <textarea
                                  value={editCommentText}
                                  onChange={(e) => setEditCommentText(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                  rows={2}
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveEditComment(comment.id, post.id)}
                                    disabled={!editCommentText.trim()}
                                    className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditCommentText('');
                                    }}
                                    className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-white rounded-lg">
                  <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-yellow-800">Please log in to view your records.</p>
        </div>
      </div>
    );
  }

  const tabs = ['My Posts', 'Bookmarks', 'Liked'];
  const currentPosts = tabValue === 0 ? myPosts : tabValue === 1 ? bookmarkedPosts : likedPosts;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center mb-2">
            <History className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl md:text-4xl font-bold text-blue-600">My Record</h1>
          </div>
          <p className="text-gray-600">Manage your posts, bookmarks, and activity</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setTabValue(index)}
                className={`flex-1 py-3 px-4 font-semibold text-sm md:text-base transition-colors ${
                  tabValue === index
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {tabValue === 0 ? 'Your Posts' : tabValue === 1 ? 'Bookmarked Posts' : 'Liked Posts'} ({currentPosts.length})
            </h2>
            {currentPosts.length > 0 ? (
              <div>
                {currentPosts.map((post) => (
                  <PostCard key={post.id} post={post} isMyPost={currentUser?.id === post.author} />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                {tabValue === 0 ? (
                  <>
                    <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Create your first post to get started!</p>
                  </>
                ) : tabValue === 1 ? (
                  <>
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No bookmarks yet</h3>
                    <p className="text-gray-500">Save posts you want to read later!</p>
                  </>
                ) : (
                  <>
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No liked posts yet</h3>
                    <p className="text-gray-500">Start liking posts you enjoy!</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Edit Post Dialog */}
        {editDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold">Edit Post</h2>
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    name="category"
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    name="content"
                    value={editFormData.content}
                    onChange={(e) => setEditFormData({ ...editFormData, content: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setEditDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!editFormData.title.trim() || !editFormData.content.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Post Dialog */}
        {deleteConfirmOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
                <p className="text-gray-700">
                  Are you sure you want to delete this post? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Comment Dialog */}
        {deleteCommentDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h2 className="text-xl font-bold mb-4">Delete Comment</h2>
                <p className="text-gray-700">
                  Are you sure you want to delete this comment? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-end gap-3 p-6 border-t">
                <button
                  onClick={() => setDeleteCommentDialogOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteComment}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Snackbar */}
        {snackbar.open && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
            <div className={`px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
              snackbar.severity === 'success' ? 'bg-green-500 text-white' :
              snackbar.severity === 'error' ? 'bg-red-500 text-white' :
              snackbar.severity === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}>
              <AlertCircle className="w-5 h-5" />
              <span>{snackbar.message}</span>
              <button
                onClick={() => setSnackbar({ ...snackbar, open: false })}
                className="ml-2 hover:bg-white hover:bg-opacity-20 rounded p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}