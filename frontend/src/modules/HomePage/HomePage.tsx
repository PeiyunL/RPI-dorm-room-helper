import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
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
  Skeleton,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
} from '@mui/icons-material';

/**
 * Types
 */
interface CommentT {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  category: string;
  likes: number;
  comments: CommentT[];
  liked: boolean;
  imageUrl?: string;
}

interface PostFormData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

/**
 * Constants (mock) – replace with API calls
 */
const CATEGORIES: ReadonlyArray<string> = [
  'Roommate Search',
  'Furniture Exchange',
  'Dorm Tips',
  'Events',
  'Lost & Found',
  'Housing Questions',
] as const;

const MOCK_POSTS: ReadonlyArray<Post> = [
  {
    id: '1',
    title: 'Looking for a roommate for Fall semester',
    content:
      "Hey everyone! I'm looking for a roommate for the upcoming Fall semester. I'm a sophomore studying Computer Science and I'm pretty quiet. I like to keep my space clean and I'm looking for someone similar. Message me if you're interested!",
    authorId: 'user1',
    authorName: 'Alex Chen',
    createdAt: '2025-04-10T10:30:00Z',
    category: 'Roommate Search',
    likes: 5,
    comments: [
      {
        id: 'c1',
        content:
          'I might be interested! Are you looking at on-campus or off-campus housing?',
        authorId: 'user2',
        authorName: 'Jordan Smith',
        createdAt: '2025-04-10T11:15:00Z',
      },
    ],
    liked: false,
  },
  {
    id: '2',
    title: 'Selling desk lamp and organizer',
    content:
      "I'm graduating this semester and selling some of my dorm items. I have a desk lamp ($15) and a desk organizer ($10) available. Both are in great condition. Pickup on campus only.",
    authorId: 'user3',
    authorName: 'Taylor Wong',
    createdAt: '2025-04-09T14:45:00Z',
    category: 'Furniture Exchange',
    likes: 3,
    comments: [],
    liked: true,
    imageUrl: 'https://via.placeholder.com/600x400',
  },
  {
    id: '3',
    title: 'Dorm hacks for maximizing small spaces',
    content:
      "After living in dorms for 3 years, I've learned a lot about how to make the most of small spaces. Here are my top 5 tips: 1) Use bed risers to create storage space under your bed. 2) Command hooks are your best friend - use them for everything. 3) Get a shower caddy that can hang - floor space is precious. 4) Collapsible storage bins save space when not in use. 5) Multi-purpose furniture is worth the investment.",
    authorId: 'user4',
    authorName: 'Morgan Lee',
    createdAt: '2025-04-08T09:20:00Z',
    category: 'Dorm Tips',
    likes: 12,
    comments: [
      {
        id: 'c2',
        content:
          'These are great tips! I would add: use the back of your door for additional storage with an over-the-door organizer.',
        authorId: 'user5',
        authorName: 'Casey Johnson',
        createdAt: '2025-04-08T10:30:00Z',
      },
      {
        id: 'c3',
        content:
          'Do you have any recommendations for specific bed risers that work well?',
        authorId: 'user6',
        authorName: 'Riley Brown',
        createdAt: '2025-04-08T11:45:00Z',
      },
    ],
    liked: false,
  },
];

/**
 * Utils & hooks
 */
const useDebouncedValue = <T,>(value: T, delay = 250) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const useDateFormatter = (locale = 'en-US') =>
  useMemo(() =>
    new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }), [locale]);

/**
 * Presentational components
 */
