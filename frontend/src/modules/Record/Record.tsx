// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import pb from '../../lib/pocketbase';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Divider,
  Avatar,
  Button,
  Paper,
  TextField,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  CardMedia
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Bookmark as BookmarkIcon,
  Sort as SortIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  Article as ArticleIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
  Title as TitleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const POSTS_COLLECTION = 'posts';
const LIKES_COLLECTION = 'likes';
const BOOKMARKS_COLLECTION = 'favorites';
const NOTIFICATIONS_COLLECTION = 'notifications';

// Types
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  category: string;
  createdAt: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  isLikedByUser: boolean;
  isBookmarkedByUser: boolean;
}

interface Notification {
  id: string;
  type: 'like' | 'comment' | 'bookmark' | 'follow';
  user: string;
  post?: string;
  read: boolean;
  created: string;
  expand?: {
    user?: { name: string; username: string; avatar?: string };
    post?: { title: string };
  };
}

interface Analytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalBookmarks: number;
  engagementRate: number;
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
};

type SortOption = {
  value: string;
  label: string;
  icon: React.ReactElement;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Record() {
  const navigate = useNavigate();

  // State
  const [activeTab, setActiveTab] = useState(0);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('-created');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  const sortOptions: SortOption[] = [
    { value: '-created', label: 'Newest First', icon: <TimeIcon /> },
    { value: 'created', label: 'Oldest First', icon: <TimeIcon /> },
    { value: '-likes', label: 'Most Liked', icon: <TrendingIcon /> },
    { value: 'title', label: 'Title (A-Z)', icon: <TitleIcon /> },
    { value: 'category', label: 'Category', icon: <CategoryIcon /> }
  ];

  const currentUser = pb.authStore.model;

  // Helpers
  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const getAvatarUrl = (user: any): string => {
    if (!user?.avatar) return '';
    try {
      return pb.files.getUrl(user, user.avatar, { thumb: '100x100' });
    } catch {
      return '';
    }
  };

  const getPostImageUrl = (post: any): string => {
    if (!post?.image) return '';
    try {
      return pb.files.getUrl(post, post.image, { thumb: '400x300' });
    } catch {
      return '';
    }
  };

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

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Fetch data
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const user = pb.authStore.model;
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch user's posts
      const userPosts = await pb.collection(POSTS_COLLECTION).getFullList({
        filter: `author = "${user.id}"`,
        sort: '-created',
        expand: 'author'
      });

      // Fetch bookmarks
      const bookmarks = await pb.collection(BOOKMARKS_COLLECTION).getFullList({
        filter: `user = "${user.id}"`,
        expand: 'post,post.author'
      });

      // Fetch likes
      const likes = await pb.collection(LIKES_COLLECTION).getFullList({
        filter: `user = "${user.id}"`,
        expand: 'post,post.author'
      });

      // Format posts
      const formatPost = (post: any, isLiked = false, isBookmarked = false): Post => ({
        id: post.id,
        title: post.title || 'Untitled',
        content: post.content || '',
        authorId: post.author || '',
        authorName: post.expand?.author?.name || 'Unknown',
        authorAvatar: post.expand?.author ? getAvatarUrl(post.expand.author) : '',
        category: post.category || 'General',
        createdAt: post.created,
        imageUrl: getPostImageUrl(post),
        likes: post.likes || 0,
        comments: post.commentsCount || 0,
        isLikedByUser: isLiked,
        isBookmarkedByUser: isBookmarked
      });

      setMyPosts(userPosts.map(p => formatPost(p)));
      setBookmarkedPosts(bookmarks.map(b => formatPost(b.expand?.post, false, true)).filter(p => p.id));
      setLikedPosts(likes.map(l => formatPost(l.expand?.post, true, false)).filter(p => p.id));

      // Fetch analytics
      const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes || 0), 0);
      const totalComments = userPosts.reduce((sum, post) => sum + (post.commentsCount || 0), 0);
      
      setAnalytics({
        totalViews: userPosts.length * 42, // Mock
        totalLikes,
        totalComments,
        totalBookmarks: bookmarks.length,
        engagementRate: userPosts.length > 0 ? ((totalLikes + totalComments) / userPosts.length).toFixed(1) : 0
      });

    } catch (err: any) {
      console.error('Error fetching posts:', err);
      showSnackbar(`Failed to load posts: ${err?.message || err}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [navigate, showSnackbar]);

  const fetchNotifications = useCallback(async () => {
    try {
      const user = pb.authStore.model;
      if (!user) return;

      const records = await pb.collection(NOTIFICATIONS_COLLECTION).getList(1, 20, {
        filter: `recipient = "${user.id}"`,
        sort: '-created',
        expand: 'user,post'
      });

      setNotifications(records.items as Notification[]);
      setUnreadCount(records.items.filter((n: any) => !n.read).length);
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchNotifications();
  }, [fetchPosts, fetchNotifications]);

  // Filter and sort
  useEffect(() => {
    let posts: Post[] = [];
    if (activeTab === 0) posts = myPosts;
    else if (activeTab === 1) posts = bookmarkedPosts;
    else posts = likedPosts;

    let filtered = [...posts];

    if (searchQuery) {
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case '-created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'created':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case '-likes':
          return b.likes - a.likes;
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setDisplayedPosts(filtered);
  }, [myPosts, bookmarkedPosts, likedPosts, activeTab, searchQuery, sortBy]);

  // Handlers
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchQuery('');
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSortSelect = (value: string) => {
    setSortBy(value);
    handleSortClose();
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await pb.collection(NOTIFICATIONS_COLLECTION).update(notificationId, { read: true });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleViewPost = (postId: string) => {
    navigate(`/posts/${postId}`);
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await pb.collection(POSTS_COLLECTION).delete(postId);
      setMyPosts(prev => prev.filter(p => p.id !== postId));
      showSnackbar('Post deleted successfully', 'success');
    } catch (err: any) {
      showSnackbar(`Failed to delete post: ${err?.message || err}`, 'error');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Sort';
  };

  const getCurrentPosts = () => {
    if (activeTab === 0) return myPosts;
    if (activeTab === 1) return bookmarkedPosts;
    return likedPosts;
  };

  const getTabLabel = () => {
    if (activeTab === 0) return 'Your Posts';
    if (activeTab === 1) return 'Bookmarked Posts';
    return 'Liked Posts';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
            <ArticleIcon sx={{ mr: 1 }} />
            My Record
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setShowAnalytics(!showAnalytics)} color="primary">
              <BarChartIcon />
            </IconButton>
            <IconButton onClick={handleNotificationClick} color="primary">
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton onClick={fetchPosts} color="primary" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          Manage your posts, bookmarks, and activity
        </Typography>
      </Box>

      {/* Analytics Panel */}
      {showAnalytics && analytics && (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BarChartIcon /> Analytics Overview
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', textAlign: 'center' }}>
                <VisibilityIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{analytics.totalViews}</Typography>
                <Typography variant="caption">Total Views</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText', textAlign: 'center' }}>
                <FavoriteIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{analytics.totalLikes}</Typography>
                <Typography variant="caption">Total Likes</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light', color: 'success.contrastText', textAlign: 'center' }}>
                <CommentIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{analytics.totalComments}</Typography>
                <Typography variant="caption">Comments</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'secondary.light', color: 'secondary.contrastText', textAlign: 'center' }}>
                <BookmarkIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">{analytics.totalBookmarks}</Typography>
                <Typography variant="caption">Bookmarks</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label={`My Posts (${myPosts.length})`} icon={<EditIcon />} iconPosition="start" />
          <Tab label={`Bookmarks (${bookmarkedPosts.length})`} icon={<BookmarkIcon />} iconPosition="start" />
          <Tab label={`Liked (${likedPosts.length})`} icon={<FavoriteIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Search and Sort */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              placeholder="Search posts..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={handleSortClick}
              sx={{ height: '40px' }}
            >
              {getCurrentSortLabel()}
            </Button>
            <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={handleSortClose}>
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  selected={sortBy === option.value}
                  onClick={() => handleSortSelect(option.value)}
                >
                  <ListItemIcon>{option.icon}</ListItemIcon>
                  <ListItemText>{option.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Grid>
        </Grid>
      </Paper>

      {/* Content */}
      {loading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Skeleton variant="rectangular" height={80} sx={{ mt: 2 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : displayedPosts.length > 0 ? (
        <Grid container spacing={3}>
          {displayedPosts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <Card elevation={2} sx={{ transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 6 } }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip label={post.category} size="small" color="primary" variant="outlined" />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <TimeIcon sx={{ fontSize: 16 }} />
                      {formatDate(post.createdAt)}
                    </Typography>
                  </Box>
                  
                  <Typography 
                    variant="h5" 
                    component="h2" 
                    gutterBottom
                    sx={{ cursor: 'pointer', fontWeight: 600, '&:hover': { color: 'primary.main' } }}
                    onClick={() => handleViewPost(post.id)}
                  >
                    {post.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }} src={post.authorAvatar}>
                      {post.authorName.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {post.authorName}
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" paragraph color="text.secondary" sx={{ lineHeight: 1.7 }}>
                    {truncateText(post.content, 250)}
                  </Typography>
                  
                  {post.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.imageUrl}
                      alt={post.title}
                      sx={{ borderRadius: 2, mb: 2, cursor: 'pointer' }}
                      onClick={() => handleViewPost(post.id)}
                    />
                  )}
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" startIcon={<FavoriteIcon />} color="inherit">
                      {post.likes}
                    </Button>
                    <Button size="small" startIcon={<CommentIcon />} color="inherit">
                      {post.comments}
                    </Button>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => handleViewPost(post.id)}>
                      View
                    </Button>
                    {activeTab === 0 && currentUser?.id === post.authorId && (
                      <>
                        <IconButton size="small" color="primary" onClick={() => navigate(`/posts/${post.id}/edit`)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeletePost(post.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 8, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
          <ArticleIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
            {searchQuery ? 'No posts found' : `No ${getTabLabel().toLowerCase()} yet`}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? `No posts match "${searchQuery}".`
              : activeTab === 0
              ? 'Create your first post to get started!'
              : activeTab === 1
              ? 'Save posts you want to read later!'
              : 'Start liking posts you enjoy!'}
          </Typography>
          {!searchQuery && activeTab === 0 && (
            <Button variant="contained" color="primary" onClick={() => navigate('/posts/create')}>
              Create Post
            </Button>
          )}
        </Paper>
      )}

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{ sx: { maxHeight: 400, width: 360 } }}
      >
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <MenuItem
              key={notification.id}
              onClick={() => markNotificationAsRead(notification.id)}
              sx={{ bgcolor: !notification.read ? 'action.hover' : 'inherit' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'start', width: '100%' }}>
                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                  {notification.type === 'like' ? <FavoriteIcon fontSize="small" /> : <CommentIcon fontSize="small" />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2">
                    <strong>{notification.expand?.user?.name}</strong> {notification.type}d your post
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(notification.created)}
                  </Typography>
                </Box>
                {!notification.read && <Box sx={{ width: 8, height: 8, bgcolor: 'primary.main', borderRadius: '50%', mt: 1 }} />}
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">No notifications</Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}