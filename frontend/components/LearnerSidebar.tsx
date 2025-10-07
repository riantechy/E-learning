// components/LearnerSidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { certificatesApi, coursesApi, User } from '@/lib/api';

interface UserProgressItem {
  id: string;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed: string;
  user: string | User;
  lesson: string;
}

interface LearnerSidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
}

export default function LearnerSidebar({ 
  isCollapsed = false, 
  onToggleCollapse, 
  isMobileOpen = false 
}: LearnerSidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [certCount, setCertCount] = useState<number>(0);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState<number>(0);
  const [localCollapsed, setLocalCollapsed] = useState(isCollapsed);

  // Force expanded view on mobile when sidebar is open
  const isExpandedView = isMobileOpen || !localCollapsed;

  useEffect(() => {
    setLocalCollapsed(isCollapsed);
  }, [isCollapsed]);

  const handleToggleCollapse = () => {
    const newState = !localCollapsed;
    setLocalCollapsed(newState);
    if (onToggleCollapse) {
      onToggleCollapse();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [progressRes, certsRes, enrollmentsRes] = await Promise.all([
          coursesApi.getUserProgress(),
          certificatesApi.getUserCertificates(),
          coursesApi.getUserEnrollments(),
        ]);

        if (progressRes.data && Array.isArray(progressRes.data)) {
          const completedLessons = progressRes.data.filter(
            (item: UserProgressItem) => item.is_completed
          ).length;
          const totalLessons = progressRes.data.length;
          const calculatedProgress = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100)
            : 0;
          setProgress(calculatedProgress);
        }

        if (certsRes.data) {
          setCertCount(certsRes.data.results?.length || 0);
        }

        if (enrollmentsRes.data) {
          setEnrolledCoursesCount(enrollmentsRes.data.length || 0);
        }
      } catch (error) {
        console.error('Error fetching sidebar data:', error);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === path;
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="h-100 d-flex flex-column">
      {/* Toggle Button - Hidden on mobile when sidebar is open */}
      {!isMobileOpen && (
        <button 
          onClick={handleToggleCollapse}
          className="btn btn-link p-2 mb-2 text-decoration-none border-0 text-muted"
          style={{ 
            alignSelf: isExpandedView ? 'flex-end' : 'center',
            width: isExpandedView ? 'auto' : '100%'
          }}
          title={isExpandedView ? "Collapse sidebar" : "Expand sidebar"}
        >
          <i className={`bi ${isExpandedView ? 'bi-chevron-left' : 'bi-chevron-right'}`}></i>
          {isExpandedView && <span className="ms-2 small"></span>}
        </button>
      )}

      <div className="flex-grow-1 overflow-auto">
        {/* User Profile Section */}
        <div className={`text-center mb-4 ${isExpandedView ? 'px-3' : 'px-2'}`}>
          <div className="avatar d-flex align-items-center justify-content-center mx-auto mb-2">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={`${user.first_name} ${user.last_name}`}
                className="rounded-circle object-cover"
                style={{ 
                  width: isExpandedView ? '60px' : '40px', 
                  height: isExpandedView ? '60px' : '40px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            ) : (
              <div
                className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white fw-bold"
                style={{ 
                  width: isExpandedView ? '60px' : '40px', 
                  height: isExpandedView ? '60px' : '40px',
                  fontSize: isExpandedView ? '1.2rem' : '0.9rem'
                }}
              >
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
            )}
          </div>
          {isExpandedView && (
            <>
              <h6 className="mb-1 fw-bold">{user?.first_name} {user?.last_name}</h6>
              <span className="text-muted small">{user?.role}</span>
            </>
          )}
        </div>

        {/* Progress Section */}
        {isExpandedView && (
          <div className="mb-4 px-3">
            {/* Progress bar removed as per original code */}
            <div className="d-flex justify-content-between">
              <span className="badge bg-danger bg-opacity-10 text-danger small">
                Courses: {enrolledCoursesCount}
              </span>
              <span className="badge bg-danger bg-opacity-10 text-danger small">
                Certs: {certCount}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav>
          <ul className="nav nav-pills flex-column gap-1 px-2">
            {[
              { href: '/dashboard', icon: 'bi-speedometer2', label: 'Dashboard' },
              { href: '/dashboard/courses', icon: 'bi-book', label: 'Browse Courses' },
              { href: '/dashboard/learn', icon: 'bi-collection', label: 'My Courses' },
              { href: '/dashboard/my-score', icon: 'bi-graph-up', label: 'My Score' },
              { href: '/dashboard/certificates', icon: 'bi-award', label: 'My Certificates' },
              { href: '/dashboard/notifications', icon: 'bi-bell', label: 'Notifications' },
              { href: '/dashboard/profile', icon: 'bi-person', label: 'Profile' },
            ].map((item) => (
              <li key={item.href} className="nav-item">
                <Link
                  href={item.href}
                  className={`nav-link d-flex align-items-center rounded ${
                    isActive(item.href) ? 'active bg-secondary text-white' : 'text-dark'
                  }`}                  
                  title={!isExpandedView ? item.label : ''}
                >
                  <i className={`${item.icon} ${isExpandedView ? 'me-3' : ''}`} style={{ minWidth: '20px' }}></i>
                  {isExpandedView && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Collapsed indicator */}
      {!isExpandedView && (
        <div className="text-center mt-auto pt-3 border-top">
          <i className="bi bi-three-dots text-muted"></i>
        </div>
      )}
    </div>
  );
}