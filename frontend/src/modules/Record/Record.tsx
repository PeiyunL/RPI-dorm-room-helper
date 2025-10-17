import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Trash2, Edit3, History, Bookmark, Heart, MessageCircle, Send,
  ChevronDown, ChevronUp, MoreVertical, X, AlertCircle, Bell,
  Search, Filter, TrendingUp, BarChart2, Calendar, Clock,
  ChevronLeft, ChevronRight, Users, Eye, ArrowUp, ArrowDown,
  CheckCircle, Star, Activity
} from 'lucide-react';

// Mock PocketBase with enhanced features
const pb = {
  authStore: { model: { id: 'user123', username: 'demo_user', name: 'Demo User' } },
  collection: (name) => ({
    getList: async (page = 1, perPage = 10, options = {}) => ({ 
      items: mockData[name] || [], 
      totalItems: (mockData[name] || []).length,
      totalPages: Math.ceil((mockData[name] || []).length / perPage)
    }),
    getFullList: async () => mockData[name] || [],
    create: async (data) => ({ id: Date.now().toString(), ...data, created: new Date().toISOString() }),
    update: async (id, data) => ({ id, ...data }),
    delete: async (id) => {},
    subscribe: (callback) => {
      // Simulate real-time updates
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          callback({ action: 'create', record: generateMockNotification() });
        }
      }, 10000);
      return () => clearInterval(interval);
    }
  }),
  files: {
    getUrl: (record, filename) => `https://via.placeholder.com/150`
  }
};

// Mock data generator
const mockData = {
  notifications: [],
  posts: [],
  likes: [],
  bookmarks: [],
  comments: []
};

function generateMockNotification() {
  const types = ['like', 'comment', 'bookmark'];
  const type = types[Math.floor(Math.random() * types.length)];
  return {
    id: Date.now().toString(),
    type,
    user: 'user' + Math.floor(Math.random() * 100),
    post: 'post1',
    read: false,
    created: new Date().toISOString(),
    expand: {
      user: { name: `User ${Math.floor(Math.random() * 100)}` },
      post: { title: 'Your recent post' }
    }
  };
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
  topPost: { title: string; views: number };
  recentActivity: Array<{ date: string; count: number }>;
  categoryBreakdown: Array<{ category: string; count: number }>;
}