const FiltersBar: React.FC<{
  filterCategory: string;
  onCategoryChange: (cat: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}> = React.memo(({ filterCategory, onCategoryChange, searchQuery, onSearchChange }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, mb: 4 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <FormControl fullWidth size="small">
            <InputLabel id="category-filter-label">Filter by Category</InputLabel>
            <Select
              labelId="category-filter-label"
              id="category-filter"
              value={filterCategory}
              label="Filter by Category"
              onChange={(e: SelectChangeEvent<string>) => onCategoryChange(e.target.value as string)}
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
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              inputProps: { 'aria-label': 'search posts' },
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
});
FiltersBar.displayName = 'FiltersBar';

const PostCard: React.FC<{
  post: Post;
  onToggleLike: (id: string) => void;
  onOpenComments: (post: Post) => void;
  format: (date: string) => string;
}> = React.memo(({ post, onToggleLike, onOpenComments, format }) => {
  return (
    <Card elevation={2} sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Chip label={post.category} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {format(post.createdAt)}
          </Typography>
        </Box>
        <Typography variant="h6" component="h2" gutterBottom>
          {post.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'primary.main' }} aria-hidden>
            {post.authorName.charAt(0)}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {post.authorName}
          </Typography>
        </Box>
        <Typography variant="body1" paragraph>
          {post.content.length > 250 ? `${post.content.substring(0, 250)}...` : post.content}
        </Typography>
        {post.imageUrl && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <img
              src={post.imageUrl}
              alt={post.title}
              loading="lazy"
              style={{ width: '100%', height: 'auto', maxHeight: 260, objectFit: 'cover', borderRadius: 6 }}
            />
          </Box>
        )}
      </CardContent>
      <Divider />
      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <IconButton
            aria-label={post.liked ? 'unlike post' : 'like post'}
            onClick={() => onToggleLike(post.id)}
            color={post.liked ? 'primary' : 'default'}
          >
            {post.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            {post.likes}
          </Typography>
          <IconButton aria-label="open comments" onClick={() => onOpenComments(post)} sx={{ ml: 1 }}>
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            {post.comments.length}
          </Typography>
        </Box>
        <Button size="small" onClick={() => onOpenComments(post)}>
          {post.comments.length > 0 ? 'View Comments' : 'Add Comment'}
        </Button>
      </CardActions>
    </Card>
  );
});
PostCard.displayName = 'PostCard';

const CreatePostDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  form: PostFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  onSubmit: () => void;
}> = ({ open, onClose, form, onChange, onSubmit }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
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
        value={form.title}
        onChange={onChange}
        sx={{ mb: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="category-label">Category</InputLabel>
        <Select
          labelId="category-label"
          id="category"
          name="category"
          value={form.category}
          onChange={onChange}
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
        value={form.content}
        onChange={onChange}
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
        value={form.imageUrl || ''}
        onChange={onChange}
        helperText="Enter a URL for an image to include with your post"
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onSubmit} variant="contained" startIcon={<SendIcon />}>
        Post
      </Button>
    </DialogActions>
  </Dialog>
);

const CommentsDialog: React.FC<{
  open: boolean;
  post: Post | null;
  onClose: () => void;
  newComment: string;
  onChangeComment: (v: string) => void;
  onSubmitComment: () => void;
  format: (date: string) => string;
}> = ({ open, post, onClose, newComment, onChangeComment, onSubmitComment, format }) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    {post && (
      <>
        <DialogTitle>
          <Typography variant="h6">{post.title}</Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {post.authorName} · {format(post.createdAt)}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            {post.content}
          </Typography>
          {post.imageUrl && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <img
                src={post.imageUrl}
                alt={post.title}
                loading="lazy"
                style={{ width: '100%', height: 'auto', borderRadius: 6 }}
              />
            </Box>
          )}
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Comments ({post.comments.length})
          </Typography>
          {post.comments.length > 0 ? (
            <Box>
              {post.comments.map((comment) => (
                <Paper key={comment.id} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: 'secondary.main' }} aria-hidden>
                      {comment.authorName.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle2">{comment.authorName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {format(comment.createdAt)}
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
              onChange={(e) => onChangeComment(e.target.value)}
              variant="outlined"
              placeholder="What are your thoughts?"
              sx={{ mb: 2 }}
            />
            <Button variant="contained" endIcon={<SendIcon />} onClick={onSubmitComment} disabled={!newComment.trim()}>
              Comment
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </>
    )}
  </Dialog>
);

/**
 * Main component
 */
export default function HomePage() {
  // data
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // dialogs
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openCommentsDialog, setOpenCommentsDialog] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);

  // forms
  const [postFormData, setPostFormData] = useState<PostFormData>({ title: '', content: '', category: '' });
  const [newComment, setNewComment] = useState('');

  // filters
  const [filterCategory, setFilterCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({ open: false, message: '', severity: 'success' });

  // date formatter
  const fmt = useDateFormatter();
  const formatDate = useCallback((dateString: string) => fmt.format(new Date(dateString)), [fmt]);

  // mock load
  useEffect(() => {
    // simulate API
    const t = setTimeout(() => {
      setPosts([...MOCK_POSTS]);
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(t);
  }, []);

  /** Handlers (stable with useCallback to avoid re-renders on children) **/
  const handleOpenPostDialog = useCallback(() => {
    setPostFormData({ title: '', content: '', category: '' });
    setOpenPostDialog(true);
  }, []);
  const handleClosePostDialog = useCallback(() => setOpenPostDialog(false), []);

  const handleOpenCommentsDialog = useCallback((post: Post) => {
    setCurrentPost(post);
    setOpenCommentsDialog(true);
  }, []);
  const handleCloseCommentsDialog = useCallback(() => {
    setOpenCommentsDialog(false);
    setNewComment('');
  }, []);

  const handlePostFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as HTMLInputElement | { name?: string; value: unknown };
    if (!name) return;
    setPostFormData((prev) => ({
      ...prev,
      [name]: value as string,
    }));
  };

  const handleSubmitPost = useCallback(() => {
    if (!postFormData.title || !postFormData.content || !postFormData.category) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'error' });
      return;
    }
    const newPost: Post = {
      id: Date.now().toString(),
      title: postFormData.title,
      content: postFormData.content,
      authorId: 'currentUser',
      authorName: 'Current User',
      createdAt: new Date().toISOString(),
      category: postFormData.category,
      likes: 0,
      comments: [],
      liked: false,
      imageUrl: postFormData.imageUrl,
    };
    setPosts((prev) => [newPost, ...prev]);
    setOpenPostDialog(false);
    setSnackbar({ open: true, message: 'Post created successfully', severity: 'success' });
  }, [postFormData]);

  const handleToggleLike = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    );
  }, []);

  const handleAddComment = useCallback(() => {
    if (!currentPost || !newComment.trim()) return;
    const newCommentObj: CommentT = {
      id: Date.now().toString(),
      content: newComment.trim(),
      authorId: 'currentUser',
      authorName: 'Current User',
      createdAt: new Date().toISOString(),
    };
    setPosts((prev) =>
      prev.map((p) => (p.id === currentPost.id ? { ...p, comments: [...p.comments, newCommentObj] } : p))
    );
    setCurrentPost((prev) => (prev ? { ...prev, comments: [...prev.comments, newCommentObj] } : prev));
    setNewComment('');
    setSnackbar({ open: true, message: 'Comment added successfully', severity: 'success' });
  }, [currentPost, newComment]);

  const handleCloseSnackbar = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);

  /** Filtering (memoized) **/
  const filteredPosts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = !filterCategory || post.category === filterCategory;
      const matchesSearch = !q ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, filterCategory, debouncedSearch]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#b71c1c' }}>
          RPI Dorm Room Helper
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenPostDialog} sx={{ mt: { xs: 2, md: 0 } }}>
          Create Post
        </Button>
      </Box>

      {/* Filters */}
      <FiltersBar
        filterCategory={filterCategory}
        onCategoryChange={setFilterCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Posts */}
      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1 }}>
                    <Skeleton variant="circular" width={24} height={24} />
                    <Skeleton variant="text" width={120} />
                  </Box>
                  <Skeleton variant="rectangular" height={80} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : filteredPosts.length > 0 ? (
        <Grid container spacing={3}>
          {filteredPosts.map((post) => (
            <Grid item xs={12} key={post.id}>
              <PostCard
                post={post}
                onToggleLike={handleToggleLike}
                onOpenComments={handleOpenCommentsDialog}
                format={formatDate}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
          <Typography variant="h6" color="text.secondary">
            No posts found matching your criteria.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenPostDialog} sx={{ mt: 2 }}>
            Create the first post
          </Button>
        </Paper>
      )}

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={openPostDialog}
        onClose={handleClosePostDialog}
        form={postFormData}
        onChange={handlePostFormChange}
        onSubmit={handleSubmitPost}
      />

      {/* Comments Dialog */}
      <CommentsDialog
        open={openCommentsDialog}
        post={currentPost}
        onClose={handleCloseCommentsDialog}
        newComment={newComment}
        onChangeComment={setNewComment}
        onSubmitComment={handleAddComment}
        format={formatDate}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
