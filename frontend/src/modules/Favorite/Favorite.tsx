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
  const fetchUserLikes = useCallback(async () => {
    try {
      const user = pb.authStore.model;
      if (!user) return;

      const likes = await pb.collection(LIKES_COLLECTION).getFullList({
        filter: `user = "${user.id}"`,
        fields: 'post'
      });

      setUserLikes(new Set(likes.map(like => like.post)));
    } catch (err: any) {
      console.error('Error fetching user likes:', err);
    }
  }, []);

  // Fetch favorites from PocketBase
  const fetchFavorites = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    
    try {
      const user = pb.authStore.model;
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch user's likes first
      await fetchUserLikes();

      // Fetch all favorite records for current user with expanded post data
      const records = await pb.collection(FAVORITES_COLLECTION).getFullList<Favorite>({
        filter: `user = "${user.id}"`,
        sort: '-created',
        expand: 'post,post.author',
      });

      // Map to Post format
      const formatted: Post[] = records
        .filter(record => record.expand?.post) // Filter out favorites with deleted posts
        .map((record) => {
          const post = record.expand!.post;
          const author = post.expand?.author;
          
          return {
            id: post.id,
            title: post.title || 'Untitled',
            content: post.content || '',
            authorId: post.author || '',
            authorName: author?.name || author?.username || 'Unknown',
            authorAvatar: author ? getAvatarUrl(author) : '',
            category: post.category || 'General',
            createdAt: post.created || record.created,
            imageUrl: getPostImageUrl(post),
            likes: post.likes || 0,
            comments: post.commentsCount || 0,
            isLikedByUser: userLikes.has(post.id),
            favoriteRecordId: record.id,
          };
        });

      setFavorites(formatted);
      setDisplayedFavorites(formatted);
    } catch (err: any) {
      console.error('Error fetching favorites:', err);
      showSnackbar(`Failed to load favorites: ${err?.message || err}`, 'error');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [navigate, showSnackbar, fetchUserLikes, userLikes]);

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

      if (isLiked) {
        // Unlike - find and delete the like record
        const existingLikes = await pb.collection(LIKES_COLLECTION).getFullList({
          filter: `user = "${user.id}" && post = "${postId}"`
        });
        
        if (existingLikes.length > 0) {
          await pb.collection(LIKES_COLLECTION).delete(existingLikes[0].id);
        }
      } else {
        // Like - create a like record
        await pb.collection(LIKES_COLLECTION).create({
          user: user.id,
          post: postId,
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

  // Handle view post details
  const handleViewPost = (postId: string) => {
    navigate(`/posts/${postId}`);
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
                  onClick={() => navigate('/posts')}
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