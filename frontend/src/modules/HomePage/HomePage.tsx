import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { SelectChangeEvent } from "@mui/material/Select";
import filter from 'leo-profanity';
filter.add(['Israel', 'Palestine']);
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
} from "@mui/material";
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Comment as CommentIcon,
  Send as SendIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  Flag as FlagIcon,
} from "@mui/icons-material";

import pb from "../../services/pb"; // <-- adjust path if needed

/**
 * Types (UI-facing)
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
  commentsCount: number; // server-side count (used before loading comments)
  comments: CommentT[]; // loaded on demand
  liked: boolean;
  bookmarked: boolean;
  imageUrl?: string;
}

interface PostFormData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

type PBRecord = any;

const makeKey = (userId: string, postId: string) => `${userId}_${postId}`;

/**
 * Constants
 */
const CATEGORIES: ReadonlyArray<string> = [
  "Roommate Search",
  "Furniture Exchange",
  "Dorm Tips",
  "Events",
  "Lost & Found",
  "Housing Questions",
] as const;

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

const useDateFormatter = (locale = "en-US") =>
  useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale]
  );

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
              inputProps: { "aria-label": "search posts" },
            }}
          />
        </Grid>
      </Grid>
    </Paper>
  );
});
FiltersBar.displayName = "FiltersBar";

