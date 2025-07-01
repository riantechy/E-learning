import Button from 'react-bootstrap/Button';

interface SectionItemProps {
  section: any;
  lessonId: string;
  onEdit: (type: 'lesson' | 'section' | 'quiz', item: any) => void;
  onDelete: (type: 'lesson' | 'section' | 'quiz', id: string, lessonId?: string) => void;
}

// SectionItem.tsx
const SectionItem = ({ section, lessonId, onEdit, onDelete }: SectionItemProps) => {
    return (
      <li className="list-group-item">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <strong>{section.title}</strong>
            {section.is_subsection && (
              <span className="text-muted ms-2">(Subsection)</span>
            )}
          </div>
          <div>
            <Button
              variant="info"
              size="sm"
              className="me-2"
              onClick={() => onEdit({ 
                ...section, 
                lessonId: lessonId,
                lesson: { id: lessonId } 
              }, 'section')}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete('section', section.id, lessonId)}
            >
              Delete
            </Button>
          </div>
        </div>
      </li>
    );
  };

export default SectionItem;