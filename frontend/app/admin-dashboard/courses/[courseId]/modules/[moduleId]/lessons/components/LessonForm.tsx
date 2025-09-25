// app/admin-dashboard/courses/[courseId]/modules/[moduleId]/lessons/components/LessonForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Form, Modal, Button } from 'react-bootstrap';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import dynamic from 'next/dynamic';

// Dynamically import EditorContent to avoid SSR issues
const DynamicEditorContent = dynamic(() => import('@tiptap/react').then(mod => mod.EditorContent), {
  ssr: false,
});

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

const LessonForm = ({
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
  const [richContent, setRichContent] = useState(formData.content || '');

  // Initialize Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'bullet-list',
          },
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
          HTMLAttributes: {
            class: 'ordered-list',
          },
        },
      }),
    ],
    content: richContent,
    onUpdate: ({ editor }) => {
      setRichContent(editor.getHTML());
    },
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
        'data-placeholder': 'Start typing your content here...',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Auto-formatting for lists like Word
          if (event.key === 'Enter') {
            const { state } = view;
            const { selection } = state;
            const { $from, empty } = selection;
  
            if (!empty || $from.parent.type.name !== 'paragraph') {
              return false;
            }
  
            const textContent = $from.parent.textContent;
            
            // Auto-detect bullet lists
            if (/^[-*]\s$/.test(textContent)) {
              event.preventDefault();
              return editor?.chain()
                .focus()
                .toggleBulletList()
                .run();
            }
            
            // Auto-detect numbered lists
            if (/^\d\.\s$/.test(textContent)) {
              event.preventDefault();
              return editor?.chain()
                .focus()
                .toggleOrderedList()
                .run();
            }
          }
          return false;
        },
      },
    },
  });

  useEffect(() => {
    setRichContent(formData.content || '');
    if (editor) {
      editor.commands.setContent(formData.content || '');
    }
  }, [formData.content, editor]);

  useEffect(() => {
    return () => {
      if (filePreview) {
        URL.revokeObjectURL(filePreview);
      }
    };
  }, [filePreview]);

  // Inject inline CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ProseMirror {
        border: 1px solid #ced4da;
        border-radius: 0.25rem;
        padding: 0.5rem;
        min-height: 100px;
      }
      .ProseMirror-focused {
        border-color: #80bdff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
      }
      .ProseMirror p.is-editor-empty:first-child::before {
        content: attr(data-placeholder);
        color: #6c757d;
        float: left;
        height: 0;
        pointer-events: none;
      }
      .is-active {
        background-color: #e9ecef;
      }
      /* Improved list styling */
      .ProseMirror ul, .ProseMirror ol {
        padding-left: 1.5rem;
        margin: 0.5rem 0;
      }
      .ProseMirror ul {
        list-style-type: disc;
      }
      .ProseMirror ol {
        list-style-type: decimal;
      }
      .ProseMirror li {
        margin: 0.25rem 0;
      }
      .ProseMirror li p {
        margin: 0;
      }
      /* Nested list styling */
      .ProseMirror ul ul, .ProseMirror ol ul {
        list-style-type: circle;
      }
      .ProseMirror ol ol, .ProseMirror ul ol {
        list-style-type: lower-latin;
      }
      .ProseMirror h1, .ProseMirror h2, .ProseMirror h3, 
      .ProseMirror h4, .ProseMirror h5, .ProseMirror h6 {
        margin-top: 1rem;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      .ProseMirror h1 { font-size: 2rem; }
      .ProseMirror h2 { font-size: 1.75rem; }
      .ProseMirror h3 { font-size: 1.5rem; }
      .ProseMirror h4 { font-size: 1.25rem; }
      .ProseMirror h5 { font-size: 1.1rem; }
      .ProseMirror h6 { font-size: 1rem; }
    `;
    document.head.appendChild(style);
  
    return () => {
      document.head.removeChild(style); 
    };
  }, []);

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

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.title) newErrors.title = 'Title is required';
    if (itemType === 'lesson' && !formData.content_type) newErrors.content_type = 'Content type is required';
    if (itemType === 'lesson' && formData.content_type === 'TEXT' && !richContent.trim()) {
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
      } else if (formData.content_type === 'VIDEO') {
        formDataToSend.append('content', formData.content?.trim() || '');
      } else if (formData.content_type === 'TEXT') {
        formDataToSend.append('content', richContent);
      } else if (formData.content_type === 'QUIZ') {
        formDataToSend.append('content', ''); // No content for quizzes
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
        formDataToSend.append('content', richContent);
      }
    }

    onSubmit(e, formDataToSend);
  };

  const Toolbar = () => (
    <div className="mb-2 d-flex flex-wrap gap-1">
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleBold().run()}
        className={editor?.isActive('bold') ? 'is-active' : ''}
      >
        Bold
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleItalic().run()}
        className={editor?.isActive('italic') ? 'is-active' : ''}
      >
        Italic
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleBulletList().run()}
        className={editor?.isActive('bulletList') ? 'is-active' : ''}
      >
        Bullet List
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        className={editor?.isActive('orderedList') ? 'is-active' : ''}
      >
        Numbered List
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''}
      >
        H1
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
      >
        H2
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}
      >
        H3
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 4 }).run()}
        className={editor?.isActive('heading', { level: 4 }) ? 'is-active' : ''}
      >
        H4
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 5 }).run()}
        className={editor?.isActive('heading', { level: 5 }) ? 'is-active' : ''}
      >
        H5
      </Button>
      <Button
        size="sm"
        variant="outline-secondary"
        onClick={() => editor?.chain().focus().toggleHeading({ level: 6 }).run()}
        className={editor?.isActive('heading', { level: 6 }) ? 'is-active' : ''}
      >
        H6
      </Button>
    </div>
  );

  const renderContentField = () => {
    // Add description field for PDF and VIDEO content types
    if (formData.content_type === 'PDF' || formData.content_type === 'VIDEO') {
      return (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description || ''}
              onChange={onInputChange}
              placeholder={`Enter description for this ${formData.content_type === 'PDF' ? 'PDF' : 'video'}`}
              disabled={loading}
            />
          </Form.Group>
          {formData.content_type === 'PDF' ? (
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
            </Form.Group>
          ) : (
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
          )}
        </>
      );
    } else if (formData.content_type === 'TEXT') {
      return (
        <Form.Group className="mb-3">
          <Form.Label>Content</Form.Label>
          <Toolbar />
          <DynamicEditorContent editor={editor} />
          {errors.content && (
            <div className="invalid-feedback d-block">{errors.content}</div>
          )}
        </Form.Group>
      );
    }
    return null;
  };

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{currentItem ? `Edit ${itemType}` : `Add New ${itemType}`}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleFormSubmit}>
          <Modal.Body>
            {itemType === 'lesson' && (
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

                <Form.Group className="mb-3">
                  <Form.Label>Content Type</Form.Label>
                  <Form.Select
                    name="content_type"
                    value={formData.content_type || 'TEXT'}
                    onChange={onInputChange}
                    required
                    disabled={loading}
                    isInvalid={!!errors.content_type}
                  >
                    <option value="TEXT">Text</option>
                    <option value="VIDEO">Video</option>
                    <option value="PDF">PDF</option>
                    {/* Removed QUIZ option */}
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

            {itemType === 'quiz' && (
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

                {/* Hidden content_type for quiz - pre-set in hook */}
                <input type="hidden" name="content_type" value="QUIZ" />

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
                    isInvalid={!!errors.title}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
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
                    {/* Removed QUIZ option */}
                  </Form.Select>
                </Form.Group>

                {/* Add description field for sections with video content */}
                {formData.content_type === 'VIDEO' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description || ''}
                      onChange={onInputChange}
                      placeholder="Enter description for this video"
                      disabled={loading}
                    />
                  </Form.Group>
                )}

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
                        isInvalid={!!errors.content}
                      />
                      <Form.Control.Feedback type="invalid">{errors.content}</Form.Control.Feedback>
                    </Form.Group>
                  </>
                ) : (
                  <Form.Group className="mb-3">
                    <Form.Label>Content</Form.Label>
                    <Toolbar />
                    <DynamicEditorContent editor={editor} />
                    {errors.content && (
                      <div className="invalid-feedback d-block">{errors.content}</div>
                    )}
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
            <Button variant="secondary" size="sm" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
};

export default LessonForm;