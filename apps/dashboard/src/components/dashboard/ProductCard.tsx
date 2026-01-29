import { Link } from "react-router-dom";
import Card from "../common/Card";
import { Product } from "../../types";
import "./Dashboard.css";
import { MdScale } from "react-icons/md";
import { MdKeyboardArrowRight } from "react-icons/md";
import React from "react";

interface ProductCardProps {
  product: Product;
  title: string;
  path: string;
}

const ProductCard = ({ product, path, title }: ProductCardProps) => {
  const getColorClass = (weight: number, active: boolean) => {
    if (!active) {
      return "status-gray";
    }

    if (weight < 100) {
      return "status-green";
    } else if (100 <= weight && weight <= 150) {
      return "status-orange";
    } else {
      return "status-red";
    }
  };

  const title_texts = title.split("\n").map((item, index) => {
    return (
      <React.Fragment key={index}>
        {item}
        <br />
      </React.Fragment>
    );
  });

  return (
    <Link to={path} style={{ textDecoration: "none" }}>
      <Card className="product-card">
        <div className="card-title-panel">
          <h3 className="card-title">{title_texts}</h3>
          <MdKeyboardArrowRight className="card-details-icon" />
        </div>
        <div className="product-items">
          <div
            className={`product-item ${getColorClass(
              product.weight,
              product.active
            )}`}
          >
            <div className="product-weight">
              <span className="weight-value">{product.weight}</span>
              <span className="weight-unit">kg</span>
            </div>
            <span className="product-icon">{<MdScale />}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;
