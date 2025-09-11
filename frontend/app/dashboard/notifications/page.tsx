'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import LearnerSidebar from '@/components/LearnerSidebar'
import TopNavbar from '@/components/TopNavbar'
import { notificationsApi, Notification } from '@/lib/api'
import { Menu } from 'lucide-react'

export default function NotificationsPage() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [user])

  const fetchNotifications = async () => {
    try {
      setRefreshing(true)
      const response = await notificationsApi.getNotifications()
      if (response.data) {
        setNotifications(response.data.results || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId)
      // Optimistically update UI
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ))
    } catch (error) {
      console.error('Error marking notification as read:', error)
      fetchNotifications() // Refresh on error
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead()
      // Optimistically update UI
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      fetchNotifications() // Refresh on error
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="d-flex justify-content-center align-items-center vh-100">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="d-flex vh-100 bg-light position-relative">
        {/* Mobile Sidebar Toggle Button */}
        <button
          className="d-lg-none btn btn-light position-fixed top-2 start-2 z-3"
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          style={{ zIndex: 1000 }}
        >
          <Menu className="bi bi-list" />
        </button>

        {/* Sidebar */}
        <div
          className={`d-flex flex-column flex-shrink-0 p-3 bg-white shadow-sm h-100 
            ${mobileSidebarOpen ? 'd-block position-fixed' : 'd-none d-lg-block'}`}
          style={{
            width: '280px',
            zIndex: 999,
            left: mobileSidebarOpen ? '0' : '-280px',
            transition: 'left 0.3s ease',
          }}
        >
          <LearnerSidebar />
        </div>

        {/* Overlay for mobile */}
        {mobileSidebarOpen && (
          <div
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
            style={{ zIndex: 998 }}
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavbar toggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          
          <div className="container-fluid py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h4>Notifications</h4>
                <p className="text-muted mb-0">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>
              
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-outline-secondary"
                  onClick={fetchNotifications}
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-arrow-clockwise me-2"></i>
                      Refresh
                    </>
                  )}
                </button>
                
                {unreadCount > 0 && (
                  <button className="btn btn-primary" onClick={markAllAsRead}>
                    Mark All as Read
                  </button>
                )}
              </div>
            </div>

            <div className="list-group">
              {notifications.length === 0 ? (
                <div className="alert alert-info text-center py-5">
                  <i className="bi bi-bell-slash fs-1 d-block mb-3"></i>
                  <h5>No notifications yet</h5>
                  <p className="mb-0">We'll notify you when there's something new.</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`list-group-item list-group-item-action ${!notification.is_read ? 'list-group-item-light' : ''}`}
                  >
                    <div className="d-flex w-100 justify-content-between">
                      <h5 className="mb-1">{notification.title}</h5>
                      <small>{new Date(notification.created_at).toLocaleDateString()}</small>
                    </div>
                    <p className="mb-1">{notification.message}</p>
                    <div className="d-flex justify-content-between align-items-center mt-2">
                      {notification.action_url && (
                        <a href={notification.action_url.replace('/api/courses', '/dashboard/learn')}
                        className="btn btn-sm btn-outline-primary">
                          View Details
                        </a>
                      )}
                       {/* {notification.action_url && (
                    <a
                        href={notification.action_url.replace('/api/courses', '/dashboard/learn')}
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setIsOpen(false)}
                    >
                        View
                    </a>
                    )} */}
                      {!notification.is_read && (
                        <button
                          className="btn btn-sm btn-outline-secondary ms-auto"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}