const PostCard: React.FC<{
  post: Post;
  onToggleLike: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  onOpenComments: (post: Post) => void;
  onReportClick: (id: string) => void;
  format: (date: string) => string;
}> = React.memo(({ post, onToggleLike, onToggleBookmark, onOpenComments, onReportClick, format }) => {
  return (
    <Card
      elevation={2}
      sx={{
        transition: "transform 0.2s",
        "&:hover": { transform: "translateY(-4px)", boxShadow: 4 },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Chip label={post.category} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
          <Typography variant="caption" color="text.secondary">
            {format(post.createdAt)}
          </Typography>
        </Box>

        <Typography variant="h6" component="h2" gutterBottom>
          {post.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: "primary.main" }} aria-hidden>
            {post.authorName.charAt(0)}
          </Avatar>
          <Typography variant="body2" color="text.secondary">
            {post.authorName}
          </Typography>
        </Box>

        {/* <Typography variant="body1" paragraph>
          {post.content.length > 250 ? `${post.content.substring(0, 250)}...` : post.content}
        </Typography> */}
        <Box
          sx={{
            maxHeight: 160,
            overflowY: "auto",
            p: 1.5,
            borderRadius: 1.5,
            bgcolor: "action.hover",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          <Typography variant="body1">
            {post.content}
          </Typography>
        </Box>

        {post.imageUrl && (
          <Box sx={{ mt: 2, mb: 2 }}>
            <img
              src={post.imageUrl}
              alt={post.title}
              loading="lazy"
              style={{ width: "100%", height: "auto", maxHeight: 260, objectFit: "cover", borderRadius: 6 }}
            />
          </Box>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: "space-between" }}>
        <Box>
          <IconButton
            aria-label={post.liked ? "unlike post" : "like post"}
            onClick={() => onToggleLike(post.id)}
            color={post.liked ? "primary" : "default"}
          >
            {post.liked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            {post.likes}
          </Typography>

          <IconButton
            aria-label={post.bookmarked ? "remove bookmark" : "bookmark post"}
            onClick={() => onToggleBookmark(post.id)}
            sx={{ ml: 1 }}
            color={post.bookmarked ? "primary" : "default"}
          >
            {post.bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
          </IconButton>

          <IconButton aria-label="report post" 
            onClick={() => onReportClick(post.id)} 
            sx={{ ml: 1 }}
          >
            <FlagIcon fontSize="small" color="action" />
          </IconButton>

          <IconButton aria-label="open comments" onClick={() => onOpenComments(post)} sx={{ ml: 1 }}>
            <CommentIcon />
          </IconButton>
          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
            {post.comments.length > 0 ? post.comments.length : post.commentsCount}
          </Typography>
        </Box>

        <Button size="small" onClick={() => onOpenComments(post)}>
          {post.comments.length > 0 ? "View Comments" : "Add Comment"}
        </Button>
      </CardActions>
    </Card>
  );
});
PostCard.displayName = "PostCard";

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
        <Select labelId="category-label" id="category" name="category" value={form.category} onChange={onChange} label="Category">
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
        minRows={4}
        maxRows={10}
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
        value={form.imageUrl || ""}
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
  isLoadingComments: boolean;
}> = ({ open, post, onClose, newComment, onChangeComment, onSubmitComment, format, isLoadingComments }) => (
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
          <Box
            sx={{
              maxHeight: 220,
              overflowY: "auto",
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: "action.hover",
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              mb: 2,
            }}
          >
            <Typography variant="body1">
              {post.content}
            </Typography>
          </Box>

          {post.imageUrl && (
            <Box sx={{ mt: 2, mb: 2 }}>
              <img src={post.imageUrl} alt={post.title} loading="lazy" style={{ width: "100%", height: "auto", borderRadius: 6 }} />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" gutterBottom>
            Comments ({post.comments.length})
          </Typography>

          {isLoadingComments ? (
            <Box>
              {Array.from({ length: 2 }).map((_, i) => (
                <Paper key={i} sx={{ p: 2, mb: 2 }}>
                  <Skeleton variant="text" width={160} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width="70%" />
                </Paper>
              ))}
            </Box>
          ) : post.comments.length > 0 ? (
            <Box>
              {post.comments.map((comment) => (
                <Paper key={comment.id} sx={{ p: 2, mb: 2, bgcolor: "background.default" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: "secondary.main" }} aria-hidden>
                      {comment.authorName.charAt(0)}
                    </Avatar>
                    <Typography variant="subtitle2">{comment.authorName}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {format(comment.createdAt)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    }}
                  >
                    {comment.content}
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          )}

          <TextField
            fullWidth
            label="Add a comment"
            multiline
            minRows={3}
            maxRows={8}
            value={newComment}
            onChange={(e) => onChangeComment(e.target.value)}
            variant="outlined"
            placeholder="What are your thoughts?"
            sx={{ mb: 1.5 }}
          />

          {/* Keep an in-content submit button too, so it's always visible even on smaller screens */}
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
            <Button
              onClick={onSubmitComment}
              variant="contained"
              startIcon={<SendIcon />}
              disabled={!newComment.trim() || isLoadingComments}
            >
              Post Comment
            </Button>
          </Box>

        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          {/* Also keep the classic dialog footer action (harmless duplicate) */}
          <Button onClick={onSubmitComment} variant="contained" startIcon={<SendIcon />} disabled={!newComment.trim() || isLoadingComments}>
            Post Comment
          </Button>
        </DialogActions>
      </>
    )}
  </Dialog>
);

/**
 * Main component (PocketBase connected)
 */
export default function HomePage() {
  const userId = pb.authStore.model?.id ?? null;
  const userName =
    (pb.authStore.model?.name as string | undefined) ??
    (pb.authStore.model?.username as string | undefined) ??
    "Current User";

  // data
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // dialogs
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [postIdToReport, setPostIdToReport] = useState<string | null>(null);
  const [openCommentsDialog, setOpenCommentsDialog] = useState(false);
  const [currentPost, setCurrentPost] = useState<Post | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // forms
  const [postFormData, setPostFormData] = useState<PostFormData>({ title: "", content: "", category: "" });
  const [newComment, setNewComment] = useState("");

  // filters
  const [filterCategory, setFilterCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  // snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error" | "info" | "warning";
  }>({ open: false, message: "", severity: "success" });

  // date formatter
  const fmt = useDateFormatter();
  const formatDate = useCallback(
  (dateString?: string) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return fmt.format(d);
  },
  [fmt]
);


  const handleCloseSnackbar = useCallback(() => setSnackbar((prev) => ({ ...prev, open: false })), []);

  const mapPostRecordToUI = useCallback(
    (r: any, likedSet: Set<string>, bookmarkedSet: Set<string>): Post => {
      const authorExpanded = r.expand?.author;
      const authorNameFromExpand =
        authorExpanded?.name ?? authorExpanded?.username ?? "Unknown";

        return {
          id: r.id,
          title: r.title ?? "",
          content: r.content ?? "",
          category: r.category ?? "",
          imageUrl: r.image ? pb.files.getUrl(r, r.image) : (r.links || undefined),
          authorId: r.author ?? "",
          authorName: authorNameFromExpand,
          createdAt: r.created ?? new Date().toISOString(),
          likes: typeof r.likes === "number" ? r.likes : 0,
          commentsCount: typeof r.commentsCount === "number" ? r.commentsCount : 0,
          liked: likedSet.has(r.id),
          bookmarked: bookmarkedSet.has(r.id),
          comments: [],
        };

    },
    []
  );

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1) load liked posts for current user
      const likedSet = new Set<string>();
      const bookmarkedSet = new Set<string>();
      if (userId) {
        const likes = await pb.collection("likes").getFullList({
          filter: `user="${userId}"`,
        });
        for (const lk of likes as any[]) likedSet.add(lk.post);

        // bookmarks (saved posts)
        try {
          const bookmarks = await pb.collection("favorites").getFullList({
            filter: `user="${userId}"`,
          });
          for (const bm of bookmarks as any[]) bookmarkedSet.add(bm.post);
        } catch {
          // if the collection doesn't exist yet, HomePage still works without bookmarks
        }
      }

      // 2) load posts
      const list = await pb.collection("posts").getList(1, 50, {
        sort: "-created",
        expand: "author",
      });

      const mapped = (list.items as any[]).map((r) => mapPostRecordToUI(r, likedSet, bookmarkedSet));
      setPosts(mapped);
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: e?.message ?? "Failed to load posts",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [mapPostRecordToUI, userId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  /** Dialog handlers **/
  const handleOpenPostDialog = useCallback(() => {
    setPostFormData({ title: "", content: "", category: "" });
    setOpenPostDialog(true);
  }, []);
  const handleClosePostDialog = useCallback(() => setOpenPostDialog(false), []);

  const loadCommentsForPost = useCallback(async (postId: string) => {
    setIsLoadingComments(true);
    try {
      const res = await pb.collection("comments").getList(1, 100, {
        sort: "created",
        filter: `post="${postId}"`,
        expand: "author",
      });

      const comments: CommentT[] = (res.items as any[]).map((c) => {
        const a = c.expand?.author;
        const authorName = a?.name ?? a?.username ?? "Unknown";
        return {
          id: c.id,
          content: c.content ?? "",
          authorId: c.author ?? "",
          authorName,
          createdAt: c.created ?? new Date().toISOString(),
        };
      });

      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments } : p)));
      setCurrentPost((prev) => (prev && prev.id === postId ? { ...prev, comments } : prev));
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: e?.message ?? "Failed to load comments",
        severity: "error",
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const handleOpenCommentsDialog = useCallback(
    async (post: Post) => {
      setCurrentPost(post);
      setOpenCommentsDialog(true);

      // load if not loaded yet
      if (post.comments.length === 0) {
        await loadCommentsForPost(post.id);
      }
    },
    [loadCommentsForPost]
  );

  const ReportDialog: React.FC<{
    open: boolean;
    onClose: () => void;
    onSubmit: (reason: string) => void;
    reason: string;
    setReason: (r: string) => void;
  }> = ({ open, onClose, onSubmit, reason, setReason }) => (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle sx={{ color: "#b71c1c", fontWeight: "bold" }}>Report Content</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Is this post violating RPI community standards?
        </Typography>
        <FormControl fullWidth size="small">
          <InputLabel>Reason for Report</InputLabel>
          <Select value={reason} label="Reason for Report" onChange={(e) => setReason(e.target.value)}>
            <MenuItem value="Spam">Spam</MenuItem>
            <MenuItem value="Harassment">Harassment</MenuItem>
            <MenuItem value="Inappropriate">Inappropriate Language</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button 
        onClick={() => onSubmit(reason)} 
        variant="contained" 
        color="error" 
        disabled={!reason}
      >
        Submit Report
      </Button>
    </DialogActions>
  </Dialog>
);

  const handleCloseCommentsDialog = useCallback(() => {
    setOpenCommentsDialog(false);
    setNewComment("");
    setIsLoadingComments(false);
  }, []);

  /** Form handlers **/
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

  /** Create post **/
  const handleSubmitPost = useCallback(async () => {
    if (!userId) {
        setSnackbar({ open: true, message: "Please log in to create a post.", severity: "warning" });
        return;
      }
      if (!postFormData.title || !postFormData.content || !postFormData.category) {
        setSnackbar({ open: true, message: "Please fill in all required fields", severity: "error" });
        return;
      }

      if (filter.check(postFormData.title) || filter.check(postFormData.content)) {
        setSnackbar({ 
          open: true, 
          message: "Inappropriate language detected. Please keep it RPI-friendly!", 
          severity: "warning" 
        });
        return;
      }

    try {
        const created = await pb.collection("posts").create({
          title: postFormData.title,
          content: postFormData.content,
          category: postFormData.category,
          links: postFormData.imageUrl || "", // ✅ store external URL here
          author: userId,
          likes: 0,
          commentsCount: 0,
        });

        const uiPost: Post = {
          id: created.id,
          title: created.title ?? postFormData.title,
          content: created.content ?? postFormData.content,
          category: created.category ?? postFormData.category,
          imageUrl: created.links || undefined, // ✅ from PB 'links'
          authorId: userId,
          authorName: userName,
          createdAt: created.created ?? new Date().toISOString(),
          likes: created.likes ?? 0,
          commentsCount: created.commentsCount ?? 0,
          liked: false,
          bookmarked: false,
          comments: [],
        };


      setPosts((prev) => [uiPost, ...prev]);
      setOpenPostDialog(false);
      setSnackbar({ open: true, message: "Post created successfully", severity: "success" });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message ?? "Failed to create post", severity: "error" });
    }
  }, [postFormData, userId, userName]);

  const handleToggleLike = useCallback(
    async (postId: string) => {
      if (!userId) {
        setSnackbar({ open: true, message: "Please log in to like posts.", severity: "warning" });
        return;
      }

      const prevPost = posts.find((p) => p.id === postId);
      const prevLiked = prevPost?.liked ?? false;
      const prevLikes = prevPost?.likes ?? 0;

      const nextLiked = !prevLiked;
      const nextLikes = Math.max(0, prevLikes + (nextLiked ? 1 : -1));

      // optimistic UI
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, liked: nextLiked, likes: nextLikes } : p)));
      setCurrentPost((prev) => (prev && prev.id === postId ? { ...prev, liked: nextLiked, likes: nextLikes } : prev));

      const key = makeKey(userId, postId);

      try {
        // Find existing by key (recommended)
        let existing: any = null;
        try {
          existing = await pb.collection("likes").getFirstListItem(`key="${key}"`);
        } catch {
          existing = null;
        }

        if (existing) {
          await pb.collection("likes").delete(existing.id);
        } else {
          // IMPORTANT: include key (many schemas require this / enforce uniqueness)
          await pb.collection("likes").create({ post: postId, user: userId, key });
        }

        // (Optional) If you want to keep posts.likes in PB synced:
        // const post = await pb.collection("posts").getOne(postId, { fields: "likes" });
        // const current = Number(post.likes || 0);
        // await pb.collection("posts").update(postId, { likes: Math.max(0, current + (existing ? -1 : +1)) });

      } catch (e: any) {
        // revert perfectly
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, liked: prevLiked, likes: prevLikes } : p)));
        setCurrentPost((prev) => (prev && prev.id === postId ? { ...prev, liked: prevLiked, likes: prevLikes } : prev));
        setSnackbar({ open: true, message: e?.message ?? "Failed to toggle like", severity: "error" });
      }
    },
    [userId, posts]
  );

  /** Toggle bookmark (saved post) **/
  const handleToggleBookmark = useCallback(
    async (postId: string) => {
      if (!userId) {
        setSnackbar({ open: true, message: "Please log in to bookmark posts.", severity: "warning" });
        return;
      }

      const prevPost = posts.find((p) => p.id === postId);
      const prevBookmarked = prevPost?.bookmarked ?? false;
      const nextBookmarked = !prevBookmarked;

      // optimistic UI
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, bookmarked: nextBookmarked } : p)));
      setCurrentPost((prev) => (prev && prev.id === postId ? { ...prev, bookmarked: nextBookmarked } : prev));

      const key = makeKey(userId, postId);

      try {
        let existing: any = null;
        try {
          existing = await pb.collection("favorites").getFirstListItem(`key="${key}"`);
        } catch {
          existing = null;
        }

        if (existing) {
          await pb.collection("favorites").delete(existing.id);
        } else {
          await pb.collection("favorites").create({ post: postId, user: userId, key });
        }
      } catch (e: any) {
        // revert
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, bookmarked: prevBookmarked } : p)));
        setCurrentPost((prev) => (prev && prev.id === postId ? { ...prev, bookmarked: prevBookmarked } : prev));
        setSnackbar({ open: true, message: e?.message ?? "Failed to toggle bookmark", severity: "error" });
      }
    },
    [userId, posts]
  );



  /** Add comment **/
  const handleAddComment = useCallback(async () => {
    if (!userId) {
        setSnackbar({ open: true, message: "Please log in to comment.", severity: "warning" });
        return;
      }
      if (!currentPost || !newComment.trim()) return;

      const content = newComment.trim();

      if (filter.check(content)) {
        setSnackbar({ 
          open: true, 
          message: "Comment contains inappropriate language.", 
          severity: "warning" 
        });
        return;
      }
    try {
      const created = await pb.collection("comments").create({
        post: currentPost.id,
        content,
        author: userId,
      });

      const newCommentObj: CommentT = {
        id: created.id,
        content,
        authorId: userId,
        authorName: userName,
        createdAt: created.created ?? new Date().toISOString(),
      };

      setPosts((prev) =>
        prev.map((p) => (p.id === currentPost.id ? { ...p, comments: [...p.comments, newCommentObj] } : p))
      );
      setCurrentPost((prev) => (prev ? { ...prev, comments: [...prev.comments, newCommentObj] } : prev));
      setNewComment("");
      setSnackbar({ open: true, message: "Comment added successfully", severity: "success" });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message ?? "Failed to add comment", severity: "error" });
    }
  }, [currentPost, newComment, userId, userName]);

