// @ts-nocheck
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import filter from "leo-profanity";
import pb from "../../lib/pocketbase";

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
  CardMedia,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";

import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Sort as SortIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  Article as ArticleIcon,
  AccessTime as TimeIcon,
  Category as CategoryIcon,
  Title as TitleIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Send as SendIcon,
} from "@mui/icons-material";

filter.add(["Israel", "Palestine"]);

const POSTS_COLLECTION = "posts";
const LIKES_COLLECTION = "likes";
const FAVORITES_COLLECTION = "favorites";
const NOTIFICATIONS_COLLECTION = "notifications";
const COMMENTS_COLLECTION = "comments";

const CATEGORIES = [
  "Roommate Search",
  "Furniture Exchange",
  "Dorm Tips",
  "Events",
  "Lost & Found",
  "Housing Questions",
  "General",
];

// Types (kept simple)
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

interface PostFormData {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

interface Notification {
  id: string;
  type: "like" | "comment" | "bookmark" | "follow";
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

interface CommentItem {
  id: string;
  content: string;
  created: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
}

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
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
    <div role="tabpanel" hidden={value !== index} {...other}>
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

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("-created");
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);

  // Create post dialog
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [postFormData, setPostFormData] = useState<PostFormData>({
    title: "",
    content: "",
    category: "",
    imageUrl: "",
  });
  const [creatingPost, setCreatingPost] = useState(false);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  // Post detail / comments / edit
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailPost, setDetailPost] = useState<Post | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailComments, setDetailComments] = useState<CommentItem[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState<PostFormData>({ title: "", content: "", category: "" });

  const currentUser = pb.authStore.model;

  const sortOptions: SortOption[] = [
    { value: "-created", label: "Newest First", icon: <TimeIcon /> },
    { value: "created", label: "Oldest First", icon: <TimeIcon /> },
    { value: "-likes", label: "Most Liked", icon: <TrendingIcon /> },
    { value: "title", label: "Title (A-Z)", icon: <TitleIcon /> },
    { value: "category", label: "Category", icon: <CategoryIcon /> },
  ];

  // Helpers
  const showSnackbarMsg = useCallback(
    (message: string, severity: "success" | "error" | "info" | "warning" = "success") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  const getAvatarUrl = (user: any): string => {
    if (!user?.avatar) return "";
    try {
      return pb.files.getUrl(user, user.avatar, { thumb: "100x100" });
    } catch {
      return "";
    }
  };

  const getPostImageUrl = (post: any): string => {
    if (post?.links) return post.links;
    if (!post?.image) return "";
    try {
      return pb.files.getUrl(post, post.image, { thumb: "600x400" });
    } catch {
      return "";
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const makeKey = (userId: string, postId: string) => `${userId}_${postId}`;

  const safeBumpPostLikes = async (postId: string, delta: number) => {
    // This only works if your posts collection has a numeric "likes" field.
    // If you removed it, this will fail silently (which is fine).
    try {
      const rec = await pb.collection(POSTS_COLLECTION).getOne(postId, { fields: "likes" });
      const current = Number(rec.likes || 0);
      await pb.collection(POSTS_COLLECTION).update(postId, { likes: Math.max(0, current + delta) });
    } catch {
      // ignore
    }
  };

  const safeBumpPostComments = async (postId: string, delta: number) => {
    // Try both common field names: commentsCount and comments
    const tryField = async (field: string) => {
      const rec = await pb.collection(POSTS_COLLECTION).getOne(postId, { fields: field });
      const current = Number((rec as any)[field] || 0);
      await pb.collection(POSTS_COLLECTION).update(postId, { [field]: Math.max(0, current + delta) });
    };
    try {
      await tryField("commentsCount");
    } catch {
      try {
        await tryField("comments");
      } catch {
        // ignore
      }
    }
  };

  // Fetch data
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const user = pb.authStore.model;
      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch user's posts
      const userPosts = await pb.collection(POSTS_COLLECTION).getFullList({
        filter: `author = "${user.id}"`,
        sort: "-created",
        expand: "author",
      });

      // Favorites
      const favorites = await pb.collection(FAVORITES_COLLECTION).getFullList({
        filter: `user = "${user.id}"`,
        expand: "post,post.author",
      });

      // Likes
      const likes = await pb.collection(LIKES_COLLECTION).getFullList({
        filter: `user = "${user.id}"`,
        expand: "post,post.author",
      });

      const likedSet = new Set(likes.map((l: any) => l?.post).filter(Boolean));
      const favSet = new Set(favorites.map((f: any) => f?.post).filter(Boolean));

      const formatPost = (post: any): Post => {
        if (!post) return null as any;
        const author = post.expand?.author;
        return {
          id: post.id,
          title: post.title || "Untitled",
          content: post.content || "",
          authorId: post.author || "",
          authorName: author?.name || author?.username || "Unknown",
          authorAvatar: author ? getAvatarUrl(author) : "",
          category: post.category || "General",
          createdAt: post.created || post.createdAt || post.created_at || "",
          imageUrl: getPostImageUrl(post),
          likes: Number(post.likes || 0),
          comments: Number(post.commentsCount ?? post.comments ?? 0),
          isLikedByUser: likedSet.has(post.id),
          isBookmarkedByUser: favSet.has(post.id),
        };
      };

      const my = userPosts.map((p: any) => formatPost(p)).filter(Boolean);

      const favPosts = favorites
        .map((f: any) => f.expand?.post)
        .map((p: any) => {
          if (!p) return null;
          // ensure flags reflect the sets
          const fp = formatPost(p);
          fp.isBookmarkedByUser = true;
          fp.isLikedByUser = likedSet.has(fp.id);
          return fp;
        })
        .filter(Boolean);

      const likedPostsList = likes
        .map((l: any) => l.expand?.post)
        .map((p: any) => {
          if (!p) return null;
          const lp = formatPost(p);
          lp.isLikedByUser = true;
          lp.isBookmarkedByUser = favSet.has(lp.id);
          return lp;
        })
        .filter(Boolean);

      setMyPosts(my);
      setBookmarkedPosts(favPosts);
      setLikedPosts(likedPostsList);

      // Analytics (simple)
      const totalLikes = my.reduce((sum, p) => sum + (p.likes || 0), 0);
      const totalComments = my.reduce((sum, p) => sum + (p.comments || 0), 0);

      setAnalytics({
        totalViews: my.length * 42, // mock
        totalLikes,
        totalComments,
        totalBookmarks: favPosts.length,
        engagementRate: my.length > 0 ? Number(((totalLikes + totalComments) / my.length).toFixed(1)) : 0,
      });
    } catch (err: any) {
      console.error("Error fetching posts:", err);
      showSnackbarMsg(`Failed to load posts: ${err?.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  }, [navigate, showSnackbarMsg]);

  const fetchNotifications = useCallback(async () => {
    try {
      const user = pb.authStore.model;
      if (!user) return;

      const records = await pb.collection(NOTIFICATIONS_COLLECTION).getList(1, 20, {
        filter: `recipient = "${user.id}"`,
        sort: "-created",
        expand: "user,post",
      });

      setNotifications(records.items as any);
      setUnreadCount(records.items.filter((n: any) => !n.read).length);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    fetchNotifications();
  }, [fetchPosts, fetchNotifications]);

  // Filter + sort displayed list
  useEffect(() => {
    let posts: Post[] = [];
    if (activeTab === 0) posts = myPosts;
    else if (activeTab === 1) posts = bookmarkedPosts;
    else posts = likedPosts;

    let filtered = [...posts];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.content.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "-created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "created":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "-likes":
          return (b.likes || 0) - (a.likes || 0);
        case "title":
          return a.title.localeCompare(b.title);
        case "category":
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setDisplayedPosts(filtered);
  }, [myPosts, bookmarkedPosts, likedPosts, activeTab, searchQuery, sortBy]);

  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchQuery("");
  };

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => setSortAnchorEl(event.currentTarget);
  const handleSortClose = () => setSortAnchorEl(null);
  const handleSortSelect = (value: string) => {
    setSortBy(value);
    handleSortClose();
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => setNotificationAnchorEl(event.currentTarget);
  const handleNotificationClose = () => setNotificationAnchorEl(null);

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await pb.collection(NOTIFICATIONS_COLLECTION).update(notificationId, { read: true });
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Error marking notification as read:", err);
    }
  };

  const isOwner = (p: Post | null) => {
    const u = pb.authStore.model;
    if (!u || !p) return false;
    // Only allow editing from the "My Posts" tab
    return activeTab === 0 && u.id === p.authorId;
  };

  const patchPostLocally = (postId: string, patch: Partial<Post>) => {
    const apply = (arr: Post[]) => arr.map((p) => (p.id === postId ? { ...p, ...patch } : p));
    setMyPosts(apply);
    setBookmarkedPosts(apply);
    setLikedPosts(apply);
    setDisplayedPosts((prev) => apply(prev));
  };

  const fetchCommentsForPost = async (postId: string) => {
    setDetailLoading(true);
    try {
      const items = await pb.collection(COMMENTS_COLLECTION).getFullList({
        filter: `post = "${postId}"`,
        sort: "created",
        expand: "author",
      });

      const formatted: CommentItem[] = items.map((c: any) => {
        const a = c.expand?.author;
        return {
          id: c.id,
          content: c.content || "",
          created: c.created || "",
          authorId: c.author || "",
          authorName: a?.name || a?.username || "Unknown",
          authorAvatar: a ? getAvatarUrl(a) : "",
        };
      });

      setDetailComments(formatted);
    } catch (err: any) {
      console.error("fetchCommentsForPost error:", err);
      showSnackbarMsg(`Failed to load comments: ${err?.message || err}`, "error");
      setDetailComments([]);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewPost = async (postOrId: any) => {
    const p: Post | null = typeof postOrId === "string" ? displayedPosts.find((x) => x.id === postOrId) || null : postOrId;
    if (!p) return;

    setDetailPost(p);
    setNewComment("");
    setEditMode(false);
    setEditForm({ title: p.title, content: p.content, category: p.category });
    setDetailOpen(true);

    await fetchCommentsForPost(p.id);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    setDetailPost(null);
    setDetailComments([]);
    setNewComment("");
    setEditMode(false);
    setEditForm({ title: "", content: "", category: "" });
  };

  const handleSubmitComment = async () => {
    const u = pb.authStore.model;
    if (!u) return navigate("/login");
    if (!detailPost) return;
    const content = newComment.trim();
    if (!content) return;

    setPostingComment(true);
    try {
      await pb.collection(COMMENTS_COLLECTION).create({
        post: detailPost.id,
        author: u.id,
        content,
      });

      setNewComment("");
      patchPostLocally(detailPost.id, { comments: (detailPost.comments || 0) + 1 });
      await safeBumpPostComments(detailPost.id, +1).catch(() => {});
      await fetchCommentsForPost(detailPost.id);
      showSnackbarMsg("Comment posted", "success");
    } catch (err: any) {
      console.error("handleSubmitComment error:", err);
      showSnackbarMsg(`Failed to post comment: ${err?.message || err}`, "error");
    } finally {
      setPostingComment(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!detailPost) return;
    if (!isOwner(detailPost)) return;

    const title = editForm.title?.trim();
    const content = editForm.content?.trim();
    const category = editForm.category?.trim();
    if (!title || !content || !category) {
      showSnackbarMsg("Please fill in title, category, and content", "error");
      return;
    }

    setEditSaving(true);
    try {
      await pb.collection(POSTS_COLLECTION).update(detailPost.id, { title, content, category });
      const updated = { ...detailPost, title, content, category };
      setDetailPost(updated);
      patchPostLocally(detailPost.id, { title, content, category });
      setEditMode(false);
      showSnackbarMsg("Post updated", "success");
    } catch (err: any) {
      console.error("handleSaveEdit error:", err);
      showSnackbarMsg(`Failed to update post: ${err?.message || err}`, "error");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await pb.collection(POSTS_COLLECTION).delete(postId);
      setMyPosts((prev) => prev.filter((p) => p.id !== postId));
      showSnackbarMsg("Post deleted successfully", "success");
      // also refresh other lists
      fetchPosts();
    } catch (err: any) {
      showSnackbarMsg(`Failed to delete post: ${err?.message || err}`, "error");
    }
  };

  // Like toggle
  const toggleLike = async (post: Post) => {
    const user = pb.authStore.model;
    if (!user) return navigate("/login");

    const already = post.isLikedByUser;
    const key = makeKey(user.id, post.id);

    // optimistic UI update
    const applyLocal = (deltaLikeFlag: boolean, deltaCount: number) => {
      const patch = (arr: Post[]) =>
        arr.map((p) =>
          p.id === post.id
            ? { ...p, isLikedByUser: deltaLikeFlag, likes: Math.max(0, (p.likes || 0) + deltaCount) }
            : p
        );
      setMyPosts(patch);
      setBookmarkedPosts(patch);
      setLikedPosts((prev) => {
        // if unliking, remove from liked tab list
        if (already) return prev.filter((p) => p.id !== post.id);
        // if liking, ensure it exists in liked tab list
        const exists = prev.some((p) => p.id === post.id);
        if (exists) return patch(prev);
        return [{ ...post, isLikedByUser: true, likes: (post.likes || 0) + 1 }, ...prev];
      });
    };

    try {
      if (!already) {
        await pb.collection(LIKES_COLLECTION).create({ user: user.id, post: post.id, key });
        applyLocal(true, 1);
        await safeBumpPostLikes(post.id, +1).catch(() => {});
      } else {
        // delete like by key (recommended) or query
        const list = await pb.collection(LIKES_COLLECTION).getList(1, 1, { filter: `key = "${key}"` });
        if (list.items.length) {
          await pb.collection(LIKES_COLLECTION).delete(list.items[0].id);
        }
        applyLocal(false, -1);
        await safeBumpPostLikes(post.id, -1).catch(() => {});
      }
    } catch (err: any) {
      console.error("toggleLike error:", err);
      showSnackbarMsg(`Failed to update like: ${err?.message || err}`, "error");
      // fallback refresh to sync
      fetchPosts();
    }
  };

  // Bookmark toggle (favorites)
  const toggleBookmark = async (post: Post) => {
    const user = pb.authStore.model;
    if (!user) return navigate("/login");

    const already = post.isBookmarkedByUser;
    const key = makeKey(user.id, post.id);

    const patchBookmark = (flag: boolean) => {
      const patch = (arr: Post[]) => arr.map((p) => (p.id === post.id ? { ...p, isBookmarkedByUser: flag } : p));
      setMyPosts(patch);
      setLikedPosts(patch);
      setBookmarkedPosts((prev) => {
        if (flag) {
          const exists = prev.some((p) => p.id === post.id);
          if (exists) return patch(prev);
          return [{ ...post, isBookmarkedByUser: true }, ...prev];
        } else {
          return prev.filter((p) => p.id !== post.id);
        }
      });
    };

    try {
      if (!already) {
        await pb.collection(FAVORITES_COLLECTION).create({ user: user.id, post: post.id, key });
        patchBookmark(true);
      } else {
        const list = await pb.collection(FAVORITES_COLLECTION).getList(1, 1, { filter: `key = "${key}"` });
        if (list.items.length) {
          await pb.collection(FAVORITES_COLLECTION).delete(list.items[0].id);
        }
        patchBookmark(false);
      }
    } catch (err: any) {
      console.error("toggleBookmark error:", err);
      showSnackbarMsg(`Failed to update bookmark: ${err?.message || err}`, "error");
      fetchPosts();
    }
  };

  // Create post handlers
  const handleOpenCreatePost = () => {
    setPostFormData({ title: "", content: "", category: "", imageUrl: "" });
    setCreatePostOpen(true);
  };

  const handleCloseCreatePost = () => {
    setCreatePostOpen(false);
    setPostFormData({ title: "", content: "", category: "", imageUrl: "" });
  };

  const handlePostFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target as any;
    if (!name) return;
    setPostFormData((prev) => ({ ...prev, [name]: value as string }));
  };

  const handleSubmitPost = async () => {
    if (!postFormData.title || !postFormData.content || !postFormData.category) {
      showSnackbarMsg("Please fill in all required fields", "error");
      return;
    }

    const user = pb.authStore.model;
    if (!user) {
      showSnackbarMsg("You must be logged in to create a post", "error");
      return;
    }

    if (filter.check(postFormData.title) || filter.check(postFormData.content)) {
      showSnackbarMsg("Inappropriate language detected. Please keep it RPI-friendly!", "warning");
      return;
    }

    setCreatingPost(true);
    try {
      await pb.collection(POSTS_COLLECTION).create({
        title: postFormData.title,
        content: postFormData.content,
        category: postFormData.category,
        links: postFormData.imageUrl || "",
        author: user.id,
        likes: 0,
        commentsCount: 0,
      });

      await fetchPosts();
      await fetchNotifications();

      handleCloseCreatePost();
      showSnackbarMsg("Post created successfully!", "success");
      setActiveTab(0);
    } catch (err: any) {
      console.error("Error creating post:", err);
      showSnackbarMsg(`Failed to create post: ${err?.message || err}`, "error");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const getCurrentSortLabel = () => sortOptions.find((o) => o.value === sortBy)?.label || "Sort";

  const getTabLabel = () => {
    if (activeTab === 0) return "Your Posts";
    if (activeTab === 1) return "Bookmarked Posts";
    return "Liked Posts";
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: "bold", color: "#1976d2", display: "flex", alignItems: "center" }}>
            <ArticleIcon sx={{ mr: 1 }} />
            My Record
          </Typography>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreatePost} sx={{ display: { xs: "none", sm: "flex" } }}>
              Create Post
            </Button>
            <IconButton onClick={handleOpenCreatePost} color="primary" sx={{ display: { xs: "flex", sm: "none" } }}>
              <AddIcon />
            </IconButton>

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
          <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BarChartIcon /> Analytics Overview
          </Typography>

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "primary.light", color: "primary.contrastText", textAlign: "center" }}>
                <VisibilityIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {analytics.totalViews}
                </Typography>
                <Typography variant="caption">Total Views</Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "error.light", color: "error.contrastText", textAlign: "center" }}>
                <FavoriteIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {analytics.totalLikes}
                </Typography>
                <Typography variant="caption">Total Likes</Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "success.light", color: "success.contrastText", textAlign: "center" }}>
                <CommentIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {analytics.totalComments}
                </Typography>
                <Typography variant="caption">Comments</Typography>
              </Paper>
            </Grid>

            <Grid item xs={6} sm={3}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: "secondary.light", color: "secondary.contrastText", textAlign: "center" }}>
                <BookmarkIcon sx={{ fontSize: 32, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  {analytics.totalBookmarks}
                </Typography>
                <Typography variant="caption">Bookmarks</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Tabs */}
      <Paper elevation={2} sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label={`My Posts (${myPosts.length})`} icon={<ArticleIcon />} iconPosition="start" />
          <Tab label={`Bookmarks (${bookmarkedPosts.length})`} icon={<BookmarkIcon />} iconPosition="start" />
          <Tab label={`Liked (${likedPosts.length})`} icon={<FavoriteIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Search + Sort */}
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
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} sm={4} md={3}>
            <Button fullWidth variant="outlined" startIcon={<SortIcon />} onClick={handleSortClick} sx={{ height: "40px" }}>
              {getCurrentSortLabel()}
            </Button>

            <Menu anchorEl={sortAnchorEl} open={Boolean(sortAnchorEl)} onClose={handleSortClose}>
              {sortOptions.map((option) => (
                <MenuItem key={option.value} selected={sortBy === option.value} onClick={() => handleSortSelect(option.value)}>
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
              <Card elevation={2} sx={{ transition: "all 0.3s", "&:hover": { transform: "translateY(-4px)", boxShadow: 6 } }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                    <Chip label={post.category} size="small" color="primary" variant="outlined" />
                    <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <TimeIcon sx={{ fontSize: 16 }} />
                      {formatDate(post.createdAt)}
                    </Typography>
                  </Box>

                  <Typography
                    variant="h5"
                    component="h2"
                    gutterBottom
                    sx={{ cursor: "pointer", fontWeight: 600, "&:hover": { color: "primary.main" } }}
                    onClick={() => handleViewPost(post)}
                  >
                    {post.title}
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Avatar sx={{ width: 32, height: 32, mr: 1 }} src={post.authorAvatar}>
                      {(post.authorName || "U").charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {post.authorName}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      maxHeight: 160,
                      overflowY: "auto",
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: "action.hover",
                      color: "text.secondary",
                      whiteSpace: "pre-wrap",
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      lineHeight: 1.7,
                    }}
                  >
                    <Typography variant="body1">{post.content}</Typography>
                  </Box>


                  {post.imageUrl && (
                    <CardMedia
                      component="img"
                      height="200"
                      image={post.imageUrl}
                      alt={post.title}
                      sx={{ borderRadius: 2, mb: 2, cursor: "pointer" }}
                      onClick={() => handleViewPost(post)}
                    />
                  )}
                </CardContent>

                <Divider />

                <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <IconButton onClick={() => toggleLike(post)} color={post.isLikedByUser ? "error" : "default"}>
                      {post.isLikedByUser ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 28 }}>
                      {post.likes}
                    </Typography>

                    <IconButton disabled>
                      <CommentIcon />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary" sx={{ minWidth: 28 }}>
                      {post.comments}
                    </Typography>

                    <IconButton onClick={() => toggleBookmark(post)} color={post.isBookmarkedByUser ? "primary" : "default"}>
                      {post.isBookmarkedByUser ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    </IconButton>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => handleViewPost(post)}>
                      View
                    </Button>

                    {activeTab === 0 && currentUser?.id === post.authorId && (
                      <IconButton size="small" color="error" onClick={() => handleDeletePost(post.id)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Paper elevation={0} sx={{ p: 8, textAlign: "center", bgcolor: "background.default", borderRadius: 2 }}>
          <ArticleIcon sx={{ fontSize: 80, color: "text.disabled", mb: 2 }} />
          <Typography variant="h5" color="text.secondary" gutterBottom fontWeight={600}>
            {searchQuery ? "No posts found" : `No ${getTabLabel().toLowerCase()} yet`}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery
              ? `No posts match "${searchQuery}".`
              : activeTab === 0
              ? "Create your first post to get started!"
              : activeTab === 1
              ? "Save posts you want to read later!"
              : "Start liking posts you enjoy!"}
          </Typography>

          {!searchQuery && activeTab === 0 && (
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreatePost}>
              Create Post
            </Button>
          )}
        </Paper>
      )}

      {/* Post Detail Dialog (view + comment + edit for your own posts) */}
      <Dialog open={detailOpen} onClose={handleCloseDetail} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {detailPost?.title || "Post"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {detailPost?.category ? `${detailPost.category} • ` : ""}
              {detailPost?.createdAt ? formatDate(detailPost.createdAt) : ""}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {isOwner(detailPost) && !editMode && (
              <IconButton onClick={() => setEditMode(true)} size="small" aria-label="Edit post">
                <EditIcon />
              </IconButton>
            )}
            <IconButton onClick={handleCloseDetail} size="small" aria-label="Close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* Author row */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
            <Avatar sx={{ width: 32, height: 32 }} src={detailPost?.authorAvatar}>
              {(detailPost?.authorName || "U").charAt(0).toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              {detailPost?.authorName || "Unknown"}
            </Typography>
          </Box>

          {/* Post content (view or edit) */}
          {!editMode ? (
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: "action.hover",
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                wordBreak: "break-word",
                lineHeight: 1.7,
                mb: 3,
              }}
            >
              <Typography variant="body1">{detailPost?.content || ""}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
              <TextField
                label="Title"
                value={editForm.title}
                onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                fullWidth
              />

              <FormControl fullWidth>
                <InputLabel id="edit-category-label">Category</InputLabel>
                <Select
                  labelId="edit-category-label"
                  value={editForm.category}
                  label="Category"
                  onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value as string }))}
                >
                  {CATEGORIES.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Content"
                value={editForm.content}
                onChange={(e) => setEditForm((prev) => ({ ...prev, content: e.target.value }))}
                fullWidth
                multiline
                minRows={5}
              />
            </Box>
          )}

          {/* Comments */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            Comments ({detailComments.length})
          </Typography>

          {detailLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={22} />
            </Box>
          ) : detailComments.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              No comments yet. Be the first to comment!
            </Typography>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mb: 2 }}>
              {detailComments.map((c) => (
                <Paper key={c.id} variant="outlined" sx={{ p: 1.5, borderRadius: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                      <Avatar sx={{ width: 28, height: 28 }} src={c.authorAvatar}>
                        {(c.authorName || "U").charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" fontWeight={700} sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.authorName}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {c.created ? formatDate(c.created) : ""}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                    {c.content}
                  </Typography>
                </Paper>
              ))}
            </Box>
          )}

          {/* Add comment */}
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
            Add a comment
          </Typography>
          <TextField
            fullWidth
            placeholder="What are your thoughts?"
            multiline
            minRows={3}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button
              onClick={handleSubmitComment}
              variant="contained"
              startIcon={postingComment ? <CircularProgress size={18} /> : <SendIcon />}
              disabled={postingComment || !newComment.trim()}
            >
              {postingComment ? "Posting..." : "Post Comment"}
            </Button>
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: "space-between" }}>
          <Button onClick={handleCloseDetail}>Close</Button>
          {isOwner(detailPost) && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {editMode ? (
                <>
                  <Button onClick={() => { setEditMode(false); if (detailPost) setEditForm({ title: detailPost.title, content: detailPost.content, category: detailPost.category }); }}>
                    Cancel Edit
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    variant="contained"
                    startIcon={editSaving ? <CircularProgress size={18} /> : <SaveIcon />}
                    disabled={editSaving}
                  >
                    {editSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : null}
            </Box>
          )}
        </DialogActions>
      </Dialog>

      {/* Create Post Dialog */}
      <Dialog open={createPostOpen} onClose={handleCloseCreatePost} maxWidth="md" fullWidth>
        <DialogTitle>Create New Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="title"
            label="Title"
            type="text"
            fullWidth
            variant="outlined"
            value={postFormData.title}
            onChange={handlePostFormChange}
            sx={{ mb: 2 }}
            required
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="category-label">Category</InputLabel>
            <Select
              labelId="category-label"
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
            name="content"
            label="Content"
            multiline
            minRows={4}
            maxRows={10}
            fullWidth
            variant="outlined"
            value={postFormData.content}
            onChange={handlePostFormChange}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="imageUrl"
            label="Image URL (optional)"
            type="text"
            fullWidth
            variant="outlined"
            value={postFormData.imageUrl || ""}
            onChange={handlePostFormChange}
            helperText="Enter a URL for an image to include with your post"
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseCreatePost} disabled={creatingPost}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitPost}
            variant="contained"
            startIcon={creatingPost ? <CircularProgress size={18} /> : <SendIcon />}
            disabled={creatingPost}
          >
            {creatingPost ? "Posting..." : "Post"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{ sx: { width: 360, maxHeight: 460 } }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Notifications
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {unreadCount} unread
          </Typography>
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet.
            </Typography>
          </Box>
        ) : (
          notifications.map((n) => (
            <MenuItem
              key={n.id}
              onClick={() => {
                if (!n.read) markNotificationAsRead(n.id);
                handleNotificationClose();
              }}
              sx={{
                alignItems: "flex-start",
                whiteSpace: "normal",
                bgcolor: n.read ? "transparent" : "action.hover",
              }}
            >
              <ListItemIcon sx={{ mt: 0.5 }}>
                <NotificationsIcon fontSize="small" />
              </ListItemIcon>

              <ListItemText
                primary={
                  <Typography variant="body2" fontWeight={n.read ? 400 : 700}>
                    {n.expand?.user?.name || n.expand?.user?.username || "Someone"}{" "}
                    {n.type === "like"
                      ? "liked"
                      : n.type === "bookmark"
                      ? "bookmarked"
                      : n.type === "comment"
                      ? "commented on"
                      : "interacted with"}{" "}
                    your post
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    {n.expand?.post?.title ? `"${n.expand.post.title}" • ` : ""}
                    {formatDate(n.created)}
                  </Typography>
                }
              />
            </MenuItem>
          ))
        )}
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
