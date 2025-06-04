// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(typeof window !== 'undefined' && localStorage.getItem('access_token') 
        ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        : {})
    };

    const response = await fetch(url, {
      method,
      headers: { ...defaultHeaders, ...headers },
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// Users API
export const usersApi = {
  login: (credentials: { email: string; password: string }) => 
    apiRequest<{ user: User; access: string; refresh: string }>('/auth/login/', 'POST', credentials),
  
  register: (user: Partial<User>) => 
    apiRequest<{ user: User; access: string; refresh: string }>('/auth/register/', 'POST', user),
  
  getProfile: () => apiRequest<User>('/auth/profile/'),
  refreshToken: (refresh: string) => 
    apiRequest<{ access: string }>('/auth/token/refresh/', 'POST', { refresh }),

  // Admin endpoints
  getAllUsers: () => apiRequest<User[]>('/auth/users/'),
  getLearners: () => apiRequest<User[]>('/auth/users/learners/'),  
  getNonLearners: () => apiRequest<User[]>('/auth/users/non-learners/'),
  getUser: (id: string) => apiRequest<User>(`/auth/users/${id}/`),
  updateUser: (id: string, user: Partial<User>) => apiRequest<User>(`/auth/users/update/${id}/`, 'PUT', user),
  deleteUser: (id: string) => apiRequest(`/auth/users/delete/${id}/`, 'DELETE'),
};

// Courses API
export const coursesApi = {
  // Course operations
  getAllCourses: () => apiRequest<Course[]>('/courses/'),
  getCourse: (id: string) => apiRequest<Course>(`/courses/${id}/`),
  createCourse: (course: Partial<Course>) => apiRequest<Course>('/courses/', 'POST', course),
  updateCourse: (id: string, course: Partial<Course>) => apiRequest<Course>(`/courses/${id}/`, 'PUT', course),
  deleteCourse: (id: string) => apiRequest(`/courses/${id}/`, 'DELETE'),
  
  // Course workflow
  approveCourse: (id: string) => apiRequest<Course>(`/courses/approve/${id}/`, 'POST'),
  rejectCourse: (id: string, reason: string) => apiRequest<Course>(`/courses/reject/${id}/`, 'POST', { reason }),
  publishCourse: (id: string) => apiRequest<Course>(`/courses/publish/${id}/`, 'POST'),

  // Module operations
  getModules: (courseId: string) => apiRequest<Module[]>(`/courses/${courseId}/modules/`),
  getModule: (courseId: string, moduleId: string) => apiRequest<Module>(`/courses/${courseId}/modules/${moduleId}/`),
  createModule: (courseId: string, module: Partial<Module>) => apiRequest<Module>(`/courses/${courseId}/modules/`, 'POST', module),
  updateModule: (courseId: string, moduleId: string, module: Partial<Module>) => apiRequest<Module>(`/courses/${courseId}/modules/${moduleId}/`, 'PUT', module),
  deleteModule: (courseId: string, moduleId: string) => apiRequest(`/courses/${courseId}/modules/${moduleId}/`, 'DELETE'),

  // Lesson operations
  getLessons: (courseId: string, moduleId: string) => apiRequest<Lesson[]>(`/courses/${courseId}/modules/${moduleId}/lessons/`),
  getLesson: (courseId: string, moduleId: string, lessonId: string) => apiRequest<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`),
  createLesson: (courseId: string, moduleId: string, lesson: Partial<Lesson>) => apiRequest<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons/`, 'POST', lesson),
  updateLesson: (courseId: string, moduleId: string, lessonId: string, lesson: Partial<Lesson>) => apiRequest<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`, 'PUT', lesson),
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => apiRequest(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`, 'DELETE'),

  // User progress
  getUserProgress: () => apiRequest<UserProgress[]>('/courses/user/progres/'),
  updateProgress: (lessonId: string, isCompleted: boolean) => 
    apiRequest<UserProgress>('/courses/user/progres/', 'POST', { 
      lesson: lessonId, 
      is_completed: isCompleted 
    }),
  getLessonProgress: (lessonId: string) => 
    apiRequest<UserProgress>(`/courses/user/progress/lesson/${lessonId}/`),
  getCourseProgress: (courseId: string) => 
    apiRequest<{ completed: number; total: number; percentage: number }>(
      `/courses/user/progress/course/${courseId}/`
    ),

  // Enrollment
  checkEnrollment: (courseId?: string) => 
    courseId 
      ? apiRequest<{ enrolled: boolean }>(`/courses/${courseId}/enrollment/`)
      : apiRequest<{ enrolled: boolean }[]>('/courses/user/enrollments/'),
  // checkEnrollment: (courseId: string) => 
  //   apiRequest<{ enrolled: boolean }>(`/courses/${courseId}/enrollment/`),
  
  enroll: (courseId: string) => 
    apiRequest<{ success: boolean }>(`/courses/${courseId}/enroll/`, 'POST'),

  getTotalEnrollments: () => apiRequest<{ total_enrollments: number }>('/courses/enrollments/total/'),
  getUserEnrollments: () => apiRequest<{course_id: string}[]>('/courses/user/enrollments/'),
  getCourseEnrollments: (courseId: string) => 
    apiRequest<{ course_id: string; course_title: string; enrollment_count: number }>(
      `/courses/${courseId}/enrollments/`
    ),
};

