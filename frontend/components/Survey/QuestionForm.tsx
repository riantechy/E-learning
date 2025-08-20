// components/Survey/QuestionForm.tsx
import { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { SurveyQuestion, SurveyChoice } from '@/lib/api';

type QuestionFormProps = {
  question: SurveyQuestion;
  onSave: (data: SurveyQuestion) => void;
  onCancel: () => void;
  loading: boolean;
};

export const QuestionForm = ({ question, onSave, onCancel, loading }: QuestionFormProps) => {
  const [formData, setFormData] = useState<SurveyQuestion>({ ...question });
  const [newChoice, setNewChoice] = useState('');

  useEffect(() => {
    setFormData({ ...question });
  }, [question]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleAddChoice = () => {
    if (newChoice.trim()) {
      setFormData((prev) => ({
        ...prev,
        choices: [
          ...(prev.choices || []),
          { id: '', question: prev.id || '', choice_text: newChoice, order: prev.choices?.length || 0 },
        ],
      }));
      setNewChoice('');
    }
  };

  const handleRemoveChoice = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      choices: prev.choices?.filter((_, i) => i !== index),
    }));
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...(formData.choices || [])];
    newChoices[index] = { ...newChoices[index], choice_text: value };
    setFormData((prev) => ({ ...prev, choices: newChoices }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Question Text</Form.Label>
        <Form.Control
          as="textarea"
          rows={2}
          name="question_text"
          value={formData.question_text}
          onChange={handleInputChange}
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Question Type</Form.Label>
        <Form.Select
          name="question_type"
          value={formData.question_type}
          onChange={handleInputChange}
          required
        >
          <option value="MCQ">Multiple Choice</option>
          <option value="TEXT">Text Answer</option>
          <option value="SCALE">Rating Scale (1-5)</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Check
          type="checkbox"
          label="Required Question"
          name="is_required"
          checked={formData.is_required}
          onChange={handleCheckboxChange}
        />
      </Form.Group>

      {formData.question_type === 'MCQ' && (
        <Form.Group className="mb-3">
          <Form.Label>Choices</Form.Label>
          {formData.choices?.map((choice, index) => (
            <div key={choice.id || index} className="d-flex align-items-center gap-2 mb-2">
              <Form.Control
                type="text"
                value={choice.choice_text}
                onChange={(e) => handleChoiceChange(index, e.target.value)}
                required
              />
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleRemoveChoice(index)}
              >
                Remove
              </Button>
            </div>
          ))}
          <div className="d-flex gap-2 mt-2">
            <Form.Control
              type="text"
              value={newChoice}
              onChange={(e) => setNewChoice(e.target.value)}
              placeholder="Add new choice"
            />
            <Button variant="outline-primary" onClick={handleAddChoice}>
              Add Choice
            </Button>
          </div>
          <Form.Text className="text-muted">
            At least 2 choices are required for multiple choice questions
          </Form.Text>
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Order</Form.Label>
        <Form.Control
          type="number"
          min="0"
          name="order"
          value={formData.order}
          onChange={handleInputChange}
          required
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Question'}
        </Button>
      </div>
    </Form>
  );
};