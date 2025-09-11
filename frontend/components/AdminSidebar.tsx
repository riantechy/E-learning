'use client'

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();
  const { user } = useAuth();

  const isCoursePath = pathname.startsWith('/admin-dashboard/courses');
  const isModulePath = pathname.includes('/modules/');
  const isLessonPath = pathname.includes('/lessons/');
  const isQuizPath = pathname.includes('/quiz');

  // Extract IDs from params if they exist
  const courseId = params?.courseId as string;
  const moduleId = params?.moduleId as string;
  const lessonId = params?.lessonId as string;

  const menuItems = [
    { href: '/admin-dashboard', label: 'Dashboard', icon: '📊', exact: true },
    { 
      href: '/admin-dashboard/courses', 
      label: 'Courses', 
      icon: '📚',
      subItems: isCoursePath ? [
        { href: '/admin-dashboard/courses', label: 'All Courses' },
      ] : []
    },
    { href: '/admin-dashboard/categories', label: 'Categories', icon: '🏷️' },
    { href: '/admin-dashboard/users', label: 'Learners', icon: '👥' },
    { href: '/admin-dashboard/instructors', label: 'Instructors', icon: '👨‍🏫' },
    { href: '/admin-dashboard/enrollments', label: 'Enrollments', icon: '🎓' },
    { href: '/admin-dashboard/surveys', label: 'Surveys', icon: '📝' },
    { href: '/admin-dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin-dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/admin-dashboard/profile', label: 'Profile', icon: '👤' },
    { href: '/admin-dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  // Determine the target for Course Management
  const getCourseManagementLink = () => {
    if (courseId) {
      return `/admin-dashboard/courses/${courseId}`;
    }
    return '/admin-dashboard/courses';
  };

  return (
    <nav className={styles.sidebarNav}>
      {/* Admin Profile Section */}
      {/* <div className={styles.profileSection}>
        <div className={styles.profileImageContainer}>
          {user?.profile_image ? (
            <img 
              src={user.profile_image} 
              alt="Profile" 
              className={styles.profileImage}
            />
          ) : (
            <div className={styles.profilePlaceholder}>
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          )}
        </div>
        <h6 className={styles.profileName}>{user?.first_name} {user?.last_name}</h6>
        <small className={styles.profileRole}>{user?.role || 'Administrator'}</small>
      </div> */}

      {/* Menu Items */}
      {menuItems.map((item) => (
        <div key={item.href} className={styles.navItem}>
          <Link
            href={item.href}
            className={`${styles.navLink} ${
              (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                ? styles.active
                : ''
            }`}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </Link>
          
          {item.subItems && item.subItems.length > 0 && (
            <ul className={styles.subMenu}>
              {item.subItems.map((subItem) => (
                <li key={subItem.href} className={styles.subItem}>
                  <Link
                    href={subItem.href}
                    className={`${styles.subNavLink} ${
                      pathname === subItem.href ? styles.active : ''
                    }`}
                  >
                    {subItem.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {/* Contextual navigation - always show Course Management when in courses section */}
      {isCoursePath && (
        <div className={styles.contextNav}>
          <div className={styles.navItem}>
            <Link
              href={getCourseManagementLink()}
              className={`${styles.navLink} ${
                pathname === getCourseManagementLink() ? styles.active : ''
              }`}
            >
              <span className={styles.icon}>📝</span>
              <span className={styles.label}>Course Management</span>
            </Link>
          </div>

          {/* Only show these if we have the specific IDs */}
          {courseId && isModulePath && (
            <div className={`${styles.navItem} ${styles.subItem}`}>
              <Link
                href={`/admin-dashboard/courses/${courseId}/modules`}
                className={`${styles.subNavLink} ${
                  pathname.includes('/modules') && !isLessonPath ? styles.active : ''
                }`}
              >
                <span className={styles.icon}>📦</span>
                <span className={styles.label}>Modules</span>
              </Link>
            </div>
          )}

          {courseId && moduleId && isLessonPath && (
            <div className={`${styles.navItem} ${styles.subItem}`}>
              <Link
                href={`/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons`}
                className={`${styles.subNavLink} ${
                  pathname.includes('/lessons') && !isQuizPath ? styles.active : ''
                }`}
              >
                <span className={styles.icon}>📄</span>
                <span className={styles.label}>Lessons</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}