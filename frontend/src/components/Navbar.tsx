import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link to="/dashboard" className="text-xl font-bold text-white">
        TaskFlow <span className="text-blue-400">AI</span>
      </Link>
      <button
        onClick={handleLogout}
        className="text-gray-400 hover:text-white text-sm transition"
      >
        Logout
      </button>
    </nav>
  );
}