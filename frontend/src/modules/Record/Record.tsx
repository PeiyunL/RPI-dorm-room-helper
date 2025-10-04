import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Divider, 
  Chip, 
  Avatar, 
  Tab, 
  Tabs, 
  IconButton, 
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Collapse,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  History as HistoryIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkedIcon,
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import pb from '../lib/pocketbase.js';

// Interface definitions
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

interface BookmarkExpanded extends Bookmark {
  expand?: {
    post?: Post;
  };
}

interface LikeExpanded extends Like {
  expand?: {
    post?: Post;
  };
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab Panel component
function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`record-tabpanel-${index}`}
      aria-labelledby={`record-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
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

  const currentUser = pb.authStore.model;

  // Fetch user's posts
  const fetchMyPosts = async () => {
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
    }
  };

  // Fetch user's likes
  const fetchUserLikes = async () => {
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
    }
  };

  // Fetch user's bookmarks
  const fetchUserBookmarks = async () => {
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
    }
  };

  // Fetch bookmarked posts
  const fetchBookmarkedPosts = async () => {
    if (!currentUser) return;
    
    try {
      const bookmarks = await pb.collection('bookmarks').getFullList<BookmarkExpanded>({
        filter: `user = "${currentUser.id}"`,
        expand: 'post.author',
        sort: '-created'
      });
      
      const posts = bookmarks
        .map((bookmark: BookmarkExpanded) => bookmark.expand?.post)
        .filter((post): post is Post => post !== undefined);
      
      setBookmarkedPosts(posts);
    } catch (error) {
      console.error('Error fetching bookmarked posts:', error);
      showSnackbar('Failed to load bookmarked posts', 'error');
    }
  };

  // Fetch liked posts
  const fetchLikedPosts = async () => {
    if (!currentUser) return;
    
    try {
      const likes = await pb.collection('likes').getFullList<LikeExpanded>({
        filter: `user = "${currentUser.id}"`,
        expand: 'post.author',
        sort: '-created'
      });
      
      const posts = likes
        .map((like: LikeExpanded) => like.expand?.post)
        .filter((post): post is Post => post !== undefined);
      
      setLikedPosts(posts);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      showSnackbar('Failed to load liked posts', 'error');
    }
  };

  // Fetch comments for a post
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

  // Toggle comments visibility
  const handleToggleComments = async (postId: string) => {
    const newExpanded = new Set(expandedComments);
    
    if (expandedComments.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
      // Fetch comments if not already loaded
      if (!postComments.has(postId)) {
        await fetchComments(postId);
      }
    }
    
    setExpandedComments(newExpanded);
  };

  // Add a comment
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
      }, {
        expand: 'user'
      });
      
      // Update comments list
      setPostComments(prev => {
        const comments = prev.get(postId) || [];
        return new Map(prev).set(postId, [comment, ...comments]);
      });
      
      // Clear comment text
      setCommentText(prev => {
        const newMap = new Map(prev);
        newMap.delete(postId);
        return newMap;
      });
      
      // Update post's comment count
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

  // Update comment text
  const handleCommentTextChange = (postId: string, text: string) => {
    setCommentText(prev => new Map(prev).set(postId, text));
  };

  // Load data based on current tab
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      try {
        // Always fetch user's likes and bookmarks status
        await Promise.all([
          fetchUserLikes(),
          fetchUserBookmarks()
        ]);
        
        // Fetch data based on current tab
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
  }, [tabValue, currentUser]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleToggleBookmark = async (post: Post) => {
    if (!currentUser) {
      showSnackbar('Please log in to bookmark posts', 'warning');
      return;
    }
    
    try {
      const existingBookmark = userBookmarks.get(post.id);
      
      if (existingBookmark) {
        // Remove bookmark
        await pb.collection('bookmarks').delete(existingBookmark.id);
        
        const newBookmarks = new Map(userBookmarks);
        newBookmarks.delete(post.id);
        setUserBookmarks(newBookmarks);
        
        // Update bookmarked posts list if on bookmarks tab
        if (tabValue === 1) {
          setBookmarkedPosts(bookmarkedPosts.filter(p => p.id !== post.id));
        }
        
        showSnackbar('Bookmark removed', 'success');
      } else {
        // Add bookmark
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
        // Remove like
        await pb.collection('likes').delete(existingLike.id);
        
        const newLikes = new Map(userLikes);
        newLikes.delete(post.id);
        setUserLikes(newLikes);
        
        // Update post likes count
        const updatedPost = await pb.collection('posts').update<Post>(post.id, {
          likes_count: Math.max(0, post.likes_count - 1)
        });
        
        // Update liked posts list if on likes tab
        if (tabValue === 2) {
          setLikedPosts(likedPosts.filter(p => p.id !== post.id));
        }
        
        // Update post in my posts if present
        if (tabValue === 0) {
          setMyPosts(myPosts.map(p => 
            p.id === post.id ? updatedPost : p
          ));
        }
        
        showSnackbar('Like removed', 'success');
      } else {
        // Add like
        const like = await pb.collection('likes').create<Like>({
          user: currentUser.id,
          post: post.id
        });
        
        const newLikes = new Map(userLikes);
        newLikes.set(post.id, like);
        setUserLikes(newLikes);
        
        // Update post likes count
        const updatedPost = await pb.collection('posts').update<Post>(post.id, {
          likes_count: post.likes_count + 1
        });
        
        // Update post in my posts if present
        if (tabValue === 0) {
          setMyPosts(myPosts.map(p => 
            p.id === post.id ? updatedPost : p
          ));
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

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditFormData({
      ...editFormData,
      [name]: value
    });
  };

  const handleSaveEdit = async () => {
    if (!currentEditPost) return;
    
    try {
      const updatedPost = await pb.collection('posts').update<Post>(currentEditPost.id, {
        title: editFormData.title,
        content: editFormData.content,
        category: editFormData.category
      });
      
      // Update post in all lists
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

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    
    try {
      await pb.collection('posts').delete(postToDelete);
      
      // Remove from all lists
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

  // Post display component
  const PostCard = ({ post, isMyPost = false }: { post: Post, isMyPost?: boolean }) => {
    const isLiked = userLikes.has(post.id);
    const isBookmarked = userBookmarks.has(post.id);
    const authorName = post.expand?.author?.name || post.expand?.author?.username || 'Unknown User';
    const authorAvatar = post.expand?.author?.avatar;
    const commentsExpanded = expandedComments.has(post.id);
    const comments = postComments.get(post.id) || [];
    const isLoadingComments = loadingComments.has(post.id);
    
    return (
      <Card elevation={2} sx={{ mb: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Chip
              label={post.category || 'General'}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatDate(post.created)}
            </Typography>
          </Box>
          <Typography variant="h6" component="h2" gutterBottom>
            {post.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}
              src={authorAvatar ? pb.files.getUrl(post.expand?.author!, authorAvatar) : undefined}
            >
              {!authorAvatar && authorName.charAt(0)}
            </Avatar>
            <Typography variant="body2" color="text.secondary">
              {authorName}
            </Typography>
          </Box>
          <Typography variant="body1" paragraph>
            {post.content}
          </Typography>
          {post.image && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <img
                src={pb.files.getUrl(post, post.image)}
                alt={post.title}
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', objectFit: 'cover' }}
              />
            </Box>
          )}
        </CardContent>
        <Divider />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, alignItems: 'center' }}>
          <Box>
            <IconButton
              onClick={() => handleToggleLike(post)}
              color={isLiked ? 'error' : 'default'}
              size="small"
            >
              {isLiked ? <LikedIcon /> : <LikeIcon />}
            </IconButton>
            <Typography variant="body2" component="span" sx={{ mr: 2 }}>
              {post.likes_count || 0}
            </Typography>
            
            <IconButton 
              size="small" 
              sx={{ mr: 1 }}
              onClick={() => handleToggleComments(post.id)}
            >
              {commentsExpanded ? <ExpandLessIcon /> : <CommentIcon />}
            </IconButton>
            <Typography variant="body2" component="span" sx={{ mr: 2 }}>
              {post.comments_count || 0}
            </Typography>
            
            <IconButton
              onClick={() => handleToggleBookmark(post)}
              color={isBookmarked ? 'primary' : 'default'}
              size="small"
            >
              {isBookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
            </IconButton>
          </Box>
          
          {isMyPost && (
            <Box>
              <IconButton 
                color="primary" 
                size="small"
                onClick={() => handleEditPost(post)}
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                color="error" 
                size="small"
                onClick={() => handleDeleteClick(post.id)}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>
        
        {/* Comments Section */}
        <Collapse in={commentsExpanded}>
          <Divider />
          <Box sx={{ p: 2, bgcolor: 'background.default' }}>
            {/* Add Comment */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Write a comment..."
                value={commentText.get(post.id) || ''}
                onChange={(e) => handleCommentTextChange(post.id, e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment(post.id);
                  }
                }}
              />
              <IconButton 
                color="primary"
                onClick={() => handleAddComment(post.id)}
                disabled={!commentText.get(post.id)?.trim()}
              >
                <SendIcon />
              </IconButton>
            </Box>
            
            {/* Comments List */}
            {isLoadingComments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : comments.length > 0 ? (
              <List sx={{ p: 0 }}>
                {comments.map((comment) => {
                  const commentAuthor = comment.expand?.user;
                  const commentAuthorName = commentAuthor?.name || commentAuthor?.username || 'Unknown User';
                  
                  return (
                    <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar 
                          sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}
                          src={commentAuthor?.avatar ? pb.files.getUrl(commentAuthor, commentAuthor.avatar) : undefined}
                        >
                          {commentAuthorName.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" component="span">
                              {commentAuthorName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.created)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {comment.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 2 }}>
                No comments yet. Be the first to comment!
              </Typography>
            )}
          </Box>
        </Collapse>
      </Card>
    );
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please log in to view your records.
        </Alert>
      </Container>
    );
  }

  return (
    <div>
      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
            <HistoryIcon sx={{ mr: 2, fontSize: 32 }} />
            My Record
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Manage your posts, bookmarks, and activity
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            aria-label="record tabs"
          >
            <Tab label="My Posts" id="record-tab-0" aria-controls="record-tabpanel-0" />
            <Tab label="Bookmarks" id="record-tab-1" aria-controls="record-tabpanel-1" />
            <Tab label="Liked" id="record-tab-2" aria-controls="record-tabpanel-2" />
          </Tabs>
        </Paper>

        {/* Tab Panels */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* My Posts Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Posts you've created ({myPosts.length})
              </Typography>
              {myPosts.length > 0 ? (
                <Grid container spacing={2}>
                  {myPosts.map((post) => (
                    <Grid item xs={12} key={post.id}>
                      <PostCard post={post} isMyPost={true} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="body1" color="text.secondary">
                    You haven't liked any posts yet.
                  </Typography>
                </Paper>
              )}
            </TabPanel>
          </>
        )}

        {/* Edit Post Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="title"
              name="title"
              label="Title"
              type="text"
              fullWidth
              variant="outlined"
              value={editFormData.title}
              onChange={handleEditFormChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="category"
              name="category"
              label="Category"
              type="text"
              fullWidth
              variant="outlined"
              value={editFormData.category}
              onChange={handleEditFormChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="content"
              name="content"
              label="Content"
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              value={editFormData.content}
              onChange={handleEditFormChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete this post? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}