'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { notificationsApi, Notification } from '@/lib/api';
import DashboardLayout from '@/components/DashboardLayout';
import AdminSidebar from '@/components/AdminSidebar';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import ListGroup from 'react-bootstrap/ListGroup';

export default function AdminNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setNotifications(response.data.results || []);
      }
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

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

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      setError('Failed to mark notification as read');
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      setError('Failed to mark all notifications as read');
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout sidebar={<AdminSidebar />}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1 className="h4 mb-0">Notifications</h1>
          {unreadCount > 0 && (
            <Button variant="outline-primary" onClick={markAllAsRead}>
              Mark All as Read
            </Button>
          )}
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        <Card>
          <Card.Header className="d-flex justify-content-between align-items-center">
            <span>
              All Notifications {unreadCount > 0 && <Badge bg="danger">{unreadCount} unread</Badge>}
            </span>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <p className="text-muted text-center p-4">No notifications</p>
            ) : (
              <ListGroup variant="flush">
                {notifications.map(notification => (
                  <ListGroup.Item 
                    key={notification.id} 
                    className={!notification.is_read ? 'bg-light' : ''}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <h6 className="mb-0">{notification.title}</h6>
                          <small className="text-muted">
                            {formatDate(notification.created_at)}
                          </small>
                        </div>
                        <p className="mb-1">{notification.message}</p>
                        <div className="d-flex align-items-center mt-2">
                          <Badge 
                            bg={
                              notification.notification_type === 'ADMIN' ? 'danger' :
                              notification.notification_type === 'COURSE' ? 'primary' :
                              notification.notification_type === 'CERTIFICATE' ? 'success' :
                              'secondary'
                            }
                            className="me-2"
                          >
                            {notification.notification_type}
                          </Badge>
                          {notification.priority !== 'MEDIUM' && (
                            <Badge 
                              bg={
                                notification.priority === 'HIGH' ? 'warning' :
                                notification.priority === 'URGENT' ? 'danger' :
                                'info'
                              }
                            >
                              {notification.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="ms-2"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </div>
                    {notification.action_url && (
                      <div className="mt-2">
                        <a 
                          href={notification.action_url} 
                          className="btn btn-sm btn-outline-primary"
                        >
                          View Details
                        </a>
                      </div>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </div>
    </DashboardLayout>
  );
}