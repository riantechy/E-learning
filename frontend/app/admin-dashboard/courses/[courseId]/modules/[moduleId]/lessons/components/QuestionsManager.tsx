'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { assessmentsApi, coursesApi } from '@/lib/api';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import Alert from 'react-bootstrap/Alert';
import Badge from 'react-bootstrap/Badge';
import Accordion from 'react-bootstrap/Accordion';
import Spinner from 'react-bootstrap/Spinner';

export default function QuestionsManager({
  show,
  onHide,
  lessonId,
  courseId,
  moduleId
}: {
  show: boolean;
  onHide: () => void;
  lessonId: string;
  courseId: string;
  moduleId: string;
}) {
  // const { courseId, moduleId, lessonId } = useParams();
  const [questions, setQuestions] = useState<any[]>([]);
  const [lesson, setLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAnswerModal, setShowAnswerModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [currentAnswer, setCurrentAnswer] = useState<any>(null);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'MCQ',
    points: 1,
    order: 0,
  });
  
  const [answerForm, setAnswerForm] = useState({
    answer_text: '',
    is_correct: false,
  });

  useEffect(() => {
    fetchData();
  }, [lessonId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      const [lessonRes, questionsRes] = await Promise.all([
        coursesApi.getLesson(courseId as string, moduleId as string, lessonId as string),
        assessmentsApi.getQuestions(lessonId as string),
      ]);

      if (lessonRes.data) setLesson(lessonRes.data);
      if (questionsRes.data) {
        const questionsWithAnswers = await Promise.all(
          questionsRes.data.map(async (question: any) => {
            const answersRes = await assessmentsApi.getAnswers(question.id);
            return {
              ...question,
              answers: answersRes.data || []
            };
          })
        );
        setQuestions(questionsWithAnswers.sort((a, b) => a.order - b.order));
      }
      if (lessonRes.error) setError(lessonRes.error);
      if (questionsRes.error) setError(questionsRes.error);
    } catch (err) {
      setError('An error occurred while fetching data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Question handlers
  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setQuestionForm(prev => ({ 
      ...prev, 
      [name]: name === 'points' || name === 'order' ? parseInt(value) || 0 : value 
    }));
  };

  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const dataToSend = {
        ...questionForm,
        lesson: lessonId
      };
      
      let response;
      if (currentQuestion) {
        response = await assessmentsApi.updateQuestion(
          lessonId as string,
          currentQuestion.id,
          dataToSend
        );
        setSuccess('Question updated successfully!');
      } else {
        response = await assessmentsApi.createQuestion(
          lessonId as string,
          dataToSend
        );
        setSuccess('Question created successfully!');
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowQuestionModal(false);
        await fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionEdit = (question: any) => {
    setCurrentQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type,
      points: question.points,
      order: question.order,
    });
    setShowQuestionModal(true);
  };

  const handleNewQuestion = () => {
    setCurrentQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'MCQ',
      points: 1,
      order: questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 0,
    });
    setShowQuestionModal(true);
  };

  const handleQuestionDelete = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question? All answers will also be deleted.')) {
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        const response = await assessmentsApi.deleteQuestion(lessonId as string, questionId);

        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Question deleted successfully!');
          await fetchData();
        }
      } catch (err) {
        setError('Failed to delete question');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Answer handlers
  const handleAnswerInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    setAnswerForm(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const dataToSend = {
        ...answerForm,
        question: currentQuestion.id
      };
      
      let response;
      if (currentAnswer) {
        response = await assessmentsApi.updateAnswer(
          currentQuestion.id,
          currentAnswer.id,
          dataToSend
        );
        setSuccess('Answer updated successfully!');
      } else {
        response = await assessmentsApi.createAnswer(
          currentQuestion.id,
          dataToSend
        );
        setSuccess('Answer created successfully!');
      }

      if (response.error) {
        setError(response.error);
      } else {
        setShowAnswerModal(false);
        await fetchData();
      }
    } catch (err) {
      setError('An error occurred while saving the answer');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerEdit = (question: any, answer: any) => {
    setCurrentQuestion(question);
    setCurrentAnswer(answer);
    setAnswerForm({
      answer_text: answer.answer_text,
      is_correct: answer.is_correct,
    });
    setShowAnswerModal(true);
  };

  const handleNewAnswer = (question: any) => {
    setCurrentQuestion(question);
    setCurrentAnswer(null);
    setAnswerForm({
      answer_text: '',
      is_correct: false,
    });
    setShowAnswerModal(true);
  };

  const handleAnswerDelete = async (questionId: string, answerId: string) => {
    if (confirm('Are you sure you want to delete this answer?')) {
      try {
        setLoading(true);
        setError('');
        setSuccess('');
        const response = await assessmentsApi.deleteAnswer(questionId, answerId);

        if (response.error) {
          setError(response.error);
        } else {
          setSuccess('Answer deleted successfully!');
          await fetchData();
        }
      } catch (err) {
        setError('Failed to delete answer');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  const getQuestionTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      MCQ: 'primary',
      TF: 'warning',
      SA: 'success',
    };
    const labels: Record<string, string> = {
      MCQ: 'Multiple Choice',
      TF: 'True/False',
      SA: 'Short Answer',
    };
    return <Badge bg={variants[type]}>{labels[type]}</Badge>;
  };

  return (
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h6 className="h4 mb-0">Manage Quiz</h6>
            {lesson && (
              <p className="text-muted mb-0">Lesson: {lesson.title}</p>
            )}
          </div>
          <Button variant="primary" onClick={handleNewQuestion} disabled={loading}>
            Add New Question
          </Button>
        </div>
  
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
  
        {success && (
          <Alert variant="success" onClose={() => setSuccess('')} dismissible>
            {success}
          </Alert>
        )}
  
        {loading && !questions.length ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <div className="accordion">
            {questions.map((question, qIndex) => (
              <div key={question.id} className="accordion-item mb-3">
                <h2 className="accordion-header">
                  <button
                    className={`accordion-button ${openQuestionId === question.id ? '' : 'collapsed'}`}
                    type="button"
                    onClick={() => 
                      setOpenQuestionId(openQuestionId === question.id ? null : question.id)
                    }
                    aria-expanded={openQuestionId === question.id}
                  >
                    <div className="d-flex justify-content-between w-100 pe-3">
                      <div>
                        <span className="me-2">Q{qIndex + 1}:</span>
                        {question.question_text.substring(0, 50)}
                        {question.question_text.length > 50 && '...'}
                      </div>
                      <div>
                        {getQuestionTypeBadge(question.question_type)}
                        <Badge bg="info" className="ms-2">
                          {question.points} pt{question.points !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    </div>
                  </button>
                </h2>
                <div
                  className={`accordion-collapse ${openQuestionId === question.id ? 'show' : 'collapse'}`}
                >
                  <div className="accordion-body">
                    <div className="d-flex justify-content-between mb-3">
                      <h5>Question Details</h5>
                      <div>
                        <Button
                          variant="info"
                          size="sm"
                          className="me-2"
                          onClick={() => handleQuestionEdit(question)}
                          disabled={loading}
                        >
                          Edit Question
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          className="me-2"
                          onClick={() => handleQuestionDelete(question.id)}
                          disabled={loading}
                        >
                          Delete Question
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleNewAnswer(question)}
                          disabled={loading}
                        >
                          Add Answer
                        </Button>
                      </div>
                    </div>
  
                    <p className="mb-3">
                      <strong>Question:</strong> {question.question_text}
                    </p>
                    <p className="mb-3">
                      <strong>Type:</strong> {getQuestionTypeBadge(question.question_type)}
                    </p>
                    <p className="mb-3">
                      <strong>Points:</strong> {question.points}
                    </p>
                    <p className="mb-3">
                      <strong>Order:</strong> {question.order}
                    </p>
  
                    <h5 className="mt-4 mb-3">Answers</h5>
                    {question.answers && question.answers.length > 0 ? (
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Answer</th>
                            <th>Correct</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {question.answers.map((answer: any) => (
                            <tr key={answer.id}>
                              <td>{answer.answer_text}</td>
                              <td>{answer.is_correct ? '✅' : '❌'}</td>
                              <td>
                                <Button
                                  variant="info"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => handleAnswerEdit(question, answer)}
                                  disabled={loading}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  onClick={() => handleAnswerDelete(question.id, answer.id)}
                                  disabled={loading}
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert variant="info">No answers yet. Add some answers to this question.</Alert>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
  
        {/* Question Modal */}
        <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{currentQuestion ? 'Edit Question' : 'Add New Question'}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleQuestionSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Question Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="question_text"
                  value={questionForm.question_text}
                  onChange={handleQuestionInputChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
  
              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Question Type</Form.Label>
                  <Form.Select
                    name="question_type"
                    value={questionForm.question_type}
                    onChange={handleQuestionInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="TF">True/False</option>
                    <option value="SA">Short Answer</option>
                  </Form.Select>
                </Form.Group>
  
                <Form.Group className="col-md-3 mb-3">
                  <Form.Label>Points</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    name="points"
                    value={questionForm.points}
                    onChange={handleQuestionInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
  
                <Form.Group className="col-md-3 mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="order"
                    value={questionForm.order}
                    onChange={handleQuestionInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowQuestionModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
  
        {/* Answer Modal */}
        <Modal show={showAnswerModal} onHide={() => setShowAnswerModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>
              {currentAnswer ? 'Edit Answer' : 'Add New Answer'}
              {currentQuestion && (
                <div className="text-muted small mt-1">
                  For: {currentQuestion.question_text.substring(0, 50)}
                  {currentQuestion.question_text.length > 50 && '...'}
                </div>
              )}
            </Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleAnswerSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Answer Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="answer_text"
                  value={answerForm.answer_text}
                  onChange={handleAnswerInputChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
  
              {currentQuestion?.question_type !== 'SA' && (
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Correct Answer"
                    name="is_correct"
                    checked={answerForm.is_correct}
                    onChange={handleAnswerInputChange}
                    disabled={loading}
                  />
                </Form.Group>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAnswerModal(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
  );
}