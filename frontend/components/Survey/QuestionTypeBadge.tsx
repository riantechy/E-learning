import Badge from 'react-bootstrap/Badge';

export const QuestionTypeBadge = ({ type }: { type: string }) => {
  const typeMap: Record<string, { label: string; variant: string }> = {
    MCQ: { label: 'Multiple Choice', variant: 'primary' },
    TEXT: { label: 'Text Answer', variant: 'info' },
    SCALE: { label: 'Rating Scale', variant: 'warning' },
  };

  const typeInfo = typeMap[type] || { label: type, variant: 'secondary' };

  return <Badge bg={typeInfo.variant}>{typeInfo.label}</Badge>;
};