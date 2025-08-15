import { useState, useEffect } from 'react';
import { Form, Modal, Button } from 'react-bootstrap';

interface LessonFormProps {
  show: boolean;
  onHide: () => void;
  formData: any;
  itemType: 'lesson' | 'section' | 'quiz' | null;
  currentItem: any;
  lessons: any[];
  onSubmit: (e: React.FormEvent, data: FormData) => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  loading: boolean;
  getParentSections: (lessonId: string) => any[];
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
  getParentSections,
}: LessonFormProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        setErrors((prev) => ({ ...prev, pdf_file: 'Please select a valid PDF file.' }));
        return;
      }
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setErrors((prev) => ({ ...prev, pdf_file: '' }));
    }
  };

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (itemType === 'lesson' && !formData.content_type) newErrors.content_type = 'Content type is required';
    if (itemType === 'lesson' && formData.content_type === 'TEXT' && !formData.content?.trim()) {
      newErrors.content = 'Content is required for text-based lessons';
    }
    if (itemType === 'lesson' && formData.content_type === 'VIDEO' && !formData.content?.trim()) {
      newErrors.content = 'Video URL is required for video-based lessons';
    }
    if (itemType === 'lesson' && formData.content_type === 'PDF' && !selectedFile && !formData.content) {
      newErrors.pdf_file = 'PDF file is required for PDF-based lessons';
    }
    if (itemType === 'lesson' && (formData.duration_minutes === undefined || formData.duration_minutes < 0)) {
      newErrors.duration_minutes = 'Duration must be a non-negative number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const formDataToSend = new FormData();

    if (itemType === 'lesson' || itemType === 'quiz') {
      formDataToSend.append('title', formData.title || '');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('content_type', formData.content_type || 'TEXT');
      formDataToSend.append('duration_minutes', (formData.duration_minutes ?? 0).toString());
      formDataToSend.append('order', (formData.order ?? 0).toString());
      formDataToSend.append('is_required', (formData.is_required ?? true).toString());

      if (formData.content_type === 'PDF') {
        if (selectedFile) {
          formDataToSend.append('pdf_file', selectedFile);
        } else if (formData.content) {
          formDataToSend.append('content', formData.content);
        }
      } else if (formData.content_type === 'VIDEO' || formData.content_type === 'TEXT') {
        formDataToSend.append('content', formData.content?.trim() || '');
      } else if (formData.content_type === 'QUIZ') {
        formDataToSend.append('content', '');
      }
    } else if (itemType === 'section') {
      formDataToSend.append('title', formData.title || '');
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('content_type', formData.content_type || 'TEXT');
      formDataToSend.append('order', (formData.order ?? 0).toString());
      formDataToSend.append('is_subsection', (formData.is_subsection ?? false).toString());

      if (formData.parent_section) {
        formDataToSend.append('parent_section', formData.parent_section);
      }

      if (formData.content_type === 'VIDEO') {
        formDataToSend.append('video_url', formData.video_url || '');
      } else {
        formDataToSend.append('content', formData.content || '');
      }
    }

    console.log('LessonFormModal FormData contents:');
    for (const [key, value] of formDataToSend.entries()) {
      console.log(`${key}: ${typeof value === 'object' && value instanceof File ? value.name : value}`);
    }

    onSubmit(e, formDataToSend);
  };

  const renderContentField = () => {
    if (formData.content_type === 'PDF') {
      return (
        <Form.Group className="mb-3">
          <Form.Label>PDF File</Form.Label>
          <Form.Control
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            disabled={loading}
            isInvalid={!!errors.pdf_file}
          />
          <Form.Control.Feedback type="invalid">{errors.pdf_file}</Form.Control.Feedback>
          {filePreview && (
            <div className="mt-2">
              <a href={filePreview} target="_blank" rel="noopener noreferrer">Preview PDF</a>
            </div>
          )}
        </Form.Group>
      );
    } else if (formData.content_type === 'TEXT') {
      return (
        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Form.Control
            as="textarea"
            rows={5}
            name="content"
            value={formData.content || ''}
            onChange={onInputChange}
            required
            disabled={loading}
            isInvalid={!!errors.content}
          />
          <Form.Control.Feedback type="invalid">{errors.content}</Form.Control.Feedback>
        </Form.Group>
      );
    } else if (formData.content_type === 'VIDEO') {
      return (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Video URL</Form.Label>
            <Form.Control
              type="url"
              name="content"
              value={formData.content || ''}
              onChange={onInputChange}
              placeholder="Enter video URL (e.g., https://youtube.com/watch?v=...)"
              required
              disabled={loading}
              isInvalid={!!errors.content}
            />
            <Form.Control.Feedback type="invalid">{errors.content}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Description (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description || ''}
              onChange={onInputChange}
              disabled={loading}
            />
          </Form.Group>
        </>
      );
    } else if (formData.content_type === 'QUIZ') {
      return null;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Form onSubmit={handleFormSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentItem ? 'Edit' : 'Add'} {itemType?.charAt(0).toUpperCase() + itemType?.slice(1)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(itemType === 'lesson' || itemType === 'quiz') && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={onInputChange}
                  required
                  disabled={loading}
                  isInvalid={!!errors.title}
                />
                <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              </Form.Group>
              {itemType === 'lesson' && (
                <Form.Group className="mb-3">
                  <Form.Label>Description (optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description || ''}
                    onChange={onInputChange}
                    disabled={loading}
                  />
                </Form.Group>
              )}
              <Form.Group className="mb-3">
                <Form.Label>Content Type</Form.Label>
                <Form.Select
                  name="content_type"
                  value={formData.content_type || 'TEXT'}
                  onChange={onInputChange}
                  required
                  disabled={loading || itemType === 'quiz'}
                  isInvalid={!!errors.content_type}
                >
                  <option value="TEXT">Text</option>
                  <option value="VIDEO">Video</option>
                  <option value="PDF">PDF</option>
                  <option value="QUIZ">Quiz</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.content_type}</Form.Control.Feedback>
              </Form.Group>

              {renderContentField()}

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Duration (minutes)</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="duration_minutes"
                    value={formData.duration_minutes ?? 0}
                    onChange={onInputChange}
                    required
                    disabled={loading}
                    isInvalid={!!errors.duration_minutes}
                  />
                  <Form.Control.Feedback type="invalid">{errors.duration_minutes}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="order"
                    value={formData.order ?? 0}
                    onChange={onInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Required for course completion"
                  name="is_required"
                  checked={formData.is_required ?? true}
                  onChange={onInputChange}
                  disabled={loading}
                />
              </Form.Group>
            </>
          )}

          {itemType === 'section' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title || ''}
                  onChange={onInputChange}
                  required
                  disabled={loading}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Content Type</Form.Label>
                <Form.Select
                  name="content_type"
                  value={formData.content_type || 'TEXT'}
                  onChange={onInputChange}
                  required
                  disabled={loading}
                >
                  <option value="TEXT">Text</option>
                  <option value="VIDEO">Video</option>
                </Form.Select>
              </Form.Group>

              {formData.content_type === 'VIDEO' ? (
                <>
                  <Form.Group className="mb-3">
                    <Form.Label>Video URL</Form.Label>
                    <Form.Control
                      type="url"
                      name="video_url"
                      value={formData.video_url || ''}
                      onChange={onInputChange}
                      placeholder="Enter video URL (e.g., https://youtube.com/watch?v=...)"
                      required
                      disabled={loading}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description (optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description || ''}
                      onChange={onInputChange}
                      disabled={loading}
                    />
                  </Form.Group>
                </>
              ) : (
                <Form.Group className="mb-3">
                  <Form.Label>Content</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={5}
                    name="content"
                    value={formData.content || ''}
                    onChange={onInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>
              )}

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Order</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    name="order"
                    value={formData.order ?? 0}
                    onChange={onInputChange}
                    required
                    disabled={loading}
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Check
                    type="checkbox"
                    label="Is Subsection"
                    name="is_subsection"
                    checked={formData.is_subsection ?? false}
                    onChange={onInputChange}
                    disabled={loading}
                  />
                </Form.Group>
              </div>

              {formData.is_subsection && (
                <Form.Group className="mb-3">
                  <Form.Label>Parent Section</Form.Label>
                  <Form.Select
                    name="parent_section"
                    value={formData.parent_section || ''}
                    onChange={onInputChange}
                    required={formData.is_subsection}
                    disabled={loading}
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