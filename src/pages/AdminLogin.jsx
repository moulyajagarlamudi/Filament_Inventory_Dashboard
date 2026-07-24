import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = process.env.NODE_ENV === "development" ? "http://localhost:4000/api" : "/api";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${API_BASE}/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminId,
            password,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      navigate("/admin");
    } catch (err) {
      setError("Server error");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-6">
      <form onSubmit={handleLogin} className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Admin Login</h1>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">ADMIN ID</label>
            <input
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                bg-white
                px-5
                py-4
                text-black
                outline-none
              "
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-600">PASSWORD</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="
                w-full
                rounded-2xl
                border
                border-slate-300
                bg-white
                px-5
                py-4
                text-black
                outline-none
              "
            />
          </div>

          {error && (
            <div className="text-center text-sm text-red-600">{error}</div>
          )}

          <button
            type="submit"
            className="mt-4 w-full rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-slate-700"
          >
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
