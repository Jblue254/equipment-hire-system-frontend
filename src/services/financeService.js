
import api from "./api";

// Get all payments, with optional filters
export const getPayments = async (params = {}) => {
  const response = await api.get("/finance/payments/", { params });
  return response.data;
};

// Record a payment
export const createPayment = async (data) => {
  const response = await api.post("/finance/payments/", data);
  return response.data;
};

// Verify a pending payment
export const verifyPayment = async (id) => {
  const response = await api.post(`/finance/payments/${id}/verify/`);
  return response.data;
};

// Get booking payment balance
export const getBookingBalance = async (bookingId) => {
  const response = await api.get(
    `/finance/bookings/${bookingId}/balance/`
  );
  return response.data;
};

// Get material sale payment balance
export const getSaleBalance = async (saleId) => {
  const response = await api.get(
    `/finance/sales/${saleId}/balance/`
  );
  return response.data;
};
