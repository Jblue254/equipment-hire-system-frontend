
import api from "./api";

// Lorry management
export const getLorries = async (params = {}) => {
  const response = await api.get("/transport/lorries/", { params });
  return response.data;
};

export const createLorry = async (data) => {
  const response = await api.post("/transport/lorries/", data);
  return response.data;
};

export const updateLorry = async (id, data) => {
  const response = await api.patch(`/transport/lorries/${id}/`, data);
  return response.data;
};

// Driver management
export const getDrivers = async (params = {}) => {
  const response = await api.get("/transport/drivers/", { params });
  return response.data;
};

export const createDriver = async (data) => {
  const response = await api.post("/transport/drivers/", data);
  return response.data;
};

export const updateDriver = async (id, data) => {
  const response = await api.patch(`/transport/drivers/${id}/`, data);
  return response.data;
};

// Trip management
export const getTrips = async (params = {}) => {
  const response = await api.get("/transport/trips/", { params });
  return response.data;
};

export const createTrip = async (data) => {
  const response = await api.post("/transport/trips/", data);
  return response.data;
};

export const getTrip = async (id) => {
  const response = await api.get(`/transport/trips/${id}/`);
  return response.data;
};

export const startTrip = async (id) => {
  const response = await api.post(`/transport/trips/${id}/start/`);
  return response.data;
};

export const completeTrip = async (id) => {
  const response = await api.post(`/transport/trips/${id}/complete/`);
  return response.data;
};

export const cancelTrip = async (id) => {
  const response = await api.post(`/transport/trips/${id}/cancel/`);
  return response.data;
};

// Trip expenses
export const getTripExpenses = async (params = {}) => {
  const response = await api.get("/transport/trip-expenses/", { params });
  return response.data;
};

export const createTripExpense = async (data) => {
  const response = await api.post("/transport/trip-expenses/", data);
  return response.data;
};

// Lorry expenses
export const getLorryExpenses = async (params = {}) => {
  const response = await api.get("/transport/lorry-expenses/", { params });
  return response.data;
};

export const createLorryExpense = async (data) => {
  const response = await api.post("/transport/lorry-expenses/", data);
  return response.data;
};
