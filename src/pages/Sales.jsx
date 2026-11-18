
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, RefreshCw, ShoppingCart, X,
  CheckCircle, Truck, Ban, Package
} from "lucide-react";

import {
  getSales,
  createSale,
  confirmSale,
  cancelSale,
  dispatchSale,
  completeSale,
} from "../services/salesService";

import { getMaterials } from "../services/inventoryService";

const emptyItem = { material: "", quantity: "1" };

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    customer_address: "",
    payment_arrangement: "FULL_PAYMENT",
    transport_required: false,
    transport_charge: "0",
    notes: "",
    items: [{ ...emptyItem }],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, materialData] = await Promise.all([
        getSales(),
        getMaterials(),
      ]);

      setSales(Array.isArray(salesData) ? salesData : salesData.results || []);
      setMaterials(
        Array.isArray(materialData)
          ? materialData
          : materialData.results || []
      );
    } catch (error) {
      toast.error("Failed to load sales or materials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateItem = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const selectedMaterial = (id) =>
    materials.find((material) => String(material.id) === String(id));

  const estimatedSubtotal = form.items.reduce((sum, item) => {
    const material = selectedMaterial(item.material);
    return sum + (Number(material?.selling_price || 0) * Number(item.quantity || 0));
  }, 0);

  const estimatedTotal =
    estimatedSubtotal +
    (form.transport_required ? Number(form.transport_charge || 0) : 0);

  const resetForm = () => {
    setForm({
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      customer_address: "",
      payment_arrangement: "FULL_PAYMENT",
      transport_required: false,
      transport_charge: "0",
      notes: "",
      items: [{ ...emptyItem }],
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.items.length || form.items.some((item) => !item.material || Number(item.quantity) <= 0)) {
      toast.error("Select a material and enter a valid quantity for every item.");
      return;
    }

    if (new Set(form.items.map((item) => item.material)).size !== form.items.length) {
      toast.error("Each material should appear only once. Combine its quantity instead.");
      return;
    }

    if (form.transport_required && Number(form.transport_charge) <= 0) {
      toast.error("Enter a valid transport charge.");
      return;
    }

    const payload = {
      ...form,
      transport_charge: form.transport_required
        ? Number(form.transport_charge)
        : 0,
      items: form.items.map((item) => ({
        material: Number(item.material),
        quantity: Number(item.quantity),
      })),
    };

    try {
      setSaving(true);
      await createSale(payload);
      toast.success("Sale registered successfully.");
      setShowForm(false);
      resetForm();
      await loadData();
    } catch (error) {
      const data = error.response?.data;
      toast.error(
        data?.detail ||
        data?.message ||
        "Could not register sale. Check the entered details."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleAction = async (action, id, successMessage) => {
    try {
      await action(id);
      toast.success(successMessage);
      await loadData();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
        "The action could not be completed."
      );
    }
  };

  const filteredSales = sales.filter((sale) =>
    [
      sale.sale_number,
      sale.customer_name,
      sale.customer_phone,
      sale.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const money = (value) =>
    `KES ${Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const statusStyle = (status) => {
    const styles = {
      PENDING: "bg-amber-100 text-amber-700",
      CONFIRMED: "bg-blue-100 text-blue-700",
      READY: "bg-indigo-100 text-indigo-700",
      DISPATCHED: "bg-purple-100 text-purple-700",
      COMPLETED: "bg-green-100 text-green-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-slate-100 text-slate-600";
  };

  const stats = [
    { label: "Total Sales", value: sales.length },
    { label: "Pending", value: sales.filter((s) => s.status === "PENDING").length },
    { label: "Dispatched", value: sales.filter((s) => s.status === "DISPATCHED").length },
    { label: "Completed", value: sales.filter((s) => s.status === "COMPLETED").length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Sales</h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage construction material sales and dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={18} /> New Sale
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sale number, customer or phone..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={loadData}
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-8 text-center text-slate-500">Loading sales...</p>
        ) : filteredSales.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingCart className="mx-auto text-slate-300" size={36} />
            <p className="mt-3 font-medium text-slate-700">No sales found</p>
            <p className="mt-1 text-sm text-slate-500">Register your first sale to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-5 py-3">Sale Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {sale.sale_number}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-800">{sale.customer_name}</p>
                      <p className="text-xs text-slate-500">{sale.customer_phone}</p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-4 font-medium">{money(sale.total_amount)}</td>
                    <td className="px-5 py-4 text-slate-600">
                      {sale.payment_arrangement === "CREDIT" ? "Credit" : "Full payment"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(sale.status)}`}>
                        {sale.status?.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {sale.status === "PENDING" && (
                          <>
                            <button
                              title="Confirm sale"
                              onClick={() => handleAction(confirmSale, sale.id, "Sale confirmed.")}
                              className="rounded-md p-2 text-blue-600 hover:bg-blue-50"
                            >
                              <CheckCircle size={17} />
                            </button>
                            <button
                              title="Cancel sale"
                              onClick={() => handleAction(cancelSale, sale.id, "Sale cancelled.")}
                              className="rounded-md p-2 text-red-600 hover:bg-red-50"
                            >
                              <Ban size={17} />
                            </button>
                          </>
                        )}
                        {sale.status === "CONFIRMED" && (
                          <button
                            title="Dispatch sale"
                            onClick={() => handleAction(dispatchSale, sale.id, "Sale dispatched.")}
                            className="rounded-md p-2 text-purple-600 hover:bg-purple-50"
                          >
                            <Truck size={17} />
                          </button>
                        )}
                        {sale.status === "DISPATCHED" && (
                          <button
                            title="Complete sale"
                            onClick={() => handleAction(completeSale, sale.id, "Sale completed.")}
                            className="rounded-md p-2 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
          <div className="my-6 w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register New Sale</h2>
                <p className="text-sm text-slate-500">Enter customer and material details.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 p-5">
              <section className="space-y-3">
                <h3 className="font-semibold text-slate-800">Customer Details</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input required value={form.customer_name} onChange={(e) => updateForm("customer_name", e.target.value)} placeholder="Customer name" className="rounded-lg border border-slate-200 px-3 py-2.5" />
                  <input required value={form.customer_phone} onChange={(e) => updateForm("customer_phone", e.target.value)} placeholder="Phone number" className="rounded-lg border border-slate-200 px-3 py-2.5" />
                  <input type="email" value={form.customer_email} onChange={(e) => updateForm("customer_email", e.target.value)} placeholder="Email (optional)" className="rounded-lg border border-slate-200 px-3 py-2.5" />
                  <input value={form.customer_address} onChange={(e) => updateForm("customer_address", e.target.value)} placeholder="Delivery/location address" className="rounded-lg border border-slate-200 px-3 py-2.5" />
                </div>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">Materials</h3>
                  <button type="button" onClick={addItem} className="flex items-center gap-1 text-sm font-semibold text-blue-600">
                    <Plus size={16} /> Add material
                  </button>
                </div>

                {form.items.map((item, index) => {
                  const material = selectedMaterial(item.material);
                  return (
                    <div key={index} className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Material</label>
                        <select required value={item.material} onChange={(e) => updateItem(index, "material", e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5">
                          <option value="">Select material</option>
                          {materials.filter((m) => m.is_active).map((m) => (
                            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Quantity</label>
                        <input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">Unit price</label>
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm">
                          {material ? money(material.selling_price) : "—"}
                        </div>
                      </div>
                      <button type="button" disabled={form.items.length === 1} onClick={() => removeItem(index)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-30">
                        <X size={18} />
                      </button>
                    </div>
                  );
                })}
              </section>

              <section className="space-y-3">
                <h3 className="font-semibold text-slate-800">Payment and Transport</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500">Payment arrangement</label>
                    <select value={form.payment_arrangement} onChange={(e) => updateForm("payment_arrangement", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5">
                      <option value="FULL_PAYMENT">Full payment</option>
                      <option value="CREDIT">Credit (requires approval)</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 self-end rounded-lg border border-slate-200 p-3 text-sm">
                    <input type="checkbox" checked={form.transport_required} onChange={(e) => updateForm("transport_required", e.target.checked)} />
                    Transport required
                  </label>
                  {form.transport_required && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-500">Transport charge (KES)</label>
                      <input type="number" min="0.01" step="0.01" required value={form.transport_charge} onChange={(e) => updateForm("transport_charge", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
                    </div>
                  )}
                </div>
                <textarea value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} rows={2} placeholder="Additional notes (optional)" className="w-full rounded-lg border border-slate-200 px-3 py-2.5" />
              </section>

              <div className="rounded-lg bg-slate-900 p-4 text-white">
                <div className="flex justify-between text-sm text-slate-300">
                  <span>Estimated subtotal</span><span>{money(estimatedSubtotal)}</span>
                </div>
                <div className="mt-2 flex justify-between text-sm text-slate-300">
                  <span>Transport</span><span>{money(form.transport_required ? form.transport_charge : 0)}</span>
                </div>
                <div className="mt-3 flex justify-between border-t border-slate-700 pt-3 text-lg font-bold">
                  <span>Estimated total</span><span>{money(estimatedTotal)}</span>
                </div>
                <p className="mt-2 text-xs text-slate-400">Final prices and totals are calculated by the server when the sale is saved.</p>
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium">Cancel</button>
                <button disabled={saving} type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : "Register Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
