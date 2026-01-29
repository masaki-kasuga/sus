import Card from "../common/Card";
import { MapMarker } from "../../types";
import { MdLocationPin } from "react-icons/md";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";

interface FactoryMapProps {
  markers: MapMarker[];
}

const FactoryMap = ({ markers }: FactoryMapProps) => {
  const navigate = useNavigate();
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);

  return (
    <Card className="factory-map-card">
      <h3 className="card-title">マップ</h3>
      <div className="map-container">
        <div className="map-placeholder">
          <img
            src="/factory-map.png"
            alt="マップ"
            className="map-image"
            onError={(e) => {
              // 画像が存在しない場合のフォールバック
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              const placeholder = target.parentElement;
              if (placeholder) {
                placeholder.innerHTML =
                  '<div style="padding: 40px; text-align: center; color: #999;">工場マップ画像</div>';
              }
            }}
          />
          {markers.map((marker) => {
            const hasMultiple = marker.items.length > 1;

            return (
              <div
                key={marker.name}
                className="map-marker"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                }}
                onMouseEnter={() => setHoveredMarker(marker.name)}
                onMouseLeave={() => setHoveredMarker(null)}
                onClick={() => {
                  if (!hasMultiple) navigate(marker.items[0].path);
                }}
              >
                <div className="map-marker-icon" > <MdLocationPin size={50} color="#36A2EB" /></div>

                {marker.items.length === 1 && (
                  <div className="marker-label">{marker.items[0].name}</div>
                )}

                {marker.items.length > 1 && (
                  <div className="marker-multi-label">
                    {marker.items.map((i) => (
                      <div key={i.name} className="marker-sub-label">
                        {i.name}
                      </div>
                    ))}
                  </div>
                )}

                {hasMultiple && hoveredMarker === marker.name && (
                  <div className="marker-modal">
                    {marker.items.map((item) => (
                      <div
                        key={item.name}
                        className="modal-item"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(item.path);
                        }}
                      >
                        {item.name} <MdKeyboardArrowRight size={24} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default FactoryMap;
