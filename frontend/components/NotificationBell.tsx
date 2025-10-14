'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { notificationsApi, Notification } from '@/lib/api'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchData = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [notificationsResponse, countResponse] = await Promise.all([
        notificationsApi.getNotifications(),
        notificationsApi.getUnreadCount()
      ])
      
      if (notificationsResponse.data) {
        setNotifications(notificationsResponse.data.results || [])
      }
      
      if (countResponse.data) {
        setUnreadCount(countResponse.data.unread_count)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchData()
    
    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      // Optimistically update UI
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      fetchData() // Refresh data on error
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      fetchData() // Refresh data on error
    }
  }

  return (
    <div className="dropdown position-static">
      <button 
        className="btn btn-link position-relative p-1 p-md-2"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) fetchData() // Refresh when opening
        }}
        disabled={loading}
        aria-label="Notifications"
      >
        <i className="bi bi-bell fs-5"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{fontSize: '0.6rem'}}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div 
          className="dropdown-menu show position-absolute" 
          style={{
            width: 'min(95vw, 350px)', 
            right: '10px', 
            left: 'auto',
            top: '100%',
            zIndex: 1050,
            maxHeight: '80vh',
            overflow: 'hidden'
          }}
        >
          <div className="d-flex justify-content-between align-items-center p-2 border-bottom">
            <h6 className="mb-0 small">Notifications</h6>
            {unreadCount > 0 && (
              <button 
                className="btn btn-sm btn-link p-1 small" 
                onClick={markAllAsRead}
                disabled={loading}
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="notification-list" style={{maxHeight: '50vh', overflowY: 'auto'}}>
            {loading ? (
              <div className="p-3 text-center">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-3 text-center text-muted small">
                No notifications
              </div>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-2 border-bottom ${!notification.is_read ? 'bg-light' : ''}`}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <h6 className="mb-1 small" style={{lineHeight: '1.2'}}>{notification.title}</h6>
                    <small className="text-muted ms-2 flex-shrink-0">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </small>
                  </div>
                  <p className="mb-1 small" style={{lineHeight: '1.2'}}>{notification.message}</p>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    {notification.action_url && (
                      <a
                        href={notification.action_url.replace('/api/courses', '/dashboard/learn')}
                        className="btn btn-sm btn-outline-danger py-0 small"
                        onClick={() => setIsOpen(false)}
                        style={{fontSize: '0.7rem'}}
                      >
                        View
                      </a>
                    )}
                    {!notification.is_read && (
                      <button 
                        className="btn btn-sm btn-link p-0 small text-muted"
                        onClick={() => markAsRead(notification.id)}
                        disabled={loading}
                        style={{fontSize: '0.7rem'}}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-top">
            <a 
              href="/dashboard/notifications" 
              className="btn btn-sm btn-outline-secondary w-100 py-1 small"
              onClick={() => setIsOpen(false)}
            >
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  )
}