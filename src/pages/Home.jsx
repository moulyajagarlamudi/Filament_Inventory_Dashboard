import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

// 🎨 IMPORT SPOOL IMAGES
import silverSpool from "../assets/silver_spool.png";
import darkYellowSpool from "../assets/dark_yellow_spool.png";
import lightGoldSpool from "../assets/light_gold_spool.png";
import brownSpool from "../assets/brown_spool.png";
import blossomSpool from "../assets/blossom_l_spool.png";
import triColorSpool from "../assets/tricolour_spool.png";
import blackSpool from "../assets/black_spool.png";
import pureWhiteSpool from "../assets/white_spool.png";
import orangeSpool from "../assets/orange_spool.png";
import blueSpool from "../assets/blue_spool.png";
import transparentSpool from "../assets/transparent_spool.png";
import yellowSpool from "../assets/yellow_spool.png";
import lemonYellowSpool from "../assets/light_yellow_spool.png";
import magentaSpool from "../assets/magenta_spool.png";
import goldSpool from "../assets/gold_spool.png";
import whiteSpool from "../assets/white_spool.png";
import greenSpool from "../assets/green_spool.png";
import redSpool from "../assets/red_spool.png";
import brassSpool from "../assets/Antique_brass_spool.png";
import greySpool from "../assets/grey_spool.png";

