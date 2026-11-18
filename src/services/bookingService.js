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

export const decideBooking = async (id, data) => {
  const response = await api.post(`/bookings/${id}/decision/`, data);
  return response.data;
};

export const dispatchBooking = async (id, data = {}) => {
  const response = await api.post(`/bookings/${id}/dispatch/`, data);
  return response.data;
};

export const getCreditApprovals = async (params = {}) => {
  const response = await api.get("/bookings/credit-approvals/", { params });
  return response.data;
};

export const decideCreditApproval = async (id, data) => {
  const response = await api.post(
    `/bookings/credit-approvals/${id}/decision/`,
    data
  );
  return response.data;
};
export const getReturns = async (params = {}) => {
  const response = await api.get("/bookings/returns/", { params });
  return response.data;
};

export const createReturn = async (data) => {
  const response = await api.post("/bookings/returns/", data);
  return response.data;
};