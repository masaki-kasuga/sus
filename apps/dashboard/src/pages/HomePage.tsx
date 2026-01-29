import { useEffect, useState } from "react";
import { fetchDashboard } from "../services/api";
import { DashboardData } from "../types";
import LatestDataCard from "../components/dashboard/LatestDataCard";
import WasteCategoryCard from "../components/dashboard/WasteCategoryCard";
import ProductCard from "../components/dashboard/ProductCard";
import FactoryMap from "../components/dashboard/FactoryMap";
import Loading from "../components/common/Loading";
import "./HomePage.css";

const HomePage = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const dashboardData = await fetchDashboard();
      setData(dashboardData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "データの読み込みに失敗しました"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <div className="error-message">エラー: {error}</div>;
  }

  if (!data) {
    return <div className="error-message">データがありません</div>;
  }

  return (
    <div className="home-page">
      <LatestDataCard timestamp={data.timestamp} onReload={loadData} />
      <div className="dashboard-grid">
        {data.wasteCategories.map((category) => (
          <WasteCategoryCard
            key={category.title}
            title={category.title}
            wasteLevelThreshold={category.sensors}
            path={category.path}
          />
        ))}
        {data.products.map((product) => (
          <ProductCard
            key={product.title}
            title={product.title}
            product={product.product}
            path={product.path}
          />
        ))}
      </div>
      <FactoryMap markers={data.mapMarkers} />
    </div>
  );
};

export default HomePage;
