import React, { useState, useEffect } from 'react';
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
  DialogTitle
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Comment as CommentIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Sort as SortIcon
} from '@mui/icons-material';

// Define types
interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  category: string;
  createdAt: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  liked: boolean;
  bookmarked: boolean;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

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

// Mock data for favorites
const MOCK_FAVORITES: Post[] = [
  {
    id: '1',
    title: 'Best study spots on campus',
    content: 'After three years at RPI, I\'ve found the best places to study that aren\'t crowded and have good wifi. My top picks are: 1) Third floor of the library near the window seats 2) The lounge in the EMPAC building 3) The cafe in the student union during off-hours...',
    authorId: 'user1',
    authorName: 'Jamie Chen',
    category: 'Campus Tips',
    createdAt: '2025-03-15T14:30:00Z',
    likes: 42,
    comments: 15,
    liked: true,
    bookmarked: true
  },
  {
    id: '2',
    title: 'Selling mini-fridge - perfect condition',
    content: 'Moving off campus and selling my mini-fridge. Only used for one year, perfect condition. Black color, 2.7 cubic feet with freezer compartment. Asking $60 OBO. Can deliver on campus.',
    authorId: 'user2',
    authorName: 'Alex Johnson',
    category: 'For Sale',
    createdAt: '2025-04-05T10:15:00Z',
    imageUrl: 'https://via.placeholder.com/300x200',
    likes: 8,
    comments: 4,
    liked: true,
    bookmarked: true
  },
  {
    id: '3',
    title: 'Summer sublet available near campus',
    content: 'I\'m looking for someone to sublet my room for the summer (May-August). It\'s a private room in a 3-bedroom apartment, 10 minute walk to campus. Rent is $500/month including utilities. Roommates are two grad students who are very quiet and clean.',
    authorId: 'user3',
    authorName: 'Morgan Smith',
    category: 'Housing',
    createdAt: '2025-03-28T09:45:00Z',
    imageUrl: 'https://via.placeholder.com/300x200',
    likes: 15,
    comments: 7,
    liked: true,
    bookmarked: true
  },
  {
    id: '4',
    title: 'Best meal plan options for sophomores',
    content: 'After trying all the meal plans this year, I wanted to share my thoughts on which one gives you the most value as a sophomore. The 15-meal plan seems to be the sweet spot if you sometimes cook or eat off campus on weekends...',
    authorId: 'user4',
    authorName: 'Taylor Wong',
    category: 'Food',
    createdAt: '2025-03-10T16:20:00Z',
    likes: 27,
    comments: 12,
    liked: true,
    bookmarked: true
  },
  {
    id: '5',
    title: 'Textbooks for sale - Computer Science',
    content: 'Selling textbooks for the following CS courses: Data Structures, Algorithms, Computer Organization, and Operating Systems. All in great condition with minimal highlighting. Prices range from $30-50, much cheaper than bookstore. DM me if interested!',
    authorId: 'user5',
    authorName: 'Jordan Park',
    category: 'For Sale',
    createdAt: '2025-04-01T11:10:00Z',
    likes: 19,
    comments: 8,
    liked: true,
    bookmarked: false
  }
];

// Mock data for saved locations
const SAVED_LOCATIONS = [
  {
    id: 'loc1',
    name: 'Folsom Library',
    description: 'Main campus library with study spaces',
    category: 'Study Spot',
    address: '110 8th St, Troy, NY 12180',
    imageUrl: 'https://via.placeholder.com/300x200',
    saved: true
  },
  {
    id: 'loc2',
    name: 'Student Union',
    description: 'Campus hub with dining options and meeting rooms',
    category: 'Campus Building',
    address: '15th Street, Troy, NY 12180',
    imageUrl: 'https://via.placeholder.com/300x200',
    saved: true
  },
  {
    id: 'loc3',
    name: 'EMPAC',
    description: 'Experimental Media and Performing Arts Center',
    category: 'Arts & Entertainment',
    address: '110 8th St, Troy, NY 12180',
    imageUrl: 'https://via.placeholder.com/300x200',
    saved: true
  }
];

