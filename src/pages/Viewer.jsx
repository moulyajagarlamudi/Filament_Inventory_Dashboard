import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Home from "./Home";

export default function Viewer() {
  const navigate = useNavigate();
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [showScroll, setShowScroll] = useState(false);
  const [isBottom, setIsBottom] = useState(false);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        navigate("/admin/login");
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      window.removeEventListener("keydown", handleKey);
    };
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

  return (
    <>
      <Home
        isAdmin={false}
        showLowStockOnly={showLowStockOnly}
        setShowLowStockOnly={setShowLowStockOnly}
      />

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