export default function Home({
  isAdmin = false,
  showLowStockOnly,
  setShowLowStockOnly,
  hideHeader = false,
  hideScrollButtons = false,
}) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [internalShowLowStockOnly, setInternalShowLowStockOnly] = useState(false);
  const showLowStock =
    typeof showLowStockOnly === "boolean"
      ? showLowStockOnly
      : internalShowLowStockOnly;
  const setShowLowStock =
    setShowLowStockOnly || setInternalShowLowStockOnly;
  const [deleteModal, setDeleteModal] = useState(null);
  const [extraGroups, setExtraGroups] = useState({});
  const [selectedFilament, setSelectedFilament] = useState(null);
  const [successPopup, setSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [inputError, setInputError] = useState("");
  const [query, setQuery] = useState("");
  const [usage, setUsage] = useState({});
  const [stocks, setStocks] = useState({});
  const [inputs, setInputs] = useState({});
  const [inventoryDocs, setInventoryDocs] = useState({});
  const [showNewStockModal, setShowNewStockModal] = useState(false);
  const [newStock, setNewStock] = useState({
    filament: "",
    color: "",
    weight: "",
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStock, setDeleteStock] = useState({
    filament: "",
    color: "",
    weight: "",
  });

  const fetchInventory = async () => {
    try {
      const res = await fetch(
        "https://filament-backend.onrender.com/api/filaments/inventory",
      );
      const data = await res.json();
      const map = {};

      if (Array.isArray(data)) {
        data.forEach((item) => {
          const key = `${item.filament} ${item.color}`;
          map[key] = item;
        });
      }

      setInventoryDocs(map);
      const extras = {};

      data.forEach((item) => {
        const existsInStatic = filamentGroups[item.filament]?.some(
          (x) => x.color === item.color,
        );

        if (!existsInStatic) {
          if (!extras[item.filament]) {
            extras[item.filament] = [];
          }

          extras[item.filament].push({
            color: item.color,
            spools: item.spools || [],
          });
        }
      });

      setExtraGroups(extras);
    } catch (err) {
      console.log("Inventory fetch error:", err);
    }
  };

  // 🔥 FETCH DATA
  useEffect(() => {
    const fetchData = async () => {
      try {
        // GOOGLE SHEET DATA
        const usageRes = await fetch(
          "https://filament-backend.onrender.com/api/filaments?t=" + Date.now(),
        );

        const usageData = await usageRes.json();

        console.log("USAGE FROM BACKEND:", usageData);

        setUsage(usageData || {});

        // MONGODB INVENTORY
        const inventoryRes = await fetch(
          "https://filament-backend.onrender.com/api/filaments/inventory",
        );

        const inventoryData = await inventoryRes.json();

        const map = {};

        if (Array.isArray(inventoryData)) {
          inventoryData.forEach((item) => {
            const key = `${item.filament} ${item.color}`;

            map[key] = item;
          });
        }

        setInventoryDocs(map);
      } catch (err) {
        console.log("Auto refresh error:", err);
      }
    };

    // INITIAL LOAD
    fetchData();

    // 🔥 AUTO REFRESH EVERY 3 SECONDS
    const interval = setInterval(() => {
      fetchData();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // 🔥 ESC CLOSE
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedFilament(null);

        setShowNewStockModal(false);

        setShowDeleteModal(false);

        setInputError("");
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  // 🎨 IMAGE MAP
  const getSpoolImage = (color) => {
    if (!color) return blackSpool;

    const c =
      typeof color === "string"
        ? color.toLowerCase()
        : String(color).toLowerCase();

    if (c.includes("silver")) return silverSpool;
    if (c.includes("dark yellow")) return darkYellowSpool;
    if (c.includes("light gold")) return lightGoldSpool;
    if (c.includes("brown")) return brownSpool;
    if (c.includes("blossom")) return blossomSpool;
    if (c.includes("tri")) return triColorSpool;
    if (c.includes("pure white")) return pureWhiteSpool;
    if (c === "white") return whiteSpool;
    if (c.includes("black")) return blackSpool;
    if (c.includes("orange")) return orangeSpool;
    if (c.includes("blue")) return blueSpool;
    if (c.includes("transparent")) return transparentSpool;
    if (c.includes("lemon")) return lemonYellowSpool;
    if (c === "yellow") return yellowSpool;
    if (c.includes("magenta")) return magentaSpool;
    if (c === "gold") return goldSpool;
    if (c.includes("green")) return greenSpool;
    if (c.includes("red")) return redSpool;
    if (c.includes("brass")) return brassSpool;
    if (c.includes("grey")) return greySpool;

    return blackSpool;
  };

  // 🎨 COLOR MAP
  const getColor = (color) => {
    if (!color) return "#475569";

    const c =
      typeof color === "string"
        ? color.toLowerCase()
        : String(color).toLowerCase();

    if (c.includes("red")) return "#dc2626";
    if (c.includes("black")) return "#111827";
    if (c.includes("white")) return "#f8fafc";
    if (c.includes("blue")) return "#2563eb";
    if (c.includes("green")) return "#16a34a";
    if (c.includes("yellow")) return "#ca8a04";
    if (c.includes("orange")) return "#ea580c";
    if (c.includes("brown")) return "#92400e";
    if (c.includes("silver")) return "#94a3b8";
    if (c.includes("gold")) return "#d4a017";
    if (c.includes("purple")) return "#9333ea";
    if (c.includes("magenta")) return "#db2777";
    if (c.includes("grey")) return "#6b7280";
    if (c.includes("transparent")) return "#cbd5e1";
    if (c.includes("brass")) return "#8b6b2e";
    if (c.includes("lemon")) return "#d9f000";

    return "#475569";
  };

  // 📦 FILAMENT GROUPS
  const filamentGroups = {
    "Silk PLA": [
      { color: "Silver", spools: [450] },
      { color: "Dark Yellow", spools: [100] },
      { color: "Light Gold", spools: [600] },
      { color: "Tri colour / Blue Green Purple", spools: [600] },
    ],

    PLA: [
      { color: "White", spools: [300] },
      { color: "ANTIQUE BRASS", spools: [900] },
      { color: "Black", spools: [3000] },
    ],

    "PLA +": [
      { color: "Yellow", spools: [950] },

      { color: "Brown", spools: [90] },

      // merged both Red spools
      { color: "Red", spools: [200, 30, 50, 200] },

      { color: "Orange", spools: [150] },

      { color: "White", spools: [500, 350] },

      // only one Black entry
      { color: "Black", spools: [50] },

      // only one Grey entry
      { color: "Grey", spools: [30] },

      { color: "Blue", spools: [100] },
    ],

    "Hyper PLA": [
      { color: "Brown", spools: [50] },
      { color: "Blossom L", spools: [800] },
      { color: "Gold", spools: [180] },

      // 🔥 Multiple Spools
      {
        color: "Black",
        spools: [
          { id: 1, weight: 100 },
          { id: 2, weight: 150 },
          { id: 3, weight: 900 },
          { id: 4, weight: 400 },
          { id: 5, weight: 600 },
        ],
      },

      { color: "Green", spools: [80, 950] },
      { color: "Red", spools: [950] },
      { color: "White", spools: [2000] },
      { color: "Blue", spools: [1000] },
      { color: "Viva Magenta", spools: [100] },
      { color: "Orange", spools: [1000] },
    ],

    PETG: [
      { color: "Orange", spools: [270] },
      { color: "Blue", spools: [800] },
      { color: "Transparent", spools: [850] },
      { color: "Yellow", spools: [300] },
      { color: "Black", spools: [0] },
      { color: "Red", spools: [1000, 250, 1000] },
    ],

    ABS: [
      { color: "White", spools: [250] },
      { color: "Green", spools: [650] },
      { color: "Black", spools: [100] },
    ],

    "ABS +": [{ color: "Brown", spools: [900] }],

    ASA: [{ color: "Lemon Yellow", spools: [1000] }],

    TPU: [
      { color: "95A - Black", spools: [900, 50] },
      { color: "Silk Black", spools: [900] },
    ],

    CF: [
      { color: "PPA - Black", spools: [250] },
      { color: "PLA - Black", spools: [50] },
    ],
  };

  // 🔥 INITIAL STOCK
  useEffect(() => {
    let initial = {};

    Object.keys(filamentGroups).forEach((group) => {
      filamentGroups[group].forEach((item) => {
        const totalWeight = item.spools.reduce((sum, spool) => {
          if (typeof spool === "object") {
            return sum + Number(spool.weight || 0);
          }

          return sum + Number(spool || 0);
        }, 0);

        const key = `${group} ${item.color}`;

        initial[key] = {
          total: totalWeight,
          spools: [...item.spools],
        };
      });
    });

    setStocks(initial);
  }, []);

  // ➕ ADD STOCK
  const addStock = async (key) => {
    const value = Number(inputs[key] || 0);

    if (!value || value <= 0) {
      setInputError("Please enter grams");
      return;
    }

    setInputError("");

    const existing = inventoryDocs[key];

    try {
      let response;

      const currentSpools = existing?.spools || stocks[key]?.spools || [];

      const updatedSpools = [...currentSpools, value];

      const totalStock = updatedSpools.reduce(
        (sum, weight) => sum + Number(weight),
        0,
      );

      const token = localStorage.getItem("token");

      if (existing && existing._id) {
        response = await fetch(
          `https://filament-backend.onrender.com/api/filaments/${existing._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              currentStock: totalStock,
              spools: updatedSpools,
            }),
          },
        );
      } else {
        const filament = selectedFilament?.group || "";
        const color = selectedFilament?.color || "";

        response = await fetch(
          "https://filament-backend.onrender.com/api/filaments",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              filament,
              color,
              currentStock: totalStock,
              usedStock: 0,
              spools: updatedSpools,
            }),
          },
        );
      }

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to save stock");
      }

      await fetchInventory();

      setLogs((prev) => [
        {
          action: `Added ${value}g to ${key}`,
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      setSuccessMessage(`${value}g spool added successfully`);

      setSuccessPopup(true);

      setTimeout(() => {
        setSuccessPopup(false);
      }, 5000);

      setInputs((prev) => ({
        ...prev,
        [key]: "",
      }));

      setSelectedFilament(null);
    } catch (err) {
      console.error("Stock save error:", err);
      setInputError(err.message || "Failed to save stock");
    }
  };

  const handleNewStockSubmit = async () => {
    try {
      const filament = newStock.filament.trim();
      const color = newStock.color.trim();
      const weight = Number(newStock.weight);

      if (!filament || !color || !weight) {
        alert("Please fill all fields");
        return;
      }

      const key = `${filament} ${color}`;

      const existing = inventoryDocs[key];

      let updatedSpools = [];

      if (existing?.spools) {
        updatedSpools = [...existing.spools, weight];
      } else {
        updatedSpools = [weight];
      }

      const totalStock = updatedSpools.reduce(
        (sum, val) => sum + Number(val),
        0,
      );

      const token = localStorage.getItem("token");
      if (existing && existing._id) {
        await fetch(
          `https://filament-backend.onrender.com/api/filaments/${existing._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
            body: JSON.stringify({
              currentStock: totalStock,
              spools: updatedSpools,
            }),
          },
        );
      } else {
        await fetch("https://filament-backend.onrender.com/api/filaments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token,
          },
          body: JSON.stringify({
            filament,
            color,
            currentStock: totalStock,
            usedStock: 0,
            spools: updatedSpools,
          }),
        });
      }

      await fetchInventory();

      setShowNewStockModal(false);

      setNewStock({
        filament: "",
        color: "",
        weight: "",
      });

      setLogs((prev) => [
        {
          action: `Created new stock ${filament} ${color} (${weight}g)`,
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      setSuccessMessage("New stock added successfully");

      setSuccessPopup(true);

      setTimeout(() => {
        setSuccessPopup(false);
      }, 4000);
    } catch (err) {
      console.log(err);
      alert("Failed to add stock");
    }
  };

  const handleDeleteStock = async () => {
    try {
      const filament = deleteStock.filament.trim();
      const color = deleteStock.color.trim();

      if (!filament || !color) {
        alert("Please fill filament and colour");
        return;
      }

      const key = `${filament} ${color}`;

      const existing = inventoryDocs[key];

      if (!existing) {
        alert("Stock not found");
        return;
      }

      // 🔥 DELETE ENTIRE FILAMENT
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://filament-backend.onrender.com/api/filaments/${existing._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete stock");
      }

      await fetchInventory();

      setShowDeleteModal(false);

      setDeleteStock({
        filament: "",
        color: "",
        weight: "",
      });

      setLogs((prev) => [
        {
          action: `Deleted ${filament} ${color}`,
          time: new Date().toLocaleString(),
        },
        ...prev,
      ]);

      setSuccessMessage("Filament deleted successfully");

      setSuccessPopup(true);

      setTimeout(() => {
        setSuccessPopup(false);
      }, 4000);
    } catch (err) {
      console.log(err);
      alert("Failed to delete stock");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar query={query} setQuery={setQuery} />

      <div className="mx-auto max-w-7xl px-8 py-10">
        {!hideHeader && (
          <div className="mb-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              Filament Inventory
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {!isAdmin && (
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
              )}

              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={
                  `
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
                showLowStock
                  ? "bg-red-700 hover:bg-red-800"
                  : "bg-red-500 hover:bg-red-600"
              }
            `
                }
              >
                {showLowStock ? "Show All" : "Low Stock"}
              </button>
            </div>
          </div>
        )}

        {/* GROUPS */}
        <div className="space-y-14">
          {[
            ...new Set([
              ...Object.keys(filamentGroups),
              ...Object.keys(extraGroups),
            ]),
          ].map((group) => {
            const groupItems = [
              ...(filamentGroups[group] || []),
              ...(extraGroups[group] || []),
            ];

            const filteredColors = groupItems.filter((item) =>
              `${group} ${item.color}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            );

            if (filteredColors.length === 0) return null;

            return (
              <div key={group}>
                {/* GROUP TITLE */}
                <div className="mb-7 flex items-center gap-4">
                  <div className="h-10 w-2 rounded-full bg-slate-900" />

                  <h2 className="text-2xl font-bold text-slate-900">{group}</h2>
                </div>

                {/* GRID */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {filteredColors.map((item) => {
                    const color = item.color;

                    const spoolColor = getColor(color);

                    const filamentKey = `${group} ${color}`;

                    const used = usage[filamentKey] || 0;

                    const originalSpools =
                      inventoryDocs[filamentKey]?.spools ||
                      stocks[filamentKey]?.spools ||
                      [];

                    let remainingUsage = used;

                    const updatedSpools = [...originalSpools]
                      .map((spool) =>
                        typeof spool === "object" ? spool.weight : spool,
                      )
                      .sort((a, b) => a - b)
                      .map((weight) => {
                        if (remainingUsage <= 0) return weight;

                        if (remainingUsage >= weight) {
                          remainingUsage -= weight;
                          return 0;
                        }

                        const newWeight = weight - remainingUsage;
                        remainingUsage = 0;

                        return newWeight;
                      });

                    const remaining = updatedSpools.reduce(
                      (sum, weight) => sum + weight,
                      0,
                    );

                    const isLowStock = remaining <= 200;
                    const spoolCount = updatedSpools.length;
                    if (showLowStock && !isLowStock) {
                      return null;
                    }

                    return (
                      <div
                        key={filamentKey}
                        className="
                          relative
                          overflow-hidden
                          rounded-[30px]
                          border
                          border-slate-200
                          bg-white
                          p-7
                          shadow-sm
                          transition-all
                          duration-500
                          hover:-translate-y-2
                          hover:shadow-2xl
                        "
                      >
                        {/* TOP COLOR LINE */}
                        <div
                          className="absolute left-0 top-0 h-2 w-full"
                          style={{
                            background: spoolColor,
                          }}
                        />

                        {/* TOP SECTION */}
                        <div className="flex items-center gap-5">
                          {/* SPOOL */}
                          <div
                            className="
                              flex
                              h-24
                              w-24
                              items-center
                              justify-center
                              rounded-3xl
                              bg-slate-50
                              border
                              border-slate-100
                            "
                          >
                            <img
                              src={getSpoolImage(color)}
                              alt={color}
                              className="
                                h-20
                                w-20
                                object-contain
                                transition-all
                                duration-500
                                hover:scale-110
                              "
                            />
                          </div>

                          {/* DETAILS */}
                          <div className="flex-1">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Colour
                            </p>

                            <div className="mt-2 flex items-center gap-3">
                              <div
                                className="h-5 w-5 rounded-full border border-slate-300"
                                style={{
                                  background: spoolColor,
                                }}
                              />

                              <h3 className="text-xl font-semibold text-slate-800">
                                {color}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {/* STOCK */}
                        {/* STOCK */}
                        <div className="mt-8">
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-500">
                              Remaining Stock
                            </p>

                            {/* MULTI SPOOL BADGE */}
                            {item.spools.length > 1 && (
                              <div
                                className="
          rounded-full
          bg-slate-900
          px-3
          py-1
          text-xs
          font-semibold
          tracking-wide
          text-white
        "
                              >
                                {item.spools.length} SPOOLS
                              </div>
                            )}
                          </div>

                          {/* TOTAL WEIGHT */}
                          <div className="mt-3 flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-black">
                              {remaining}g
                            </h1>

                            {isLowStock && (
                              <div
                                className="
        rounded-full
        bg-red-100
        px-3
        py-1
        text-xs
        font-bold
        text-red-600
        animate-pulse
      "
                              >
                                LOW STOCK
                              </div>
                            )}
                          </div>

                          {/* SPOOL BREAKDOWN */}
                          {updatedSpools.length > 1 && (
                            <div className="mt-5 space-y-2">
                              {updatedSpools.map((weight, index) => (
                                <div
                                  key={index}
                                  className="
            flex
            items-center
            justify-between
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-4
            py-3
          "
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="h-3 w-3 rounded-full"
                                      style={{
                                        background: spoolColor,
                                      }}
                                    />

                                    <p className="text-sm font-medium text-slate-700">
                                      Spool {index + 1}
                                    </p>
                                  </div>

                                  <p className="text-sm font-bold text-slate-900">
                                    {weight}g
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* BUTTON */}
                        {isAdmin && (
                          <div className="mt-8">
                            <button
                              onClick={() =>
                                setSelectedFilament({
                                  key: filamentKey,
                                  group,
                                  color,
                                })
                              }
                              className="
                                w-full
                                rounded-2xl
                                bg-slate-900
                                py-3
                                text-sm
                                font-semibold
                                text-white
                                transition-all
                                duration-300
                                hover:scale-[1.02]
                                hover:bg-slate-700
                                active:scale-95
                              "
                            >
                              Add Stock
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LOGS */}
      <div className="mt-16">
        <div className="mb-5 flex items-center gap-3">
          <div className="h-8 w-2 rounded-full bg-slate-900" />

          <h2 className="text-2xl font-bold text-slate-900">Inventory Logs</h2>
        </div>

        <div className="space-y-4">
          {logs.length === 0 ? (
            <div
              className="
          rounded-3xl
          border
          border-slate-200
          bg-white
          p-6
          text-slate-500
          shadow-sm
        "
            >
              No recent actions
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className="
            flex
            items-center
            justify-between
            rounded-3xl
            border
            border-slate-200
            bg-white
            px-6
            py-5
            shadow-sm
          "
              >
                <p className="font-semibold text-slate-800">{log.action}</p>

                <p className="text-sm text-slate-400">{log.time}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
          {/* ADD BUTTON */}
          <button
            onClick={() => setShowNewStockModal(true)}
            className="
      group
      relative
      overflow-hidden
      rounded-3xl
      bg-slate-900
      px-10
      py-5
      text-lg
      font-bold
      text-white
      shadow-2xl
      transition-all
      duration-500
      hover:-translate-y-2
      hover:scale-105
      hover:bg-slate-700
      active:scale-95
    "
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl transition-transform duration-500 group-hover:rotate-90">
                +
              </span>
              Add New Stock
            </span>
          </button>

          {/* DELETE BUTTON */}
          <button
            onClick={() => setShowDeleteModal(true)}
            className="
      group
      relative
      overflow-hidden
      rounded-3xl
      bg-red-500
      px-10
      py-5
      text-lg
      font-bold
      text-white
      shadow-2xl
      transition-all
      duration-500
      hover:-translate-y-2
      hover:scale-105
      hover:bg-red-600
      active:scale-95
    "
          >
            <span className="flex items-center gap-3">
              <span className="text-2xl transition-transform duration-500 group-hover:rotate-90">
                ×
              </span>
              Delete Stock
            </span>
          </button>
        </div>
      )}
      {/* NEW STOCK MODAL */}
      {isAdmin && showNewStockModal && (
        <div
          className="
    fixed
    inset-0
    z-[9999]
    flex
    items-center
    justify-center
    bg-black/40
  "
        >
          <div
            className="
    relative
    z-[10000]
    w-[450px]
        rounded-[32px]
        bg-white
        p-8
        shadow-2xl
      "
          >
            <h2 className="text-3xl font-bold text-slate-900">Add New Stock</h2>

            <div className="mt-8 space-y-5">
              <input
                type="text"
                placeholder="Filament Name"
                value={newStock.filament}
                onChange={(e) =>
                  setNewStock({
                    ...newStock,
                    filament: e.target.value,
                  })
                }
                autoFocus
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
              />

              <input
                type="text"
                placeholder="Colour"
                value={newStock.color}
                onChange={(e) =>
                  setNewStock({
                    ...newStock,
                    color: e.target.value,
                  })
                }
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
              />

              <input
                type="number"
                placeholder="Weight in grams"
                value={newStock.weight}
                onChange={(e) =>
                  setNewStock({
                    ...newStock,
                    weight: e.target.value,
                  })
                }
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
              />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowNewStockModal(false)}
                className="
    flex-1
    rounded-2xl
    border
    border-slate-300
    bg-white
    py-4
    text-base
    font-semibold
    text-black
    shadow-sm
    transition-all
    duration-300
    hover:-translate-y-1
    hover:bg-slate-100
    hover:shadow-lg
    active:scale-95
  "
              >
                Cancel
              </button>

              <button
                onClick={handleNewStockSubmit}
                className="
    flex-1
    rounded-2xl
    bg-slate-900
    py-4
    text-base
    font-semibold
    text-white
    shadow-xl
    transition-all
    duration-300
    hover:-translate-y-1
    hover:scale-[1.03]
    hover:bg-slate-700
    hover:shadow-2xl
    active:scale-95
  "
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE STOCK MODAL */}
      {isAdmin && showDeleteModal && (
        <div
          className="
      fixed
      inset-0
      z-[9999]
      flex
      items-center
      justify-center
      bg-black/40
    "
        >
          <div
            className="
        relative
        w-[450px]
        rounded-[32px]
        bg-white
        p-8
        shadow-2xl
      "
          >
            {/* CLOSE */}
            <button
              onClick={() => setShowDeleteModal(false)}
              className="
          absolute
          right-5
          top-5
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-full
          bg-slate-100
          text-xl
          font-bold
          text-slate-500
          transition-all
          duration-300
          hover:bg-red-500
          hover:text-white
        "
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-black">Delete Stock</h2>

            <div className="mt-8 space-y-5">
              <input
                type="text"
                placeholder="Filament Name"
                value={deleteStock.filament}
                onChange={(e) =>
                  setDeleteStock({
                    ...deleteStock,
                    filament: e.target.value,
                  })
                }
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
          "
              />

              <input
                type="text"
                placeholder="Colour"
                value={deleteStock.color}
                onChange={(e) =>
                  setDeleteStock({
                    ...deleteStock,
                    color: e.target.value,
                  })
                }
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
          "
              />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="
            flex-1
            rounded-2xl
            border
            border-slate-300
            bg-white
            py-4
            text-base
            font-semibold
            text-black
            transition-all
            duration-300
            hover:bg-slate-100
          "
              >
                Cancel
              </button>

              <button
                onClick={handleDeleteStock}
                className="
            flex-1
            rounded-2xl
            bg-red-500
            py-4
            text-base
            font-semibold
            text-white
            shadow-xl
            transition-all
            duration-300
            hover:bg-red-600
            hover:scale-105
            active:scale-95
          "
              >
                Delete Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {isAdmin && selectedFilament && (
        <div
          className="
      fixed
      inset-0
      z-[9999]
      flex
      items-center
      justify-center
      bg-black/40
      backdrop-blur-sm
      animate-fadeIn
    "
        >
          <div
            className="
        relative
        w-[420px]
        overflow-hidden
        rounded-[28px]
        bg-white
        p-7
        shadow-[0_25px_60px_rgba(0,0,0,0.25)]
        animate-scaleIn
      "
          >
            {/* CLOSE */}
            <button
              onClick={() => {
                setSelectedFilament(null);
                setInputError("");
              }}
              className="
          absolute
          right-4
          top-4
          flex
          h-8
          w-8
          items-center
          justify-center
          rounded-full
          bg-slate-100
          text-sm
          font-bold
          text-slate-500
          transition-all
          duration-300
          hover:bg-red-500
          hover:text-white
        "
            >
              ×
            </button>

            {/* TOP */}
            <div className="flex items-center gap-5">
              {/* IMAGE */}
              <div
                className="
            flex
            h-20
            w-20
            items-center
            justify-center
            rounded-2xl
            bg-slate-50
            border
            border-slate-200
          "
              >
                <img
                  src={getSpoolImage(selectedFilament.color)}
                  alt={selectedFilament.color}
                  className="h-16 w-16 object-contain"
                />
              </div>

              {/* DETAILS */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedFilament.group}
                </h2>

                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{
                      background: getColor(selectedFilament.color),
                    }}
                  />

                  <p className="text-sm font-medium text-slate-500">
                    {selectedFilament.color}
                  </p>
                </div>
              </div>
            </div>

            {/* INPUT */}
            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-slate-500">
                Add Weight
              </p>

              <input
                type="number"
                placeholder="Enter grams"
                autoFocus
                value={inputs[selectedFilament.key] || ""}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    [selectedFilament.key]: e.target.value,
                  }))
                }
                className="
            w-full
            rounded-2xl
            border
            border-slate-200
            bg-slate-50
            px-5
            py-4
            text-base
            font-medium
            text-slate-900
            outline-none
            transition-all
            duration-300
            placeholder:text-slate-400
            focus:border-slate-900
            focus:bg-white
          "
              />

              {inputError && (
                <p className="mt-3 text-sm font-medium text-red-500">
                  {inputError}
                </p>
              )}
            </div>

            {/* BUTTONS */}
            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setSelectedFilament(null);
                  setInputError("");
                }}
                className="
            flex-1
            rounded-2xl
            border
            border-slate-200
            bg-white
            py-3
            text-sm
            font-semibold
            text-slate-700
            transition-all
            duration-300
            hover:bg-slate-100
          "
              >
                Cancel
              </button>

              <button
                onClick={() => addStock(selectedFilament.key)}
                className="
            flex-1
            rounded-2xl
            bg-slate-900
            py-3
            text-sm
            font-semibold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:scale-[1.03]
            hover:bg-slate-700
            active:scale-95
          "
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCROLL BUTTONS */}
      {/* Scroll buttons moved to individual page components */}

      {/* ✅ SUCCESS POPUP */}
      {successPopup && (
        <div
          className="
            fixed
            right-8
            top-44
            z-[100]
            animate-bounce
          "
        >
          <div
            className="
              rounded-3xl
              bg-green-500
              px-8
              py-5
              shadow-2xl
              text-white
            "
          >
            <h2 className="text-lg font-bold">Stock Updated</h2>

            <p className="mt-2 text-sm text-white/90">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
