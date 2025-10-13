'use client'

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { notificationsApi } from '@/lib/api';
import styles from './AdminTopbar.module.css';

export default function AdminTopbar({ onMenuToggle }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchRecentNotifications();
    }
  }, [user]);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationsApi.getUnreadCount();
      if (response.data) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchRecentNotifications = async () => {
    try {
      const response = await notificationsApi.getNotifications();
      if (response.data) {
        setNotifications(response.data.results || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      router.push('/');
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setUnreadCount(prev => Math.max(0, prev - 1));
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleViewAllNotifications = () => {
    setShowNotifications(false);
    router.push('/admin-dashboard/notifications');
  };

  return (
    <>
      <nav className={styles.topbar}>
        <div className={styles.topbarContent}>
          <div className={styles.leftSection}>
            <button 
              className={`d-sm-none ${styles.menuToggle}`}
              onClick={onMenuToggle}
            >
              ☰
            </button>
            <div className={styles.brand}>
              {/* <h4>Whitebox E-learning</h4> */}
            </div>
          </div>
          
          <div className={styles.rightSection}>
            <div className={styles.notificationWrapper} ref={notificationRef}>
              <button 
                className={styles.notificationButton}
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>{unreadCount}</span>
                )}
              </button>
              
              {showNotifications && (
                <div className={styles.notificationDropdown}>
                  <div className={styles.notificationHeader}>
                    <h6>Notifications</h6>
                    {unreadCount > 0 && (
                      <button 
                        className={styles.markAllReadButton}
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  
                  <div className={styles.notificationList}>
                    {notifications.length === 0 ? (
                      <p className={styles.noNotifications}>No notifications</p>
                    ) : (
                      notifications.map(notification => (
                        <div 
                          key={notification.id} 
                          className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                        >
                          <div className={styles.notificationContent}>
                            <h6>{notification.title}</h6>
                            <p>{notification.message}</p>
                            <small>{new Date(notification.created_at).toLocaleDateString()}</small>
                          </div>
                          {!notification.is_read && (
                            <button 
                              className={styles.markAsReadButton}
                              onClick={() => markAsRead(notification.id)}
                              title="Mark as read"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className={styles.notificationFooter}>
                    <button 
                      className={styles.viewAllButton}
                      onClick={handleViewAllNotifications}
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className={styles.userInfo}>
              <span>Welcome, {user?.first_name} {user?.last_name}</span>
            </div>
            
            <button 
              className={styles.logoutButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    </>
  );
}