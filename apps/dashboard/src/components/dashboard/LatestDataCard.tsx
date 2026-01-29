import Card from '../common/Card';
import './Dashboard.css';
import { IoReload } from "react-icons/io5";

type LatestDataCardProps = {
  timestamp: string;
  onReload: () => void;
};

const LatestDataCard = ({ timestamp, onReload }: LatestDataCardProps) => {
  return (
    <Card className="latest-data-card">
      <div className="latest-data-content">
        <span className="data-label">最近の計測データ</span>
        <span className="data-timestamp">{timestamp}</span>
        <IoReload className="reload-icon" onClick={onReload}/>
      </div>
    </Card>
  );
};

export default LatestDataCard;

