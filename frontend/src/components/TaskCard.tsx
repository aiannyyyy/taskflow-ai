interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  due_date: string | null;
}

interface Props {
  task: Task;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}

const priorityColors = {
  high: "bg-red-500/10 text-red-400 border-red-500/30",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  low: "bg-green-500/10 text-green-400 border-green-500/30",
};

export default function TaskCard({ task, onToggle, onDelete }: Props) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3 ${task.is_completed ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={() => onToggle(task.id, !task.is_completed)}
            className="mt-1 w-4 h-4 accent-blue-500 cursor-pointer"
          />
          <div>
            <p className={`text-white font-medium ${task.is_completed ? "line-through" : ""}`}>
              {task.title}
            </p>
            {task.description && (
              <p className="text-gray-400 text-sm mt-1">{task.description}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="text-gray-600 hover:text-red-400 text-lg transition"
        >
          ×
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.due_date && (
          <span className="text-xs text-gray-500">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </span>
        )}
      </div>
    </div>
  );
}