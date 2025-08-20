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
    <div className="h-full p-4">
      <div className="text-center mb-6">
        <div className="avatar mx-auto mb-3">
          {user?.profile_image ? (
            <img
              src={user.profile_image}
              alt={`${user.first_name} ${user.last_name}`}
              className="rounded-full w-20 h-20 object-cover"
            />
          ) : (
            <div
              className="rounded-full bg-primary flex items-center justify-center mx-auto w-20 h-20"
            >
              <span className="text-white text-xl font-bold">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <h5 className="text-lg font-medium mb-1">{user?.first_name} {user?.last_name}</h5>
        <span className="text-gray-500">{user?.role}</span>
      </div>

      <div className="mb-6">
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

      <ul className="space-y-1">
        <li>
          <Link
            href="/dashboard"
            className={`flex items-center p-2 rounded-md ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <i className="bi bi-speedometer2 mr-3"></i>
            Dashboard
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/courses"
            className={`flex items-center p-2 rounded-md ${isActive('/dashboard/courses') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <i className="bi bi-book mr-3"></i>
            Browse Courses
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/learn"
            className={`flex items-center p-2 rounded-md ${isActive('/dashboard/learn') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <i className="bi bi-collection mr-3"></i>
            My Courses
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/my-score"
            className={`flex items-center p-2 rounded-md ${isActive('/dashboard/my-score') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <i className="bi bi-graph-up mr-3"></i>
            My Score
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/certificates"
            className={`flex items-center p-2 rounded-md ${isActive('/dashboard/certificates') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <i className="bi bi-award mr-3"></i>
            My Certificates
          </Link>
        </li>
        <li>
          <Link
            href="/dashboard/profile"
            className={`flex items-center p-2 rounded-md ${isActive('/dashboard/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
          >
            <i className="bi bi-person mr-3"></i>
            Profile
          </Link>
        </li>
      </ul>
    </div>
  );
}