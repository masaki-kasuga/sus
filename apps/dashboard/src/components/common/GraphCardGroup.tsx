import { ReactNode } from 'react';
import GraphCard from './GraphCard';
import './GraphCardGroup.css';

interface GraphCardGroupCard {
  title?: ReactNode;
  meta?: ReactNode;
  description?: ReactNode;
  content: ReactNode;
}

interface GraphCardGroupProps {
  heading?: ReactNode;
  cards: GraphCardGroupCard[];
  className?: string;
}

const GraphCardGroup = ({ heading, cards, className = '' }: GraphCardGroupProps) => {
  return (
    <div className={`graph-card-group ${className}`}>
      {heading && <div className="graph-card-group-heading">{heading}</div>}
      <div className="graph-card-group-inner">
        {cards.map((card, index) => (
          <GraphCard
            key={index}
            title={card.title}
            meta={card.meta}
            description={card.description}
          >
            {card.content}
          </GraphCard>
        ))}
      </div>
    </div>
  );
};

export default GraphCardGroup;