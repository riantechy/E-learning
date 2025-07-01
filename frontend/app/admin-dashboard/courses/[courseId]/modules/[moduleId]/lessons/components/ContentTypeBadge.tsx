import Badge from 'react-bootstrap/Badge';

interface ContentTypeBadgeProps {
  type: string;
}

const ContentTypeBadge = ({ type }: ContentTypeBadgeProps) => {
  const variants: Record<string, string> = {
    VIDEO: 'primary',
    PDF: 'danger',
    TEXT: 'success',
    QUIZ: 'warning',
  };

  return <Badge bg={variants[type]}>{type}</Badge>;
};

export default ContentTypeBadge;