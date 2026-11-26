import { useState, type DragEvent } from "react";
import {
  CalendarDays,
  MoreHorizontal,
  MoveRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import {
  useCreateTask,
  useDeleteTask,
  useMembers,
  useTasks,
  useUpdateTask,
} from "@/lib/queries";
import type { ProjectDetail, Task, TaskInput, TaskStatus } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  ErrorState,
  FormError,
  Skeleton,
} from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import {
  Dialog,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
} from "@/components/ui/overlay";
import { useToast } from "@/components/ui/toast";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "backlog", label: "Backlog" },
  { status: "in_progress", label: "In progress" },
  { status: "in_review", label: "In review" },
  { status: "done", label: "Done" },
];

function isOverdue(task: Task) {
  return (
    Boolean(task.due_date) &&
    task.status !== "done" &&
    task.due_date! < new Date().toISOString().slice(0, 10)
  );
}

interface TaskDialogProps {
  project: ProjectDetail;
  task: Task | null;
  initialStatus: TaskStatus;
  onClose: () => void;
}

function TaskDialog({
  project,
  task,
  initialStatus,
  onClose,
}: TaskDialogProps) {
  const members = useMembers(project.id);
  const create = useCreateTask(project.id);
  const update = useUpdateTask(project.id);
  const toast = useToast();
  const [draft, setDraft] = useState<TaskInput>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    status: task?.status ?? initialStatus,
    assignee_id: task?.assignee_id ?? null,
    due_date: task?.due_date ?? null,
  });
  const set = <K extends keyof TaskInput>(key: K, value: TaskInput[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const mutation = task ? update : create;

  return (
    <Dialog
      open
      onOpenChange={(next) => !next && onClose()}
      title={task ? "Edit task" : "New task"}
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const input = { ...draft, title: draft.title.trim() };
          if (!input.title) return;
          const done = {
            onSuccess: onClose,
            onError: (error: unknown) => task && toast.error(error),
          };
          if (task) update.mutate({ id: task.id, ...input }, done);
          else create.mutate(input, done);
        }}
      >
        <Field label="Task" required>
          {(control) => (
            <Input
              {...control}
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
              maxLength={120}
              autoFocus
            />
          )}
        </Field>
        <Field label="Details">
          {(control) => (
            <Textarea
              {...control}
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
              maxLength={2000}
              rows={3}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Owner">
            {(control) => (
              <Select
                {...control}
                value={draft.assignee_id ?? ""}
                onChange={(event) =>
                  set("assignee_id", event.target.value || null)
                }
              >
                <option value="">Unassigned</option>
                {members.data?.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Due date">
            {(control) => (
              <Input
                {...control}
                type="date"
                value={draft.due_date ?? ""}
                onChange={(event) =>
                  set("due_date", event.target.value || null)
                }
              />
            )}
          </Field>
        </div>
        <Field label="Column">
          {(control) => (
            <Select
              {...control}
              value={draft.status}
              onChange={(event) =>
                set("status", event.target.value as TaskStatus)
              }
            >
              {COLUMNS.map((column) => (
                <option key={column.status} value={column.status}>
                  {column.label}
                </option>
              ))}
            </Select>
          )}
        </Field>
        {!task && <FormError error={create.error} />}
        <Button
          type="submit"
          loading={mutation.isPending}
          disabled={!draft.title.trim()}
        >
          {task ? "Save task" : "Add task"}
        </Button>
      </form>
    </Dialog>
  );
}

interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onMove: (status: TaskStatus) => void;
  onDelete: () => void;
}

function TaskCard({ task, onEdit, onMove, onDelete }: TaskCardProps) {
  const overdue = isOverdue(task);
  return (
    <li
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/task-id", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="flex cursor-grab flex-col gap-3 rounded-field border border-line bg-surface p-4 active:cursor-grabbing"
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "font-medium leading-snug",
            task.status === "done" && "text-ink-soft line-through",
          )}
        >
          {task.title}
        </p>
        {/* Dragging is a shortcut; this menu does everything it does from the keyboard. */}
        <Menu>
          <MenuTrigger
            aria-label={`Actions for ${task.title}`}
            className="-mr-2 -mt-2 flex size-9 shrink-0 items-center justify-center rounded-field text-ink-soft hover:bg-sunken"
          >
            <MoreHorizontal className="size-5" aria-hidden />
          </MenuTrigger>
          <MenuContent>
            <MenuLabel>Move to</MenuLabel>
            {COLUMNS.filter((column) => column.status !== task.status).map(
              (column) => (
                <MenuItem
                  key={column.status}
                  onSelect={() => onMove(column.status)}
                >
                  <MoveRight aria-hidden /> {column.label}
                </MenuItem>
              ),
            )}
            <MenuSeparator />
            <MenuItem onSelect={onEdit}>
              <Pencil aria-hidden /> Edit
            </MenuItem>
            <MenuItem danger onSelect={onDelete}>
              <Trash2 aria-hidden /> Delete
            </MenuItem>
          </MenuContent>
        </Menu>
      </div>
      {task.description && (
        <p className="line-clamp-2 text-sm text-ink-soft">{task.description}</p>
      )}
      {(task.assignee || task.due_date) && (
        <div className="flex items-center justify-between gap-2 text-sm">
          {task.assignee ? (
            <span className="flex min-w-0 items-center gap-2 text-ink-soft">
              <Avatar user={task.assignee} size="xs" />
              <span className="truncate">
                {task.assignee.name.split(" ")[0]}
              </span>
            </span>
          ) : (
            <span />
          )}
          {task.due_date && (
            <span
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-chip px-2 py-0.5",
                overdue
                  ? "bg-danger-soft font-medium text-danger"
                  : "text-ink-soft",
              )}
            >
              <CalendarDays className="size-3.5" aria-hidden />
              {overdue && <span className="sr-only">Overdue: </span>}
              {formatDate(task.due_date, { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
      )}
    </li>
  );
}

export function BoardTab({ project }: { project: ProjectDetail }) {
  const tasks = useTasks(project.id, true);
  const update = useUpdateTask(project.id);
  const remove = useDeleteTask(project.id);
  const toast = useToast();
  const [dialog, setDialog] = useState<{
    task: Task | null;
    status: TaskStatus;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);

  const onError = (error: unknown) => toast.error(error);
  const move = (id: string, status: TaskStatus) =>
    update.mutate({ id, status }, { onError });

  function onDrop(event: DragEvent, status: TaskStatus) {
    event.preventDefault();
    setDropTarget(null);
    const id = event.dataTransfer.getData("text/task-id");
    const task = tasks.data?.find((candidate) => candidate.id === id);
    if (task && task.status !== status) move(id, status);
  }

  if (tasks.isError)
    return (
      <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />
    );
  if (tasks.isPending) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => (
          <Skeleton key={column.status} className="h-64 rounded-card" />
        ))}
      </div>
    );
  }

  const all = tasks.data;
  const done = all.filter((task) => task.status === "done").length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft">
          {all.length === 0
            ? "Break the work into tasks and give each one an owner."
            : `${done} of ${all.length} tasks done. Completed tasks count toward each member's contribution record.`}
        </p>
        <Button onClick={() => setDialog({ task: null, status: "backlog" })}>
          <Plus aria-hidden /> New task
        </Button>
      </div>

      {all.length === 0 ? (
        <EmptyState
          title="The board is empty"
          action={
            <Button
              variant="outline"
              onClick={() => setDialog({ task: null, status: "backlog" })}
            >
              Add the first task
            </Button>
          }
        >
          Tasks move from Backlog to Done as the team ships.
        </EmptyState>
      ) : (
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 xl:grid xl:grid-cols-4 xl:overflow-visible">
          {COLUMNS.map((column) => {
            const columnTasks = all.filter(
              (task) => task.status === column.status,
            );
            return (
              <section
                key={column.status}
                aria-label={`${column.label}, ${columnTasks.length} tasks`}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropTarget(column.status);
                }}
                onDragLeave={() =>
                  setDropTarget((current) =>
                    current === column.status ? null : current,
                  )
                }
                onDrop={(event) => onDrop(event, column.status)}
                className={cn(
                  "flex w-[80vw] max-w-xs shrink-0 snap-center flex-col rounded-card bg-sunken p-3 outline-2 outline-offset-2 transition-[outline-color] xl:w-auto xl:max-w-none",
                  dropTarget === column.status
                    ? "outline-primary"
                    : "outline-transparent",
                )}
              >
                <header className="mb-3 flex items-center justify-between gap-2 px-1">
                  <h3 className="flex items-center gap-2 text-[0.9375rem]">
                    {column.label}
                    <span className="text-sm font-normal text-ink-mute tabular-nums">
                      {columnTasks.length}
                    </span>
                  </h3>
                  <button
                    type="button"
                    aria-label={`Add task to ${column.label}`}
                    onClick={() =>
                      setDialog({ task: null, status: column.status })
                    }
                    className="flex size-9 items-center justify-center rounded-field border border-line text-ink-soft hover:bg-surface hover:text-ink"
                  >
                    <Plus className="size-5" aria-hidden />
                  </button>
                </header>
                <ul className="flex min-h-16 flex-1 flex-col gap-2.5">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={() => setDialog({ task, status: task.status })}
                      onMove={(status) => move(task.id, status)}
                      onDelete={() => remove.mutate(task.id, { onError })}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {dialog && (
        <TaskDialog
          key={dialog.task?.id ?? `new-${dialog.status}`}
          project={project}
          task={dialog.task}
          initialStatus={dialog.status}
          onClose={() => setDialog(null)}
        />
      )}
    </>
  );
}
