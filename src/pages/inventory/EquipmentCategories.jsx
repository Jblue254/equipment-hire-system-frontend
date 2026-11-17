
import { useEffect, useState } from "react";
import { Plus, Search, RefreshCw, X, Layers, Pencil } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/api";

export default function EquipmentCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    is_active: true,
  });

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get("/inventory/equipment-categories/");
      const data = response.data;
      setCategories(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load equipment categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", is_active: true });
    setShowModal(true);
  };

  const openEdit = (category) => {
    setEditing(category);
    setForm({
      name: category.name || "",
      description: category.description || "",
      is_active: category.is_active,
    });
    setShowModal(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      if (editing) {
        await api.patch(
          `/inventory/equipment-categories/${editing.id}/`,
          form
        );
        toast.success("Category updated successfully.");
      } else {
        await api.post("/inventory/equipment-categories/", form);
        toast.success("Category created successfully.");
      }

      setShowModal(false);
      await loadCategories();
    } catch (error) {
      const data = error.response?.data;
      const message =
        Object.values(data || {}).flat().join(" ") ||
        "Unable to save category.";
      toast.error(String(message));
    } finally {
      setSaving(false);
    }
  };

  const filtered = categories.filter((category) =>
    `${category.name} ${category.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const activeCount = categories.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Equipment Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organise equipment into manageable categories.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total Categories</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {categories.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Active Categories</p>
          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {activeCount}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-4">
          <div className="relative min-w-52 flex-1">
            <Search
              size={17}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={loadCategories}
            className="rounded-lg border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Loading categories...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Layers className="mx-auto mb-3 text-slate-300" size={36} />
            <p className="font-medium text-slate-700">
              No categories found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Add your first equipment category.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Description</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((category) => (
                  <tr key={category.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {category.name}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {category.description || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          category.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {category.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => openEdit(category)}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Pencil size={15} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? "Edit Category" : "Add Equipment Category"}
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Category name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="e.g. Construction Tools"
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  rows="3"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Describe this equipment category..."
                  className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                Category is active
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg border px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editing
                    ? "Update Category"
                    : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
