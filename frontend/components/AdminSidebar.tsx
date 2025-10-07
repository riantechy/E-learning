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

  // Generate sub-items for courses based on current context
  const courseSubItems = [];
  
  // Always show "All Courses" link
  courseSubItems.push({ href: '/admin-dashboard/courses', label: 'All Courses' });
  
  // Show course-specific links if we have a course ID
  if (courseId) {
    courseSubItems.push(
      { href: `/admin-dashboard/courses/${courseId}/modules`, label: 'Modules' }
    );
    
    // Show module-specific links if we have a module ID
    if (moduleId) {
      courseSubItems.push(
        // { href: `/admin-dashboard/courses/${courseId}/modules/${moduleId}`, label: 'Module Details' },
        { href: `/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons`, label: 'Lessons' }
      );
      
      // Show lesson-specific links if we have a lesson ID
      if (lessonId) {
        courseSubItems.push(
          { href: `/admin-dashboard/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`, label: 'Lesson Details' }
        );
      }
    }
  }

  const menuItems = [
    { href: '/admin-dashboard', label: 'Dashboard', icon: '📊', exact: true },
    { href: '/admin-dashboard/categories', label: 'Categories', icon: '🏷️' },
    { 
      href: '/admin-dashboard/courses', 
      label: 'Courses', 
      icon: '📚',
      subItems: isCoursePath ? courseSubItems : []
    },
    { href: '/admin-dashboard/users', label: 'Learners', icon: '👥' },
    { href: '/admin-dashboard/instructors', label: 'Instructors', icon: '👨‍🏫' },
    { href: '/admin-dashboard/enrollments', label: 'Enrollments', icon: '🎓' },
    { href: '/admin-dashboard/surveys', label: 'Surveys', icon: '📝' },
    { href: '/admin-dashboard/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin-dashboard/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/admin-dashboard/profile', label: 'Profile', icon: '👤' },
    { href: '/admin-dashboard/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <nav className={styles.sidebarNav}>
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
    </nav>
  );
}
