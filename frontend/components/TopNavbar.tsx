'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import NotificationBell from './NotificationBell'

interface TopNavbarProps {
  toggleSidebar?: () => void;
}

export default function TopNavbar({ toggleSidebar }: TopNavbarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      logout();
    }
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        {/* Left Section: Menu Button and Brand */}
        <div className="d-flex align-items-center">
          {/* Mobile menu button */}
          <button 
            className="d-lg-none btn btn-link me-2 p-1"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>

          {/* Brand (hidden on small devices) */}
          <span className="navbar-brand mb-0 h1 d-none d-md-block">Learning Platform</span>
        </div>
        
        {/* Right Section: Notification and User Info */}
        <div className="d-flex align-items-center gap-2">
          {/* Notification Bell */}
          {user && (
            <div className="me-2">
              <NotificationBell />
            </div>
          )}
          
          {user && (
            <div className="d-flex align-items-center gap-2">
              {/* Welcome message (hidden on small devices) */}
              <div className="d-none d-md-block text-muted small">
                Welcome, {user.first_name}
              </div>

              {/* User Avatar (visible only on small screens) */}
              <div className="d-md-none rounded-circle bg-danger d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ 
                  width: '32px', 
                  height: '32px',
                  fontSize: '0.8rem'
                }}
              >
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm d-flex align-items-center"
              >
                <i className="bi bi-box-arrow-right me-1 d-none d-sm-inline"></i>
                <span className="d-none d-sm-inline">Logout</span>
                <i className="bi bi-box-arrow-right d-sm-none"></i>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
