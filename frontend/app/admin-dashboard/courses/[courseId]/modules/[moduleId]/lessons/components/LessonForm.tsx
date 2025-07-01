import { useState } from 'react';
import { Form, Modal, Button } from 'react-bootstrap';

interface LessonFormProps {
  show: boolean;
  onHide: () => void;
  formData: any;
  itemType: 'lesson' | 'section' | 'quiz' | null;
  currentItem: any;
  lessons: any[];
  onSubmit: (e: React.FormEvent) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  loading: boolean;
}

const LessonFormModal = ({
    show,
    onHide,
    formData,
    itemType,
    currentItem,
    lessons,
    onSubmit,
    onInputChange,
    loading,
    getParentSections
  }: LessonFormProps & { getParentSections: (lessonId: string) => any[] }) => {

    const [quizFormData, setQuizFormData] = useState<QuizFormData>({
        ...formData,
        answers: formData.answers || [
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false },
          { answer_text: '', is_correct: false }
        ]
      });

      const handleAnswerChange = (index: number, field: keyof Answer, value: string | boolean) => {
        const newAnswers = [...quizFormData.answers];
        newAnswers[index] = { ...newAnswers[index], [field]: value };
        setQuizFormData(prev => ({ ...prev, answers: newAnswers }));
      };
    
      const handleQuizInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setQuizFormData(prev => ({ ...prev, [name]: value }));
      };
    
      const handleQuizSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...e, target: { ...e.target, value: quizFormData } });
      };

    const getValidParentSections = () => {
        if (!currentItem && itemType === 'section') {
          // For new sections, show all non-subsection sections from the same lesson
          return lessons.flatMap(lesson => 
            lesson.sections
              .filter((s: any) => !s.is_subsection)
              .map((section: any) => ({
                ...section,
                lessonId: lesson.id
              }))
          );
        } else if (currentItem && itemType === 'section') {
          // For editing sections, show sections from the same lesson only
          const currentLessonId = currentItem.lesson?.id || currentItem.lessonId;
          const currentLesson = lessons.find(l => l.id === currentLessonId);
          return currentLesson?.sections
            .filter((s: any) => !s.is_subsection && s.id !== currentItem.id) || [];
        }
        return [];
      };

      const currentFormData = itemType === 'quiz' ? quizFormData : formData;
      const currentOnSubmit = itemType === 'quiz' ? handleQuizSubmit : onSubmit;
      const currentOnInputChange = itemType === 'quiz' ? handleQuizInputChange : onInputChange;

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {currentItem ? `Edit ${itemType}` : `Add New ${itemType}`}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={onSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              required
            />
          </Form.Group>

          {itemType === 'lesson' && (
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={onInputChange}
              />
            </Form.Group>
          )}

          {itemType === 'lesson'  && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Content Type</Form.Label>
                <Form.Select
                  name="content_type"
                  value={formData.content_type}
                  onChange={onInputChange}
                  required
                  disabled={itemType === 'quiz'}
                >
                  <option value="TEXT">Text</option>
                  <option value="VIDEO">Video</option>
                  <option value="PDF">PDF</option>
                  <option value="QUIZ">Quiz</option>
                  {/* {itemType === 'quiz' && <option value="QUIZ">Quiz</option>} */}
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={5}
                  name="content"
                  value={formData.content}
                  onChange={onInputChange}
                  required
                />
              </Form.Group>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={onInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="order"
                    value={formData.order}
                    onChange={onInputChange}
                    required
                  />
                </Form.Group>
              </div>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Required for course completion"
                  name="is_required"
                  checked={formData.is_required}
                  onChange={onInputChange}
                />
              </Form.Group>
            </>
          )}

        {itemType === 'section' && (
        <>
            <Form.Group className="mb-3">
            <Form.Label>Content</Form.Label>
            <Form.Control
                as="textarea"
                rows={5}
                name="content"
                value={formData.content}
                onChange={onInputChange}
                required
            />
            </Form.Group>

            <div className="row">
            <Form.Group className="col-md-6 mb-3">
                <Form.Label>Order</Form.Label>
                <Form.Control
                type="number"
                min="0"
                name="order"
                value={formData.order}
                onChange={onInputChange}
                required
                />
            </Form.Group>

            <Form.Group className="col-md-6 mb-3">
                <Form.Check
                type="checkbox"
                label="Is Subsection"
                name="is_subsection"
                checked={formData.is_subsection}
                onChange={onInputChange}
                />
            </Form.Group>
            </div>

            {formData.is_subsection && (
            <Form.Group className="mb-3">
                <Form.Label>Parent Section</Form.Label>
                <Form.Select
                name="parent_section"
                value={formData.parent_section}
                onChange={onInputChange}
                required={formData.is_subsection}
                >
                <option value="">Select parent section</option>
                {currentItem?.lessonId && getParentSections(currentItem.lessonId).map((section: any) => (
                    <option key={section.id} value={section.id}>
                    {section.title}
                    </option>
                ))}
                </Form.Select>
            </Form.Group>
            )}
        </>
        )}

{itemType === 'quiz' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Question Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="question_text"
                  value={currentFormData.question_text}
                  onChange={currentOnInputChange}
                  required
                />
              </Form.Group>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Question Type</Form.Label>
                  <Form.Select
                    name="question_type"
                    value={currentFormData.question_type}
                    onChange={currentOnInputChange}
                    required
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TF">True/False</option>
                    <option value="SA">Short Answer</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Points</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="points"
                    value={currentFormData.points}
                    onChange={currentOnInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="order"
                    value={currentFormData.order}
                    onChange={currentOnInputChange}
                    required
                  />
                </Form.Group>
              </div>

              {currentFormData.question_type === 'MCQ' && (
                <>
                  <h6>Answers</h6>
                  {currentFormData.answers.map((answer: Answer, index: number) => (
                    <div key={index} className="row mb-2 align-items-center">
                      <div className="col-md-8">
                        <Form.Control
                          type="text"
                          placeholder={`Answer ${index + 1}`}
                          value={answer.answer_text}
                          onChange={(e) => handleAnswerChange(index, 'answer_text', e.target.value)}
                        />
                      </div>
                      <div className="col-md-4">
                        <Form.Check
                          type="checkbox"
                          label="Correct Answer"
                          checked={answer.is_correct}
                          onChange={(e) => handleAnswerChange(index, 'is_correct', e.target.checked)}
                        />
                      </div>
                    </div>
                  ))}
                </>
              )}

              {currentFormData.question_type === 'TF' && (
                <div className="mb-3">
                  <h6>Correct Answer</h6>
                  <Form.Check
                    type="radio"
                    label="True"
                    name="tf_answer"
                    checked={currentFormData.answers[0].is_correct}
                    onChange={() => {
                      handleAnswerChange(0, 'is_correct', true);
                      handleAnswerChange(1, 'is_correct', false);
                    }}
                  />
                  <Form.Check
                    type="radio"
                    label="False"
                    name="tf_answer"
                    checked={currentFormData.answers[1].is_correct}
                    onChange={() => {
                      handleAnswerChange(0, 'is_correct', false);
                      handleAnswerChange(1, 'is_correct', true);
                    }}
                  />
                </div>
              )}
            </>
          )}

        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default LessonFormModal;