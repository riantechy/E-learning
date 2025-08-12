import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { coursesApi, assessmentsApi } from '@/lib/api';

export const useLessonsManagement = () => {
  const { courseId, moduleId } = useParams() as { courseId: string; moduleId: string };
  const [lessons, setLessons] = useState<any[]>([]);
  const [module, setModule] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [itemType, setItemType] = useState<'lesson' | 'section' | 'quiz' | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pdf_file: '',
    content: '',
    content_type: 'TEXT',
    video_url: '',
    duration_minutes: 0,
    order: 0,
    is_required: true,
    is_subsection: false,
    parent_section: '',
  });

  useEffect(() => {
    console.log('courseId:', courseId, 'moduleId:', moduleId);
    if (!moduleId) {
      setError('Module ID is missing or invalid');
    }
    fetchData();
  }, [courseId, moduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [courseRes, moduleRes, lessonsRes] = await Promise.all([
        coursesApi.getCourse(courseId),
        coursesApi.getModule(courseId, moduleId),
        coursesApi.getLessonsWithSections(courseId, moduleId),
      ]);

      if (courseRes.data) setCourse(courseRes.data);
      if (moduleRes.data) setModule(moduleRes.data);
      
      const lessonsData = lessonsRes.data?.results || lessonsRes.data || [];
      
      const organizedLessons = await Promise.all(
        lessonsData.map(async (lesson: any) => {
          const sectionsRes = await coursesApi.getLessonSections(courseId, moduleId, lesson.id);
          const sections = sectionsRes.data?.results || sectionsRes.data || [];
          
          const isQuiz = lesson.content_type === 'QUIZ';
          let hasQuiz = false;
          
          if (isQuiz) {
            try {
              const quizRes = await assessmentsApi.getQuestions(lesson.id);
              hasQuiz = quizRes.data.results && (quizRes.data.results || quizRes.data).length > 0;
            } catch (error) {
              console.error('Error checking quiz questions:', error);
              hasQuiz = false;
            }
          }
          
          return {
            ...lesson,
            sections: sections.sort((a: any, b: any) => a.order - b.order),
            hasQuiz,
          };
        })
      );
      
      setLessons(organizedLessons.sort((a, b) => a.order - b.order));
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageQuestions = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return;
    // Implement question management logic if needed
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'duration_minutes' ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent, data: FormData) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Debug FormData contents
      console.log('useLessonsManagement handleSubmit FormData contents:');
      for (const [key, value] of data.entries()) {
        console.log(`${key}: ${typeof value === 'object' && value instanceof File ? value.name : value}`);
      }

      // Ensure module is included
      if (!data.get('module')) {
        data.append('module', moduleId);
      }

      let response;
      if (itemType === 'lesson') {
        if (currentItem) {
          response = await coursesApi.updateLesson(courseId, moduleId, currentItem.id, data);
        } else {
          response = await coursesApi.createLesson(courseId, moduleId, data);
        }
      } else if (itemType === 'section') {
        const lessonId = currentItem?.lesson?.id || data.get('lesson')?.toString();
        
        if (!lessonId) {
          setError('Lesson ID is required for section operations');
          return;
        }

        if (currentItem?.id) {
          response = await coursesApi.updateLessonSection(courseId, moduleId, lessonId, currentItem.id, data);
        } else {
          response = await coursesApi.createLessonSection(courseId, moduleId, lessonId, data);
        }
      } else if (itemType === 'quiz') {
        data.set('content_type', 'QUIZ');
        data.set('title', `${data.get('title') || 'Quiz'} Quiz`);

        if (currentItem?.id) {
          response = await coursesApi.updateLesson(courseId, moduleId, currentItem.id, data);
        } else {
          response = await coursesApi.createLesson(courseId, moduleId, data);
        }
      }

      if (response?.error) {
        if (typeof response.error === 'object') {
          const errorMessages = Object.entries(response.error)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
            .join('; ');
          setError(errorMessages);
        } else {
          setError(response.error);
        }
      } else {
        setShowModal(false);
        await fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving: ' + (err instanceof Error ? err.message : 'Unknown error'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any, type: 'lesson' | 'section' | 'quiz') => {
    console.log('Editing item:', item, 'Type:', type);
    setCurrentItem(item);
    setItemType(type);
    
    if (type === 'lesson') {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        content: item.content || '',
        pdf_file: item.pdf_file || '',
        content_type: item.content_type || 'TEXT',
        duration_minutes: item.duration_minutes ?? 0,
        order: item.order ?? 0,
        is_required: item.is_required ?? true,
        is_subsection: false,
        parent_section: '',
      });
    } else if (type === 'section') {
      setFormData({
        title: item.title || '',
        description: '',
        pdf_file: '',
        content: item.content || '',
        content_type: 'TEXT',
        duration_minutes: 0,
        order: item.order ?? 0,
        is_required: true,
        is_subsection: item.is_subsection ?? false,
        parent_section: item.is_subsection ? item.parent_section?.id || '' : '',
      });
    } else if (type === 'quiz') {
      setFormData({
        title: item.title.replace(' Quiz', '') || '',
        description: '',
        pdf_file: '',
        content: item.content || '',
        content_type: 'QUIZ',
        duration_minutes: item.duration_minutes ?? 0,
        order: item.order ?? 0,
        is_required: item.is_required ?? true,
        is_subsection: false,
        parent_section: '',
      });
    }
    
    setShowModal(true);
  };

  const handleNewItem = (type: 'lesson' | 'section' | 'quiz', parentItem?: any) => {
    console.log('Creating new item:', type, 'Parent:', parentItem);
    setCurrentItem(parentItem);
    setItemType(type);
    
    const baseData = {
      title: '',
      description: '',
      content: '',
      pdf_file: '',
      content_type: type === 'quiz' ? 'QUIZ' : 'TEXT',
      duration_minutes: 0,
      order: lessons.length > 0 ? Math.max(...lessons.map((l) => l.order)) + 1 : 0,
      is_required: true,
      is_subsection: false,
      parent_section: '',
      lesson: parentItem?.lesson || null,
    };
    
    setFormData(baseData);
    setShowModal(true);
  };

  const handleDelete = async (type: 'lesson' | 'section' | 'quiz', id: string, lessonId?: string) => {
    const message = type === 'lesson'
      ? 'Are you sure you want to delete this lesson? All sections and quiz will also be deleted.'
      : type === 'section'
      ? 'Are you sure you want to delete this section?'
      : 'Are you sure you want to delete this quiz? All questions will be deleted.';

    if (confirm(message)) {
      try {
        setLoading(true);
        let response;
        
        if (type === 'lesson') {
          response = await coursesApi.deleteLesson(courseId, moduleId, id);
        } else if (type === 'section') {
          response = await coursesApi.deleteLessonSection(courseId, moduleId, lessonId!, id);
        } else if (type === 'quiz') {
          response = await coursesApi.deleteLesson(courseId, moduleId, id);
        }

        if (response?.error) {
          setError(response.error);
        } else {
          await fetchData();
        }
      } catch (err) {
        setError(`Failed to delete ${type}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getParentSections = (lessonId: string) => {
    const lesson = lessons.find((l) => l.id === lessonId);
    if (!lesson) return [];
    return lesson.sections.filter((section: any) => !section.is_subsection);
  };

  return {
    course,
    module,
    lessons,
    loading,
    error,
    showModal,
    formData,
    itemType,
    currentItem,
    setShowModal,
    handleInputChange,
    handleSubmit,
    handleNewItem,
    handleEdit,
    handleDelete,
    getParentSections,
    fetchData,
    onManageQuestions: handleManageQuestions,
  };
};