export default function Favorite() {
  // State variables
  const [activeTab, setActiveTab] = useState(0);
  const [favorites, setFavorites] = useState<Post[]>(MOCK_FAVORITES);
  const [locations, setLocations] = useState(SAVED_LOCATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState<'post' | 'location'>('post');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info' | 'warning'
  });

  // Simulate loading data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  }, [activeTab]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchQuery('');
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Filter items based on search query
  const filteredFavorites = favorites.filter(
    (favorite) =>
      favorite.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle like toggle
  const handleToggleLike = (postId: string) => {
    setFavorites(
      favorites.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.liked ? post.likes - 1 : post.likes + 1
            }
          : post
      )
    );
  };

  // Handle bookmark toggle
  const handleToggleBookmark = (postId: string) => {
    setFavorites(
      favorites.map((post) =>
        post.id === postId
          ? {
              ...post,
              bookmarked: !post.bookmarked
            }
          : post
      )
    );
  };

  // Handle remove favorite confirmation dialog
  const handleOpenDeleteDialog = (id: string, type: 'post' | 'location') => {
    setItemToDelete(id);
    setItemTypeToDelete(type);
    setDeleteDialogOpen(true);
  };

  // Handle remove favorite confirmation
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    if (itemTypeToDelete === 'post') {
      setFavorites(favorites.filter((post) => post.id !== itemToDelete));
    } else {
      setLocations(locations.filter((location) => location.id !== itemToDelete));
    }

    setSnackbar({
      open: true,
      message: `Item removed from favorites`,
      severity: 'success'
    });

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1976d2', display: 'flex', alignItems: 'center' }}>
            <FavoriteIcon sx={{ mr: 1, color: '#e91e63' }} />
            My Favorites
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 1 }}>
            Manage your favorite posts and saved locations
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
          >
            <Tab label={`Favorite Posts (${favorites.filter(p => p.liked).length})`} id="tab-0" aria-controls="tabpanel-0" />
            <Tab label={`Saved Locations (${locations.length})`} id="tab-1" aria-controls="tabpanel-1" />
          </Tabs>
        </Paper>

        {/* Search Bar */}
        <Paper elevation={1} sx={{ p: 2, mb: 4 }}>
          <TextField
            fullWidth
            placeholder={`Search ${activeTab === 0 ? 'posts' : 'locations'}...`}
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
        </Paper>

        {/* Loading Indicator */}
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Favorites Tab Panel */}
            <TabPanel value={activeTab} index={0}>
              {filteredFavorites.length > 0 ? (
                <Grid container spacing={3}>
                  {filteredFavorites.map((post) => (
                    <Grid item xs={12} key={post.id}>
                      <Card elevation={2} sx={{ transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
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
                            {truncateText(post.content, 200)}
                          </Typography>
                          
                          {post.imageUrl && (
                            <CardMedia
                              component="img"
                              height="140"
                              image={post.imageUrl}
                              alt={post.title}
                              sx={{ borderRadius: 1, mb: 2 }}
                            />
                          )}
                        </CardContent>
                        
                        <Divider />
                        
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                          <Box>
                            <IconButton
                              onClick={() => handleToggleLike(post.id)}
                              color={post.liked ? 'error' : 'default'}
                              size="small"
                            >
                              {post.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                            </IconButton>
                            <Typography variant="body2" component="span" sx={{ mr: 2 }}>
                              {post.likes}
                            </Typography>
                            
                            <IconButton size="small" color="default">
                              <CommentIcon />
                            </IconButton>
                            <Typography variant="body2" component="span" sx={{ mr: 2 }}>
                              {post.comments}
                            </Typography>
                            
                            <IconButton
                              onClick={() => handleToggleBookmark(post.id)}
                              color={post.bookmarked ? 'primary' : 'default'}
                              size="small"
                            >
                              {post.bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                            </IconButton>
                          </Box>
                          
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDeleteDialog(post.id, 'post')}
                          >
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No favorite posts found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery
                      ? "No posts match your search criteria"
                      : "You haven't favorited any posts yet. Browse the home page and like posts to add them here."}
                  </Typography>
                </Paper>
              )}
            </TabPanel>

            {/* Saved Locations Tab Panel */}
            <TabPanel value={activeTab} index={1}>
              {filteredLocations.length > 0 ? (
                <Grid container spacing={3}>
                  {filteredLocations.map((location) => (
                    <Grid item xs={12} sm={6} md={4} key={location.id}>
                      <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 } }}>
                        {location.imageUrl && (
                          <CardMedia
                            component="img"
                            height="140"
                            image={location.imageUrl}
                            alt={location.name}
                          />
                        )}
                        
                        <CardContent sx={{ flexGrow: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Chip
                              label={location.category}
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ mb: 1 }}
                            />
                          </Box>
                          
                          <Typography variant="h6" component="h2" gutterBottom>
                            {location.name}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {location.description}
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary">
                            {location.address}
                          </Typography>
                        </CardContent>
                        
                        <CardActions>
                          <Button
                            size="small"
                            color="primary"
                          >
                            View Details
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleOpenDeleteDialog(location.id, 'location')}
                          >
                            Remove
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    No saved locations found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {searchQuery
                      ? "No locations match your search criteria"
                      : "You haven't saved any locations yet. Browse the map and save locations to add them here."}
                  </Typography>
                </Paper>
              )}
            </TabPanel>
          </>
        )}
        
        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Remove from Favorites</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to remove this {itemTypeToDelete} from your favorites?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmDelete} color="error" variant="contained">
              Remove
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
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </div>
  );
}