// Categories API
export const categoriesApi = {
  getAllCategories: () => apiRequest<CourseCategory[]>('/courses/categories/'),
  getCategory: (id: string) => apiRequest<CourseCategory>(`/courses/categories/${id}/`),
  createCategory: (category: Partial<CourseCategory>) => apiRequest<CourseCategory>('/courses/categories/', 'POST', category),
  updateCategory: (id: string, category: Partial<CourseCategory>) => apiRequest<CourseCategory>(`/courses/categories/${id}/`, 'PUT', category),
  deleteCategory: (id: string) => apiRequest(`/courses/categories/${id}/`, 'DELETE'),
};

// Assessments API
export const assessmentsApi = {
  // Questions
  getQuestions: (lessonId: string) => apiRequest<Question[]>(`/assessments/lessons/${lessonId}/questions/`),
  createQuestion: (lessonId: string, question: Partial<Question>) => 
    apiRequest<Question>(`/assessments/lessons/${lessonId}/questions/`, 'POST', question),
  updateQuestion: (lessonId: string, questionId: string, question: Partial<Question>) => 
    apiRequest<Question>(`/assessments/lessons/${lessonId}/questions/${questionId}/`, 'PUT', question),
  deleteQuestion: (lessonId: string, questionId: string) => 
    apiRequest(`/assessments/lessons/${lessonId}/questions/${questionId}/`, 'DELETE'),

  // Answers
  getAnswers: (questionId: string) => apiRequest<Answer[]>(`/assessments/questions/${questionId}/answers/`),
  createAnswer: (questionId: string, answer: Partial<Answer>) => 
    apiRequest<Answer>(`/assessments/questions/${questionId}/answers/`, 'POST', answer),
  updateAnswer: (questionId: string, answerId: string, answer: Partial<Answer>) => 
    apiRequest<Answer>(`/assessments/questions/${questionId}/answers/${answerId}/`, 'PUT', answer),
  deleteAnswer: (questionId: string, answerId: string) => 
    apiRequest(`/assessments/questions/${questionId}/answers/${answerId}/`, 'DELETE'),

  // Quiz
  getQuiz: (lessonId: string) => apiRequest<{ lesson: Lesson; questions: Question[] }>(`/assessments/lessons/${lessonId}/quiz/`),
  submitQuiz: (lessonId: string, answers: { answers: Record<string, string> }) =>
    apiRequest<{ score: number; passed: boolean }>(`/assessments/lessons/${lessonId}/submit/`, 'POST', answers),
};

// Certificates API
export const certificatesApi = {
  getUserCertificates: () => apiRequest<Certificate[]>('/certificates/user/'),
  getCourseCertificate: (courseId: string) => apiRequest<Certificate>(`/certificates/${courseId}/`),
  downloadCertificate: (certificateId: string) => 
    apiRequest<{ download_url: string }>(`/certificates/${certificateId}/download/`),
  verifyCertificate: (certificateNumber: string) => 
    apiRequest<{ valid: boolean; certificate: Certificate }>(`/certificates/verify/${certificateNumber}/`),
};

// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: CourseCategory | string;
  thumbnail: string | null;
  created_by: User | string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  duration_hours: number;
  is_featured: boolean;
}

export interface CourseCategory {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface Module {
  id: string;
  course: string | Course;
  title: string;
  description: string;
  order: number;
  created_at: string;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  module: string | Module;
  title: string;
  content_type: string;
  content: string;
  duration_minutes: number;
  order: number;
  is_required: boolean;
  created_at: string;
  questions?: Question[];
}

export interface Question {
  id: string;
  lesson: string | Lesson;
  question_text: string;
  question_type: string;
  points: number;
  order: number;
  answers?: Answer[];
}

export interface Answer {
  id: string;
  question: string | Question;
  answer_text: string;
  is_correct: boolean;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user: string | User;
  lesson: string | Lesson;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed: string;
}

export interface Certificate {
  id: string;
  user: User | string;
  course: Course | string;
  template: CertificateTemplate | string | null;
  issued_date: string;
  certificate_number: string;
  pdf_file: string | null;
  verification_url: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  template_file: string;
  created_at: string;
  updated_at: string;
}