import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [adminId, setAdminId] = useState("");

  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch(
        "https://filament-backend.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            adminId,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      localStorage.setItem("token", data.token);

      navigate("/admin");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
        <div className="mb-10 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Login</h1>
            <p className="mt-2 text-sm text-slate-500">
              Filament Inventory Secure Access
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-600">
              ADMIN ID
            </label>
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
                text-lg
                font-medium
                text-black
                caret-black
                outline-none
                placeholder:text-slate-400
                focus:border-slate-900
              "
              placeholder="admin"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-slate-600">
              PASSWORD
            </label>
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
                text-lg
                font-medium
                text-black
                caret-black
                outline-none
                placeholder:text-slate-400
                focus:border-slate-900
              "
              placeholder="Enter your password"
            />
          </div>
        </div>

        <button
          onClick={handleLogin}
          className="mt-8 w-full rounded-2xl bg-slate-900 px-6 py-4 text-base font-semibold text-white transition-all duration-300 hover:bg-slate-700"
        >
          Login
        </button>
      </div>
    </div>
  );
}
