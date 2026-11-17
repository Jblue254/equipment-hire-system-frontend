import api from "./api";

export const getBookings = async (params = {}) => {
  const response = await api.get("/bookings/", { params });
  return response.data;
};

export const createBooking = async (data) => {
  const response = await api.post("/bookings/", data);
  return response.data;
};

export const getBooking = async (id) => {
  const response = await api.get(`/bookings/${id}/`);
  return response.data;
};

export const updateBooking = async (id, data) => {
  const response = await api.patch(`/bookings/${id}/`, data);
  return response.data;
};

export const decideBooking = async (id, data) => {
  const response = await api.post(`/bookings/${id}/decision/`, data);
  return response.data;
};