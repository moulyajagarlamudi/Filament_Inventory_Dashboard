import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

const logoUrl = new URL("../../innomayi_image.png", import.meta.url).href;

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
    navigate("/");
  };

  return (
  <>
    <div className="min-h-screen bg-[#f8fafc]">
      <Home
        isAdmin={true}
        showLowStockOnly={showLowStockOnly}
        setShowLowStockOnly={setShowLowStockOnly}
        onLogout={handleLogout}
      />

      {/* SCROLL BUTTON */}
      {showScroll && (
        <button
          onClick={() => {
            if (isBottom) {
              window.scrollTo({ top: 0, behavior: "smooth" });
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
            hover:scale-110
            animate-bounce
          "
        >
          {isBottom ? "↑" : "↓"}
        </button>
      )}
    </div>
  </>
);
}