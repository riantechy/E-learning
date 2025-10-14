// TopNavbar.tsx
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
      <div className="container-fluid">
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
          <span className="navbar-brand mb-0 h1 d-none d-sm-block">Learning Platform</span>
          <span className="navbar-brand mb-0 h5 d-block d-sm-none">Learning Platform</span>
        </div>
        
        {/* Right Section: Notification and User Info */}
        <div className="d-flex align-items-center">
          {/* Notification Bell */}
          {user && (
            <div className="me-2 me-md-3">
              <NotificationBell />
            </div>
          )}
          
          {user && (
            <div className="d-flex align-items-center">
              {/* Welcome message - hidden on extra small screens */}
              <div className="me-2 me-md-3 d-none d-sm-block">
                <span className="text-muted small">Welcome, {user.first_name}</span>
              </div>
              
              {/* User avatar for small screens */}
              <div className="d-block d-md-none me-2">
                <div 
                  className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white fw-bold"
                  style={{ 
                    width: '32px', 
                    height: '32px',
                    fontSize: '0.8rem'
                  }}
                >
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="btn btn-outline-danger btn-sm"
              >
                <i className="bi bi-box-arrow-right d-none d-md-inline me-1"></i>
                <i className="bi bi-box-arrow-right d-md-none"></i>
                <span className="d-none d-md-inline">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}