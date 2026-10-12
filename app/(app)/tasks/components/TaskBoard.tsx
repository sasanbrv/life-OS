
"use client";

import { useState } from "react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type BoardTask = {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  category?: {
    id: string;
    name: string;
    color: string;
  } | null;
};

type TaskBoardProps = {
  tasks: BoardTask[];
  onStatusChange: (
    taskId: string,
    status: TaskStatus
  ) => Promise<void> | void;
  onEdit?: (task: BoardTask) => void;
  onDelete?: (task: BoardTask) => void;
};

const columns: {
  id: TaskStatus;
  title: string;
  color: string;
}[] = [
  {
    id: "TODO",
    title: "To Do",
    color: "border-slate-500",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    color: "border-violet-500",
  },
  {
    id: "DONE",
    title: "Done",
    color: "border-emerald-500",
  },
];

const priorityStyles: Record<TaskPriority, string> = {
  LOW: "bg-slate-500/15 text-slate-300",
  MEDIUM: "bg-amber-500/15 text-amber-300",
  HIGH: "bg-rose-500/15 text-rose-300",
};

export default function TaskBoard({
  tasks,
  onStatusChange,
  onEdit,
  onDelete,
}: TaskBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(
    null
  );
  const [dragOverColumn, setDragOverColumn] =
    useState<TaskStatus | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(
    null
  );
  const [error, setError] = useState("");

  async function moveTask(
    taskId: string,
    nextStatus: TaskStatus
  ) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task || task.status === nextStatus) return;

    setUpdatingTaskId(taskId);
    setError("");

    try {
      await onStatusChange(taskId, nextStatus);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task status."
      );
    } finally {
      setUpdatingTaskId(null);
      setDraggedTaskId(null);
      setDragOverColumn(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        {columns.map((column) => {
          const columnTasks = tasks.filter(
            (task) => task.status === column.id
          );

          const isOver = dragOverColumn === column.id;

          return (
            <section
              key={column.id}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverColumn(column.id);
              }}
              onDragLeave={(event) => {
                const nextTarget = event.relatedTarget;

                if (
                  nextTarget instanceof Node &&
                  event.currentTarget.contains(nextTarget)
                ) {
                  return;
                }

                setDragOverColumn(null);
              }}
              onDrop={(event) => {
                event.preventDefault();

                const taskId =
                  event.dataTransfer.getData("text/plain") ||
                  draggedTaskId;

                setDragOverColumn(null);

                if (taskId) {
                  void moveTask(taskId, column.id);
                }
              }}
              className={`min-h-72 rounded-2xl border border-white/10 bg-[#11111b] p-3 transition-colors ${
                isOver
                  ? "bg-violet-500/10 ring-1 ring-violet-500/40"
                  : ""
              }`}
            >
              <div
                className={`mb-4 flex items-center justify-between border-t-2 ${column.color} pt-3`}
              >
                <h3 className="font-semibold text-white">
                  {column.title}
                </h3>

                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-300">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const isUpdating = updatingTaskId === task.id;

                  return (
                    <article
                      key={task.id}
                      draggable={!isUpdating}
                      onDragStart={(event) => {
                        setDraggedTaskId(task.id);
                        event.dataTransfer.effectAllowed = "move";
                        event.dataTransfer.setData(
                          "text/plain",
                          task.id
                        );
                      }}
                      onDragEnd={() => {
                        setDraggedTaskId(null);
                        setDragOverColumn(null);
                      }}
                      className={`rounded-xl border border-white/10 bg-[#191926] p-4 transition ${
                        isUpdating
                          ? "opacity-50"
                          : "cursor-grab hover:border-violet-500/40 active:cursor-grabbing"
                      } ${
                        draggedTaskId === task.id ? "opacity-40" : ""
                      }`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-2">
                        <h4 className="break-words text-sm font-medium text-white">
                          {task.title}
                        </h4>

                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold ${
                            priorityStyles[task.priority]
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="mb-3 line-clamp-3 whitespace-pre-wrap break-words text-xs leading-5 text-slate-400">
                          {task.description}
                        </p>
                      )}

                      {task.category && (
                        <div className="mb-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-2 py-1 text-xs text-slate-300">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: task.category.color,
                              }}
                            />
                            {task.category.name}
                          </span>
                        </div>
                      )}

                      {task.dueDate && (
                        <p className="mb-3 text-xs text-slate-500">
                          <span className="mr-1">Due:</span>
                          {new Date(task.dueDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}

                      {(onEdit || onDelete) && (
                        <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                          {onEdit && (
                            <button
                              type="button"
                              onClick={() => onEdit(task)}
                              className="text-xs text-violet-300 transition hover:text-violet-200"
                            >
                              Edit
                            </button>
                          )}

                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => onDelete(task)}
                              className="text-xs text-rose-300 transition hover:text-rose-200"
                            >
                              Delete
                            </button>
                          )}

                          {isUpdating && (
                            <span className="ml-auto text-xs text-slate-500">
                              Saving...
                            </span>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 px-3 py-8 text-center text-xs text-slate-500">
                    Drop tasks here
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-slate-500">
        Drag a task card to another column to change its status.
      </p>
    </div>
  );
}
