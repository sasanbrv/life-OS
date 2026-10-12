"use client";

import {

  useCallback,

  useEffect,

  useMemo,

  useState,

  type FormEvent,

} from "react";

import CategoryManager from "./components/CategoryManager";

import TaskBoard, { type BoardTask } from "./components/TaskBoard";
import SubtaskList from "./components/SubtaskList";
import TaskCalendar from "./components/TaskCalendar";
import TaskSort, {
  type TaskSortField,
  type TaskSortOrder,
} from "./components/TaskSort";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type TaskFilter = "ALL" | TaskStatus;

type Category = {

  id: string;

  name: string;

  color: string;

  isDefault: boolean;

};

type Task = {

  id: string;

  title: string;

  description: string | null;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate: string | null;

  createdAt: string;

  updatedAt: string;

  categoryId: string | null;

  category?: Category | null;

};

type TaskForm = {

  title: string;

  description: string;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate: string;

  categoryId: string;

};

type ApiError = { message?: string };

const initialForm: TaskForm = {

  title: "",

  description: "",

  status: "TODO",

  priority: "MEDIUM",

  dueDate: "",

  categoryId: "",

};

const statusLabels: Record<TaskStatus, string> = {

  TODO: "To Do",

  IN_PROGRESS: "In Progress",

  DONE: "Done",

};

const priorityColors: Record<TaskPriority, string> = {

  LOW: "bg-sky-500/10 text-sky-300",

  MEDIUM: "bg-amber-500/10 text-amber-300",

  HIGH: "bg-red-500/10 text-red-300",

};

function formatDate(value: string | null) {

  if (!value) return "No due date";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-US", {

    year: "numeric",

    month: "short",

    day: "numeric",

  }).format(date);

}

function dateInputValue(value: string | null) {

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

}

async function readJson<T>(response: Response): Promise<T> {

  return response.json() as Promise<T>;

}

