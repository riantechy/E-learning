// lib/api.ts
const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_BASE_HOST}/api`
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

const extractErrorMessage = (error: string): string => {
  // Handle field-specific errors (e.g., "field: error message")
  const colonIndex = error.indexOf(':');
  if (colonIndex > -1) {
    return error.slice(colonIndex + 1).trim();
  }
  return error;
};

async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: any,
  headers: Record<string, string> = {},
  isBinary: boolean = false
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const isLessonEndpoint = endpoint.includes('/courses/') && endpoint.includes('/lessons/');
    
    const defaultHeaders = {
      ...(isLessonEndpoint || body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(typeof window !== 'undefined' && localStorage.getItem('access_token') 
        ? { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
        : {}),
      ...headers,
    };

    let requestBody;
    if (body instanceof FormData) {
      requestBody = body;
      console.log('apiRequest FormData contents:');
      for (const [key, value] of body.entries()) {
        console.log(`${key}: ${typeof value === 'object' && value instanceof File ? value.name : value}`);
      }
    } else if (body && isLessonEndpoint) {
      const formData = new FormData();
      for (const [key, value] of Object.entries(body)) {
        formData.append(key, value instanceof Object ? JSON.stringify(value) : value.toString());
      }
      requestBody = formData;
    } else {
      requestBody = body ? JSON.stringify(body) : undefined;
    }

    console.log('Sending request to:', url, 'Method:', method, 'Headers:', defaultHeaders);

    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body: requestBody,
      credentials: 'include',
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      
      let errorMsg = errorData.detail || errorData.message || '';
      if (!errorMsg && Object.keys(errorData).length > 0) {
        // Handle field-specific validation errors (e.g., {"email": ["error message"]})
        errorMsg = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('; ');
      }
      if (!errorMsg) {
        errorMsg = `HTTP error! status: ${response.status}`;
      }
      
      throw new Error(errorMsg);
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return { data: undefined as T }; 
    }

    if (isBinary) {
      const data = await response.blob();
      return { data: data as unknown as T };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error('API request failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { error: extractErrorMessage(errorMessage) };
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
  verifyEmail: (token: string) => 
    apiRequest(`/auth/verify-email/${token}/`, 'GET'),
  resendVerificationEmail: () => apiRequest<ResendVerificationResponse>('/auth/resend-verification-email/', 'POST'),
  requestPasswordReset: (data: { email: string }) => apiRequest<{ message: string }>('/auth/request-password-reset/', 'POST', data),
  // resetPassword: (data: { token: string; new_password: string }) => apiRequest<void>(`/auth/reset-password/${data.token}/`, 'POST', { new_password: data.new_password }),

  // Admin endpoints
  getAllUsers: () => apiRequest<PaginatedResponse<User>>('/auth/users/'),
  getLearnersCount: () => apiRequest<{ count: number }>('/auth/learners/count/'),
  getLearners: (page: number = 1, pageSize: number = 10, search: string = '') => 
    apiRequest<{results: User[]; count: number; next: string | null; previous: string | null}>(
      `/auth/users/learners/?page=${page}&page_size=${pageSize}&search=${search}`
    ),
  getNonLearners: () => apiRequest<PaginatedResponse<User>>('/auth/users/non-learners/'),
  // getNonLearners: (page: number = 1, pageSize: number = 10) =>
  //   apiRequest<PaginatedResponse<User>>(
  //     `auth/users/non-learners/`,
  //     'GET'
  //   ),
  getUser: (id: string) => apiRequest<User>(`/auth/users/${id}/`),
  updateUser: (id: string, user: Partial<User>) => apiRequest<User>(`/auth/users/update/${id}/`, 'PUT', user),
  deleteUser: (id: string) => apiRequest(`/auth/users/delete/${id}/`, 'DELETE'),
  changePassword: (data: { old_password: string; new_password: string }) => 
    apiRequest('/auth/change-password/', 'PUT', data),

  uploadProfileImage: (formData: FormData) => {
    return apiRequest<{ profile_image_url: string }>(
      '/auth/profile/image/',
      'POST',
      formData,
      {}, // Empty headers object
      false // isBinary
    );
  },
 
  // resendVerificationEmail: () => 
  //   apiRequest('/auth/resend-verification-email/', 'POST'),
  
  // requestPasswordReset: (data: { email: string }) => 
  //   apiRequest('/auth/request-password-reset/', 'POST', data),
  
  // // resetPassword: (data: { token: string; new_password: string }) => 
  // //   apiRequest('/auth/reset-password/', 'POST', data),
  resetPassword: (data: { token: string; new_password: string }) => 
    apiRequest(`/auth/reset-password/${data.token}/`, 'POST', { new_password: data.new_password }),
};

// Courses API
export const coursesApi = {
  // Course operations
  getAllCourses: () => apiRequest<PaginatedResponse<Course>>('/courses/'),
  getCourse: (id: string) => apiRequest<Course>(`/courses/${id}/`),
  createCourse: (course: Partial<Course>) => apiRequest<Course>('/courses/', 'POST', course),
  updateCourse: (id: string, course: Partial<Course>) => apiRequest<Course>(`/courses/${id}/`, 'PUT', course),
  deleteCourse: (id: string) => apiRequest(`/courses/${id}/`, 'DELETE'),
  
  // Course workflow
  approveCourse: (id: string) => apiRequest<Course>(`/courses/approve/${id}/`, 'POST'),
  rejectCourse: (id: string, reason: string) => apiRequest<Course>(`/courses/reject/${id}/`, 'POST', { reason }),
  publishCourse: (id: string) => apiRequest<Course>(`/courses/publish/${id}/`, 'POST'),

  // Module operations
  getModules: (courseId: string) => apiRequest<PaginatedResponse<Module>>(`/courses/${courseId}/modules/`),
  getModule: (courseId: string, moduleId: string) => apiRequest<Module>(`/courses/${courseId}/modules/${moduleId}/`),
  createModule: (courseId: string, module: Partial<Module>) => apiRequest<Module>(`/courses/${courseId}/modules/`, 'POST', module),
  updateModule: (courseId: string, moduleId: string, module: Partial<Module>) => apiRequest<Module>(`/courses/${courseId}/modules/${moduleId}/`, 'PUT', module),
  deleteModule: (courseId: string, moduleId: string) => apiRequest(`/courses/${courseId}/modules/${moduleId}/`, 'DELETE'),

  // Lesson operations
  getLessons: (courseId: string, moduleId: string) => apiRequest<PaginatedResponse<Lesson>>(`/courses/${courseId}/modules/${moduleId}/lessons/`),
  getLesson: (courseId: string, moduleId: string, lessonId: string) => apiRequest<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`),
  // getLesson: (courseId: string, moduleId: string, lessonId: string) => apiRequest<LessonResponse>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`),
  
  createLesson: (courseId: string, moduleId: string, lesson: Partial<Lesson> | FormData) => {
    return apiRequest<Lesson>(
      `/courses/${courseId}/modules/${moduleId}/lessons/`,
      'POST',
      lesson
    );
  },

  updateLesson: (courseId: string, moduleId: string, lessonId: string, lesson: Partial<Lesson> | FormData) => {
    return apiRequest<Lesson>(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`,
      'PUT',
      lesson
    );
  },
  // createLesson: (courseId: string, moduleId: string, lesson: Partial<Lesson>) => apiRequest<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons/`, 'POST', lesson),
  // updateLesson: (courseId: string, moduleId: string, lessonId: string, lesson: Partial<Lesson>) => apiRequest<Lesson>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`, 'PUT', lesson),
  deleteLesson: (courseId: string, moduleId: string, lessonId: string) => apiRequest(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/`, 'DELETE'),

   // Lesson sections
   getLessonsWithSections: (courseId: string, moduleId: string) => 
    apiRequest<(Lesson & { sections: LessonSection[]; has_quiz: boolean })[]>(
      `/courses/${courseId}/modules/${moduleId}/lessons-with-sections/`
    ),
  getLessonSections: (courseId: string, moduleId: string, lessonId: string) => 
    apiRequest<PaginatedResponse<LessonSection>>(
      `/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/sections/`
    ),
  createLessonSection: (courseId: string, moduleId: string, lessonId: string, section: Partial<LessonSection> | FormData) => 
    apiRequest<LessonSection>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/sections/`, 'POST', section),
  
  updateLessonSection: (courseId: string, moduleId: string, lessonId: string, sectionId: string, section: Partial<LessonSection> | FormData) => 
    apiRequest<LessonSection>(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/sections/${sectionId}/`, 'PUT', section),
  deleteLessonSection: (courseId: string, moduleId: string, lessonId: string, sectionId: string) => 
      apiRequest(`/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/sections/${sectionId}/`, 'DELETE'),

 // User progress
 getModuleProgress: (moduleId: string) => 
  apiRequest<{ is_completed: boolean }>(`/courses/module-progress/get_progress/?module_id=${moduleId}`),

markModuleCompleted: (moduleId: string) => 
  apiRequest<{ is_completed: boolean }>(`/courses/module-progress/mark-completed/`, 'POST', { module_id: moduleId }),

 getUserProgress: () => apiRequest<UserProgress[]>('/courses/user/progress/all/'),
 createProgress: (progress: Partial<UserProgress>) => 
   apiRequest<UserProgress>('/courses/user/progress/all/', 'POST', progress),
 updateProgress: (lessonId: string, isCompleted: boolean) => 
  apiRequest<UserProgress>(`/courses/user/progress/lesson/${lessonId}/`, 'PUT', { 
    is_completed: isCompleted 
  }),
 getLessonProgress: (lessonId: string) => 
   apiRequest<UserProgress>(`/courses/user/progress/lesson/${lessonId}/`),
 getCourseProgress: (courseId: string) => 
   apiRequest<{ completed: number; total: number; percentage: number }>(
     `/courses/user/progress/course/${courseId}/`
   ),
 getAllProgress: () => 
   apiRequest<Array<{
     course_id: string;
     course_title: string;
     percentage: number;
   }>>('/courses/user/progress/all/'),
 toggleLessonCompletion: (lessonId: string) => 
   apiRequest<UserProgress>('/courses/user/progress/toggle/', 'POST', { lesson: lessonId }),

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
  // getUserEnrollments: () => apiRequest<{course_id: string}[]>('/courses/user/enrollments/'),
  getUserEnrollments: () => apiRequest<{ course_id: string; course_title: string }[]>('/courses/user/enrollments/'),
  getCourseEnrollments: (courseId: string) => 
    apiRequest<{ course_id: string; course_title: string; enrollment_count: number }>(
      `/courses/${courseId}/enrollments/`
    ),
    getCompletionRates: () => apiRequest<{overall_completion_rate: number; courses: Array<{
          course_id: string; course_title: string; enrollments: number; completions: number;
          completion_rate: number;}>;
      }>('/courses/completion-rates/'),
};

// Categories API
export const categoriesApi = {
  getAllCategories: () => apiRequest<PaginatedResponse<CourseCategory>>('/courses/categories/'),
  getCategory: (id: string) => apiRequest<CourseCategory>(`/courses/categories/${id}/`),
  createCategory: (category: Partial<CourseCategory>) => apiRequest<CourseCategory>('/courses/categories/', 'POST', category),
  updateCategory: (id: string, category: Partial<CourseCategory>) => apiRequest<CourseCategory>(`/courses/categories/${id}/`, 'PUT', category),
  deleteCategory: (id: string) => apiRequest(`/courses/categories/${id}/`, 'DELETE'),
};

// Assessments API
export const assessmentsApi = {
  // Questions
  // In api.ts, under assessmentsApi
getQuestions: (lessonId: string) => apiRequest<PaginatedResponse<Question>>(`/assessments/lessons/${lessonId}/questions/`),
  createQuestion: (lessonId: string, question: Partial<Question>) => 
    apiRequest<Question>(`/assessments/lessons/${lessonId}/questions/`, 'POST', question),
  updateQuestion: (lessonId: string, questionId: string, question: Partial<Question>) => 
    apiRequest<Question>(`/assessments/lessons/${lessonId}/questions/${questionId}/`, 'PUT', question),
  deleteQuestion: (lessonId: string, questionId: string) => 
    apiRequest(`/assessments/lessons/${lessonId}/questions/${questionId}/`, 'DELETE'),
  getUserAttempts: () => apiRequest<{ status: string; data: { [key: string]: UserAttempt }; count: number }>(`/assessments/user-attempts/`),



  // Answers
  getAnswers: (questionId: string) => apiRequest<PaginatedResponse<Answer>>(`/assessments/questions/${questionId}/answers/`),
  createAnswer: (questionId: string, answer: Partial<Answer>) => 
    apiRequest<Answer>(`/assessments/questions/${questionId}/answers/`, 'POST', answer),
  updateAnswer: (questionId: string, answerId: string, answer: Partial<Answer>) => 
    apiRequest<Answer>(`/assessments/questions/${questionId}/answers/${answerId}/`, 'PUT', answer),
  deleteAnswer: (questionId: string, answerId: string) => 
    apiRequest(`/assessments/questions/${questionId}/answers/${answerId}/`, 'DELETE'),

  getQuiz: (lessonId: string) => apiRequest<{ lesson: Lesson; questions: Question[] }>(`/assessments/lessons/${lessonId}/quiz/`),
  getAttemptResponses: (attemptId: string) => 
    apiRequest<UserResponse[]>(`/assessments/user-attempts/${attemptId}/responses/`, 'GET'),

  // submitQuiz: (lessonId: string, answers: { answers: Record<string, string | string[]> }) => 
  //   apiRequest<QuizSubmitResponse>(`/assessments/lessons/${lessonId}/quiz/`, 'POST', answers),
  
  submitQuiz: (lessonId: string, answers:  { answers: Record<string, string | string[]> }) =>
    apiRequest<{ score: number; passed: boolean; correct_answers: number; total_questions: number; attempt_id: string; }>(
      `/assessments/lessons/${lessonId}/quiz/`, 
      'POST', 
      { answers }
    ),

    // Module Surveys
    getModuleSurveys: (courseId: string, moduleId: string) =>
      apiRequest<Survey[]>(`/assessments/${courseId}/modules/${moduleId}/survey/`, 'GET'),
  
    createModuleSurvey: (courseId: string, moduleId: string, survey: CreateSurveyPayload) =>
      apiRequest<Survey>(`/assessments/${courseId}/modules/${moduleId}/survey/`, 'POST', survey),
  
    deleteModuleSurvey: (courseId: string, moduleId: string, surveyId: string) =>
      apiRequest(`/assessments/${courseId}/modules/${moduleId}/survey/${surveyId}/`, 'DELETE'),
  
    getSurveyQuestions: (surveyId: string) =>
      apiRequest<SurveyQuestion[]>(`/assessments/surveys/${surveyId}/questions/`, 'GET'),
  
    createSurveyQuestion: (surveyId: string, question: SurveyQuestionPayload) =>
      apiRequest<SurveyQuestion>(`/assessments/surveys/${surveyId}/questions/`, 'POST', question),
  
    updateSurveyQuestion: (surveyId: string, questionId: string, question: SurveyQuestionPayload) =>
      apiRequest<SurveyQuestion>(`/assessments/surveys/${surveyId}/questions/${questionId}/`, 'PUT', question),
  
    deleteSurveyQuestion: (surveyId: string, questionId: string) =>
      apiRequest(`/assessments/surveys/${surveyId}/questions/${questionId}/`, 'DELETE'),
  
    // Survey Questions
    // getSurveyQuestions: (surveyId: string) =>
    //   apiRequest<SurveyQuestion[]>(`/assessments/surveys/${surveyId}/questions/`),
  
    // createSurveyQuestion: (surveyId: string, question: Omit<SurveyQuestion, 'id' | 'survey'>) =>
    //   apiRequest<SurveyQuestion>(`/assessments/surveys/${surveyId}/questions/`, 'POST', question),

    submitSurveyResponse: (data: {
      survey_id: string;
      answers: Array<{
        question: string;
        text_answer?: string;
        choice_answer?: string;
        scale_answer?: number;
      }>;
    }) => apiRequest<SurveyResponse>('/assessments/survey-responses/', 'POST', data),
  
    // updateSurveyQuestion: (surveyId: string, questionId: string, question: Partial<SurveyQuestion>) =>
    //   apiRequest<SurveyQuestion>(`/assessments/surveys/${surveyId}/questions/${questionId}/`, 'PUT', question),
  
    // deleteSurveyQuestion: (surveyId: string, questionId: string) =>
    //   apiRequest(`/assessments/surveys/${surveyId}/questions/${questionId}/`, 'DELETE'),
  
    // Survey Choices
    createSurveyChoice: (questionId: string, choice: Omit<SurveyChoice, 'id' | 'question'>) =>
      apiRequest<SurveyChoice>(`/assessments/survey-questions/${questionId}/choices/`, 'POST', choice),
  
    updateSurveyChoice: (questionId: string, choiceId: string, choice: Partial<SurveyChoice>) =>
      apiRequest<SurveyChoice>(`/assessments/survey-questions/${questionId}/choices/${choiceId}/`, 'PUT', choice),
  
    deleteSurveyChoice: (questionId: string, choiceId: string) =>
      apiRequest(`/assessments/survey-questions/${questionId}/choices/${choiceId}/`, 'DELETE'),
    // submitSurveyResponse: (data: {
    //   survey_id: string;
    //   answers: Array<{
    //     question_id: string;
    //     text_answer?: string;
    //     choice_answer?: string;
    //     scale_answer?: number;
    //   }>;
    // }) => apiRequest<SurveyResponse>('/assessments/survey-responses/', 'POST', data),
    getSurvey: (surveyId: string) => 
      apiRequest<Survey>(`/assessments/surveys/${surveyId}/`),
  
    getSurveyResponses: (surveyId: string) =>
      apiRequest<PaginatedSurveyResponse>(`/assessments/surveys/${surveyId}/responses/`),
    
    getSurveyResponse: (responseId: string) =>
      apiRequest<SurveyResponse>(`/assessments/survey-responses/${responseId}/`),

    getSurveys: () => 
      apiRequest<Survey[]>(`/assessments/surveys/`),
  
    getModuleSurveyResponses: (courseId: string, moduleId: string, surveyId: string) =>
      apiRequest<SurveyResponse[]>(
        `/assessments/modules/${moduleId}/survey/${surveyId}/responses/`
      ),

  };
  
// Certificates API
export const certificatesApi = {
  getUserCertificates: () => apiRequest<PaginatedResponse<Certificate>>('/certificates/user/'),
  getCourseCertificate: (courseId: string) => 
    apiRequest<Certificate[]>(`/certificates/user/?course_id=${courseId}`),
  generateCertificate: (courseId: string) => 
    apiRequest<Certificate>(`/certificates/generate/${courseId}/`, 'POST'),
  verifyCertificate: (certificateNumber: string) => 
    apiRequest<{ valid: boolean; certificate: Certificate }>(`/certificates/verify/${certificateNumber}/`),
  downloadCertificate: (certificateId: string) => 
    apiRequest<Blob>(`/certificates/download/${certificateId}/`, 
      'GET', 
      undefined, {
        'Accept': 'application/pdf',
      },
      true  
    ),
    getCertificateTemplates: () => 
      apiRequest<PaginatedResponse<CertificateTemplate>>('/certificates/templates/'),
    
    createCertificateTemplate: (formData: FormData) => 
      apiRequest<CertificateTemplate>(
        '/certificates/templates/',
        'POST',
        formData,
        {},
        false
      ),
    deleteCertificateTemplate: (id: string) => 
      apiRequest(`/certificates/templates/${id}/`, 'DELETE'),
};

// Analytics API
export const analyticsApi = {
  getUserActivity: (timeFilter: string = '7d') => 
    apiRequest<any>(`/analytics/user-activity/?time_filter=${timeFilter}`),
  
  getCourseProgress: (courseId?: string) => 
    courseId 
      ? apiRequest<any>(`/analytics/course-progress/?course_id=${courseId}`)
      : apiRequest<any>('/analytics/course-progress/'),
  
  getEnrollmentStats: (timeRange: string = 'monthly') => 
    apiRequest<any>(`/analytics/enrollment-stats/?time_range=${timeRange}`),
  
  getCompletionRates: () => 
    apiRequest<any>('/analytics/completion-rates/'),
  
  getQuizPerformance: (courseId?: string) => 
    courseId 
      ? apiRequest<any>(`/analytics/quiz-performance/?course_id=${courseId}`)
      : apiRequest<any>('/analytics/quiz-performance/'),

  exportReport: (type: string, timeFilter: string, format: string) => 
    apiRequest<{ download_url: string }>(
      `/analytics/export-report/?type=${type}&time_filter=${timeFilter}&format=${format}`
    ),

  getModuleCoverage: (courseId: string) => 
    apiRequest<{
      course_id: string;
      course_title: string;
      modules: string[];
      learners: {
        user_id: string;
        name: string;
        module_progress: {
          module_id: string;
          completed: boolean;
          completed_at: string | null;
        }[];
      }[];
    }>(`/analytics/module-coverage/${courseId}/`),
};

// Notifications API
export const notificationsApi = {
  // Get all notifications
  getNotifications: () => apiRequest<PaginatedResponse<Notification>>('/notifications/notifications/'),
  // Get unread notifications
  getUnreadNotifications: () => apiRequest<PaginatedResponse<Notification>>('/notifications/notifications/unread/'),
  // Mark a notification as read
  markAsRead: (notificationId: string) => 
    apiRequest(`/notifications/notifications/${notificationId}/mark_as_read/`, 'POST'),
  // Mark all notifications as read
  markAllAsRead: () => 
    apiRequest('/notifications/notifications/mark_all_as_read/', 'POST'),
  // Get unread count
  getUnreadCount: () => 
    apiRequest<{ unread_count: number }>('/notifications/notifications/count_unread/'),
  // Get notification preferences
  getPreferences: () => 
    apiRequest<NotificationPreference[]>('/notifications/preferences/'),
  
  // Update notification preferences
  updatePreferences: (preferencesId: string, preferences: Partial<NotificationPreference>) => 
    apiRequest<NotificationPreference>(`/notifications/preferences/${preferencesId}/`, 'PUT', preferences),
};


// Types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'LEARNER' | 'CONTENT_MANAGER' | 'ADMIN';
  is_active: boolean;
  date_joined: string;
  status: string;
  date_registered: string;
  gender: string;
  profile_image: string | null;
  phone: string;
  date_of_birth: string;
  county: string;
  education: string;
  innovation: string;
  innovation_stage: string;
  innovation_in_whitebox: string;
  innovation_industry: string;
  training: string;
  training_institution: string;
  agreed_to_terms: boolean;
  is_verified: boolean;
  is_staff?: boolean;
  last_login?: string | null;
}

interface ResendVerificationResponse {
  message: string;
}

// Add to your Types section
export interface LessonResponse {
  id: string;
  module: string | Module;
  title: string;
  content_type: string;
  content: string;
  duration_minutes: number;
  order: number;
  is_required: boolean;
  created_at: string;
  sections?: LessonSection[];
  questions?: Question[];
  description?: string;
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
  description?: string;
  sections: LessonSection[];
}

export interface LessonSection {
  id: string;
  lesson: string | Lesson;
  title: string;
  content: string;
  order: number;
  is_subsection: boolean;
  parent_section: string | LessonSection | null;
  created_at: string;
  subsections?: LessonSection[];
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

export interface QuizSubmitResponse {
  attempt_id: string;
  score: number;
  passed: boolean;
  correct_answers: number;
  questions: Question[];
  total_questions: number;
}
export interface UserProgress {
  id: string;
  user: string | User;
  lesson: string | Lesson;
  is_completed: boolean;
  completed_at: string | null;
  last_accessed: string;
}

export interface CreateSurveyPayload {
  title: string;
  description: string;
  is_active?: boolean;
}

export interface SurveyQuestionPayload {
  question_text: string;
  question_type: 'MCQ' | 'TEXT' | 'SCALE';
  is_required: boolean;
  order: number;
  choices?: { choice_text: string; order: number }[];
}
export interface PaginatedSurveyResponse {
  status: string;
  count: number;
  data: SurveyResponse[];
}
export interface Certificate {
  id: string;
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    description: string;
  };
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

// Add to your Types section
export interface Survey {
  id: string;
  module: string | Module;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  questions?: SurveyQuestion[];
}

export interface SurveyQuestion {
  id: string;
  survey: string | Survey;
  question_text: string;
  question_type: 'MCQ' | 'TEXT' | 'SCALE';
  is_required: boolean;
  order: number;
  choices?: SurveyChoice[];
}

export interface SurveyChoice {
  id: string;
  question: string | SurveyQuestion;
  choice_text: string;
  order: number;
}

export interface SurveyResponse {
  id: string;
  survey: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
    };
  };
  user: {
    id: string;
    email: string;
    name: string;
  };
  submitted_at: string;
  answers?: SurveyAnswer[];
}

export interface SurveyAnswer {
  id: string;
  response: string | SurveyResponse;
  question: string 
  text_answer?: string;
  choice_answer?: string;
  scale_answer?: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface UserAttempt {
  id: string;
  user: string | User;
  lesson: {
    id: string;
    title: string;
    module: {
      id: string;
      title: string;
      course: {
        id: string;
        title: string;
      };
    };
  };
  score: number | { source: string; parsedValue: number };
  max_score: number;
  passed: boolean;
  attempt_date: string;
  completion_date: string | null;
  responses?: UserResponse[];
}

export interface UserResponse {
  id: string;
  attempt: string | UserAttempt;
  question: {
    id: string;
    question_text: string;
    question_type: string;
    points: number;
  };
  selected_answer?: {
    id: string;
    answer_text: string;
    is_correct: boolean;
  };
  text_response?: string;
  is_correct: boolean;
}

// Add to your Types section in api.ts

export interface Notification {
  id: string;
  recipient: string | User;
  title: string;
  message: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  related_object_id: string | null;
  related_content_type: string | null;
  action_url: string | null;
  created_at: string;
  time_since?: string;
}

export interface NotificationPreference {
  id: string;
  user: string | User;
  course_updates: boolean;
  new_content: boolean;
  deadline_reminders: boolean;
  live_session_reminders: boolean;
  forum_replies: boolean;
  mentions: boolean;
  certificate_issued: boolean;
  course_completed: boolean;
  progress_reports: boolean;
  user_reports: boolean;
  system_alerts: boolean;
  course_approvals: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  updated_at: string;
}