const handleReportSubmit = useCallback(async (reason: string) => {
  if (!userId || !postIdToReport) return;

  try {
    // Step 1: Create the report record
    // Uses the fields: post, reason, reporter as seen in your collection
    await pb.collection("reports").create({
      post: postIdToReport,
      reason: reason,
      reporter: userId,
    });

    // Step 2: Fetch current post to get current count
    const post = await pb.collection("posts").getOne(postIdToReport);
    
    // Step 3: Increment the number and update the post
    await pb.collection("posts").update(postIdToReport, {
      reportsCount: (post.reportsCount || 0) + 1
    });

    setOpenReportDialog(false);
    setReportReason("");
    setSnackbar({ 
      open: true, 
      message: "Report submitted. Thank you for keeping RPI safe!", 
      severity: "success" 
    });
  } catch (e: any) {
    // Catch the Unique Index error (User already reported this)
    const isDuplicate = e?.response?.data?.post?.code === 'validation_not_unique' || 
                         e?.message?.toLowerCase().includes("unique");

    setSnackbar({ 
      open: true, 
      message: isDuplicate ? "You have already reported this post." : "Failed to report post.", 
      severity: isDuplicate ? "info" : "error" 
    });
    
    if (isDuplicate) setOpenReportDialog(false);
  }
}, [userId, postIdToReport]);
  // Function to trigger the dialog