export default function TasksPage() {

  const [tasks, setTasks] = useState<Task[]>([]);

  const [categories, setCategories] = useState<Category[]>([]);

  const [form, setForm] = useState<TaskForm>(initialForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<TaskFilter>("ALL");

  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [viewMode, setViewMode] = useState<"LIST" | "KANBAN" | "CALENDAR">("LIST");
  const [sortField, setSortField] = useState<TaskSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<TaskSortOrder>("desc");

  const [loading, setLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const loadTasks = useCallback(async (showLoading = true) => {

    if (showLoading) setLoading(true);

    setError("");

    try {

      const response = await fetch("/api/tasks", {

        cache: "no-store",

      });

      const data = await readJson<{ tasks: Task[] } & ApiError>(response);

      if (!response.ok) {

        throw new Error(data.message || "Failed to load tasks.");

      }

      if (!Array.isArray(data.tasks)) {

        throw new Error("Invalid response received from the server.");

      }

      setTasks(data.tasks);

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Something went wrong."

      );

    } finally {

      if (showLoading) setLoading(false);

    }

  }, []);

  const loadCategories = useCallback(async () => {

    try {

      const response = await fetch("/api/categories", {

        cache: "no-store",

      });

      const data = await readJson<{ categories: Category[] } & ApiError>(

        response

      );

      if (!response.ok) {

        throw new Error(data.message || "Failed to load categories.");

      }

      setCategories(

        Array.isArray(data.categories) ? data.categories : []

      );

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Failed to load categories."

      );

    }

  }, []);

  useEffect(() => {

  let cancelled = false;



  async function initialize() {

    await Promise.all([

      loadTasks(),

      loadCategories(),

    ]);

  }



  void initialize();



  return () => {

    cancelled = true;

  };

}, [loadTasks, loadCategories]);

  function updateForm(field: keyof TaskForm, value: string) {

    setForm((current) => ({ ...current, [field]: value }));

  }

  function resetForm() {

    setForm(initialForm);

    setEditingId(null);

  }

  function startEditing(task: Task) {

    setForm({

      title: task.title,

      description: task.description ?? "",

      status: task.status,

      priority: task.priority,

      dueDate: dateInputValue(task.dueDate),

      categoryId: task.categoryId ?? task.category?.id ?? "",

    });

    setEditingId(task.id);

    setError("");

    setSuccess("");

    document.getElementById("task-form")?.scrollIntoView({

      behavior: "smooth",

      block: "start",

    });

  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {

    event.preventDefault();

    setError("");

    setSuccess("");

    const title = form.title.trim();

    const description = form.description.trim();

    if (!title) {

      setError("Task title is required.");

      return;

    }

    if (title.length > 200) {

      setError("Task title must not exceed 200 characters.");

      return;

    }

    if (description.length > 5000) {

      setError("Description must not exceed 5000 characters.");

      return;

    }

    setSubmitting(true);

    try {

      const payload = {

        title,

        description: description || null,

        status: form.status,

        priority: form.priority,

        dueDate: form.dueDate

          ? new Date(`${form.dueDate}T12:00:00`).toISOString()

          : null,

        categoryId: form.categoryId || null,

      };

      const response = await fetch(

        editingId ? `/api/tasks/${editingId}` : "/api/tasks",

        {

          method: editingId ? "PATCH" : "POST",

          headers: { "Content-Type": "application/json" },

          body: JSON.stringify(payload),

        }

      );

      const data = await readJson<{ task?: Task; message?: string } & ApiError>(

        response

      );

      if (!response.ok) {

        throw new Error(

          data.message ||

            (editingId ? "Failed to update task." : "Failed to create task.")

        );

      }

      if (!data.task?.id) {

        throw new Error("The server returned an invalid task.");

      }

      setTasks((current) => [

        data.task!,

        ...current.filter((task) => task.id !== data.task!.id),

      ]);

      setSuccess(

        editingId ? "Task updated successfully." : "Task created successfully."

      );

      resetForm();

      await loadCategories();

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Something went wrong."

      );

    } finally {

      setSubmitting(false);

    }

  }

  async function handleDelete(task: Task) {

    const confirmed = window.confirm(

      `Delete "${task.title}"? This action cannot be undone.`

    );

    if (!confirmed) return;

    setError("");

    setSuccess("");

    setDeletingId(task.id);

    try {

      const response = await fetch(`/api/tasks/${task.id}`, {

        method: "DELETE",

      });

      const data = await readJson<{ message?: string } & ApiError>(response);

      if (!response.ok) {

        throw new Error(data.message || "Failed to delete task.");

      }

      setTasks((current) =>

        current.filter((item) => item.id !== task.id)

      );

      if (editingId === task.id) resetForm();

      setSuccess("Task deleted successfully.");

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Something went wrong."

      );

    } finally {

      setDeletingId(null);

    }

  }

  async function handleStatusChange(task: Task, status: TaskStatus) {

    if (task.status === status) return;

    setError("");

    setSuccess("");

    try {

      const response = await fetch(`/api/tasks/${task.id}`, {

        method: "PATCH",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({ status }),

      });

      const data = await readJson<{ task?: Task; message?: string } & ApiError>(

        response

      );

      if (!response.ok) {

        throw new Error(data.message || "Failed to update task status.");

      }

      if (data.task) {

        setTasks((current) =>

          current.map((item) =>

            item.id === task.id ? data.task! : item

          )

        );

      } else {

        await loadTasks(false);

      }

      setSuccess("Task status updated.");

    } catch (err) {

      setError(

        err instanceof Error ? err.message : "Something went wrong."

      );

      await loadTasks(false);

    }

  }

  async function handleBoardStatusChange(

    taskId: string,

    status: TaskStatus

  ) {

    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === status) return;

    await handleStatusChange(task, status);

  }



  const visibleTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      const matchesStatus = filter === "ALL" || task.status === filter;
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        (task.description ?? "").toLowerCase().includes(query);
      const matchesCategory =
        !selectedCategoryId ||
        task.categoryId === selectedCategoryId ||
        task.category?.id === selectedCategoryId;
      return matchesStatus && matchesSearch && matchesCategory;
    });

    const priorityRank: Record<TaskPriority, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
    };
    const statusRank: Record<TaskStatus, number> = {
      TODO: 1,
      IN_PROGRESS: 2,
      DONE: 3,
    };

    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "priority":
          comparison = priorityRank[a.priority] - priorityRank[b.priority];
          break;
        case "status":
          comparison = statusRank[a.status] - statusRank[b.status];
          break;
        case "dueDate":
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return comparison * (sortOrder === "asc" ? 1 : -1);
    });
  }, [tasks, filter, search, selectedCategoryId, sortField, sortOrder]);

  const counts = {

    total: tasks.length,

    todo: tasks.filter((task) => task.status === "TODO").length,

    inProgress: tasks.filter((task) => task.status === "IN_PROGRESS").length,

    done: tasks.filter((task) => task.status === "DONE").length,

  };

  return (

    <div className="mx-auto max-w-7xl space-y-8">

      <header>

        <p className="text-sm font-medium tracking-widest text-violet-400">

          YOUR PERSONAL WORKSPACE

        </p>

        <h1 className="mt-3 text-3xl font-bold text-white sm:text-4xl">

          Tasks

        </h1>

        <p className="mt-3 text-slate-400">

          Plan your work, prioritize what matters, and track your progress.

        </p>

      </header>

      {error && (

        <div

          role="alert"

          className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300"

        >

          {error}

        </div>

      )}

      {success && (

        <div

          role="status"

          className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300"

        >

          {success}

        </div>

      )}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">

        {[

          { label: "Total Tasks", value: counts.total },

          { label: "To Do", value: counts.todo },

          { label: "In Progress", value: counts.inProgress },

          { label: "Completed", value: counts.done },

        ].map((item) => (

          <article

            key={item.label}

            className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"

          >

            <p className="text-sm text-slate-400">{item.label}</p>

            <p className="mt-4 text-3xl font-bold text-white">

              {item.value}

            </p>

          </article>

        ))}

      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">

        <div className="space-y-6 xl:col-span-1">

          <article

            id="task-form"

            className="scroll-mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6"

          >

            <h2 className="text-xl font-semibold text-white">

              {editingId ? "Edit Task" : "Create a Task"}

            </h2>

            <p className="mt-2 text-sm text-slate-400">

              {editingId

                ? "Update your task details."

                : "Add a new task to your workspace."}

            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">

              <div>

                <label

                  htmlFor="task-title"

                  className="mb-2 block text-sm font-medium text-slate-300"

                >

                  Title \*

                </label>

                <input

                  id="task-title"

                  value={form.title}

                  onChange={(event) =>

                    updateForm("title", event.target.value)

                  }

                  maxLength={200}

                  required

                  placeholder="e.g. Learn Next.js"

                  className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"

                />

              </div>

              <div>

                <label

                  htmlFor="task-description"

                  className="mb-2 block text-sm font-medium text-slate-300"

                >

                  Description

                </label>

                <textarea

                  id="task-description"

                  value={form.description}

                  onChange={(event) =>

                    updateForm("description", event.target.value)

                  }

                  maxLength={5000}

                  rows={3}

                  placeholder="Add some details..."

                  className="w-full resize-y rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"

                />

              </div>

              <div>

                <label

                  htmlFor="task-status"

                  className="mb-2 block text-sm font-medium text-slate-300"

                >

                  Status

                </label>

                <select

                  id="task-status"

                  value={form.status}

                  onChange={(event) =>

                    updateForm("status", event.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"

                >

                  <option value="TODO">To Do</option>

                  <option value="IN_PROGRESS">In Progress</option>

                  <option value="DONE">Done</option>

                </select>

              </div>

              <div>

                <label

                  htmlFor="task-priority"

                  className="mb-2 block text-sm font-medium text-slate-300"

                >

                  Priority

                </label>

                <select

                  id="task-priority"

                  value={form.priority}

                  onChange={(event) =>

                    updateForm("priority", event.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"

                >

                  <option value="LOW">Low</option>

                  <option value="MEDIUM">Medium</option>

                  <option value="HIGH">High</option>

                </select>

              </div>

              <div>

                <label

                  htmlFor="task-due-date"

                  className="mb-2 block text-sm font-medium text-slate-300"

                >

                  Due Date

                </label>

                <input

                  id="task-due-date"

                  type="date"

                  value={form.dueDate}

                  onChange={(event) =>

                    updateForm("dueDate", event.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"

                />

              </div>

              <div>

                <label

                  htmlFor="task-category"

                  className="mb-2 block text-sm font-medium text-slate-300"

                >

                  Category

                </label>

                <select

                  id="task-category"

                  value={form.categoryId}

                  onChange={(event) =>

                    updateForm("categoryId", event.target.value)

                  }

                  className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none focus:border-violet-500"

                >

                  <option value="">No Category</option>

                  {categories.map((category) => (

                    <option key={category.id} value={category.id}>

                      {category.name}

                    </option>

                  ))}

                </select>

              </div>

              <button

                type="submit"

                disabled={submitting}

                className="w-full rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"

              >

                {submitting

                  ? "Saving..."

                  : editingId

                    ? "Save Changes"

                    : "Create Task"}

              </button>

              {editingId && (

                <button

                  type="button"

                  onClick={resetForm}

                  disabled={submitting}

                  className="w-full rounded-xl border border-white/10 px-4 py-3 font-medium text-slate-300 transition hover:bg-white/5"

                >

                  Cancel Editing

                </button>

              )}

            </form>

          </article>

          <CategoryManager

            selectedCategoryId={selectedCategoryId}

            onSelect={(categoryId) => {

              setSelectedCategoryId(categoryId);

              setForm((current) => ({

                ...current,

                categoryId,

              }));

            }}

          />

        </div>

        <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 xl:col-span-2">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <h2 className="text-xl font-semibold text-white">

                Your Tasks

              </h2>

              <p className="mt-2 text-sm text-slate-400">

                Search, filter, edit, and organize your tasks.

              </p>

            </div>

            <button

              type="button"

              onClick={() => {

                void loadTasks();

                void loadCategories();

              }}

              disabled={loading}

              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-50"

            >

              Refresh

            </button>

          </div>

          <div className="mt-6">

            <label htmlFor="task-search" className="sr-only">

              Search tasks

            </label>

            <input

              id="task-search"

              type="search"

              value={search}

              onChange={(event) => setSearch(event.target.value)}

              placeholder="Search by title or description..."

              className="w-full rounded-xl border border-white/10 bg-[#0D1325] px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-violet-500"

            />

          </div>

          <div className="mt-4 flex flex-wrap gap-2">

            {(["ALL", "TODO", "IN_PROGRESS", "DONE"] as const).map(

              (value) => (

                <button

                  key={value}

                  type="button"

                  onClick={() => setFilter(value)}

                  aria-pressed={filter === value}

                  className={`rounded-lg px-3 py-2 text-sm transition ${

                    filter === value

                      ? "bg-violet-600 text-white"

                      : "bg-white/5 text-slate-400 hover:text-white"

                  }`}

                >

                  {value === "ALL" ? "All" : statusLabels[value]}

                </button>

              )

            )}

          </div>

          <div className="mt-3 flex flex-wrap gap-2">

            <button

              type="button"

              onClick={() => setSelectedCategoryId("")}

              className={`rounded-lg px-3 py-2 text-xs transition ${

                !selectedCategoryId

                  ? "bg-violet-500/15 text-violet-300"

                  : "bg-white/5 text-slate-400 hover:text-white"

              }`}

            >

              All Categories

            </button>

            {categories.map((category) => (

              <button

                key={category.id}

                type="button"

                onClick={() => setSelectedCategoryId(category.id)}

                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${

                  selectedCategoryId === category.id

                    ? "bg-violet-500/15 text-violet-300"

                    : "bg-white/5 text-slate-400 hover:text-white"

                }`}

              >

                <span

                  className="h-2 w-2 rounded-full"

                  style={{ backgroundColor: category.color || "#8B5CF6" }}

                />

                {category.name}

              </button>

            ))}

          </div>

          <div className="mt-6">
            <TaskSort
              field={sortField}
              order={sortOrder}
              onFieldChange={setSortField}
              onOrderChange={setSortOrder}
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">

            <h3 className="font-medium text-white">View</h3>

            <div className="flex rounded-xl border border-white/10 bg-[#0D1325] p-1">

              <button

                type="button"

                onClick={() => setViewMode("LIST")}

                aria-pressed={viewMode === "LIST"}

                className={`rounded-lg px-4 py-2 text-sm transition ${

                  viewMode === "LIST"

                    ? "bg-violet-600 text-white"

                    : "text-slate-400 hover:text-white"

                }`}

              >

                List

              </button>

              <button

                type="button"

                onClick={() => setViewMode("KANBAN")}

                aria-pressed={viewMode === "KANBAN"}

                className={`rounded-lg px-4 py-2 text-sm transition ${

                  viewMode === "KANBAN"

                    ? "bg-violet-600 text-white"

                    : "text-slate-400 hover:text-white"

                }`}

              >

                Kanban

              </button>
              <button
                type="button"
                onClick={() => setViewMode("CALENDAR")}
                aria-pressed={viewMode === "CALENDAR"}
                className={`rounded-lg px-4 py-2 text-sm transition ${
                  viewMode === "CALENDAR"
                    ? "bg-violet-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Calendar
              </button>

            </div>

          </div>

          <div className="mt-4">

            {loading ? (

              <div className="py-12 text-center text-slate-400">

                Loading tasks...

              </div>

            ) : visibleTasks.length === 0 ? (

              <div className="rounded-xl border border-dashed border-white/10 px-4 py-12 text-center">

                <div className="text-3xl text-slate-500">✓</div>

                <p className="mt-3 font-medium text-white">

                  {tasks.length === 0

                    ? "No tasks yet"

                    : "No tasks match your filters"}

                </p>

                <p className="mt-2 text-sm text-slate-400">

                  {tasks.length === 0

                    ? "Create your first task using the form."

                    : "Try another search term, status, or category."}

                </p>

              </div>

            ) : viewMode === "CALENDAR" ? (
              <TaskCalendar
                tasks={visibleTasks}
                onTaskClick={(calendarTask) => {
                  const task = tasks.find((item) => item.id === calendarTask.id);
                  if (task) startEditing(task);
                }}
              />
            ) : viewMode === "KANBAN" ? (

              <TaskBoard

                tasks={visibleTasks as BoardTask[]}

                onStatusChange={handleBoardStatusChange}

                onEdit={(boardTask) => {

                  const task = tasks.find((item) => item.id === boardTask.id);

                  if (task) startEditing(task);

                }}

                onDelete={(boardTask) => {

                  const task = tasks.find((item) => item.id === boardTask.id);

                  if (task) void handleDelete(task);

                }}

              />

            ) : (

              <div className="space-y-3">

              {visibleTasks.map((task) => {

                const taskCategory =

                  task.category ??

                  categories.find(

                    (category) => category.id === task.categoryId

                  );

                return (

                  <div

                    key={task.id}

                    className="rounded-xl border border-white/10 bg-[#0D1325]/70 p-4"

                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0 flex-1">

                        <h3

                          className={`break-words font-semibold ${

                            task.status === "DONE"

                              ? "text-slate-500 line-through"

                              : "text-white"

                          }`}

                        >

                          {task.title}

                        </h3>

                        {task.description && (

                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-400">

                            {task.description}

                          </p>

                        )}

                      </div>

                      <span

                        className={`w-fit shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium ${priorityColors[task.priority]}`}

                      >

                        {task.priority}

                      </span>

                    </div>

                    {taskCategory && (

                      <div className="mt-3">

                        <span className="inline-flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300">

                          <span

                            className="h-2 w-2 rounded-full"

                            style={{

                              backgroundColor:

                                taskCategory.color || "#8B5CF6",

                            }}

                          />

                          {taskCategory.name}

                        </span>

                      </div>

                    )}

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                      <div>

                        <label

                          htmlFor={`status-${task.id}`}

                          className="mb-1.5 block text-xs text-slate-500"

                        >

                          Status

                        </label>

                        <select

                          id={`status-${task.id}`}

                          value={task.status}

                          onChange={(event) =>

                            void handleStatusChange(

                              task,

                              event.target.value as TaskStatus

                            )

                          }

                          className="w-full rounded-lg border border-white/10 bg-[#0D1325] px-3 py-2 text-sm text-slate-300 outline-none focus:border-violet-500"

                        >

                          <option value="TODO">To Do</option>

                          <option value="IN_PROGRESS">In Progress</option>

                          <option value="DONE">Done</option>

                        </select>

                      </div>

                      <div>

                        <p className="mb-1.5 text-xs text-slate-500">

                          Due Date

                        </p>

                        <p className="rounded-lg bg-white/5 px-3 py-2 text-sm text-slate-300">

                          {formatDate(task.dueDate)}

                        </p>

                      </div>

                    </div>

                    <SubtaskList taskId={task.id} />

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">

                      <span className="mr-auto text-xs text-slate-500">

                        Created {formatDate(task.createdAt)}

                      </span>

                      <button

                        type="button"

                        onClick={() => startEditing(task)}

                        className="rounded-lg border border-violet-500/20 px-3 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/10"

                      >

                        Edit

                      </button>

                      <button

                        type="button"

                        onClick={() => void handleDelete(task)}

                        disabled={deletingId === task.id}

                        className="rounded-lg border border-red-500/20 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"

                      >

                        {deletingId === task.id ? "Deleting..." : "Delete"}

                      </button>

                    </div>

                  </div>

                );

              })}

              </div>

            )}

          </div>

          {!loading && visibleTasks.length > 0 && (

            <p className="mt-4 text-xs text-slate-500">

              Showing {visibleTasks.length} of {tasks.length} tasks

            </p>

          )}

        </article>

      </section>

    </div>

  );

}
