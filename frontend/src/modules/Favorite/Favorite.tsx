import React, { useState, useEffect, useCallback } from 'react';
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
  CardMedia,
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
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Comment as CommentIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Sort as SortIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingIcon,
  Title as TitleIcon,
  Category as CategoryIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const FAVORITES_COLLECTION = 'favorites';
const POSTS_COLLECTION = 'posts';
const LIKES_COLLECTION = 'likes';
const COMMENTS_COLLECTION = 'comments';
const makeLikeKey = (userId: string, postId: string) => `${userId}_${postId}`;

// Define types
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
  favoriteRecordId: string;
}

type PostComment = {
  id: string;
  content: string;
  created: string;
  userId: string;
  userName: string;
  userAvatar?: string;
};

interface Favorite {
  id: string;
  user: string;
  post: string;
  created: string;
  expand?: {
    post?: any;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
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

// TabPanel component
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

export default function Favorite() {
  const navigate = useNavigate();
  
  // State variables
  const [activeTab, setActiveTab] = useState(0);
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [displayedFavorites, setDisplayedFavorites] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; favoriteId: string; title: string } | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [sortBy, setSortBy] = useState('-created');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Post detail (view + comment) dialog state
  const [postDetailOpen, setPostDetailOpen] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [postDetailLoading, setPostDetailLoading] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [detailComments, setDetailComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  const sortOptions: SortOption[] = [
    { value: '-created', label: 'Newest First', icon: <TimeIcon /> },
    { value: 'created', label: 'Oldest First', icon: <TimeIcon /> },
    { value: '-likes', label: 'Most Liked', icon: <TrendingIcon /> },
    { value: 'title', label: 'Title (A-Z)', icon: <TitleIcon /> },
    { value: 'category', label: 'Category', icon: <CategoryIcon /> }
  ];

  // Show snackbar helper
  const showSnackbar = useCallback(
    (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  // Get avatar URL helper
  const getAvatarUrl = (user: any): string => {
    if (!user?.avatar) return '';
    try {
      return pb.files.getUrl(user, user.avatar, { thumb: '100x100' });
    } catch {
      return '';
    }
  };

  // Get post image URL helper
  const getPostImageUrl = (post: any): string => {
    if (!post?.image) return '';
    try {
      return pb.files.getUrl(post, post.image, { thumb: '400x300' });
    } catch {
      return '';
    }
  };

  // Fetch user's likes
const fetchUserLikes = useCallback(async (): Promise<Set<string>> => {
  const user = pb.authStore.model;
  if (!user) return new Set();

  const likes = await pb.collection(LIKES_COLLECTION).getFullList({
    filter: `user = "${user.id}"`,
    fields: "post",
  });

  return new Set(likes.map((like: any) => like.post));
}, []);


const fetchFavorites = useCallback(async (showLoading = true) => {
  if (showLoading) setIsLoading(true);

  try {
    const user = pb.authStore.model;
    if (!user) {
      navigate("/login");
      return;
    }

    const likesSet = await fetchUserLikes();
    setUserLikes(likesSet);

    const records = await pb.collection(FAVORITES_COLLECTION).getFullList({
      filter: `user = "${user.id}"`,
      sort: "-created",
      expand: "post,post.author",
    });

    const formatted = records
      .filter((r: any) => r.expand?.post)
      .map((r: any) => {
        const post = r.expand.post;
        const author = post.expand?.author;

        return {
          id: post.id,
          title: post.title || "Untitled",
          content: post.content || "",
          authorId: post.author || "",
          authorName: author?.name || author?.username || "Unknown",
          authorAvatar: author ? getAvatarUrl(author) : "",
          category: post.category || "General",
          createdAt: post.created || r.created,
          imageUrl: getPostImageUrl(post),
          likes: post.likes || 0,
          comments: post.commentsCount || 0,
          isLikedByUser: likesSet.has(post.id),   // <-- use likesSet, not state
          favoriteRecordId: r.id,
        };
      });

    setFavorites(formatted);
    setDisplayedFavorites(formatted);
  } catch (err: any) {
    console.error("Error fetching favorites:", err);
    showSnackbar(`Failed to load favorites: ${err?.message || err}`, "error");
  } finally {
    if (showLoading) setIsLoading(false);
  }
}, [navigate, showSnackbar, fetchUserLikes]); // <-- IMPORTANT: no userLikes here

  // Load favorites on mount
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Apply search and sort
  useEffect(() => {
    let filtered = [...favorites];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (favorite) =>
          favorite.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          favorite.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          favorite.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          favorite.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
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

    setDisplayedFavorites(filtered);
  }, [favorites, searchQuery, sortBy]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchQuery('');
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle sort menu
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

  // Handle like toggle
  const handleToggleLike = async (postId: string) => {
    try {
      const user = pb.authStore.model;
      if (!user) {
        showSnackbar('Please log in to like posts', 'error');
        return;
      }

      const isLiked = userLikes.has(postId);

      // Optimistically update UI
      setFavorites(prevFavorites =>
        prevFavorites.map(post =>
          post.id === postId
            ? { 
                ...post, 
                likes: isLiked ? Math.max(0, post.likes - 1) : post.likes + 1,
                isLikedByUser: !isLiked 
              }
            : post
        )
      );

      // Update userLikes set
      const newUserLikes = new Set(userLikes);
      if (isLiked) {
        newUserLikes.delete(postId);
      } else {
        newUserLikes.add(postId);
      }
      setUserLikes(newUserLikes);

      const likeKey = makeLikeKey(user.id, postId);
      if (isLiked) {
        // Unlike: delete by unique key first, fallback to user/post query
        try {
          const existing = await pb.collection(LIKES_COLLECTION).getFirstListItem(`key="${likeKey}"`);
          await pb.collection(LIKES_COLLECTION).delete(existing.id);
        } catch {
          const existingLikes = await pb.collection(LIKES_COLLECTION).getFullList({
            filter: `user = "${user.id}" && post = "${postId}"`,
          });
          if (existingLikes.length > 0) {
            await pb.collection(LIKES_COLLECTION).delete(existingLikes[0].id);
          }
        }
      } else {
        // Like: include key (required in this project's PB schema)
        await pb.collection(LIKES_COLLECTION).create({
          user: user.id,
          post: postId,
          key: likeKey,
        });
      }
    } catch (err: any) {
      // Revert on error
      await fetchUserLikes();
      await fetchFavorites(false);
      showSnackbar(`Failed to update like: ${err?.message || err}`, 'error');
    }
  };

  // Handle remove favorite confirmation dialog
  const handleOpenDeleteDialog = (postId: string, favoriteId: string, title: string) => {
    setItemToDelete({ id: postId, favoriteId, title });
    setDeleteDialogOpen(true);
  };

  // Handle remove favorite confirmation
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingItem(true);
    try {
      // Delete the favorite record from PocketBase
      await pb.collection(FAVORITES_COLLECTION).delete(itemToDelete.favoriteId);

      // Remove from local state
      setFavorites(prevFavorites =>
        prevFavorites.filter(post => post.id !== itemToDelete.id)
      );

      showSnackbar('Removed from favorites', 'success');
    } catch (err: any) {
      showSnackbar(`Failed to remove favorite: ${err?.message || err}`, 'error');
    } finally {
      setDeletingItem(false);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchFavorites();
  };

  // Format date
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

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Load post details + comments (for in-page dialog)
  const loadPostDetail = useCallback(async (postId: string) => {
    const user = pb.authStore.model;
    if (!user) {
      navigate('/login');
      return;
    }

    setSelectedPostId(postId);
    setPostDetailOpen(true);
    setPostDetailLoading(true);

    try {
      // Fetch the post with author expanded
      const p: any = await pb.collection(POSTS_COLLECTION).getOne(postId, {
        expand: 'author',
      });

      const author = p.expand?.author;
      const formattedPost: Post = {
        id: p.id,
        title: p.title || 'Untitled',
        content: p.content || '',
        authorId: p.author || '',
        authorName: author?.name || author?.username || 'Unknown',
        authorAvatar: author ? getAvatarUrl(author) : '',
        category: p.category || 'General',
        createdAt: p.created || p.createdAt || p.created_at || '',
        imageUrl: getPostImageUrl(p),
        likes: p.likes || 0,
        comments: p.commentsCount || p.comments || 0,
        isLikedByUser: userLikes.has(postId),
        favoriteRecordId: '',
      };

      setDetailPost(formattedPost);

      // Fetch comments
      const commentRecords: any[] = await pb.collection(COMMENTS_COLLECTION).getFullList({
        filter: `post = "${postId}"`,
        sort: '-created',
        expand: 'user',
      });

      const formattedComments: PostComment[] = commentRecords.map((c: any) => {
        const u = c.expand?.user;
        const content = c.content ?? c.text ?? c.body ?? '';
        return {
          id: c.id,
          content: String(content),
          created: c.created || c.createdAt || c.created_at || '',
          userId: c.user || '',
          userName: u?.name || u?.username || 'Unknown',
          userAvatar: u ? getAvatarUrl(u) : '',
        };
      });

      setDetailComments(formattedComments);
    } catch (err: any) {
      console.error('Failed to load post detail:', err);
      showSnackbar(`Failed to load post: ${err?.message || err}`, 'error');
      setPostDetailOpen(false);
    } finally {
      setPostDetailLoading(false);
    }
  }, [navigate, showSnackbar, getAvatarUrl, getPostImageUrl, userLikes]);

  const handleClosePostDetail = () => {
    setPostDetailOpen(false);
    setSelectedPostId(null);
    setDetailPost(null);
    setDetailComments([]);
    setNewComment('');
  };

  const handleSubmitComment = async () => {
    const user = pb.authStore.model;
    if (!user) {
      showSnackbar('Please log in to comment', 'error');
      return;
    }
    if (!selectedPostId) return;

    const content = newComment.trim();
    if (!content) return;

    setPostingComment(true);
    try {
      await pb.collection(COMMENTS_COLLECTION).create({
        post: selectedPostId,
        user: user.id,
        content,
      });

      setNewComment('');

      // Reload comments
      const commentRecords: any[] = await pb.collection(COMMENTS_COLLECTION).getFullList({
        filter: `post = "${selectedPostId}"`,
        sort: '-created',
        expand: 'user',
      });

      const formattedComments: PostComment[] = commentRecords.map((c: any) => {
        const u = c.expand?.user;
        const cText = c.content ?? c.text ?? c.body ?? '';
        return {
          id: c.id,
          content: String(cText),
          created: c.created || c.createdAt || c.created_at || '',
          userId: c.user || '',
          userName: u?.name || u?.username || 'Unknown',
          userAvatar: u ? getAvatarUrl(u) : '',
        };
      });
      setDetailComments(formattedComments);

      // Update comment count on card list (best-effort)
      setFavorites(prev => prev.map(p => (p.id === selectedPostId ? { ...p, comments: formattedComments.length } : p)));
      setDetailPost(prev => (prev ? { ...prev, comments: formattedComments.length } : prev));
    } catch (err: any) {
      console.error('Failed to post comment:', err);
      showSnackbar(`Failed to post comment: ${err?.message || err}`, 'error');
    } finally {
      setPostingComment(false);
    }
  };

  // Handle view post details
  const handleViewPost = (postId: string) => {
    loadPostDetail(postId);
  };

  // Get current sort label
  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === sortBy);
    return option ? option.label : 'Sort';
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
            <BookmarkIcon sx={{ mr: 1, color: '#1976d2' }} />
            My Favorites
          </Typography>
          <IconButton onClick={handleRefresh} color="primary" disabled={isLoading}>
            <RefreshIcon />
          </IconButton>
        </Box>
        <Typography variant="subtitle1" color="text.secondary">
          {favorites.length} saved {favorites.length === 1 ? 'post' : 'posts'}
        </Typography>
      </Box>

      {/* Search and Sort Bar */}
      <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              placeholder="Search favorite posts by title, content, author, or category..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
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
            <Menu
              anchorEl={sortAnchorEl}
              open={Boolean(sortAnchorEl)}
              onClose={handleSortClose}
            >
              {sortOptions.map((option) => (
                <MenuItem
                  key={option.value}
                  selected={sortBy === option.value}
                  onClick={() => handleSortSelect(option.value)}
                >
                  <ListItemIcon>
                    {option.icon}
                  </ListItemIcon>
                  <ListItemText>{option.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Grid>
        </Grid>
      </Paper>

      {/* Loading Indicator */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} />
        </Box>
      ) : (
        <>
          {displayedFavorites.length > 0 ? (
            <Grid container spacing={3}>
              {displayedFavorites.map((post) => (
                <Grid item xs={12} key={post.id}>
                  <Card 
                    elevation={2} 
                    sx={{ 
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-4px)', 
                        boxShadow: 6 
                      } 
                    }}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          label={post.category}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <TimeIcon sx={{ fontSize: 16 }} />
                          {formatDate(post.createdAt)}
                        </Typography>
                      </Box>
                      
                      <Typography 
                        variant="h5" 
                        component="h2" 
                        gutterBottom
                        sx={{ 
                          cursor: 'pointer',
                          fontWeight: 600,
                          '&:hover': { color: 'primary.main' },
                          transition: 'color 0.2s'
                        }}
                        onClick={() => handleViewPost(post.id)}
                      >
                        {post.title}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          sx={{ width: 32, height: 32, mr: 1 }} 
                          src={post.authorAvatar}
                        >
                          {post.authorName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          {post.authorName}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                        {truncateText(post.content, 250)}
                      </Typography>
                      
                      {post.imageUrl && (
                        <CardMedia
                          component="img"
                          height="200"
                          image={post.imageUrl}
                          alt={post.title}
                          sx={{ 
                            borderRadius: 2, 
                            mb: 2,
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'scale(1.02)'
                            }
                          }}
                          onClick={() => handleViewPost(post.id)}
                        />
                      )}
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          startIcon={post.isLikedByUser ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                          onClick={() => handleToggleLike(post.id)}
                          color={post.isLikedByUser ? 'error' : 'inherit'}
                          sx={{ minWidth: 'auto' }}
                        >
                          {post.likes}
                        </Button>
                        
                        <Button
                          size="small"
                          startIcon={<CommentIcon />}
                          onClick={() => handleViewPost(post.id)}
                          color="inherit"
                          sx={{ minWidth: 'auto' }}
                        >
                          {post.comments}
                        </Button>
                      </Box>
                      
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleViewPost(post.id)}
                        >
                          View Post
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleOpenDeleteDialog(post.id, post.favoriteRecordId, post.title)}
                        >
                          Remove
                        </Button>
                      </Box>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Paper 
              elevation={0} 
              sx={{ 
                p: 8, 
                textAlign: 'center', 
                bgcolor: 'background.default',
                borderRadius: 2,
                border: '2px dashed',
                borderColor: 'divider'
              }}
            >
              <BookmarkBorderIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
                {searchQuery ? 'No posts found' : 'No favorites yet'}
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                {searchQuery
                  ? `No posts match "${searchQuery}". Try different keywords or clear your search.`
                  : "You haven't saved any posts yet. Browse posts and click the bookmark icon to save them here for easy access later."}
              </Typography>
              {!searchQuery && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="large"
                  onClick={() => navigate('/homepage')}
                  sx={{ mt: 1 }}
                >
                  Browse Posts
                </Button>
              )}
              {searchQuery && (
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={() => setSearchQuery('')}
                  sx={{ mt: 1 }}
                >
                  Clear Search
                </Button>
              )}
            </Paper>
          )}
        </>
      )}
      
      {/* Post Detail Dialog (view + comment, no edit) */}
      <Dialog
        open={postDetailOpen}
        onClose={handleClosePostDetail}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {detailPost?.title || 'Post'}
            </Typography>
            {detailPost && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5, flexWrap: 'wrap' }}>
                <Chip size="small" label={detailPost.category} variant="outlined" />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimeIcon sx={{ fontSize: 16 }} />
                  {detailPost.createdAt ? formatDate(detailPost.createdAt) : ''}
                </Typography>
              </Box>
            )}
          </Box>
          <IconButton onClick={handleClosePostDetail} aria-label="close">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          {postDetailLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {detailPost && (
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Avatar sx={{ width: 32, height: 32 }} src={detailPost.authorAvatar}>
                      {detailPost.authorName?.charAt(0)?.toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {detailPost.authorName}
                    </Typography>
                  </Box>

                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {detailPost.content}
                  </Typography>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Comments ({detailComments.length})
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mb: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={2}
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button
                  variant="contained"
                  onClick={handleSubmitComment}
                  disabled={postingComment || !newComment.trim()}
                  sx={{ height: 40, mt: 0.5 }}
                >
                  {postingComment ? 'Posting...' : 'Post'}
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {detailComments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No comments yet.
                  </Typography>
                ) : (
                  detailComments.map((c) => (
                    <Paper key={c.id} variant="outlined" sx={{ p: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                        <Avatar sx={{ width: 28, height: 28 }} src={c.userAvatar}>
                          {c.userName?.charAt(0)?.toUpperCase()}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {c.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {c.created ? formatDate(c.created) : ''}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {c.content}
                      </Typography>
                    </Paper>
                  ))
                )}
              </Box>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClosePostDetail} variant="outlined">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deletingItem && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Remove from Favorites
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove <strong>"{itemToDelete?.title}"</strong> from your favorites?
          </DialogContentText>
          <DialogContentText sx={{ mt: 1, fontSize: '0.875rem', color: 'text.secondary' }}>
            Don't worry, you can always add it back later by visiting the post.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setDeleteDialogOpen(false)} 
            disabled={deletingItem}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained" 
            disabled={deletingItem}
            startIcon={deletingItem ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deletingItem ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