export default function EnhancedRecord() {
  // State management
  const [tabValue, setTabValue] = useState(0);
  const [myPosts, setMyPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Filtering and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'comments'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  
  // Refs for real-time updates
  const notificationUnsubscribe = useRef<(() => void) | null>(null);
  const postsUnsubscribe = useRef<(() => void) | null>(null);

  // Mock current user
  const currentUser = pb.authStore.model;

  // Initialize notifications and subscriptions
  useEffect(() => {
    fetchNotifications();
    setupRealtimeSubscriptions();
    fetchAnalytics();
    
    return () => {
      if (notificationUnsubscribe.current) notificationUnsubscribe.current();
      if (postsUnsubscribe.current) postsUnsubscribe.current();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const records = await pb.collection('notifications').getList(1, 20, {
        filter: `recipient = "${currentUser?.id}"`,
        sort: '-created',
        expand: 'user,post'
      });
      
      // Generate mock notifications for demo
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'like',
          user: 'user456',
          post: 'post1',
          read: false,
          created: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          expand: {
            user: { name: 'John Doe', username: 'johndoe' },
            post: { title: 'Your post about React' }
          }
        },
        {
          id: '2',
          type: 'comment',
          user: 'user789',
          post: 'post2',
          read: false,
          created: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          expand: {
            user: { name: 'Jane Smith', username: 'janesmith' },
            post: { title: 'Tutorial on TypeScript' }
          }
        },
        {
          id: '3',
          type: 'bookmark',
          user: 'user101',
          post: 'post1',
          read: true,
          created: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          expand: {
            user: { name: 'Mike Johnson', username: 'mikej' },
            post: { title: 'Your post about React' }
          }
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchAnalytics = async () => {
    // Mock analytics data
    const mockAnalytics: Analytics = {
      totalViews: 15234,
      totalLikes: 892,
      totalComments: 456,
      totalBookmarks: 234,
      engagementRate: 12.5,
      topPost: { title: 'Introduction to React Hooks', views: 3456 },
      recentActivity: [
        { date: '2024-01-15', count: 45 },
        { date: '2024-01-16', count: 62 },
        { date: '2024-01-17', count: 38 },
        { date: '2024-01-18', count: 71 },
        { date: '2024-01-19', count: 55 },
        { date: '2024-01-20', count: 89 },
        { date: '2024-01-21', count: 42 }
      ],
      categoryBreakdown: [
        { category: 'Technology', count: 15 },
        { category: 'Design', count: 8 },
        { category: 'Business', count: 12 },
        { category: 'Lifestyle', count: 6 }
      ]
    };
    setAnalytics(mockAnalytics);
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to notifications
    notificationUnsubscribe.current = pb.collection('notifications').subscribe((e) => {
      if (e.action === 'create' && e.record.recipient === currentUser?.id) {
        setNotifications(prev => [e.record as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New activity on your post!', {
            body: getNotificationMessage(e.record as Notification),
            icon: '/icon.png'
          });
        }
      }
    });

    // Subscribe to post updates for real-time like/comment counts
    postsUnsubscribe.current = pb.collection('posts').subscribe((e) => {
      if (e.action === 'update') {
        updatePostInState(e.record);
      }
    });
  };

  const getNotificationMessage = (notification: Notification) => {
    const userName = notification.expand?.user?.name || 'Someone';
    const postTitle = notification.expand?.post?.title || 'your post';
    
    switch (notification.type) {
      case 'like':
        return `${userName} liked ${postTitle}`;
      case 'comment':
        return `${userName} commented on ${postTitle}`;
      case 'bookmark':
        return `${userName} bookmarked ${postTitle}`;
      case 'follow':
        return `${userName} started following you`;
      default:
        return 'New activity on your post';
    }
  };

  const updatePostInState = (updatedPost: any) => {
    setMyPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    setBookmarkedPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
    setLikedPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await pb.collection('notifications').update(notificationId, { read: true });
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(n => 
          pb.collection('notifications').update(n.id, { read: true })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Filter and sort posts
  const getFilteredAndSortedPosts = (posts: any[]) => {
    let filtered = [...posts];
    
    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(post => post.category === filterCategory);
    }
    
    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.created).getTime() - new Date(a.created).getTime();
          break;
        case 'likes':
          comparison = (b.likes_count || 0) - (a.likes_count || 0);
          break;
        case 'comments':
          comparison = (b.comments_count || 0) - (a.comments_count || 0);
          break;
      }
      return sortOrder === 'desc' ? comparison : -comparison;
    });
    
    return filtered;
  };

  // Paginate posts
  const getPaginatedPosts = (posts: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return posts.slice(startIndex, endIndex);
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
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const NotificationPanel = () => (
    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 max-h-[500px] overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllNotificationsAsRead}
              className="text-sm hover:bg-white hover:bg-opacity-20 px-3 py-1 rounded-full transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>
      
      <div className="overflow-y-auto max-h-[400px]">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                !notification.read ? 'bg-blue-50' : ''
              }`}
              onClick={() => !notification.read && markNotificationAsRead(notification.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${
                  notification.type === 'like' ? 'bg-red-100 text-red-600' :
                  notification.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                  notification.type === 'bookmark' ? 'bg-purple-100 text-purple-600' :
                  'bg-green-100 text-green-600'
                }`}>
                  {notification.type === 'like' ? <Heart className="w-4 h-4" /> :
                   notification.type === 'comment' ? <MessageCircle className="w-4 h-4" /> :
                   notification.type === 'bookmark' ? <Bookmark className="w-4 h-4" /> :
                   <Users className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">{notification.expand?.user?.name}</span>
                    {' '}
                    {notification.type === 'like' ? 'liked' :
                     notification.type === 'comment' ? 'commented on' :
                     notification.type === 'bookmark' ? 'bookmarked' :
                     'followed you'}
                    {' '}
                    {notification.expand?.post?.title && (
                      <span className="font-medium">"{notification.expand.post.title}"</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created)}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
      
      {notifications.length > 5 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all notifications
          </button>
        </div>
      )}
    </div>
  );

  const AnalyticsPanel = () => (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-blue-600" />
          Analytics Dashboard
        </h2>
        <button
          onClick={() => setShowAnalytics(false)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Eye className="w-8 h-8 opacity-80" />
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{analytics.totalViews.toLocaleString()}</p>
            <p className="text-sm opacity-90">Total Views</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Heart className="w-8 h-8 opacity-80" />
              <ArrowUp className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{analytics.totalLikes.toLocaleString()}</p>
            <p className="text-sm opacity-90">Total Likes</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <MessageCircle className="w-8 h-8 opacity-80" />
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-3xl font-bold">{analytics.totalComments.toLocaleString()}</p>
            <p className="text-sm opacity-90">Total Comments</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-lg text-white">
            <div className="flex items-center justify-between mb-2">
              <Star className="w-8 h-8 opacity-80" />
              <span className="text-xl font-bold">{analytics.engagementRate}%</span>
            </div>
            <p className="text-3xl font-bold">{analytics.totalBookmarks}</p>
            <p className="text-sm opacity-90">Bookmarks</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="space-y-2">
            {analytics?.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{activity.date}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(activity.count / 100) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{activity.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <BarChart2 className="w-5 h-5" />
            Category Performance
          </h3>
          <div className="space-y-2">
            {analytics?.categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{category.category}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(category.count / 20) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{category.count} posts</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {analytics?.topPost && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-700">Top Performing Post</h3>
          </div>
          <p className="text-gray-800 font-medium">{analytics.topPost.title}</p>
          <p className="text-sm text-gray-600 mt-1">{analytics.topPost.views.toLocaleString()} views</p>
        </div>
      )}
    </div>
  );

  const FilterPanel = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Categories</option>
          <option value="Technology">Technology</option>
          <option value="Design">Design</option>
          <option value="Business">Business</option>
          <option value="Lifestyle">Lifestyle</option>
        </select>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'likes' | 'comments')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="likes">Sort by Likes</option>
          <option value="comments">Sort by Comments</option>
        </select>
        
        <button
          onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
        >
          {sortOrder === 'desc' ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
          {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
        </button>
      </div>
    </div>
  );

  const PaginationControls = ({ totalItems }: { totalItems: number }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return (
      <div className="flex justify-between items-center mt-6 p-4 bg-white rounded-lg shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="text-sm text-gray-600">per page</span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1 rounded-lg ${
                  currentPage === pageNum
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{' '}
          {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} results
        </div>
      </div>
    );
  };

  // Mock data for demo
  const mockPosts = [
    {
      id: 'post1',
      title: 'Introduction to React Hooks',
      content: 'React Hooks revolutionized how we write React components...',
      author: 'user123',
      category: 'Technology',
      created: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      updated: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      likes_count: 42,
      comments_count: 18,
      expand: {
        author: { id: 'user123', name: 'Demo User', username: 'demo_user' }
      }
    },
    {
      id: 'post2',
      title: 'Building Scalable APIs with Node.js',
      content: 'Learn how to build robust and scalable APIs...',
      author: 'user123',
      category: 'Technology',
      created: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      updated: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      likes_count: 35,
      comments_count: 12,
      expand: {
        author: { id: 'user123', name: 'Demo User', username: 'demo_user' }
      }
    },
    {
      id: 'post3',
      title: 'UI/UX Design Principles',
      content: 'Understanding the fundamentals of good design...',
      author: 'user123',
      category: 'Design',
      created: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      updated: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
      likes_count: 28,
      comments_count: 8,
      expand: {
        author: { id: 'user123', name: 'Demo User', username: 'demo_user' }
      }
    }
  ];

  // Get current posts based on tab
  const getCurrentPosts = () => {
    switch (tabValue) {
      case 0:
        return mockPosts; // My Posts
      case 1:
        return mockPosts.slice(0, 2); // Bookmarked Posts (mock subset)
      case 2:
        return mockPosts.slice(1, 3); // Liked Posts (mock subset)
      default:
        return [];
    }
  };

  const filteredPosts = getFilteredAndSortedPosts(getCurrentPosts());
  const paginatedPosts = getPaginatedPosts(filteredPosts);

  const PostCard = ({ post }: { post: any }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 mb-4 overflow-hidden">
      <div className="p-6">
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
            {post.category || 'General'}
          </span>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-500 font-medium">
              {formatDate(post.created)}
            </span>
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 mb-3">{post.title}</h2>
        
        <div className="flex items-center mb-3">
          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium mr-2">
            {post.expand?.author?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <span className="text-sm text-gray-600 font-medium">
            {post.expand?.author?.name || 'Unknown User'}
          </span>
        </div>
        
        <p className="text-gray-700 mb-4 leading-relaxed line-clamp-3">{post.content}</p>
      </div>
      
      <div className="border-t border-gray-200" />
      
      <div className="px-6 py-3 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 text-gray-600">
            <Heart className="w-5 h-5" />
            <span className="text-sm font-medium">{post.likes_count || 0}</span>
          </button>
          
          <button className="flex items-center gap-1 p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">{post.comments_count || 0}</span>
          </button>
          
          <button className="p-2 rounded-full hover:bg-gray-100 transition-transform hover:scale-110 text-gray-600">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
        
        {currentUser?.id === post.author && (
          <div className="flex gap-1">
            <button className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-transform hover:scale-110">
              <Edit3 className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-full hover:bg-red-50 text-red-600 transition-transform hover:scale-110">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Header with Notifications */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <History className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-3xl md:text-4xl font-bold text-blue-600">My Record</h1>
            </div>
            <div className="flex items-center gap-3">
              {/* Analytics Button */}
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 relative"
                title="View Analytics"
              >
                <BarChart2 className="w-6 h-6 text-blue-600" />
              </button>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105"
                title="Toggle Filters"
              >
                <Filter className="w-6 h-6 text-gray-600" />
              </button>
              
              {/* Notifications Bell */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 relative"
                >
                  <Bell className="w-6 h-6 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                {showNotifications && <NotificationPanel />}
              </div>
            </div>
          </div>
          <p className="text-gray-600">Manage your posts, bookmarks, and activity</p>
        </div>

        {/* Analytics Panel */}
        {showAnalytics && <AnalyticsPanel />}

        {/* Filter Panel */}
        {showFilters && <FilterPanel />}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6 overflow-hidden">
          <div className="flex">
            {['My Posts', 'Bookmarks', 'Liked'].map((tab, index) => (
              <button
                key={tab}
                onClick={() => {
                  setTabValue(index);
                  setCurrentPage(1);
                }}
                className={`flex-1 py-3 px-4 font-semibold text-sm md:text-base transition-all relative ${
                  tabValue === index
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {index === 0 && <Edit3 className="w-4 h-4" />}
                  {index === 1 && <Bookmark className="w-4 h-4" />}
                  {index === 2 && <Heart className="w-4 h-4" />}
                  {tab}
                </span>
                {tabValue === index && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white opacity-50" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{getCurrentPosts().length}</p>
              <p className="text-sm text-gray-600">Total Posts</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {getCurrentPosts().reduce((acc, post) => acc + (post.likes_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Total Likes</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {getCurrentPosts().reduce((acc, post) => acc + (post.comments_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Comments</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">+12%</p>
              <p className="text-sm text-gray-600">Engagement</p>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {tabValue === 0 ? 'Your Posts' : tabValue === 1 ? 'Bookmarked Posts' : 'Liked Posts'} 
                {' '}({filteredPosts.length} {filteredPosts.length === 1 ? 'result' : 'results'})
              </h2>
            </div>
            
            {paginatedPosts.length > 0 ? (
              <>
                <div>
                  {paginatedPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
                <PaginationControls totalItems={filteredPosts.length} />
              </>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                {searchQuery || filterCategory !== 'all' ? (
                  <>
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No results found</h3>
                    <p className="text-gray-500">Try adjusting your filters or search query</p>
                  </>
                ) : (
                  <>
                    {tabValue === 0 ? <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" /> :
                     tabValue === 1 ? <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" /> :
                     <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />}
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      {tabValue === 0 ? 'No posts yet' : 
                       tabValue === 1 ? 'No bookmarks yet' : 
                       'No liked posts yet'}
                    </h3>
                    <p className="text-gray-500">
                      {tabValue === 0 ? 'Create your first post to get started!' :
                       tabValue === 1 ? 'Save posts you want to read later!' :
                       'Start liking posts you enjoy!'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}