// components/AdminSidebar.tsx
'use client'

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import styles from './AdminSidebar.module.css';

export default function AdminSidebar() {
  const pathname = usePathname();
  const params = useParams();

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
    { href: '/admin-dashboard/analytics', label: 'Analytics', icon: '📈' },
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
      <ul className="nav flex-column">
        {menuItems.map((item) => (
          <li key={item.href} className={`nav-item ${styles.navItem}`}>
            <Link
              href={item.href}
              className={`nav-link ${
                (item.exact ? pathname === item.href : pathname.startsWith(item.href))
                  ? styles.active 
                  : ''
              } ${styles.navLink}`}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </Link>
            
            {item.subItems && item.subItems.length > 0 && (
              <ul className={styles.subMenu}>
                {item.subItems.map((subItem) => (
                  <li key={subItem.href}>
                    <Link
                      href={subItem.href}
                      className={`nav-link ${
                        pathname === subItem.href ? styles.active : ''
                      } ${styles.subNavLink}`}
                    >
                      {subItem.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}

        {/* Contextual navigation - always show Course Management when in courses section */}
        {isCoursePath && (
          <>
            <li className={`nav-item ${styles.navItem} ${styles.contextNav}`}>
              <Link
                href={getCourseManagementLink()}
                className={`nav-link ${styles.navLink} ${
                  pathname === getCourseManagementLink() ? styles.active : ''
                }`}
              >
                <span className={styles.icon}>📝</span>
                <span className={styles.label}>Course Management</span>
              </Link>
            </li>

            {/* Only show these if we have the specific IDs */}
            {courseId && isModulePath && (
              <li className={`nav-item ${styles.navItem}`}>
                <Link
                  href={`/admin-dashboard/courses/${courseId}/modules`}
                  className={`nav-link ${
                    pathname.includes('/modules') && !isLessonPath ? styles.active : ''
                  } ${styles.navLink} ${styles.subItem}`}
                >
                  <span className={styles.icon}>📦</span>
                  <span className={styles.label}>Modules</span>
                </Link>
              </li>
            )}

            {courseId && moduleId && isLessonPath && (
              <li className={`nav-item ${styles.navItem}`}>
                <Link
                  href={`/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons`}
                  className={`nav-link ${
                    pathname.includes('/lessons') && !isQuizPath ? styles.active : ''
                  } ${styles.navLink} ${styles.subItem}`}
                >
                  <span className={styles.icon}>📄</span>
                  <span className={styles.label}>Lessons</span>
                </Link>
              </li>
            )}

            {/* {courseId && moduleId && lessonId && isQuizPath && (
              <li className={`nav-item ${styles.navItem}`}>
                <Link
                  href={`/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/quiz`}
                  className={`nav-link ${
                    pathname.includes('/quiz') ? styles.active : ''
                  } ${styles.navLink} ${styles.subItem}`}
                >
                  <span className={styles.icon}>❓</span>
                  <span className={styles.label}>Quiz</span>
                </Link>
              </li>
            )} */}
          </>
        )}

        <li className={`nav-item mt-auto ${styles.navItem}`}>
          <Link href="/login" className={`nav-link ${styles.navLink} ${styles.logoutLink}`}>
            <span className={styles.icon}>🚪</span>
            <span className={styles.label}>Logout</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}