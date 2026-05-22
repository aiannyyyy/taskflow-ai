import { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import TaskCard from "../components/TaskCard";

interface Task {
  id: number;
  title: string;
  description: string | null;
  priority: "low" | "medium" | "high";
  is_completed: boolean;
  due_date: string | null;
}

interface AiSuggestion {
  suggested_priority: string;
  suggested_due_date: string;
  suggested_subtasks: string[];
  ai_note: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AiSuggestion | null>(null);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const [showPlan, setShowPlan] = useState(false);

  const fetchTasks = async () => {
    const res = await api.get("/tasks/");
    setTasks(res.data);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/tasks/", { title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setAiSuggestion(null);
      fetchTasks();
    } finally {
      setLoading(false);
    }
  };

  const handleAiSuggest = async () => {
    if (!title) return;
    const res = await api.post("/tasks/ai-suggest", { title, description, priority });
    setAiSuggestion(res.data);
    setPriority(res.data.suggested_priority);
  };

  const handleToggle = async (id: number, completed: boolean) => {
    await api.put(`/tasks/${id}`, { is_completed: completed });
    fetchTasks();
  };

  const handleDelete = async (id: number) => {
    await api.delete(`/tasks/${id}`);
    fetchTasks();
  };

  const handleAiPlan = async () => {
    const res = await api.get("/tasks/ai-plan");
    setAiPlan(res.data);
    setShowPlan(true);
  };

  const pending = tasks.filter((t) => !t.is_completed);
  const completed = tasks.filter((t) => t.is_completed);

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Tasks</h1>
            <p className="text-gray-400 text-sm mt-1">
              {pending.length} pending · {completed.length} completed
            </p>
          </div>
          <button
            onClick={handleAiPlan}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            🤖 AI Daily Plan
          </button>
        </div>

        {/* AI Daily Plan */}
        {showPlan && aiPlan && (
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-purple-400 font-semibold">🤖 AI Daily Plan — {aiPlan.date}</h2>
              <button onClick={() => setShowPlan(false)} className="text-gray-500 hover:text-white">×</button>
            </div>
            <div className="space-y-2">
              {aiPlan.daily_plan.map((item: any) => (
                <div key={item.slot} className="flex items-center gap-3 text-sm">
                  <span className="text-purple-400 font-medium w-16">{item.slot}</span>
                  <span className="text-white">{item.task}</span>
                  <span className="text-gray-500">· {item.estimated_time}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-xs mt-3">{aiPlan.ai_note}</p>
          </div>
        )}

        {/* Create Task Form */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-white font-semibold mb-4">Add New Task</h2>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              required
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (optional)..."
              className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            />
            <div className="flex gap-3">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <button
                type="button"
                onClick={handleAiSuggest}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition"
              >
                🤖 AI Suggest
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? "Adding..." : "Add Task"}
              </button>
            </div>
          </form>

          {/* AI Suggestion Box */}
          {aiSuggestion && (
            <div className="mt-4 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
              <p className="text-purple-400 text-sm font-medium mb-2">🤖 AI Suggestion</p>
              <p className="text-gray-300 text-sm">Priority set to <span className="text-white font-medium">{aiSuggestion.suggested_priority}</span></p>
              <p className="text-gray-300 text-sm">Suggested due date: <span className="text-white font-medium">{aiSuggestion.suggested_due_date}</span></p>
              <div className="mt-2">
                <p className="text-gray-400 text-xs mb-1">Suggested subtasks:</p>
                <ul className="space-y-1">
                  {aiSuggestion.suggested_subtasks.map((s, i) => (
                    <li key={i} className="text-gray-300 text-xs">· {s}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pending Tasks */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-gray-400 text-sm font-medium mb-3">PENDING ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <div>
            <h2 className="text-gray-400 text-sm font-medium mb-3">COMPLETED ({completed.length})</h2>
            <div className="space-y-3">
              {completed.map((task) => (
                <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-gray-400">No tasks yet. Add your first task above!</p>
          </div>
        )}

      </div>
    </div>
  );
}