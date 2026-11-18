
import api from "./api";

// List sales with optional filters
export const getSales = async (params = {}) => {
  const response = await api.get("/sales/", { params });
  return response.data;
};

// Get one sale
export const getSale = async (id) => {
  const response = await api.get(`/sales/${id}/`);
  return response.data;
};

// Create a sale
export const createSale = async (data) => {
  const response = await api.post("/sales/", data);
  return response.data;
};

// Confirm sale and deduct stock
export const confirmSale = async (id) => {
  const response = await api.post(`/sales/${id}/confirm/`);
  return response.data;
};

// Cancel sale
export const cancelSale = async (id) => {
  const response = await api.post(`/sales/${id}/cancel/`);
  return response.data;
};

// Dispatch sale
export const dispatchSale = async (id) => {
  const response = await api.post(`/sales/${id}/dispatch/`);
  return response.data;
};

// Complete sale
export const completeSale = async (id) => {
  const response = await api.post(`/sales/${id}/complete/`);
  return response.data;
};

// List credit approval requests
export const getSaleCreditApprovals = async (params = {}) => {
  const response = await api.get("/sales/credit-approvals/", { params });
  return response.data;
};

// Approve or reject a credit request
export const decideSaleCredit = async (id, data) => {
  const response = await api.post(
    `/sales/credit-approvals/${id}/decision/`,
    data
  );
  return response.data;
};
