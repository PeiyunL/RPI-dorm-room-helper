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
  TextField
} from '@mui/material';
import { 
  Delete as DeleteIcon, 
  Edit as EditIcon,
  History as HistoryIcon,
  BookmarkBorder as BookmarkIcon,
  Bookmark as BookmarkedIcon,
  FavoriteBorder as LikeIcon,
  Favorite as LikedIcon,
  Comment as CommentIcon
} from '@mui/icons-material';

// Interface definitions
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  category: string;
  likes: number;
  comments: number;
  liked: boolean;
  bookmarked: boolean;
  imageUrl?: string;
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

// Mock data
const MY_POSTS: Post[] = [
  {
    id: '1',
    title: 'Looking for a roommate for Fall semester',
    content: 'Hey everyone! I\'m looking for a roommate for the upcoming Fall semester...',
    authorId: 'currentUser',
    authorName: 'Current User',
    createdAt: '2025-04-10T10:30:00Z',
    category: 'Roommate Search',
    likes: 5,
    comments: 1,
    liked: false,
    bookmarked: false
  },
  {
    id: '2',
    title: 'Anyone know how to get housing priority?',
    content: 'I\'m trying to figure out how to get priority for on-campus housing next semester...',
    authorId: 'currentUser',
    authorName: 'Current User',
    createdAt: '2025-04-05T08:15:00Z',
    category: 'Housing Questions',
    likes: 3,
    comments: 2,
    liked: false,
    bookmarked: false
  }
];

const BOOKMARKED_POSTS: Post[] = [
  {
    id: '3',
    title: 'Dorm hacks for maximizing small spaces',
    content: 'After living in dorms for 3 years, I\'ve learned a lot about how to make the most of small spaces...',
    authorId: 'user4',
    authorName: 'Morgan Lee',
    createdAt: '2025-04-08T09:20:00Z',
    category: 'Dorm Tips',
    likes: 12,
    comments: 2,
    liked: true,
    bookmarked: true
  },
  {
    id: '4',
    title: 'Selling desk lamp and organizer',
    content: 'I\'m graduating this semester and selling some of my dorm items...',
    authorId: 'user3',
    authorName: 'Taylor Wong',
    createdAt: '2025-04-09T14:45:00Z',
    category: 'Furniture Exchange',
    likes: 3,
    comments: 0,
    liked: false,
    bookmarked: true,
    imageUrl: 'https://via.placeholder.com/150'
  }
];

const LIKED_POSTS: Post[] = [
  {
    id: '3',
    title: 'Dorm hacks for maximizing small spaces',
    content: 'After living in dorms for 3 years, I\'ve learned a lot about how to make the most of small spaces...',
    authorId: 'user4',
    authorName: 'Morgan Lee',
    createdAt: '2025-04-08T09:20:00Z',
    category: 'Dorm Tips',
    likes: 12,
    comments: 2,
    liked: true,
    bookmarked: true
  },
  {
    id: '5',
    title: 'Preparing for move-in day',
    content: 'Here are my top tips for a smooth move-in day experience...',
    authorId: 'user7',
    authorName: 'Jamie Rodriguez',
    createdAt: '2025-04-01T11:10:00Z',
    category: 'Dorm Tips',
    likes: 8,
    comments: 3,
    liked: true,
    bookmarked: false
  }
];

