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
  lesson: string 
}

export default function LearnerSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [progress, setProgress] = useState<number>(0);
  const [certCount, setCertCount] = useState<number>(0);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState<number>(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all progress data
        const progressRes = await coursesApi.getUserProgress();
        const certsRes = await certificatesApi.getUserCertificates();
        const enrollmentsRes = await coursesApi.getUserEnrollments();

        // Calculate progress percentage
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

        // Set certificates count
        if (certsRes.data) {
          setCertCount(certsRes.data.results?.length || 0);
        }

        // Set enrolled courses count
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
    <div className={`h-full flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="p-2 m-2 rounded-md bg-gray-100 hover:bg-gray-200 self-end"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </button>

      <div className="flex-1 overflow-y-auto">
        <div className={`text-center mb-6 px-4 ${isCollapsed ? 'px-2' : ''}`}>
          <div className="avatar mx-auto mb-3">
            {user?.profile_image ? (
              <img
                src={user.profile_image}
                alt={`${user.first_name} ${user.last_name}`}
                className="rounded-full w-14 h-14 object-cover"
              />
            ) : (
              <div
                className="rounded-full bg-primary flex items-center justify-center mx-auto w-14 h-14"
              >
                <span className="text-white font-bold">
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <>
              <h5 className="text-lg font-medium mb-1 truncate">{user?.first_name} {user?.last_name}</h5>
              <span className="text-gray-500 text-sm">{user?.role}</span>
            </>
          )}
        </div>

        {!isCollapsed && (
          <div className="mb-6 px-4">
            <div className="mb-2 flex justify-between">
              <span className="text-sm text-gray-500">Learning Progress</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="progress mb-3 h-2 bg-gray-200 rounded-full">
              <div
                className="progress-bar bg-success h-full rounded-full"
                style={{ width: `${progress}%` }}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <div className="flex justify-between">
              <span className="badge bg-blue-100 text-blue-800 text-xs">
                Courses: {enrolledCoursesCount}
              </span>
              <span className="badge bg-green-100 text-green-800 text-xs">
                Certs: {certCount}
              </span>
            </div>
          </div>
        )}

        <ul className="space-y-1 px-2">
          <li>
            <Link
              href="/dashboard"
              className={`flex items-center p-2 rounded-md ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Dashboard"
            >
              <i className="bi bi-speedometer2 text-xl"></i>
              {!isCollapsed && <span className="ml-3">Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/courses"
              className={`flex items-center p-2 rounded-md ${isActive('/dashboard/courses') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Browse Courses"
            >
              <i className="bi bi-book text-xl"></i>
              {!isCollapsed && <span className="ml-3">Browse Courses</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/learn"
              className={`flex items-center p-2 rounded-md ${isActive('/dashboard/learn') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="My Courses"
            >
              <i className="bi bi-collection text-xl"></i>
              {!isCollapsed && <span className="ml-3">My Courses</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/my-score"
              className={`flex items-center p-2 rounded-md ${isActive('/dashboard/my-score') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="My Score"
            >
              <i className="bi bi-graph-up text-xl"></i>
              {!isCollapsed && <span className="ml-3">My Score</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/certificates"
              className={`flex items-center p-2 rounded-md ${isActive('/dashboard/certificates') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="My Certificates"
            >
              <i className="bi bi-award text-xl"></i>
              {!isCollapsed && <span className="ml-3">My Certificates</span>}
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/profile"
              className={`flex items-center p-2 rounded-md ${isActive('/dashboard/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
              title="Profile"
            >
              <i className="bi bi-person text-xl"></i>
              {!isCollapsed && <span className="ml-3">Profile</span>}
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}