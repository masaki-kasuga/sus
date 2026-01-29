import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import ClassifiedWastePage from './pages/ClassifiedWastePage';
import ProcessedProductPage from './pages/ProcessedProductPage';

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/waste/:category?" element={<ClassifiedWastePage />} />
          <Route path="/product/:product?" element={<ProcessedProductPage />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;

