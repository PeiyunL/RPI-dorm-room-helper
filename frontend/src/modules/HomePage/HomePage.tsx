import React, { useState, useEffect } from 'react';
import { SelectChangeEvent } from '@mui/material/Select';
import { 
  Container, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Card, 
  CardContent, 
  CardActions, 
  IconButton, 
  Divider, 
  Box, 
  Avatar, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Favorite as FavoriteIcon, 
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';

// Define types
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  category: string;
  likes: number;
  comments: Comment[];
  liked: boolean;
  imageUrl?: string;
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface PostFormData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

// Mock data - This would typically come from an API
const CATEGORIES = [
  'Roommate Search', 
  'Furniture Exchange', 
  'Dorm Tips', 
  'Events', 
  'Lost & Found', 
  'Housing Questions'
];

const MOCK_POSTS: Post[] = [
  {
    id: '1',
    title: 'Looking for a roommate for Fall semester',
    content: 'Hey everyone! I\'m looking for a roommate for the upcoming Fall semester. I\'m a sophomore studying Computer Science and I\'m pretty quiet. I like to keep my space clean and I\'m looking for someone similar. Message me if you\'re interested!',
    authorId: 'user1',
    authorName: 'Alex Chen',
    createdAt: '2025-04-10T10:30:00Z',
    category: 'Roommate Search',
    likes: 5,
    comments: [
      {
        id: 'c1',
        content: 'I might be interested! Are you looking at on-campus or off-campus housing?',
        authorId: 'user2',
        authorName: 'Jordan Smith',
        createdAt: '2025-04-10T11:15:00Z'
      }
    ],
    liked: false
  },
  {
    id: '2',
    title: 'Selling desk lamp and organizer',
    content: 'I\'m graduating this semester and selling some of my dorm items. I have a desk lamp ($15) and a desk organizer ($10) available. Both are in great condition. Pickup on campus only.',
    authorId: 'user3',
    authorName: 'Taylor Wong',
    createdAt: '2025-04-09T14:45:00Z',
    category: 'Furniture Exchange',
    likes: 3,
    comments: [],
    liked: true,
    imageUrl: 'https://via.placeholder.com/150'
  },
  {
    id: '3',
    title: 'Dorm hacks for maximizing small spaces',
    content: 'After living in dorms for 3 years, I\'ve learned a lot about how to make the most of small spaces. Here are my top 5 tips: 1) Use bed risers to create storage space under your bed. 2) Command hooks are your best friend - use them for everything. 3) Get a shower caddy that can hang - floor space is precious. 4) Collapsible storage bins save space when not in use. 5) Multi-purpose furniture is worth the investment.',
    authorId: 'user4',
    authorName: 'Morgan Lee',
    createdAt: '2025-04-08T09:20:00Z',
    category: 'Dorm Tips',
    likes: 12,
    comments: [
      {
        id: 'c2',
        content: 'These are great tips! I would add: use the back of your door for additional storage with an over-the-door organizer.',
        authorId: 'user5',
        authorName: 'Casey Johnson',
        createdAt: '2025-04-08T10:30:00Z'
      },
      {
        id: 'c3',
        content: 'Do you have any recommendations for specific bed risers that work well?',
        authorId: 'user6',
        authorName: 'Riley Brown',
        createdAt: '2025-04-08T11:45:00Z'
      }
    ],
    liked: false
  }
];

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [openPostDialog, setOpenPostDialog] = useState<boolean>(false);
  const [openCommentsDialog, setOpenCommentsDialog] = useState<boolean>(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [postFormData, setPostFormData] = useState<PostFormData>({
    title: '',
    content: '',
    category: '',
  });
  const [newComment, setNewComment] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Mock data loading effect
  useEffect(() => {
    // In a real app, you would fetch posts from an API here
    setIsLoading(true);
    // Simulating API call
    setTimeout(() => {
      setPosts(MOCK_POSTS);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Handlers
  const handleOpenPostDialog = () => {
    setPostFormData({
      title: '',
      content: '',
      category: '',
    });
    setOpenPostDialog(true);
  };

  const handleClosePostDialog = () => {
    setOpenPostDialog(false);
  };

  const handleOpenCommentsDialog = (post: Post) => {
    setCurrentPost(post);
    setOpenCommentsDialog(true);
  };

  const handleCloseCommentsDialog = () => {
    setOpenCommentsDialog(false);
    setNewComment('');
  };

  const handlePostFormChange = (
    e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }> | 
       SelectChangeEvent<string>
  ) => {
    const name = e.target.name as keyof PostFormData;
    const value = e.target.value as string;
    setPostFormData({
      ...postFormData,
      [name]: value,
    });
  };

  const handleSubmitPost = () => {
    // Validate form data
    if (!postFormData.title || !postFormData.content || !postFormData.category) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error',
      });
      return;
    }

    // In a real app, you would send this to an API
    const newPost: Post = {
      id: Date.now().toString(),
      title: postFormData.title,
      content: postFormData.content,
      authorId: 'currentUser', // This would come from auth
      authorName: 'Current User', // This would come from auth
      createdAt: new Date().toISOString(),
      category: postFormData.category,
      likes: 0,
      comments: [],
      liked: false,
      imageUrl: postFormData.imageUrl,
    };

    setPosts([newPost, ...posts]);
    handleClosePostDialog();
    setSnackbar({
      open: true,
      message: 'Post created successfully',
      severity: 'success',
    });
  };

  const handleToggleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newLikedStatus = !post.liked;
        return {
          ...post,
          liked: newLikedStatus,
          likes: newLikedStatus ? post.likes + 1 : post.likes - 1,
        };
      }
      return post;
    }));
  };

  const handleAddComment = () => {
    if (!currentPost || !newComment.trim()) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      content: newComment,
      authorId: 'currentUser', // This would come from auth
      authorName: 'Current User', // This would come from auth
      createdAt: new Date().toISOString(),
    };

    const updatedPost = {
      ...currentPost,
      comments: [...currentPost.comments, newCommentObj],
    };

    setPosts(posts.map(post => post.id === currentPost.id ? updatedPost : post));
    setCurrentPost(updatedPost);
    setNewComment('');
    setSnackbar({
      open: true,
      message: 'Comment added successfully',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false,
    });
  };

  // Filter posts based on category and search query
  const filteredPosts = posts.filter(post => {
    const matchesCategory = !filterCategory || post.category === filterCategory;
    const matchesSearch = !searchQuery || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

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

  return (
    <div>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            RPI Dorm Room Helper
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenPostDialog}
            sx={{ mt: { xs: 2, md: 0 } }}
          >
            Create Post
          </Button>
        </Box>

        {/* Filters and Search */}
        <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth variant="outlined" size="small">
                <InputLabel id="category-filter-label">Filter by Category</InputLabel>
                <Select
                  labelId="category-filter-label"
                  id="category-filter"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value as string)}
                  label="Filter by Category"
                  startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                placeholder="Search posts..."
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Posts List */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredPosts.length > 0 ? (
          <Grid container spacing={3}>
            {filteredPosts.map((post) => (
              <Grid item xs={12} key={post.id}>
                <Card elevation={2} sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={post.category}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(post.createdAt)}
                      </Typography>
                    </Box>
                    <Typography variant="h6" component="h2" gutterBottom>
                      {post.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }}>
                        {post.authorName.charAt(0)}
                      </Avatar>
                      <Typography variant="body2" color="text.secondary">
                        {post.authorName}
                      </Typography>
                    </Box>
                    <Typography variant="body1" paragraph>
                      {post.content.length > 250
                        ? `${post.content.substring(0, 250)}...`
                        : post.content}
                    </Typography>
                    {post.imageUrl && (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <img
                          src={post.imageUrl}
                          alt={post.title}
                          style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '4px' }}
                        />
                      </Box>
                    )}
                  </CardContent>
                  <Divider />
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <IconButton
                        aria-label="like"
                        onClick={() => handleToggleLike(post.id)}
                        color={post.liked ? 'primary' : 'default'}
                      >
                        {post.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                      </IconButton>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {post.likes}
                      </Typography>
                      <IconButton
                        aria-label="comments"
                        onClick={() => handleOpenCommentsDialog(post)}
                        sx={{ ml: 1 }}
                      >
                        <CommentIcon />
                      </IconButton>
                      <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                        {post.comments.length}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      onClick={() => handleOpenCommentsDialog(post)}
                    >
                      {post.comments.length > 0 ? 'View Comments' : 'Add Comment'}
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
            <Typography variant="h6" color="text.secondary">
              No posts found matching your criteria.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenPostDialog}
              sx={{ mt: 2 }}
            >
              Create the first post
            </Button>
          </Paper>
        )}

        {/* Create Post Dialog */}
        <Dialog open={openPostDialog} onClose={handleClosePostDialog} maxWidth="md" fullWidth>
          <DialogTitle>Create New Post</DialogTitle>
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
              value={postFormData.title}
              onChange={handlePostFormChange}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                id="category"
                name="category"
                value={postFormData.category}
                onChange={handlePostFormChange}
                label="Category"
              >
                {CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              id="content"
              name="content"
              label="Content"
              multiline
              rows={6}
              fullWidth
              variant="outlined"
              value={postFormData.content}
              onChange={handlePostFormChange}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="dense"
              id="imageUrl"
              name="imageUrl"
              label="Image URL (optional)"
              type="text"
              fullWidth
              variant="outlined"
              value={postFormData.imageUrl || ''}
              onChange={handlePostFormChange}
              helperText="Enter a URL for an image to include with your post"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClosePostDialog}>Cancel</Button>
            <Button onClick={handleSubmitPost} variant="contained" startIcon={<SendIcon />}>
              Post
            </Button>
          </DialogActions>
        </Dialog>

        {/* Comments Dialog */}
        <Dialog open={openCommentsDialog} onClose={handleCloseCommentsDialog} maxWidth="md" fullWidth>
          {currentPost && (
            <>
              <DialogTitle>
                <Typography variant="h6">{currentPost.title}</Typography>
                <Typography variant="subtitle2" color="text.secondary">
                  {currentPost.authorName} · {formatDate(currentPost.createdAt)}
                </Typography>
              </DialogTitle>
              <DialogContent dividers>
                <Typography variant="body1" paragraph>
                  {currentPost.content}
                </Typography>
                
                {currentPost.imageUrl && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <img
                      src={currentPost.imageUrl}
                      alt={currentPost.title}
                      style={{ maxWidth: '100%', borderRadius: '4px' }}
                    />
                  </Box>
                )}
                
                <Divider sx={{ my: 3 }} />
                
                <Typography variant="h6" gutterBottom>
                  Comments ({currentPost.comments.length})
                </Typography>
                
                {currentPost.comments.length > 0 ? (
                  <Box>
                    {currentPost.comments.map((comment) => (
                      <Paper key={comment.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'secondary.main' }}>
                            {comment.authorName.charAt(0)}
                          </Avatar>
                          <Typography variant="subtitle2">
                            {comment.authorName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {formatDate(comment.createdAt)}
                          </Typography>
                        </Box>
                        <Typography variant="body2">{comment.content}</Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
                    No comments yet. Be the first to comment!
                  </Typography>
                )}
                
                <Box sx={{ mt: 3 }}>
                  <TextField
                    fullWidth
                    label="Add a comment"
                    multiline
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    variant="outlined"
                    placeholder="What are your thoughts?"
                    sx={{ mb: 2 }}
                  />
                  <Button
                    variant="contained"
                    endIcon={<SendIcon />}
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Comment
                  </Button>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseCommentsDialog}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}