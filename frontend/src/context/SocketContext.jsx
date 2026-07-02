import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await notificationAPI.getAll();
      if (data.success) {
        setNotifications(data.data);
        setUnreadCount(data.data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err.message);
    }
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Resolve socket URL
    const apiUrl = import.meta.env.VITE_API_URL || '';
    let socketUrl = window.location.origin;
    if (apiUrl) {
      try {
        const url = new URL(apiUrl);
        socketUrl = url.origin;
      } catch {
        socketUrl = apiUrl.replace(/\/api$/, '');
      }
    }

    console.log(`🔌 Connecting to socket server: ${socketUrl}`);
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server');
      // Register user and role
      newSocket.emit('register', {
        userId: user.id || user._id,
        role: user.role
      });
    });

    newSocket.on('notification:new', (notification) => {
      console.log('📡 Received real-time notification:', notification);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Trigger custom premium toast
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-in fade-in slide-in-from-top-4' : 'animate-out fade-out slide-out-to-top-4'
          } max-w-md w-full bg-white shadow-[0_12px_40px_-6px_rgba(13,43,107,0.15)] rounded-2xl pointer-events-auto flex ring-1 ring-black/5 p-4 border border-blue-50/50`}
        >
          <div className="flex-1 w-0">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                  <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-[#0D2B6B] font-poppins">
                  {notification.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 font-semibold leading-relaxed">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
          <div className="ml-4 flex-shrink-0 flex items-start border-l border-slate-100 pl-4 my-auto">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-lg p-1 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors uppercase tracking-wider"
            >
              Close
            </button>
          </div>
        </div>
      ), { duration: 6000 });
    });

    setSocket(newSocket);
    fetchNotifications();

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const markAsRead = async (id) => {
    try {
      const { data } = await notificationAPI.markAsRead(id);
      if (data.success) {
        setNotifications(prev =>
          prev.map(n => n._id === id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data } = await notificationAPI.markAllAsRead();
      if (data.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err.message);
    }
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications: fetchNotifications }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
