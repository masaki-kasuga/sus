import { ReactNode } from 'react';
import './GraphCard.css';

interface GraphCardProps {
  heading?: ReactNode;
  title?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode; // Deprecated: use heading instead
  children: ReactNode;
  className?: string;
}

const GraphCard = ({ heading, title, meta, description, children, className = '' }: GraphCardProps) => {
  const displayHeading = heading ?? (description && !title ? description : null);
  const displayDescription = heading && description ? description : null;
  const hasHeader = displayHeading || title || meta || displayDescription;
  return (
    <div className={`graph-card ${className}`}>
      {hasHeader && (
        <div className="graph-card-header">
          {displayHeading && <div className="graph-card-heading">{displayHeading}</div>}
          <div className="graph-card-header-row">
            {title && <h3 className="graph-card-title">{title}</h3>}
            {meta && <span className="graph-card-meta">{meta}</span>}
          </div>
          {displayDescription && <p className="graph-card-description">{displayDescription}</p>}
        </div>
      )}
      <div className="graph-card-content">{children}</div>
    </div>
  );
};

export default GraphCard;