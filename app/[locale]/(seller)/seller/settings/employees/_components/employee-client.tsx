"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { createEmployee, updateEmployee, deleteEmployee } from "@/app/actions/employee";
import { useRouter } from "next/navigation";;
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";

type Warehouse = {
  id: string;
  warehouseName: string; // Adjusted to match schema
};

type Employee = {
  id: string;
  canManageProducts: boolean;
  canManageOrders: boolean;
  canManageCustomers: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
  warehouses: Warehouse[];
};

export default function EmployeeClient({
  employees,
  warehouses,
}: {
  employees: Employee[];
  warehouses: Warehouse[];
}) {
  const router = useRouter();
  const t = useTranslations("SellerEmployees");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    canManageProducts: false,
    canManageOrders: false,
    canManageCustomers: false,
    warehouseIds: [] as string[],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      canManageProducts: false,
      canManageOrders: false,
      canManageCustomers: false,
      warehouseIds: [],
    });
    setEditingId(null);
    setError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (emp: Employee) => {
    setFormData({
      name: emp.user.name || "",
      email: emp.user.email,
      password: "",
      canManageProducts: emp.canManageProducts,
      canManageOrders: emp.canManageOrders,
      canManageCustomers: emp.canManageCustomers,
      warehouseIds: emp.warehouses.map((w) => w.id),
    });
    setEditingId(emp.id);
    setIsModalOpen(true);
  };

  const handleWarehouseToggle = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      warehouseIds: prev.warehouseIds.includes(id)
        ? prev.warehouseIds.filter((wId) => wId !== id)
        : [...prev.warehouseIds, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let res;
    if (editingId) {
      res = await updateEmployee(editingId, formData);
    } else {
      if (!formData.password) {
        setError(t("passwordRequired"));
        setLoading(false);
        return;
      }
      res = await createEmployee(formData as any);
    }

    if (res?.error) {
      setError(res.error);
    } else {
      setIsModalOpen(false);
      router.refresh();
    }
    setLoading(false);
  };

  const promptDelete = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId) {
      setIsDeleting(confirmDeleteId);
      await deleteEmployee(confirmDeleteId);
      setIsDeleting(null);
      setConfirmDeleteId(null);
      router.refresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{t("title")}</h2>
          <p className="text-sm text-zinc-500">{t("subtitle")}</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("addEmployee")}
        </button>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-medium">{t("name")}</th>
                <th className="px-6 py-4 font-medium">{t("email")}</th>
                <th className="px-6 py-4 font-medium">{t("warehouses")}</th>
                <th className="px-6 py-4 font-medium">{t("permissions")}</th>
                <th className="px-6 py-4 font-medium text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                    {t("noData")}
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {emp.user.name || "-"}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {emp.user.email}
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {emp.warehouses.map((w) => w.warehouseName).join(", ") || "-"}
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
                      {emp.canManageProducts && <div className="bg-green-100 text-green-700 px-2 py-0.5 rounded inline-block mr-1 mb-1">{t("products")}</div>}
                      {emp.canManageOrders && <div className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded inline-block mr-1 mb-1">{t("orders")}</div>}
                      {emp.canManageCustomers && <div className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded inline-block mr-1 mb-1">{t("customers")}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => promptDelete(emp.id)}
                          disabled={isDeleting === emp.id}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px] p-4">
          <DialogHeader>
            <DialogTitle>
              {editingId ? t("modalEditTitle") : t("modalAddTitle")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-none px-2">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("labelName")}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("labelEmail")}</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t("labelPassword")} {editingId && <span className="text-xs text-zinc-500">({t("passwordHelp")})</span>}
              </label>
              <input
                type="password"
                required={!editingId}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full mt-2 px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-orange-500 outline-none"
                minLength={6}
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("labelWarehouses")}</label>
              <div className="grid grid-cols-2 gap-2">
                {warehouses.map((w) => (
                  <label key={w.id} className="flex items-center gap-2 p-2 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
                    <input
                      type="checkbox"
                      checked={formData.warehouseIds.includes(w.id)}
                      onChange={() => handleWarehouseToggle(w.id)}
                      className="rounded text-orange-500 focus:ring-orange-500"
                    />
                    <span className="text-sm">{w.warehouseName}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{t("labelPermissions")}</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageProducts}
                    onChange={(e) => setFormData({ ...formData, canManageProducts: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{t("canManageProducts")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageOrders}
                    onChange={(e) => setFormData({ ...formData, canManageOrders: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{t("canManageOrders")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.canManageCustomers}
                    onChange={(e) => setFormData({ ...formData, canManageCustomers: e.target.checked })}
                    className="rounded text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">{t("canManageCustomers")}</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                {t("btnCancel")}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? "..." : t("btnSave")}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent className="sm:max-w-[425px] p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle>{t("deleteTitle")}</DialogTitle>
          </DialogHeader>
          <div className="py-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("confirmDelete")}
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              {t("btnCancel")}
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={!!isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting ? "..." : t("btnDelete")}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
