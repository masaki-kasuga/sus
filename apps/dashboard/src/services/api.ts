import axios from 'axios';
import { DashboardData, WasteDetailData, ProductDetailData } from '../types';

// Docker環境ではViteのproxyを使用（/api）、ローカル開発でもproxyを使用
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchDashboard = async (): Promise<DashboardData> => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const fetchWasteDetail = async (category: 'A' | 'B'): Promise<WasteDetailData> => {
  const response = await api.get(`/waste/${category}`);
  return response.data;
};

export const fetchProductDetail = async (product: 'A' | 'B'): Promise<ProductDetailData> => {
  const response = await api.get(`/product/${product}`);
  return response.data;
};

