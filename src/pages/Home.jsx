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

const API_BASE = import.meta.env.VITE_API_BASE ?? "/api";

export default function Home({
  isAdmin = false,
  showLowStockOnly,
  setShowLowStockOnly,
  hideHeader = false,
  hideScrollButtons = false,
  onLogout,
}) {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [internalShowLowStockOnly, setInternalShowLowStockOnly] = useState(false);
  const showLowStock =
    typeof showLowStockOnly === "boolean"
      ? showLowStockOnly
      : internalShowLowStockOnly;
  const setShowLowStock = setShowLowStockOnly || setInternalShowLowStockOnly;

  const [extraGroups, setExtraGroups] = useState({});
  const [selectedFilament, setSelectedFilament] = useState(null);
  const [successPopup, setSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [inputError, setInputError] = useState("");
  const [query, setQuery] = useState("");
  const [inputs, setInputs] = useState({});
  const [inventoryDocs, setInventoryDocs] = useState({});

  // ADMIN MODALS
  const [showNewStockModal, setShowNewStockModal] = useState(false);
  const [newStock, setNewStock] = useState({
    filament: "",
    color: "",
    weight: "",
  });

  const [showAdminDeleteModal, setShowAdminDeleteModal] = useState(false);
  const [adminDeleteData, setAdminDeleteData] = useState({
    filament: "",
    color: "",
    weight: "",
    partName: "",
    projectBy: "",
    quantity: "1",
    printTime: "",
    printer: "",
  });

  // USER DELETE STOCK MODAL (11 REQUIRED FIELDS)
  const [showUserDeleteModal, setShowUserDeleteModal] = useState(false);
  const [userDeleteFormData, setUserDeleteFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    username: "",
    partName: "",
    projectBy: "",
    quantity: "1",
    filamentType: "",
    filamentColor: "",
    filamentUsage: "",
    totalFilamentUsage: "",
    printTime: "",
    printer: "",
  });

  const fetchInventory = async () => {
    try {
      const res = await fetch(`${API_BASE}/filaments/inventory`, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      if (!res.ok) return;
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
      if (Array.isArray(data)) {
        data.forEach((item) => {
          const existsInStatic = filamentGroups[item.filament]?.some(
            (x) => x.color === item.color
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
      }

      setExtraGroups(extras);
    } catch (err) {
      console.log("Inventory fetch error:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`${API_BASE}/logs`);
      if (res.ok) {
        const data = await res.json();
        const normalizedLogs = Array.isArray(data)
          ? data
          : Array.isArray(data?.logs)
            ? data.logs
            : [];
        setLogs(normalizedLogs);
      }
    } catch (err) {
      console.log("Logs fetch error:", err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        await fetchInventory();
        await fetchLogs();
      } catch (err) {
        console.log("Auto refresh error:", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchInventory();
        fetchLogs();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelectedFilament(null);
        setShowNewStockModal(false);
        setShowAdminDeleteModal(false);
        setShowUserDeleteModal(false);
        setInputError("");
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // 🎨 IMAGE MAP
  const getSpoolImage = (color) => {
    if (!color) return blackSpool;
    const c = String(color).toLowerCase();

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
    const c = String(color).toLowerCase();

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
      { color: "Red", spools: [200, 30, 50, 200] },
      { color: "Orange", spools: [150] },
      { color: "White", spools: [500, 350] },
      { color: "Black", spools: [50] },
      { color: "Grey", spools: [30] },
      { color: "Blue", spools: [100] },
    ],

    "Hyper PLA": [
      { color: "Brown", spools: [50] },
      { color: "Blossom L", spools: [800] },
      { color: "Gold", spools: [180] },
      {
        color: "Black",
        spools: [100, 150, 900, 400, 600],
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

  // List of all filament names for dropdowns
  const filamentNames = [
    ...new Set([
      ...Object.keys(filamentGroups),
      ...Object.values(inventoryDocs).map((item) => item.filament?.trim()),
    ]),
  ].filter(Boolean).sort();

  // Helper for available colors by filament name
  const getColorsForFilament = (filamentName) => {
    if (!filamentName) return [];
    const norm = filamentName.toLowerCase().trim();

    const staticColors = Object.entries(filamentGroups)
      .filter(([group]) => group.toLowerCase().trim() === norm)
      .flatMap(([, items]) => items.map((i) => i.color));

    const docColors = Object.values(inventoryDocs)
      .filter((doc) => doc.filament?.toLowerCase().trim() === norm)
      .map((doc) => doc.color);

    return [...new Set([...staticColors, ...docColors])].filter(Boolean).sort();
  };

  // ➕ ADD STOCK (CARD MODAL) - ALWAYS CREATES NEW SPOOL
  const addStock = async (key) => {
    try {
      const value = Number(inputs[key] || 0);

      if (!value || value <= 0) {
        setInputError("Please enter weight in grams");
        return;
      }

      // Collect current spools from DB OR static data so backend can append correctly
      const filamentKey = `${selectedFilament.group} ${selectedFilament.color}`;
      const mongoDoc = inventoryDocs[filamentKey];
      const staticItem = filamentGroups[selectedFilament.group]?.find(
        (i) => i.color === selectedFilament.color
      );
      const spoolsRaw = mongoDoc?.spools?.length > 0 ? mongoDoc.spools : (staticItem?.spools || []);
      const existingSpools = spoolsRaw
        .map((s) => (typeof s === "object" ? s.weight : s))
        .map((w) => Number(w || 0))
        .filter((w) => w > 0);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/filaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          filament: selectedFilament.group,
          color: selectedFilament.color,
          weight: value,
          existingSpools,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to add stock");
      }

      await fetchInventory();
      await fetchLogs();

      setSelectedFilament(null);
      setInputs((prev) => ({ ...prev, [key]: "" }));
      setSuccessMessage(`New spool of ${value}g added to ${selectedFilament.group} ${selectedFilament.color}`);
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 3500);
    } catch (err) {
      console.error("Stock save error:", err);
      setInputError(err.message);
    }
  };

  // ➕ ADD NEW STOCK (ADMIN BOTTOM MODAL)
  const handleNewStockSubmit = async () => {
    try {
      const filament = newStock.filament.trim();
      const color = newStock.color.trim();
      const weight = Number(newStock.weight);

      if (!filament || !color || !weight || weight <= 0) {
        alert("Please fill all fields with valid values");
        return;
      }

      // Collect current spools from DB OR static data so backend can append correctly
      const filamentKey = `${filament} ${color}`;
      const mongoDoc = inventoryDocs[filamentKey];
      const staticItem = filamentGroups[filament]?.find(
        (i) => i.color.toLowerCase().trim() === color.toLowerCase().trim()
      );
      const spoolsRaw = mongoDoc?.spools?.length > 0 ? mongoDoc.spools : (staticItem?.spools || []);
      const existingSpools = spoolsRaw
        .map((s) => (typeof s === "object" ? s.weight : s))
        .map((w) => Number(w || 0))
        .filter((w) => w > 0);

      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/filaments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          filament,
          color,
          weight,
          existingSpools,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to add new stock");
      }

      await fetchInventory();
      await fetchLogs();

      setShowNewStockModal(false);
      setNewStock({ filament: "", color: "", weight: "" });
      setSuccessMessage(`New spool of ${weight}g added for ${filament} ${color}`);
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 3500);
    } catch (err) {
      console.error("Add new stock error:", err);
      alert(err.message || "Failed to add stock");
    }
  };

  // 🗑 ADMIN DELETE STOCK SUBMIT
  const handleAdminDeleteSubmit = async (e) => {
    if (e) e.preventDefault();
    const { filament, color, weight, partName, projectBy, quantity, printTime, printer } = adminDeleteData;
    const safeWeight = Number(weight);

    if (!filament || !color || !safeWeight || safeWeight <= 0) {
      alert("Please select Filament Name, Colour, and enter valid Weight");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const now = new Date();
      const dateVal = now.toISOString().split("T")[0];
      const res = await fetch(`${API_BASE}/filaments/delete-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          filament,
          color,
          weightToReduce: safeWeight,
          username: adminDeleteData.username || "Admin",
          sheetData: {
            date: dateVal,
            username: "Admin",
            partName: (partName || "").trim(),
            projectBy: (projectBy || "").trim(),
            quantity: Number(quantity) || 1,
            filamentType: filament,
            filamentColor: color,
            filamentUsage: safeWeight,
            totalFilamentUsage: safeWeight,
            printTime: (printTime || "").trim(),
            printer: (printer || "").trim(),
          },
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Failed to delete stock");
      }

      setShowAdminDeleteModal(false);
      setAdminDeleteData({ filament: "", color: "", weight: "", partName: "", projectBy: "", quantity: "1", printTime: "", printer: "" });
      await fetchInventory();
      await fetchLogs();

      setSuccessMessage(`Successfully removed ${safeWeight}g from ${filament} ${color}`);
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 3500);
    } catch (err) {
      console.error("Admin delete stock error:", err);
      alert(err.message || "Delete stock failed");
    }
  };

  // 🗑 USER DELETE STOCK FORM FIELD CHANGE
  const handleUserDeleteFormChange = (field, value) => {
    setUserDeleteFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "quantity" || field === "filamentUsage") {
        const q = Number(field === "quantity" ? value : prev.quantity) || 0;
        const u = Number(field === "filamentUsage" ? value : prev.filamentUsage) || 0;
        next.totalFilamentUsage = (q * u).toString();
      }
      return next;
    });
  };

  // 🗑 USER DELETE STOCK SUBMIT (All 11 required fields)
  const handleUserDeleteSubmit = async (e) => {
    if (e) e.preventDefault();
    const {
      date,
      username,
      partName,
      projectBy,
      quantity,
      filamentType,
      filamentColor,
      filamentUsage,
      totalFilamentUsage,
      printTime,
      printer,
    } = userDeleteFormData;

    if (
      !date ||
      !username.trim() ||
      !partName.trim() ||
      !projectBy.trim() ||
      !quantity ||
      !filamentType.trim() ||
      !filamentColor.trim() ||
      !filamentUsage ||
      !totalFilamentUsage ||
      !printTime.trim() ||
      !printer.trim()
    ) {
      alert("All fields are required. Please fill in all fields before submitting.");
      return;
    }

    const weightToReduce = Number(totalFilamentUsage);
    if (isNaN(weightToReduce) || weightToReduce <= 0) {
      alert("Total Filament Usage must be a positive number.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/filaments/delete-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: token } : {}),
        },
        body: JSON.stringify({
          filament: filamentType.trim(),
          color: filamentColor.trim(),
          weightToReduce,
          username: username.trim(),
          sheetData: {
            date,
            username: username.trim(),
            partName: partName.trim(),
            projectBy: projectBy.trim(),
            quantity: Number(quantity),
            filamentType: filamentType.trim(),
            filamentColor: filamentColor.trim(),
            filamentUsage: Number(filamentUsage),
            totalFilamentUsage: weightToReduce,
            printTime: printTime.trim(),
            printer: printer.trim(),
          },
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Failed to submit delete stock");
      }

      setShowUserDeleteModal(false);
      await fetchInventory();
      await fetchLogs();

      setSuccessMessage(`Stock reduced by ${weightToReduce}g & row appended to Google Sheet.`);
      setSuccessPopup(true);
      setTimeout(() => setSuccessPopup(false), 4000);
    } catch (err) {
      console.error("User delete stock submit error:", err);
      alert(err.message || "Failed to submit delete stock");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <Navbar query={query} setQuery={setQuery} />

      <div className="mx-auto max-w-7xl px-8 py-10">
        {!hideHeader && (
          <div className="mb-10 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">
              {isAdmin ? "Admin Dashboard" : "Filament Inventory"}
            </h1>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {!isAdmin ? (
                <>
                  <button
                    onClick={() => navigate("/admin/login")}
                    className="rounded-2xl bg-slate-900 px-7 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-slate-700"
                  >
                    Admin Login
                  </button>

                  {/* USER DASHBOARD DELETE STOCK BUTTON BESIDE ADMIN LOGIN */}
                  <button
                    onClick={() => setShowUserDeleteModal(true)}
                    className="rounded-2xl bg-red-600 px-7 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-red-700"
                  >
                    Delete Stock
                  </button>
                </>
              ) : (
                <button
                  onClick={onLogout}
                  className="rounded-2xl bg-red-600 px-7 py-3 text-sm font-bold text-white shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-red-700"
                >
                  Logout
                </button>
              )}

              <button
                onClick={() => setShowLowStock(!showLowStock)}
                className={`rounded-2xl px-6 py-3 text-sm font-bold text-white transition-all duration-300 shadow-lg ${
                  showLowStock
                    ? "bg-red-700 hover:bg-red-800"
                    : "bg-red-500 hover:bg-red-600"
                }`}
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
                .includes(query.toLowerCase())
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

                    const mongoDoc = inventoryDocs[filamentKey];
                    const spoolsRaw = mongoDoc?.spools || item.spools || [];

                    const activeSpools = spoolsRaw
                      .map((spool) => (typeof spool === "object" ? spool.weight : spool))
                      .map((w) => Number(w || 0))
                      .filter((w) => w > 0);

                    const remaining = activeSpools.reduce((sum, w) => sum + w, 0);
                    const isLowStock = remaining <= 200;

                    if (showLowStock && !isLowStock) {
                      return null;
                    }

                    return (
                      <div
                        key={filamentKey}
                        className="relative overflow-hidden rounded-[30px] border border-slate-200 bg-white p-7 shadow-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col justify-between"
                      >
                        {/* TOP COLOR LINE */}
                        <div
                          className="absolute left-0 top-0 h-2 w-full"
                          style={{ background: spoolColor }}
                        />

                        <div>
                          {/* TOP SECTION */}
                          <div className="flex items-center gap-5">
                            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-50 border border-slate-100">
                              <img
                                src={getSpoolImage(color)}
                                alt={color}
                                className="h-20 w-20 object-contain transition-all duration-500 hover:scale-110"
                              />
                            </div>

                            <div className="flex-1">
                              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                Colour
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                <div
                                  className="h-5 w-5 rounded-full border border-slate-300"
                                  style={{ background: spoolColor }}
                                />
                                <h3 className="text-xl font-semibold text-slate-800">
                                  {color}
                                </h3>
                              </div>
                            </div>
                          </div>

                          {/* STOCK */}
                          <div className="mt-8">
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-slate-500">
                                Remaining Stock
                              </p>

                              {activeSpools.length > 0 && (
                                <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                                  {activeSpools.length} {activeSpools.length === 1 ? "SPOOL" : "SPOOLS"}
                                </div>
                              )}
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <h1 className="text-3xl font-bold text-black">
                                {remaining}g
                              </h1>

                              {isLowStock && (
                                <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600 animate-pulse">
                                  LOW STOCK
                                </div>
                              )}
                            </div>

                            {/* SPOOL BREAKDOWN */}
                            {activeSpools.length > 0 && (
                              <div className="mt-5 space-y-2">
                                {activeSpools.map((weight, displayIndex) => (
                                  <div
                                    key={displayIndex}
                                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ background: spoolColor }}
                                      />
                                      <p className="text-sm font-medium text-slate-700">
                                        Spool {displayIndex + 1}
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
                        </div>

                        {/* CARD BUTTON: ONLY ADD STOCK FOR ADMIN, NO DELETE BUTTON ON CARDS */}
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
                              className="w-full rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:bg-slate-700 active:scale-95"
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

        {/* LOGS (Admin Dashboard Display) */}
        <div className="mt-16">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-8 w-2 rounded-full bg-slate-900" />
            <h2 className="text-2xl font-bold text-slate-900">Inventory Logs</h2>
          </div>

          <div className="space-y-4">
            {logs.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
                No recent inventory actions recorded
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={log._id || index}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-6 py-5 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={`rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider ${
                        log.action?.includes("DELETE") || log.action === "DELETE_STOCK"
                          ? "bg-red-100 text-red-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {log.action || "ACTION"}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900 text-base">
                        {log.filament} {log.color} {log.weight ? `(${log.weight}g)` : ""} {log.spoolNumber ? `- ${log.spoolNumber}` : ""}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        User: <span className="font-semibold text-slate-700">{log.username || log.adminId || "Admin"}</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">
                      {log.date || (log.createdAt ? new Date(log.createdAt).toLocaleDateString() : "")}
                    </p>
                    <p className="text-xs text-slate-400">
                      {log.time || (log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : "")}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BOTTOM ADMIN BUTTONS (PREVIOUS LAYOUT RESTORED: ADD NEW STOCK & DELETE STOCK) */}
        {isAdmin && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-6">
            <button
              onClick={() => setShowNewStockModal(true)}
              className="group relative overflow-hidden rounded-3xl bg-slate-900 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:bg-slate-700 active:scale-95"
            >
              <span className="flex items-center gap-3">
                <span className="text-2xl transition-transform duration-500 group-hover:rotate-90">
                  +
                </span>
                Add New Stock
              </span>
            </button>

            <button
              onClick={() => {
                setAdminDeleteData({ filament: "", color: "", weight: "" });
                setShowAdminDeleteModal(true);
              }}
              className="group relative overflow-hidden rounded-3xl bg-red-600 px-10 py-5 text-lg font-bold text-white shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:bg-red-700 active:scale-95"
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
      </div>

      {/* NEW STOCK MODAL (ADMIN) */}
      {isAdmin && showNewStockModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="relative z-[10000] w-[450px] rounded-[32px] bg-white p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-slate-900">Add New Stock</h2>

            <div className="mt-8 space-y-5">
              <input
                type="text"
                placeholder="Filament Name (e.g. PLA)"
                value={newStock.filament}
                onChange={(e) =>
                  setNewStock({ ...newStock, filament: e.target.value })
                }
                autoFocus
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-medium text-black outline-none placeholder:text-slate-400 focus:border-slate-900"
              />

              <input
                type="text"
                placeholder="Colour (e.g. Black)"
                value={newStock.color}
                onChange={(e) =>
                  setNewStock({ ...newStock, color: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-medium text-black outline-none placeholder:text-slate-400 focus:border-slate-900"
              />

              <input
                type="number"
                placeholder="Weight in grams (e.g. 1000)"
                value={newStock.weight}
                onChange={(e) =>
                  setNewStock({ ...newStock, weight: e.target.value })
                }
                className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-medium text-black outline-none placeholder:text-slate-400 focus:border-slate-900"
              />
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => setShowNewStockModal(false)}
                className="flex-1 rounded-2xl border border-slate-300 bg-white py-4 text-base font-semibold text-black shadow-sm transition-all hover:bg-slate-100 active:scale-95"
              >
                Cancel
              </button>

              <button
                onClick={handleNewStockSubmit}
                className="flex-1 rounded-2xl bg-slate-900 py-4 text-base font-semibold text-white shadow-xl transition-all hover:bg-slate-700 active:scale-95"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🗑 ADMIN DELETE STOCK POPUP */}
      {isAdmin && showAdminDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4 overflow-y-auto">
          <div className="relative w-full max-w-[500px] rounded-[32px] bg-white p-8 shadow-2xl">
            <button
              onClick={() => setShowAdminDeleteModal(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition-all hover:bg-red-500 hover:text-white"
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-black">Delete Stock</h2>

            <form onSubmit={handleAdminDeleteSubmit} className="mt-8 space-y-5">
              {/* FILAMENT NAME DROPDOWN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Filament Name *
                </label>
                <select
                  required
                  value={adminDeleteData.filament}
                  onChange={(e) =>
                    setAdminDeleteData({
                      ...adminDeleteData,
                      filament: e.target.value,
                      color: "",
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-medium text-black outline-none focus:border-slate-900"
                >
                  <option value="">Select Filament Name</option>
                  {filamentNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              {/* FILAMENT COLOUR DROPDOWN */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Filament Colour *
                </label>
                <select
                  required
                  value={adminDeleteData.color}
                  onChange={(e) =>
                    setAdminDeleteData({
                      ...adminDeleteData,
                      color: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-medium text-black outline-none focus:border-slate-900"
                >
                  <option value="">Select Colour</option>
                  {getColorsForFilament(adminDeleteData.filament).map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>

              {/* WEIGHT IN GRAMS */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Weight (grams) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="Enter weight in grams"
                  value={adminDeleteData.weight}
                  onChange={(e) =>
                    setAdminDeleteData({
                      ...adminDeleteData,
                      weight: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-white px-5 py-4 text-lg font-medium text-black outline-none focus:border-slate-900"
                />
              </div>

              <div className="mt-8 flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminDeleteModal(false)}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white py-4 text-base font-semibold text-black transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-red-600 py-4 text-base font-semibold text-white shadow-xl transition-all hover:bg-red-700 active:scale-95"
                >
                  Delete Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗑 USER DELETE STOCK POPUP (11 FIELDS WITH DROPDOWNS FOR TYPE & COLOUR) */}
      {showUserDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[32px] bg-white p-8 shadow-2xl border border-slate-200">
            <button
              onClick={() => setShowUserDeleteModal(false)}
              className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition-all hover:bg-red-500 hover:text-white"
            >
              ×
            </button>

            <h2 className="text-3xl font-bold text-slate-900">Delete Stock</h2>
            <p className="text-sm text-slate-500 mt-1">
              All fields are required. Select Filament Type & Colour from inventory.
            </p>

            <form onSubmit={handleUserDeleteSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. DATE */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={userDeleteFormData.date}
                    onChange={(e) => handleUserDeleteFormChange("date", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>

                {/* 2. USERNAME */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    value={userDeleteFormData.username}
                    onChange={(e) => handleUserDeleteFormChange("username", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 3. 3D PART NAME */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    3D Part Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gear Assembly"
                    value={userDeleteFormData.partName}
                    onChange={(e) => handleUserDeleteFormChange("partName", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>

                {/* 4. PROJECT BY */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Project By *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics Team"
                    value={userDeleteFormData.projectBy}
                    onChange={(e) => handleUserDeleteFormChange("projectBy", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 5. QUANTITY */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={userDeleteFormData.quantity}
                    onChange={(e) => handleUserDeleteFormChange("quantity", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>

                {/* 6. FILAMENT TYPE (DROPDOWN FROM INVENTORY) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Filament Type *
                  </label>
                  <select
                    required
                    value={userDeleteFormData.filamentType}
                    onChange={(e) => {
                      handleUserDeleteFormChange("filamentType", e.target.value);
                      handleUserDeleteFormChange("filamentColor", "");
                    }}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  >
                    <option value="">Select Type</option>
                    {filamentNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 7. FILAMENT COLOR (DROPDOWN FROM INVENTORY) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Filament Color *
                  </label>
                  <select
                    required
                    value={userDeleteFormData.filamentColor}
                    onChange={(e) => handleUserDeleteFormChange("filamentColor", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  >
                    <option value="">Select Color</option>
                    {getColorsForFilament(userDeleteFormData.filamentType).map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 8. FILAMENT USAGE (GMS) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Filament Usage (gms) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Usage per part (gms)"
                    value={userDeleteFormData.filamentUsage}
                    onChange={(e) => handleUserDeleteFormChange("filamentUsage", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>

                {/* 9. TOTAL FILAMENT USAGE (GMS) */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Total Usage (gms) *
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="Total Usage (gms)"
                    value={userDeleteFormData.totalFilamentUsage}
                    onChange={(e) => handleUserDeleteFormChange("totalFilamentUsage", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-bold text-black outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 10. PRINT TIME */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Print Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 3h 45m"
                    value={userDeleteFormData.printTime}
                    onChange={(e) => handleUserDeleteFormChange("printTime", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>

                {/* 11. PRINTER */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Printer *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ender 3 / Bambu X1"
                    value={userDeleteFormData.printer}
                    onChange={(e) => handleUserDeleteFormChange("printer", e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-black outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="mt-8 flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserDeleteModal(false)}
                  className="flex-1 rounded-2xl border border-slate-300 bg-white py-4 text-base font-semibold text-black transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-red-600 py-4 text-base font-semibold text-white shadow-xl transition-all hover:bg-red-700 active:scale-95"
                >
                  Submit & Delete Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD STOCK MODAL (CARD ADD STOCK BUTTON FOR ADMIN) */}
      {isAdmin && selectedFilament && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-[420px] overflow-hidden rounded-[28px] bg-white p-7 shadow-[0_25px_60px_rgba(0,0,0,0.25)] animate-scaleIn">
            <button
              onClick={() => {
                setSelectedFilament(null);
                setInputError("");
              }}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 transition-all hover:bg-red-500 hover:text-white"
            >
              ×
            </button>

            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200">
                <img
                  src={getSpoolImage(selectedFilament.color)}
                  alt={selectedFilament.color}
                  className="h-16 w-16 object-contain"
                />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {selectedFilament.group}
                </h2>
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-4 w-4 rounded-full border"
                    style={{ background: getColor(selectedFilament.color) }}
                  />
                  <p className="text-sm font-medium text-slate-500">
                    {selectedFilament.color}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <p className="mb-3 text-sm font-medium text-slate-500">
                Add New Spool Weight (grams)
              </p>
              <input
                type="number"
                placeholder="Enter grams (e.g. 1000)"
                autoFocus
                value={inputs[selectedFilament.key] || ""}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    [selectedFilament.key]: e.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-base font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-slate-900 focus:bg-white"
              />

              {inputError && (
                <p className="mt-3 text-sm font-medium text-red-500">
                  {inputError}
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-4">
              <button
                onClick={() => {
                  setSelectedFilament(null);
                  setInputError("");
                }}
                className="flex-1 rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                onClick={() => addStock(selectedFilament.key)}
                className="flex-1 rounded-2xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.03] hover:bg-slate-700 active:scale-95"
              >
                Add Spool
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ SUCCESS POPUP */}
      {successPopup && (
        <div className="fixed right-8 top-28 z-[100] animate-bounce">
          <div className="rounded-3xl bg-emerald-600 px-8 py-5 shadow-2xl text-white">
            <h2 className="text-lg font-bold">Success</h2>
            <p className="mt-1 text-sm text-white/90">{successMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
