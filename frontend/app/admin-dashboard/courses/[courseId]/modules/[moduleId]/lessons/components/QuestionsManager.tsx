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
import { Lesson, Question, Answer } from '@/lib/api';

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);
  
  const [questionForm, setQuestionForm] = useState({
    question_text: '',
    question_type: 'MCQ' as 'MCQ' | 'TF' | 'SA',
    points: 1,
    order: 0,
    answers: [] as { answer_text: string; is_correct: boolean }[]
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
      if (questionsRes.data?.results) {
        const questionsWithAnswers = await Promise.all(
          questionsRes.data.results.map(async (question: Question) => {
            const answersRes = await assessmentsApi.getAnswers(question.id);
            const answersData = Array.isArray(answersRes.data) ? answersRes.data : answersRes.data.results || [];
            return {
              ...question,
              answers: answersData as Answer[],
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

  // Handle input changes for question and answers
  const handleQuestionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    if (name.startsWith('answer_text_')) {
      const index = parseInt(name.split('_')[2]);
      setQuestionForm(prev => ({
        ...prev,
        answers: prev.answers.map((answer, i) =>
          i === index ? { ...answer, answer_text: value } : answer
        )
      }));
    } else if (name.startsWith('is_correct_')) {
      const index = parseInt(name.split('_')[2]);
      setQuestionForm(prev => ({
        ...prev,
        answers: prev.answers.map((answer, i) =>
          i === index ? { ...answer, is_correct: checked! } : answer
        )
      }));
    } else {
      setQuestionForm(prev => ({
        ...prev,
        [name]: name === 'points' || name === 'order' ? parseInt(value) || 0 : value,
        ...(name === 'question_type' && {
          answers: value === 'TF'
            ? [
                { answer_text: 'True', is_correct: false },
                { answer_text: 'False', is_correct: false }
              ]
            : value === 'SA'
            ? []
            : prev.answers.length === 0
            ? [{ answer_text: '', is_correct: false }]
            : prev.answers
        })
      }));
    }
  };

  // Add a new answer field for MCQ
  const handleAddAnswer = () => {
    if (questionForm.question_type !== 'MCQ') return;
    setQuestionForm(prev => ({
      ...prev,
      answers: [...prev.answers, { answer_text: '', is_correct: false }]
    }));
  };

  // Remove an answer field for MCQ
  const handleRemoveAnswer = (index: number) => {
    if (questionForm.question_type !== 'MCQ') return;
    setQuestionForm(prev => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index)
    }));
  };

  // Handle form submission for question and answers
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const questionData = {
        question_text: questionForm.question_text,
        question_type: questionForm.question_type,
        points: questionForm.points,
        order: questionForm.order,
        lesson: lessonId
      };
      
      let response;
      let questionId;
      
      if (currentQuestion) {
        response = await assessmentsApi.updateQuestion(
          lessonId as string,
          currentQuestion.id,
          questionData
        );
        questionId = currentQuestion.id;
        setSuccess('Question updated successfully!');
      } else {
        response = await assessmentsApi.createQuestion(
          lessonId as string,
          questionData
        );
        questionId = response.data.id;
        setSuccess('Question created successfully!');
      }

      if (response.error) {
        setError(response.error);
        return;
      }

      // Delete existing answers for updated questions
      if (currentQuestion && questionForm.question_type !== 'SA') {
        const existingAnswers = currentQuestion.answers || [];
        await Promise.all(
          existingAnswers.map((answer: Answer) =>
            assessmentsApi.deleteAnswer(questionId, answer.id)
          )
        );
      }

      // Create new answers for non-SA questions
      if (questionForm.question_type !== 'SA') {
        for (const answer of questionForm.answers) {
          if (answer.answer_text.trim()) {
            const answerData = {
              answer_text: answer.answer_text,
              is_correct: answer.is_correct,
              question: questionId
            };
            const answerResponse = await assessmentsApi.createAnswer(
              questionId,
              answerData
            );
            if (answerResponse.error) {
              setError(`Failed to save answer: ${answerResponse.error}`);
              return;
            }
          }
        }
      }

      setShowQuestionModal(false);
      await fetchData();
    } catch (err) {
      setError('An error occurred while saving the question and answers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionEdit = (question: Question) => {
    setCurrentQuestion(question);
    setQuestionForm({
      question_text: question.question_text,
      question_type: question.question_type as 'MCQ' | 'TF' | 'SA',
      points: question.points,
      order: question.order,
      answers: question.question_type === 'SA' ? [] : question.answers || []
    });
    setShowQuestionModal(true);
  };

  const handleNewQuestion = () => {
    setCurrentQuestion(null);
    setQuestionForm({
      question_text: '',
      question_type: 'MCQ' as 'MCQ' | 'TF' | 'SA',
      points: 1,
      order: questions.length > 0 ? Math.max(...questions.map(q => q.order)) + 1 : 0,
      answers: [{ answer_text: '', is_correct: false }]
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
                        {question.answers.map((answer: Answer) => (
                          <tr key={answer.id}>
                            <td>{answer.answer_text}</td>
                            <td>{answer.is_correct ? '✅' : '❌'}</td>
                            <td>
                              <Button
                                variant="info"
                                size="sm"
                                className="me-2"
                                onClick={() => handleQuestionEdit({ ...question, answers: [answer] })}
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
                    <Alert variant="info">No answers yet.</Alert>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question and Answers Modal */}
      <Modal show={showQuestionModal} onHide={() => setShowQuestionModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{currentQuestion ? 'Edit Question and Answers' : 'Add New Question and Answers'}</Modal.Title>
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

            {questionForm.question_type !== 'SA' && (
              <>
                <h5 className="mt-4 mb-3">Answers</h5>
                {questionForm.answers.map((answer, index) => (
                  <div key={index} className="mb-3 p-3 border rounded">
                    <Form.Group className="mb-2">
                      <Form.Label>Answer {index + 1}</Form.Label>
                      <Form.Control
                        type="text"
                        name={`answer_text_${index}`}
                        value={answer.answer_text}
                        onChange={handleQuestionInputChange}
                        required
                        disabled={loading || questionForm.question_type === 'TF'}
                      />
                    </Form.Group>
                    {questionForm.question_type !== 'TF' && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveAnswer(index)}
                        disabled={loading || questionForm.answers.length <= 1}
                      >
                        Remove Answer
                      </Button>
                    )}
                    <Form.Group className="mt-2">
                      <Form.Check
                        type="checkbox"
                        label="Correct Answer"
                        name={`is_correct_${index}`}
                        checked={answer.is_correct}
                        onChange={handleQuestionInputChange}
                        disabled={loading}
                      />
                    </Form.Group>
                  </div>
                ))}
                {questionForm.question_type === 'MCQ' && (
                  <Button
                    variant="secondary"
                    onClick={handleAddAnswer}
                    disabled={loading}
                    className="mb-3"
                  >
                    Add Another Answer
                  </Button>
                )}
              </>
            )}
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
    </div>
  );
}