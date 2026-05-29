import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [showScroll, setShowScroll] = useState(false);
  const [isBottom, setIsBottom] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/admin/login");
    }
  }, [navigate]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.body.scrollHeight;

      if (scrollTop > 300) {
        setShowScroll(true);
      } else {
        setShowScroll(false);
      }

      if (scrollTop + windowHeight >= documentHeight - 100) {
        setIsBottom(true);
      } else {
        setIsBottom(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/admin/login");
  };

  return (
    <>
      <div className="bg-slate-900 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-slate-300">
              Manage stock, add new filament, and delete items.
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/login")}
            className="
              rounded-2xl
              bg-slate-900
              px-7
              py-3
              text-sm
              font-bold
              text-white
              shadow-xl
              transition-all
              duration-300
              hover:-translate-y-1
              hover:bg-slate-700
            "
          >
            Admin Login
          </button>

          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`
              rounded-2xl
              px-6
              py-3
              text-sm
              font-bold
              text-white
              transition-all
              duration-300
              shadow-lg
              ${
                showLowStockOnly
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-red-500 hover:bg-red-600"
              }
            `}
          >
            {showLowStockOnly ? "Show All" : "Low Stock"}
          </button>
        </div>
      </div>

      <Home isAdmin hideHeader hideScrollButtons showLowStockOnly={showLowStockOnly} setShowLowStockOnly={setShowLowStockOnly} />

      {showScroll && (
        <button
          onClick={() => {
            if (isBottom) {
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              });
            } else {
              window.scrollTo({
                top: document.body.scrollHeight,
                behavior: "smooth",
              });
            }
          }}
          className="
        fixed
        bottom-8
        right-8
        z-[999]
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-full
        bg-slate-900
        text-3xl
        font-bold
        text-white
        shadow-2xl
        transition-all
        duration-500
        hover:scale-110
        hover:bg-slate-700
        animate-bounce
      "
        >
          {isBottom ? "↑" : "↓"}
        </button>
      )}
    </>
  );
}
