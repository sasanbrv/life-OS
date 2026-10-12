"use client";

import { useEffect, useState, type FormEvent } from "react";

type Category = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
};

type CategoryManagerProps = {
  selectedCategoryId: string;
  onSelect: (categoryId: string) => void;
};

const colors = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
];

export default function CategoryManager({
  selectedCategoryId,
  onSelect,
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  async function loadCategories() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load categories.");
      }

      setCategories(Array.isArray(data.categories) ? data.categories : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
  let cancelled = false;

  async function fetchCategories() {
    try {
      const response = await fetch("/api/categories", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load categories.");
      }

      if (!cancelled) {
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      }
    } catch (err) {
      if (!cancelled) {
        setError(
          err instanceof Error ? err.message : "Failed to load categories."
        );
      }
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  void fetchCategories();

  return () => {
    cancelled = true;
  };
}, [reloadKey]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Category name is required.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          color,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create category.");
      }

      const category = data.category as Category | undefined;

      if (!category?.id) {
        throw new Error("The server returned an invalid category.");
      }

      setCategories((current) => [
        category,
        ...current.filter((item) => item.id !== category.id),
      ]);
      setName("");
      onSelect(category.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category: Category) {
    if (category.isDefault) {
      setError("Default categories cannot be deleted.");
      return;
    }

    if (!window.confirm(`Delete category "${category.name}"?`)) return;

    setError("");

    try {
      const response = await fetch(`/api/categories/${category.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete category.");
      }

      setCategories((current) =>
        current.filter((item) => item.id !== category.id)
      );

      if (selectedCategoryId === category.id) {
        onSelect("");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h2 className="text-lg font-semibold text-white">Categories</h2>
      <p className="mt-1 text-sm text-slate-400">
        Organize your tasks with custom categories.
      </p>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleCreate} className="mt-5 space-y-3">
        <label htmlFor="category-name" className="sr-only">
          Category name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={80}
          placeholder="New category name"
          className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"
        />

        <div className="flex flex-wrap items-center gap-3">
          {colors.map((item) => (
            <button
              key={item}
              type="button"
              aria-label={`Select color ${item}`}
              aria-pressed={color === item}
              onClick={() => setColor(item)}
              className={`h-7 w-7 rounded-full border-2 ${
                color === item ? "border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: item }}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Category"}
        </button>
      </form>

      <div className="mt-5 space-y-2">
        <button
          type="button"
          onClick={() => onSelect("")}
          className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm ${
            selectedCategoryId === ""
              ? "border-violet-500/40 bg-violet-500/10 text-white"
              : "border-white/10 text-slate-300 hover:bg-white/5"
          }`}
        >
          All Categories
        </button>

        {loading ? (
          <p className="py-3 text-sm text-slate-400">Loading categories...</p>
        ) : (
          categories.map((category) => (
            <div
              key={category.id}
              className={`flex items-center gap-2 rounded-xl border px-3 py-3 ${
                selectedCategoryId === category.id
                  ? "border-violet-500/40 bg-violet-500/10"
                  : "border-white/10"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(category.id)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color || colors[0] }}
                />
                <span className="truncate text-sm text-slate-200">
                  {category.name}
                </span>
              </button>

              {!category.isDefault && (
                <button
                  type="button"
                  onClick={() => void handleDelete(category)}
                  aria-label={`Delete ${category.name}`}
                  className="rounded-lg px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}