export default function Record() {
  const [tabValue, setTabValue] = useState(0);
  const [myPosts, setMyPosts] = useState<Post[]>(MY_POSTS);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>(BOOKMARKED_POSTS);
  const [likedPosts, setLikedPosts] = useState<Post[]>(LIKED_POSTS);
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

  // Simulate loading data
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, [tabValue]);

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

  const handleToggleBookmark = (post: Post) => {
    // Handle bookmarking/unbookmarking logic
    if (post.bookmarked) {
      // Remove from bookmarked posts
      setBookmarkedPosts(bookmarkedPosts.filter(p => p.id !== post.id));
      
      // Update in other lists if present
      if (post.authorId === 'currentUser') {
        setMyPosts(myPosts.map(p => 
          p.id === post.id ? { ...p, bookmarked: false } : p
        ));
      }
      
      if (post.liked) {
        setLikedPosts(likedPosts.map(p => 
          p.id === post.id ? { ...p, bookmarked: false } : p
        ));
      }
    } else {
      // Add to bookmarked posts if not already there
      if (!bookmarkedPosts.some(p => p.id === post.id)) {
        setBookmarkedPosts([...bookmarkedPosts, { ...post, bookmarked: true }]);
      } else {
        setBookmarkedPosts(bookmarkedPosts.map(p => 
          p.id === post.id ? { ...p, bookmarked: true } : p
        ));
      }
      
      // Update in other lists if present
      if (post.authorId === 'currentUser') {
        setMyPosts(myPosts.map(p => 
          p.id === post.id ? { ...p, bookmarked: true } : p
        ));
      }
      
      if (post.liked) {
        setLikedPosts(likedPosts.map(p => 
          p.id === post.id ? { ...p, bookmarked: true } : p
        ));
      }
    }
  };

  const handleToggleLike = (post: Post) => {
    // Handle liking/unliking logic
    const newLikedStatus = !post.liked;
    const updatedPost = {
      ...post,
      liked: newLikedStatus,
      likes: newLikedStatus ? post.likes + 1 : post.likes - 1,
    };
    
    if (newLikedStatus) {
      // Add to liked posts if not already there
      if (!likedPosts.some(p => p.id === post.id)) {
        setLikedPosts([...likedPosts, updatedPost]);
      } else {
        setLikedPosts(likedPosts.map(p => 
          p.id === post.id ? updatedPost : p
        ));
      }
    } else {
      // Remove from liked posts
      setLikedPosts(likedPosts.filter(p => p.id !== post.id));
    }
    
    // Update in other lists if present
    if (post.authorId === 'currentUser') {
      setMyPosts(myPosts.map(p => 
        p.id === post.id ? updatedPost : p
      ));
    }
    
    if (post.bookmarked) {
      setBookmarkedPosts(bookmarkedPosts.map(p => 
        p.id === post.id ? updatedPost : p
      ));
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

  const handleSaveEdit = () => {
    if (!currentEditPost) return;
    
    const updatedPost = {
      ...currentEditPost,
      title: editFormData.title,
      content: editFormData.content,
      category: editFormData.category
    };
    
    // Update in my posts
    setMyPosts(myPosts.map(post => 
      post.id === currentEditPost.id ? updatedPost : post
    ));
    
    // Update in other lists if present
    if (currentEditPost.bookmarked) {
      setBookmarkedPosts(bookmarkedPosts.map(post => 
        post.id === currentEditPost.id ? updatedPost : post
      ));
    }
    
    if (currentEditPost.liked) {
      setLikedPosts(likedPosts.map(post => 
        post.id === currentEditPost.id ? updatedPost : post
      ));
    }
    
    setEditDialogOpen(false);
    setCurrentEditPost(null);
  };

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!postToDelete) return;
    
    // Remove from my posts
    setMyPosts(myPosts.filter(post => post.id !== postToDelete));
    
    // Remove from other lists if present
    setBookmarkedPosts(bookmarkedPosts.filter(post => post.id !== postToDelete));
    setLikedPosts(likedPosts.filter(post => post.id !== postToDelete));
    
    setDeleteConfirmOpen(false);
    setPostToDelete(null);
  };

  // Post display component
  const PostCard = ({ post, isMyPost = false }: { post: Post, isMyPost?: boolean }) => (
    <Card elevation={2} sx={{ mb: 2, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
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
          {post.content}
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, alignItems: 'center' }}>
        <Box>
          <IconButton
            onClick={() => handleToggleLike(post)}
            color={post.liked ? 'error' : 'default'}
            size="small"
          >
            {post.liked ? <LikedIcon /> : <LikeIcon />}
          </IconButton>
          <Typography variant="body2" component="span" sx={{ mr: 2 }}>
            {post.likes}
          </Typography>
          
          <IconButton size="small" sx={{ mr: 1 }}>
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" component="span" sx={{ mr: 2 }}>
            {post.comments}
          </Typography>
          
          <IconButton
            onClick={() => handleToggleBookmark(post)}
            color={post.bookmarked ? 'primary' : 'default'}
            size="small"
          >
            {post.bookmarked ? <BookmarkedIcon /> : <BookmarkIcon />}
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
    </Card>
  );

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
                    You haven't created any posts yet.
                  </Typography>
                </Paper>
              )}
            </TabPanel>

            {/* Bookmarks Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Posts you've bookmarked ({bookmarkedPosts.length})
              </Typography>
              {bookmarkedPosts.length > 0 ? (
                <Grid container spacing={2}>
                  {bookmarkedPosts.map((post) => (
                    <Grid item xs={12} key={post.id}>
                      <PostCard post={post} isMyPost={post.authorId === 'currentUser'} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="body1" color="text.secondary">
                    You haven't bookmarked any posts yet.
                  </Typography>
                </Paper>
              )}
            </TabPanel>

            {/* Liked Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Posts you've liked ({likedPosts.length})
              </Typography>
              {likedPosts.length > 0 ? (
                <Grid container spacing={2}>
                  {likedPosts.map((post) => (
                    <Grid item xs={12} key={post.id}>
                      <PostCard post={post} isMyPost={post.authorId === 'currentUser'} />
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
      </Container>
    </div>
  );
}