const handleOpenReport = (postId: string) => {
    setPostIdToReport(postId);
    setOpenReportDialog(true);
};


  
  /** Filtering **/
  const filteredPosts = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesCategory = !filterCategory || post.category === filterCategory;
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.content.toLowerCase().includes(q) ||
        post.authorName.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [posts, filterCategory, debouncedSearch]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", md: "center" },
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", color: "#b71c1c" }}>
          RPI Dorm Room Helper
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenPostDialog} sx={{ mt: { xs: 2, md: 0 } }}>
          Create Post
        </Button>
      </Box>

      {/* Filters */}
      <FiltersBar filterCategory={filterCategory} onCategoryChange={setFilterCategory} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Posts */}
      {isLoading ? (
        <Grid container spacing={3}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Grid item xs={12} key={i}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" width={120} />
                  <Skeleton variant="text" width="60%" height={32} />
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, my: 1 }}>
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
                onToggleBookmark={handleToggleBookmark}
                onOpenComments={handleOpenCommentsDialog}
                onReportClick={handleOpenReport} 
                format={formatDate}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 4, textAlign: "center", bgcolor: "background.default" }}>
          <Typography variant="h6" color="text.secondary">
            No posts found matching your criteria.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenPostDialog} sx={{ mt: 2 }}>
            Create the first post
          </Button>
        </Paper>
      )}

      {/* Create Post Dialog */}
      <CreatePostDialog open={openPostDialog} onClose={handleClosePostDialog} form={postFormData} onChange={handlePostFormChange} onSubmit={handleSubmitPost} />

      {/* Comments Dialog */}
      <CommentsDialog
        open={openCommentsDialog}
        post={currentPost}
        onClose={handleCloseCommentsDialog}
        newComment={newComment}
        onChangeComment={setNewComment}
        onSubmitComment={handleAddComment}
        format={formatDate}
        isLoadingComments={isLoadingComments}
      />

      {/* Report Dialog */}
      <ReportDialog 
        open={openReportDialog} 
        onClose={() => setOpenReportDialog(false)} 
        onSubmit={handleReportSubmit}
        reason={reportReason}
        setReason={setReportReason}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={handleCloseSnackbar} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
