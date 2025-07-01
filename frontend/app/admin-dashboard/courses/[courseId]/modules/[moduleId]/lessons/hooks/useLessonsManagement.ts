// useLessonsManagement.ts
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
    content: '',
    content_type: 'TEXT',
    duration_minutes: 0,
    order: 0,
    is_required: true,
    is_subsection: false,
    parent_section: '',
  });

  useEffect(() => {
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
        if (lessonsRes.data) {
            const organizedLessons = await Promise.all(
            lessonsRes.data.map(async (lesson: any) => {
                const sectionsRes = await coursesApi.getLessonSections(courseId, moduleId, lesson.id);
                const sections = sectionsRes.data || [];
                
                // Check if lesson is a quiz
                const isQuiz = lesson.content_type === 'QUIZ';
                let hasQuiz = false;
                
                if (isQuiz) {
                try {
                    const quizRes = await assessmentsApi.getQuestions(lesson.id);
                    hasQuiz = quizRes.data && quizRes.data.length > 0;
                } catch (error) {
                    console.error('Error checking quiz questions:', error);
                    hasQuiz = false;
                }
                }
                
                return {
                ...lesson,
                sections: sections.sort((a: any, b: any) => a.order - b.order),
                hasQuiz
                };
            })
            );
            setLessons(organizedLessons.sort((a, b) => a.order - b.order));
        }
        } catch (err) {
        setError('An error occurred while fetching data');
        console.error(err);
        } finally {
        setLoading(false);
        }
    };

    const handleManageQuestions = (lessonId: string) => {
      const lesson = lessons.find(l => l.id === lessonId);
      if (!lesson) return;
    
      setCurrentLessonId(lessonId);
    };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      let response;
      
      if (itemType === 'lesson') {
        const dataToSend = {
          title: formData.title,
          description: formData.description,
          content_type: formData.content_type,
          content: formData.content,
          duration_minutes: formData.duration_minutes,
          order: formData.order,
          is_required: formData.is_required,
          module: moduleId,
        };
        
        if (currentItem) {
          response = await coursesApi.updateLesson(courseId, moduleId, currentItem.id, dataToSend);
        } else {
          response = await coursesApi.createLesson(courseId, moduleId, dataToSend);
        }
      } 
      else if (itemType === 'section') {
        const lessonId = currentItem?.lesson?.id || formData.lesson?.id;
        
        if (!lessonId) {
          setError('Lesson ID is required for section operations');
          return;
        }
    
        const dataToSend = {
          title: formData.title,
          content: formData.content,
          order: formData.order,
          is_subsection: formData.is_subsection,
          parent_section: formData.is_subsection ? formData.parent_section : null,
          lesson: lessonId
        };
        
        if (currentItem?.id) {
          response = await coursesApi.updateLessonSection(
            courseId, 
            moduleId,
            lessonId, 
            currentItem.id, 
            dataToSend
          );
        } else {
          response = await coursesApi.createLessonSection(
            courseId, 
            moduleId,
            lessonId, 
            dataToSend
          );
        }
      }
      else if (itemType === 'quiz') {
        const quizLesson = {
          title: `${formData.title} Quiz`,
          content_type: 'QUIZ',
          content: formData.description || 'Quiz content',
          duration_minutes: formData.duration_minutes,
          order: formData.order,
          is_required: formData.is_required,
          module: moduleId
        };
    
        if (currentItem?.id) {
          response = await assessmentsApi.updateQuestion(
            courseId, 
            moduleId, 
            currentItem.id, 
            quizLesson
          );
        } else {
          response = await assessmentsApi.createQuestion(
            courseId, 
            moduleId, 
            quizLesson
          );
        }
      }
  
      if (response?.error) {
        setError(response.error);
      } else {
        setShowModal(false);
        await fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any, type: 'lesson' | 'section' | 'quiz') => {
    setCurrentItem(item);
    setItemType(type);
    
    if (type === 'lesson') {
      setFormData({
        title: item.title,
        description: item.description,
        content: item.content,
        content_type: item.content_type,
        duration_minutes: item.duration_minutes,
        order: item.order,
        is_required: item.is_required,
        is_subsection: false,
        parent_section: '',
      });
    } 
    else if (type === 'section') {
      setFormData({
        title: item.title,
        description: '',
        content: item.content,
        content_type: 'TEXT',
        duration_minutes: 0,
        order: item.order,
        is_required: true,
        is_subsection: item.is_subsection,
        parent_section: item.is_subsection ? item.parent_section?.id : '',
      });
    }
    else if (type === 'quiz') {
      setFormData({
        title: item.title.replace(' Quiz', ''),
        description: '',
        content: item.content,
        content_type: 'QUIZ',
        duration_minutes: item.duration_minutes,
        order: item.order,
        is_required: item.is_required,
        is_subsection: false,
        parent_section: '',
      });
    }
    
    setShowModal(true);
  };

  const handleNewItem = (type: 'lesson' | 'section' | 'quiz', parentItem?: any) => {
    setCurrentItem(parentItem);
    setItemType(type);
    
    const baseData = {
        title: '',
        description: '',
        content: '',
        content_type: type === 'quiz' ? 'QUIZ' : 'TEXT',
        duration_minutes: 0,
        order: lessons.length > 0 ? Math.max(...lessons.map(l => l.order)) + 1 : 0,
        is_required: true,
        is_subsection: false,
        parent_section: '',
        lesson: parentItem?.lesson || null 
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
        } 
        else if (type === 'section') {
          response = await coursesApi.deleteLessonSection(courseId, moduleId, lessonId!, id);
        }
        else if (type === 'quiz') {
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
    const lesson = lessons.find(l => l.id === lessonId);
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
    onManageQuestions: handleManageQuestions
  };
};