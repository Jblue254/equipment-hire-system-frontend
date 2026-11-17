
import api from "./api";

// Equipment
export const getEquipment = async (params = {}) => {
  const response = await api.get("/inventory/equipment/", { params });
  return response.data;
};

export const createEquipment = async (data) => {
  const response = await api.post("/inventory/equipment/", data);
  return response.data;
};

export const updateEquipment = async (id, data) => {
  const response = await api.patch(`/inventory/equipment/${id}/`, data);
  return response.data;
};

export const deleteEquipment = async (id) => {
  const response = await api.delete(`/inventory/equipment/${id}/`);
  return response.data;
};

// Equipment categories
export const getEquipmentCategories = async () => {
  const response = await api.get("/inventory/equipment-categories/");
  return response.data;
};

export const createEquipmentCategory = async (data) => {
  const response = await api.post("/inventory/equipment-categories/", data);
  return response.data;
};
// MATERIALS

export const getMaterials = async (params = {}) => {
  const response = await api.get("/inventory/materials/", { params });
  return response.data;
};

export const createMaterial = async (data) => {
  const response = await api.post("/inventory/materials/", data);
  return response.data;
};

export const updateMaterial = async (id, data) => {
  const response = await api.patch(`/inventory/materials/${id}/`, data);
  return response.data;
};

export const deleteMaterial = async (id) => {
  const response = await api.delete(`/inventory/materials/${id}/`);
  return response.data;
};

// MATERIAL CATEGORIES

export const getMaterialCategories = async () => {
  const response = await api.get("/inventory/material-categories/");
  return response.data;
};

export const createMaterialCategory = async (data) => {
  const response = await api.post("/inventory/material-categories/", data);
  return response.data;
};
export const updateMaterialCategory = async (id, data) => {
  const response = await api.patch(
    `/inventory/material-categories/${id}/`,
    data
  );
  return response.data;
};

export const deleteMaterialCategory = async (id) => {
  const response = await api.delete(
    `/inventory/material-categories/${id}/`
  );
  return response.data;
};
// STOCK MOVEMENTS

export const getStockMovements = async (params = {}) => {
  const response = await api.get("/inventory/stock-movements/", {
    params,
  });
  return response.data;
};

export const createStockMovement = async (data) => {
  const response = await api.post(
    "/inventory/stock-movements/",
    data
  );
  return response.data;
};

export const getMaintenanceRecords = async (params = {}) => {
  const response = await api.get("/inventory/maintenance/", { params });
  return response.data;
};

export const createMaintenanceRecord = async (data) => {
  const response = await api.post("/inventory/maintenance/", data);
  return response.data;
};

export const updateMaintenanceRecord = async (id, data) => {
  const response = await api.patch(`/inventory/maintenance/${id}/`, data);
  return response.data;
};

export const getEquipmentUnits = async (params = {}) => {
  const response = await api.get("/inventory/equipment-units/", { params });
  return response.data;
};
