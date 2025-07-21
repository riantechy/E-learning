// components/TopNavbar.tsx
'use client'

import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react' // Import the Menu icon

interface TopNavbarProps {
  toggleSidebar?: () => void;
}

export default function TopNavbar({ toggleSidebar }: TopNavbarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm sticky-top">
      <div className="container-fluid">
        <div className="d-flex align-items-center">
          {/* Mobile menu button - only shows on small screens */}
          <button 
            className="d-lg-none btn btn-link me-2 p-1"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} /> {/* Using the Menu icon from lucide-react */}
          </button>
          <span className="navbar-brand mb-0 h1">Learning Platform</span>
        </div>
        
        <div className="d-flex align-items-center">
          {user && (
            <>
              <div className="me-3 d-none d-md-block">
                <span className="text-muted">Welcome, {user.first_name}</span>
              </div>
              <button 
                onClick={logout}
                className="btn btn-outline-danger btn-sm"
              >
                <i className="bi bi-box-arrow-right me-1"></i>
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}