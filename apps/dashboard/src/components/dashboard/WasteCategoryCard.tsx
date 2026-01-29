import { Link } from "react-router-dom";
import Card from "../common/Card";
import { WasteLevelThreshold } from "../../types";
import "./Dashboard.css";
import React from "react";
import { CiWarning } from "react-icons/ci";
import { GiSodaCan } from "react-icons/gi";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdElectricBolt } from "react-icons/md";
import { GiCrackedGlass } from "react-icons/gi";
import { LuCable } from "react-icons/lu";
import { BsBatteryHalf } from "react-icons/bs";
import { GiWoodBeam } from "react-icons/gi";
import { GiCardboardBoxClosed } from "react-icons/gi";
import { FaRegTrashAlt } from "react-icons/fa";
import { GiLighter } from "react-icons/gi";
import { BsEraserFill } from "react-icons/bs";
import { IoNewspaperSharp } from "react-icons/io5";
import { FaBottleWater } from "react-icons/fa6";
import { useState } from "react";

interface WasteCategoryCardProps {
  title: string;
  wasteLevelThreshold: WasteLevelThreshold[];
  path: string;
}

const WasteCategoryCard = ({
  title,
  wasteLevelThreshold,
  path,
}: WasteCategoryCardProps) => {
  const [hoveredWasteItem, setHoveredWasteItem] = useState<string | null>(null);
  const getColorClass = (percentage: number, active: boolean) => {
    if (!active) {
      return "status-gray";
    }

    if (percentage < 70) {
      return "status-green";
    } else if (70 <= percentage && percentage <= 80) {
      return "status-orange";
    } else {
      return "status-red";
    }
  };

  const getIcon = (category: string, active: boolean) => {
    if (!active) {
      return <CiWarning />;
    }
    switch (category) {
      case "小電気部品":
        return <MdElectricBolt size={16} />;
      case "ガラスくず":
        return <GiCrackedGlass size={16} />;
      case "電線くず":
        return <LuCable size={16} />;
      case "電池":
        return <BsBatteryHalf size={16} />;
      case "木くず":
        return <GiWoodBeam size={16} />;
      case "段ボール":
        return <GiCardboardBoxClosed size={16} />;
      case "ペットボトル":
        return <FaBottleWater size={16} />;
      case "空き缶":
        return <GiSodaCan size={16} />;
      case "複合品":
        return <GiLighter size={16} />;
      case "再生紙":
        return <IoNewspaperSharp size={16} />;
      case "樹脂・ゴムくず":
        return <BsEraserFill size={16} />;
      default:
        return <FaRegTrashAlt size={16} />;
    }
  };

  return (
    <Link to={`${path}`} style={{ textDecoration: "none" }}>
      <Card className="waste-category-card">
        <div className="card-title-panel">
          <h3 className="card-title">{title}</h3>
          <MdKeyboardArrowRight className="card-details-icon" size={24}/>
        </div>
        <div className="waste-items">
          {wasteLevelThreshold.map((threshold, index) => {
            const name_texts = threshold.name.split("\n").map((item, index) => {
              return (
                <React.Fragment key={index}>
                  {item}
                  <br />
                </React.Fragment>
              );
            });
            const active = threshold.active;
            return (
              <div
                onMouseEnter={() => setHoveredWasteItem(threshold.name)}
                onMouseLeave={() => setHoveredWasteItem(null)}
                key={index}
                className={`waste-item ${getColorClass(
                  threshold.percentage,
                  threshold.active
                )}`}
              >
                <div className="waste-item-name-panel">
                  <span className="waste-item-name-icon">
                    {getIcon(threshold.category, threshold.active)}
                  </span>
                  <span className="waste-item-name">{name_texts}</span>
                </div>
                <div className="waste-item-value">
                  <div className="waste-item-percentage">
                    {threshold.percentage}
                  </div>
                  <div className="waste-item-percentage-unit">%</div>
                  {!active && hoveredWasteItem === threshold.name &&(
                  <div className="waste-item-tooltip">
                    最終更新: {threshold.updatedAt ? new Date(threshold.updatedAt).toLocaleString() : "不明"}
                    {!threshold.active && "（データが古い可能性があります）"}
                  </div>
                )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </Link>
  );
};

export default WasteCategoryCard;
