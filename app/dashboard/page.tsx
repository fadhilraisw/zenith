"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { UserButton } from "@clerk/nextjs";

const C = {
  bg: "#0A0A0B",
  sage: "#C8D5B9",
  sageDark: "#8A9E7A",
  sageDeep: "#3D5040",
  sageCard: "#1C2420",
  surface: "#111713",
  card: "#161E19",
  border: "#2A3530",
  accent: "#C8FF00",
  accentDark: "#7A9900",
  text: "#E8EDE5",
  muted: "#5A6E60",
  danger: "#E05A3A",
  dangerLight: "#FF8060",
  success: "#7EC87A",
  gold: "#E6B84A",
  silver: "#A8B8A0",
  mono: "'Space Mono', 'Courier New', monospace",
};

const fmt = (n: number) => {
  if (n >= 1000000) return "Rp " + (n / 1000000).toFixed(1) + "JT";
  if (n >= 1000) return "Rp " + Math.round(n / 1000) + "K";
  return "Rp " + Math.round(n).toLocaleString();
};
const fmtUSD = (n: number) => "$" + Math.round(n).toLocaleString("en-US");

function BarcodeStripes({ count = 28, color = C.sageDeep, opacity = 1, style = {} }: any) {
  const lines = Array.from({ length: count }, (_, i) => {
    const h = 20 + Math.sin(i * 0.7) * 15 + Math.cos(i * 1.3) * 10;
    return Math.max(8, Math.min(60, h));
  });
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, ...style }}>
      {lines.map((h, i) => (
        <div key={i} style={{ width: 2, height: h, background: color, opacity: opacity * (0.4 + (h / 60) * 0.6), borderRadius: 1 }} />
      ))}
    </div>
  );
}

function RadialChart({ transactions }: any) {
  const [popup, setPopup] = useState<any>(null);

  // 1. Agregasi data: Gabungkan transaksi berdasarkan kategori
  const categories: Record<string, { amount: number; type: string }> = {};
  transactions.forEach((t: any) => {
    if (!categories[t.category]) {
      categories[t.category] = { amount: 0, type: t.type };
    }
    categories[t.category].amount += t.amount;
  });

  const entries = Object.entries(categories);
  const total = entries.reduce((s, [, v]) => s + v.amount, 0) || 1;

  // 2. Buat "potongan kue" (slices) untuk setiap kategori
  const slices = entries.map(([k, v], i) => ({
    label: k,
    val: v.amount,
    type: v.type, // Menyimpan info INCOME atau EXPENSE
    pct: v.amount / total,
    angle: (i / entries.length) * Math.PI * 2,
  }));

  const N = 72; // Jumlah total garis pancaran (bursting)
  const lines = [];
  const cx = 140, cy = 140; // Titik tengah lingkaran

  // 3. Menggambar setiap garis secara dinamis
  for (let i = 0; i < N; i++) {
    const angle = (i / N) * Math.PI * 2 - Math.PI / 2;
    
    // Cari kategori terdekat untuk menetapkan garis ini milik siapa
    const nearestSlice = slices.length > 0 ? slices.reduce((best, s) => {
      const diff = Math.abs(((angle + Math.PI * 2) % (Math.PI * 2)) - ((s.angle + Math.PI * 2) % (Math.PI * 2)));
      const bestDiff = Math.abs(((angle + Math.PI * 2) % (Math.PI * 2)) - ((best.angle + Math.PI * 2) % (Math.PI * 2)));
      return diff < bestDiff ? s : best;
    }, slices[0]) : null;

    if (!nearestSlice) continue;

    // Hitung panjang garis (semakin besar persentase uangnya, semakin panjang mencuat)
    const len = 18 + nearestSlice.pct * 110 + Math.sin(i * 0.5) * 8;
    const r1 = 42, r2 = r1 + len;
    
    const x1 = cx + Math.cos(angle) * r1, y1 = cy + Math.sin(angle) * r1;
    const x2 = cx + Math.cos(angle) * r2, y2 = cy + Math.sin(angle) * r2;

    // WARNA: Hijau Neon untuk Income, Hijau Tua untuk Expense
    const color = nearestSlice.type === "INCOME" ? C.accent : C.sageDeep;
    const strokeWidth = i % 7 === 0 ? 3 : 1.5;

    lines.push(
      <line
        key={i}
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.7 + nearestSlice.pct * 0.3}
        style={{ cursor: "pointer", transition: "all 0.2s ease-out" }}
        
        // Sensor sentuh & klik untuk pop-up!
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
          e.currentTarget.style.strokeWidth = "5"; // Menebal saat disentuh
          setPopup({ label: nearestSlice.label, type: nearestSlice.type, amount: nearestSlice.val });
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = String(0.7 + nearestSlice.pct * 0.3);
          e.currentTarget.style.strokeWidth = String(strokeWidth);
          setPopup(null);
        }}
        onClick={() => setPopup({ label: nearestSlice.label, type: nearestSlice.type, amount: nearestSlice.val })}
      />
    );
  }

  // Background titik-titik (dots) luar
  const dots = [];
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2;
    dots.push(
      <circle key={'dot'+i} cx={cx + Math.cos(a) * 160} cy={cy + Math.sin(a) * 160} r={1} fill={C.muted} opacity={0.3} />
    );
  }

  return (
    <div style={{ position: "relative", width: 280, height: 280, margin: "0 auto" }}>
      {/* Kanvas SVG Utama */}
      <svg width={280} height={280} viewBox="0 0 280 280" style={{ overflow: "visible" }}>
        {dots}
        {lines}
        <circle cx={cx} cy={cy} r={40} fill={C.sageCard} />
        <circle cx={cx} cy={cy} r={36} fill="transparent" stroke={C.border} strokeWidth={1} />
      </svg>
      
      {/* Jendela Pop-up Interaktif di Tengah */}
      {popup ? (
        <div style={{
          position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
          background: C.bg, border: `1px solid ${popup.type === "INCOME" ? C.accent : C.sageDark}`,
          padding: "12px 16px", borderRadius: 14, textAlign: "center", pointerEvents: "none",
          boxShadow: "0 8px 32px rgba(0,0,0,0.8)", zIndex: 10, minWidth: "120px",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 2 }}>{popup.type}</p>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{popup.label}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, fontFamily: C.mono, fontWeight: 700, color: popup.type === "INCOME" ? C.accent : C.dangerLight }}>
            {popup.type === "INCOME" ? "+" : "-"}{fmt(popup.amount)}
          </p>
        </div>
      ) : (
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none" }}>
           <span style={{ fontSize: 24, color: C.muted, opacity: 0.3 }}>◈</span>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ light, bold }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ margin: 0, fontSize: 16, color: C.muted, fontWeight: 400 }}>{light}</p>
      <p style={{ margin: 0, fontSize: 26, color: C.text, fontWeight: 800, letterSpacing: -0.5 }}>{bold}</p>
    </div>
  );
}

function ConfirmModal({ isOpen, onClose, onConfirm, title, message, isDeleting }: any) {
  if (!isOpen) return null;
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(4px)" }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: "24px", width: "100%", maxWidth: 320, textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: C.danger + "15", border: `1px solid ${C.danger}44`, color: C.danger, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>⚠</div>
        <p style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800, color: C.text }}>{title}</p>
        <p style={{ margin: "0 0 24px", fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} disabled={isDeleting} style={{ flex: 1, background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12, fontWeight: 700, cursor: "pointer", fontSize: 11, letterSpacing: 1 }}>CANCEL</button>
          <button onClick={onConfirm} disabled={isDeleting} style={{ flex: 1, background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: 12, fontWeight: 700, cursor: isDeleting ? "wait" : "pointer", fontSize: 11, letterSpacing: 1 }}>
            {isDeleting ? "DELETING..." : "CONFIRM"}
          </button>
        </div>
      </div>
    </div>
  );
}

// FUNGSI HELPER BARU: Menghitung nilai presisi tanpa bocor kurs
const getAssetValueUSD = (a: any) => {
  if (a.assetClass === "CASH" && a.assetTicker === "IDR") {
    // Kembalikan ke nilai Dolar real-time agar saat diformat balik ke Rupiah, hasilnya 100% presisi.
    return a.quantity / (typeof DYNAMIC_RATE !== "undefined" ? DYNAMIC_RATE : 16000);
  }
  return (a.currentPrice || 0) * (a.quantity || 0);
};

function NetWorthHero({ assets = [], currency = "USD" }: any) {
  const validAssets = Array.isArray(assets) ? assets : [];
  
  // MENGGUNAKAN GET ASSET VALUE AGAR PRESISI
  const nw = validAssets.reduce((s: any, a: any) => s + getAssetValueUSD(a), 0);
  const cash = validAssets.filter((a: any) => a.assetClass === "CASH").reduce((s: any, a: any) => s + getAssetValueUSD(a), 0);
  const investedValue = nw - cash;

  const investedAssets = validAssets.filter((a: any) => a.averagePurchasePrice > 0 && a.assetClass !== "CASH");
  const activeInvestedNw = investedAssets.reduce((s: any, a: any) => s + getAssetValueUSD(a), 0);
  const cost = investedAssets.reduce((s: any, a: any) => s + (a.averagePurchasePrice || 0) * (a.quantity || 0), 0);
  
  const gainValue = activeInvestedNw - cost;
  const gain = cost > 0 ? (gainValue / cost) * 100 : 0;
  
  const isPositive = gain >= 0;
  const gainStr = `${isPositive && gain > 0 ? '+' : ''}${gain.toFixed(2)}%`;
  const plColor = isPositive ? C.success : C.danger;
  
  return (
    <div style={{ background: C.sageCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "22px 22px 16px" }}>
        <p style={{ margin: "0 0 4px", fontSize: 10, color: C.muted, letterSpacing: 3, textTransform: "uppercase" }}>Net Worth</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 16 }}>
          <span style={{ fontSize: 36, fontWeight: 900, color: C.text, fontFamily: C.mono, letterSpacing: -1 }}>{formatCurrency(nw, currency)}</span>
        </div>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
          {[
            ["LIQUID CASH", formatCurrency(cash, currency), C.text], 
            ["ASSETS VALUE", formatCurrency(investedValue, currency), C.text], 
            ["TOTAL GAIN", gainStr, plColor]
          ].map(([label, val, color], i) => (
            <div key={label as string} style={{ paddingRight: i < 2 ? 14 : 0, borderRight: i < 2 ? `1px solid ${C.border}` : "none", paddingLeft: i > 0 ? 14 : 0 }}>
              <p style={{ margin: "0 0 2px", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{label as string}</p>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: color as string, fontFamily: C.mono }}>{val as string}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: plColor, padding: "10px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "background 0.3s ease" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 16, height: 16, border: "1.5px solid rgba(255,255,255,0.7)", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 2, height: 8, background: "rgba(255,255,255,0.9)", borderRadius: 1 }} />
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.9)", letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>Unrealized P&L</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", fontFamily: C.mono }}>
            {isPositive ? "+" : ""}{formatCurrency(gainValue, currency)} ({gainStr})
          </span>
          <div style={{ width: 28, height: 28, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 12, color: "#fff", transform: isPositive ? "rotate(-45deg)" : "rotate(45deg)", transition: "transform 0.3s ease" }}>→</span>
          </div>
        </div>
      </div>

      <div style={{ padding: "14px 22px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Investments Cost</p>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: C.text, fontFamily: C.mono }}>{formatCurrency(cost, currency)}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardOverview({ assets = [], transactions = [], user, currency = "USD" }: any) {
  const validAssets = Array.isArray(assets) ? assets : [];
  const validTx = Array.isArray(transactions) ? transactions : [];

  // MENGGUNAKAN GET ASSET VALUE DI OVERVIEW AGAR SINKRON
  const nw = validAssets.reduce((s: any, a: any) => s + getAssetValueUSD(a), 0);
  const income = validTx.filter((t: any) => t.type === "INCOME").reduce((s: any, t: any) => s + (t.amount || 0), 0);
  const expense = validTx.filter((t: any) => t.type === "EXPENSE").reduce((s: any, t: any) => s + (t.amount || 0), 0);
  const totalNW = nw || 1;
  
  if (!user) return null; 

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <div>
          <p style={{ margin: "0 0 2px", fontSize: 13, color: C.muted }}>Welcome back,</p>
          <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text, letterSpacing: -0.5 }}>{user.name}</p>
        </div>
        <div style={{ background: C.sageCard, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px", textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Level</p>
          <p style={{ margin: 0, fontSize: 18, fontWeight: 900, color: C.accent, fontFamily: C.mono }}>{user.level}</p>
        </div>
      </div>
      <NetWorthHero assets={validAssets} currency={currency} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        {[["INCOME", income, C.success], ["EXPENSES", expense, C.danger]].map(([label, val, color]) => (
          <div key={label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: "16px 18px", position: "relative", overflow: "hidden" }}>
            <p style={{ margin: "0 0 4px", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{label}</p>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: color as string, fontFamily: C.mono }}>{formatCurrency(val as number, currency)}</p>
          </div>
        ))}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 20px", marginBottom: 16 }}>
        <p style={{ margin: "0 0 14px", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Allocation</p>
        {[["CRYPTO", "CRYPTO", C.accent], ["STOCKS", "STOCK", C.gold], ["CASH", "CASH", C.success]].map(([label, cls, color]) => {
          const pct = Math.round(validAssets.filter((a: any) => a.assetClass === cls).reduce((s: any, a: any) => s + getAssetValueUSD(a), 0) / totalNW * 100);
          return (
            <div key={label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: C.muted, letterSpacing: 2 }}>{label}</span>
                <span style={{ fontSize: 11, color, fontWeight: 700, fontFamily: C.mono }}>{pct}%</span>
              </div>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
                {Array.from({ length: 32 }, (_, i) => (
                  <div key={i} style={{ flex: 1, height: 5 + (i % 2) * 5, background: i / 32 < pct / 100 ? color : C.border, borderRadius: 1 }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        <p style={{ margin: 0, padding: "12px 18px", fontSize: 9, color: C.muted, letterSpacing: 2, textTransform: "uppercase", borderBottom: `1px solid ${C.border}` }}>Recent Transactions</p>
        {validTx.slice(0, 5).map((t: any, i: number) => (
          <div key={t._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 18px", borderBottom: i < 4 ? `1px solid ${C.border}` : "none" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{t.category}</p>
              <p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{t.date ? new Date(t.date).toISOString().slice(0, 10) : ""}</p>
            </div>
            <p style={{ margin: 0, fontWeight: 800, fontSize: 13, fontFamily: C.mono, color: t.type === "INCOME" ? C.success : C.text }}>{t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount, currency)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssetsModule({ assets, setAssets, currency }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [editAsset, setEditAsset] = useState<any>(null);
  const [editMode, setEditMode] = useState<"EDIT" | "TOPUP">("EDIT");
  const [editForm, setEditForm] = useState({ assetClass: "", assetTicker: "", location: "", quantity: "", averagePurchasePrice: "" });
  const [topUpForm, setTopUpForm] = useState({ quantity: "", buyPrice: "" });

  const [form, setForm] = useState({ assetClass: "CRYPTO", assetTicker: "", location: "", quantity: "", averagePurchasePrice: "", currentPrice: "" });
  
  const [inputCurrency, setInputCurrency] = useState<"USD" | "IDR">("IDR"); 
  const [modalCurrency, setModalCurrency] = useState<"USD" | "IDR">("USD"); 

  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const inp = { background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, fontFamily: C.mono, width: "100%", boxSizing: "border-box" as any };
  const icons: any = { CRYPTO: "◈", STOCK: "◆", COMMODITY: "◉", CASH: "💵" };
  const cls: any = { CRYPTO: C.accent, STOCK: C.gold, COMMODITY: C.sageDark, CASH: C.success };

  // FUNGSI DISPLAY MONEY (Sudah 100% menggunakan DYNAMIC_RATE yang stabil)
  const displayMoney = (usdValue: number, isCash: boolean) => {
    if (currency === "USD") return "$" + usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return "Rp " + Math.round(usdValue * DYNAMIC_RATE).toLocaleString("id-ID");
  };

  const handleSyncAllPrices = async () => {
    setIsSyncingAll(true);
    try {
      const updatedAssets = await Promise.all(assets.map(async (a: any) => {
        if (a.assetClass === "CASH") return a; 
        
        const res = await fetch(`/api/market?ticker=${a.assetTicker}`);
        if (res.ok) {
          const data = await res.json();
          if (data.price && data.price !== a.currentPrice) {
            await fetch(`/api/assets/${a._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ currentPrice: data.price })
            });
            return { ...a, currentPrice: data.price };
          }
        }
        return a;
      }));
      setAssets(updatedAssets); 
    } catch (e) {
      alert("Gagal melakukan sinkronisasi harga massal.");
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleGetPrice = async () => {
    const ticker = form.assetTicker.toUpperCase();
    if (!ticker) return alert("Ketik Ticker atau Kode Mata Uang");
    setIsFetchingPrice(true);
    
    try {
      // Jika CASH dan IDR, tembak langsung ke DYNAMIC_RATE
      if (form.assetClass === "CASH" && ticker === "IDR") {
        setForm({ ...form, currentPrice: (1 / DYNAMIC_RATE).toString() });
        setIsFetchingPrice(false);
        return;
      }

      let searchTicker = form.assetClass === "CASH" ? `${ticker}USD=X` : ticker;
      const response = await fetch(`/api/market?ticker=${searchTicker}`);
      if (response.ok) {
        const data = await response.json();
        let price = data.price;
        if (ticker === "IDR" && form.assetClass === "CASH") price = 1 / price;
        setForm({ ...form, currentPrice: price });
      } else {
        alert("Ticker tidak ditemukan!");
      }
    } catch (error) { alert("Gagal menghubungi server pasar."); } finally { setIsFetchingPrice(false); }
  };

  const handleAddAsset = async () => {
    if (!form.assetTicker || !form.quantity) return;
    setIsSubmitting(true);
    
    const rawAvgPrice = form.averagePurchasePrice ? Number(form.averagePurchasePrice) : 0;
    // Semuanya sekarang aman menggunakan DYNAMIC_RATE
    const finalAvgPrice = inputCurrency === "IDR" && form.assetClass !== "CASH" ? rawAvgPrice / DYNAMIC_RATE : rawAvgPrice;

    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetClass: form.assetClass,
          assetTicker: form.assetTicker.toUpperCase(),
          location: form.location,
          quantity: Number(form.quantity),
          averagePurchasePrice: form.assetClass === "CASH" ? 0 : finalAvgPrice,
          currentPrice: Number(form.currentPrice)
        })
      });

      if (response.ok) {
        const savedAsset = await response.json();
        setAssets((prev: any) => [savedAsset, ...prev]); 
        setShowForm(false);
        setForm({ assetClass: "CRYPTO", assetTicker: "", location: "", quantity: "", averagePurchasePrice: "", currentPrice: "" });
      } else {
        alert("GAGAL MENYIMPAN: " + await response.text());
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const confirmDeleteAsset = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/assets/${deleteTarget._id}`, { method: 'DELETE' });
      if (response.ok) {
        setAssets((prev: any) => prev.filter((x: any) => x._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (error) { console.error(error); } finally { setIsDeleting(false); }
  };

  const openEditModal = (a: any) => {
    setEditAsset(a);
    setEditMode("EDIT");
    setModalCurrency("USD");
    setEditForm({ 
      assetClass: a.assetClass, 
      assetTicker: a.assetTicker, 
      location: a.location || "", 
      quantity: a.quantity.toString(), 
      averagePurchasePrice: a.averagePurchasePrice.toString() 
    });
    setTopUpForm({ quantity: "", buyPrice: "" });
  };

  const handleSaveUpdate = async () => {
    if (!editAsset) return;
    setIsSubmitting(true);
    
    const targetId = editAsset._id;
    let finalQty = Number(editForm.quantity);
    let rawEditAvgPrice = Number(editForm.averagePurchasePrice);
    
    let finalAvgPrice = modalCurrency === "IDR" && editMode === "EDIT" ? rawEditAvgPrice / DYNAMIC_RATE : rawEditAvgPrice;

    if (editMode === "TOPUP") {
      const oldQty = editAsset.quantity;
      const oldAvgPrice = editAsset.averagePurchasePrice || 0;
      const addedQty = Number(topUpForm.quantity);
      const newBuyPriceUSD = modalCurrency === "IDR" ? Number(topUpForm.buyPrice) / DYNAMIC_RATE : Number(topUpForm.buyPrice);

      finalQty = oldQty + addedQty;
      finalAvgPrice = ((oldQty * oldAvgPrice) + (addedQty * newBuyPriceUSD)) / finalQty;
    }

    try {
      const response = await fetch(`/api/assets/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetClass: editForm.assetClass,
          assetTicker: editForm.assetTicker.toUpperCase(),
          location: editForm.location,
          quantity: finalQty,
          averagePurchasePrice: editForm.assetClass === "CASH" ? 0 : finalAvgPrice,
          currentPrice: editAsset.currentPrice 
        })
      });

      if (response.ok) {
        const updatedAsset = await response.json();
        setAssets((prev: any[]) => prev.map((a: any) => a._id === targetId ? updatedAsset : a));
        setEditAsset(null); 
      } else {
        alert("Gagal update data.");
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  return (
    <div>
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDeleteAsset} isDeleting={isDeleting} title="Delete Asset?" message={`Hapus ${deleteTarget?.quantity} unit ${deleteTarget?.assetTicker}? Data ini akan dihapus permanen.`} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <SectionHeader light="Track your" bold="Portfolio" />
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          <button onClick={handleSyncAllPrices} disabled={isSyncingAll} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontWeight: 800, cursor: isSyncingAll ? "wait" : "pointer", fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>
            {isSyncingAll ? "SYNCING..." : "⟳ SYNC MARKET"}
          </button>
          <button onClick={() => setShowForm(!showForm)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, cursor: "pointer", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
            + ADD
          </button>
        </div>
      </div>
      
      {showForm && (
        <div style={{ background: C.sageCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <select value={form.assetClass} onChange={e => setForm({ ...form, assetClass: e.target.value })} style={{ ...inp }}>
              <option value="CRYPTO">CRYPTO</option>
              <option value="STOCK">STOCK</option>
              <option value="COMMODITY">COMMODITY</option>
              <option value="CASH">CASH (MONEY)</option>
            </select>
            
            <div style={{ display: "flex", gap: 6 }}>
              <input placeholder={form.assetClass === "CASH" ? "Currency (e.g. IDR)" : "Ticker (e.g. BTC-USD)"} value={form.assetTicker} onChange={e => setForm({ ...form, assetTicker: e.target.value.toUpperCase() })} style={{ ...inp, flex: 1 }} />
              <button onClick={handleGetPrice} disabled={isFetchingPrice} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, padding: "0 12px", fontWeight: 800, fontSize: 10, cursor: isFetchingPrice ? "wait" : "pointer" }}>{isFetchingPrice ? "..." : "GET"}</button>
            </div>
    
            <input placeholder={form.assetClass === "CASH" ? "Balance Amount" : "Quantity"} type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} style={inp} />
            <input placeholder="Location (e.g. BCA, Binance)" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={inp} />
            
            {form.assetClass !== "CASH" && (
              <div style={{ display: "flex", gap: 6 }}>
                <input placeholder={`Price per Unit in ${inputCurrency}`} type="number" value={form.averagePurchasePrice} onChange={e => setForm({ ...form, averagePurchasePrice: e.target.value })} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setInputCurrency(inputCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 50, fontWeight: 800, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {inputCurrency}
                </button>
              </div>
            )}

            <div style={{ gridColumn: form.assetClass === "CASH" ? "span 2" : "auto" }}>
              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>LIVE RATE TO USD</label>
              <input disabled value={form.currentPrice} style={{ ...inp, opacity: 0.6 }} />
            </div>
          </div>
          <button onClick={handleAddAsset} disabled={isSubmitting} style={{ width: "100%", background: isSubmitting ? C.sageCard : C.accent, color: isSubmitting ? C.muted : "#000", border: "none", borderRadius: 8, padding: 10, fontWeight: 800, cursor: isSubmitting ? "wait" : "pointer" }}>
            {isSubmitting ? "SAVING..." : "CONFIRM"}
          </button>
        </div>
      )}
      
      <NetWorthHero assets={assets} currency={currency} />
      
      {assets.map((a: any) => {
        const valueInUSD = (a.currentPrice || 0) * (a.quantity || 0);
        const buyPriceInUSD = a.averagePurchasePrice || 0;
        const gain = buyPriceInUSD > 0 ? ((a.currentPrice - buyPriceInUSD) / buyPriceInUSD) * 100 : 0;
        const isCash = a.assetClass === "CASH";
        
        return (
          <div key={a._id} onClick={() => openEditModal(a)} style={{ display: "flex", alignItems: "center", padding: "14px 18px", background: C.card, borderRadius: 10, marginBottom: 8, border: `1px solid ${C.border}`, position: "relative", cursor: "pointer", transition: "transform 0.1s" }}>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(a); }} style={{ position: "absolute", right: 8, top: 8, width: 24, height: 24, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, lineHeight: 1, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
            
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.sageCard, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: cls[a.assetClass] || C.text, marginRight: 14 }}>{icons[a.assetClass] || "◈"}</div>
            
            <div style={{ flex: 1, paddingRight: 30 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text, fontFamily: C.mono }}>{a.assetTicker}</p>
                <span style={{ fontSize: 9, color: cls[a.assetClass] || C.text, background: (cls[a.assetClass] || C.text)+"22", padding: "2px 6px", borderRadius: 4, fontWeight: 800, letterSpacing: 1 }}>{a.assetClass}</span>
              </div>
              <p style={{ margin: "4px 0 2px", fontSize: 11, color: C.accent }}>📍 {a.location || "Vault"}</p>
              <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
                {isCash ? `Balance: ${a.quantity.toLocaleString()}` : `Qty: ${a.quantity} • Avg Buy: ${displayMoney(buyPriceInUSD, isCash)}`}
              </p>
            </div>

            <div style={{ textAlign: "right" }}>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 14, fontFamily: C.mono, color: C.text }}>
                {displayMoney(valueInUSD, isCash)}
              </p>
              {!isCash ? (
                buyPriceInUSD > 0 ? (
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: gain >= 0 ? C.success : C.danger, fontFamily: C.mono, fontWeight: 700 }}>{gain >= 0 ? "+" : ""}{gain.toFixed(2)}%</p>
                ) : (
                  <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>No Buy Price</p>
                )
              ) : null}
            </div>
          </div>
        );
      })}

      {editAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 400, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
            
            <div style={{ background: C.sageCard, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <div>
                <p style={{ margin: 0, fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Manage {editAsset.assetClass}</p>
                <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: C.text }}>{editAsset.assetTicker}</p>
              </div>
              <button onClick={() => setEditAsset(null)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", borderBottom: `1px solid ${C.border}` }}>
              <button onClick={() => { setEditMode("EDIT"); setModalCurrency("USD"); setEditForm({...editForm, averagePurchasePrice: editAsset.averagePurchasePrice.toString()}) }} style={{ flex: 1, padding: 12, background: editMode === "EDIT" ? C.surface : "transparent", border: "none", borderBottom: editMode === "EDIT" ? `2px solid ${C.accent}` : "2px solid transparent", color: editMode === "EDIT" ? C.text : C.muted, fontWeight: 800, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>EDIT DETAILS</button>
              {editAsset.assetClass !== "CASH" && (
                <button onClick={() => { setEditMode("TOPUP"); setModalCurrency("IDR"); }} style={{ flex: 1, padding: 12, background: editMode === "TOPUP" ? C.surface : "transparent", border: "none", borderBottom: editMode === "TOPUP" ? `2px solid ${C.accent}` : "2px solid transparent", color: editMode === "TOPUP" ? C.accent : C.muted, fontWeight: 800, fontSize: 11, letterSpacing: 1, cursor: "pointer" }}>+ TOP UP</button>
              )}
            </div>

            <div style={{ padding: 20 }}>
              {editMode === "EDIT" ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input placeholder="Location" value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} style={inp} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                       <label style={{ fontSize: 10, color: C.muted, marginBottom: 4, display: "block" }}>{editAsset.assetClass === "CASH" ? "Balance Amount" : "Total Qty"}</label>
                       <input type="number" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: e.target.value})} style={inp} />
                    </div>
                    {editAsset.assetClass !== "CASH" && (
                      <div>
                         <label style={{ fontSize: 10, color: C.muted, marginBottom: 4, display: "block" }}>Avg Price in {modalCurrency}</label>
                         <div style={{ display: "flex", gap: 6 }}>
                           <input type="number" value={editForm.averagePurchasePrice} onChange={e => setEditForm({...editForm, averagePurchasePrice: e.target.value})} style={{...inp, flex: 1}} />
                           <button type="button" onClick={() => { setModalCurrency(modalCurrency === "USD" ? "IDR" : "USD"); setEditForm({...editForm, averagePurchasePrice: ""}); }} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 44, fontWeight: 800, fontSize: 10, cursor: "pointer", padding: 0 }}>{modalCurrency}</button>
                         </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ padding: 12, background: C.surface, borderRadius: 8, border: `1px solid ${C.border}`, marginBottom: 4 }}>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Current Qty: <span style={{ color: C.text, fontWeight: 700 }}>{editAsset.quantity}</span></p>
                    <p style={{ margin: "4px 0 0", fontSize: 11, color: C.muted }}>Current Avg: <span style={{ color: C.text, fontWeight: 700 }}>{displayMoney(editAsset.averagePurchasePrice || 0, false)}</span></p>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                       <label style={{ fontSize: 10, color: C.accent, marginBottom: 4, display: "block", fontWeight: 700 }}>+ Add Qty</label>
                       <input type="number" placeholder="0.0" value={topUpForm.quantity} onChange={e => setTopUpForm({...topUpForm, quantity: e.target.value})} style={{...inp, borderColor: C.accent}} />
                    </div>
                    <div>
                       <label style={{ fontSize: 10, color: C.accent, marginBottom: 4, display: "block", fontWeight: 700 }}>Buy Price in {modalCurrency}</label>
                       <div style={{ display: "flex", gap: 6 }}>
                         <input type="number" placeholder="0.0" value={topUpForm.buyPrice} onChange={e => setTopUpForm({...topUpForm, buyPrice: e.target.value})} style={{...inp, borderColor: C.accent, flex: 1}} />
                         <button type="button" onClick={() => setModalCurrency(modalCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 8, width: 44, fontWeight: 800, fontSize: 10, cursor: "pointer", padding: 0 }}>{modalCurrency}</button>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={handleSaveUpdate} disabled={isSubmitting} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 10, padding: 12, fontWeight: 800, cursor: "pointer", marginTop: 20 }}>
                {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

function BudgetAllocationChart({ budgets, currency }: any) {
  const [hovered, setHovered] = useState<any>(null);
  
  if (!budgets || budgets.length === 0) return null;

  const totalTarget = budgets.reduce((sum: any, b: any) => sum + b.scaledTarget, 0) || 1;
  const cx = 120, cy = 120, r = 80;
  const circumference = 2 * Math.PI * r;
  
  let currentOffset = 0;
  const colors = [C.accent, C.gold, C.dangerLight, C.sageDark, C.success, "#A8B8A0", "#CD7F32", "#E5E4E2"];

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 30, background: C.card, borderRadius: 16, padding: "24px", border: `1px solid ${C.border}`, marginBottom: 16, position: "relative" }}>
      
      {/* DONUT CHART SVG */}
      <div style={{ position: "relative", width: 240, height: 240, flexShrink: 0, margin: "0 auto" }}>
        <svg width={240} height={240} viewBox="0 0 240 240" style={{ transform: "rotate(-90deg)", overflow: "visible" }}>
          {budgets.map((b: any, i: number) => {
            const pct = b.scaledTarget / totalTarget;
            const strokeDasharray = `${pct * circumference} ${circumference}`;
            const strokeDashoffset = -currentOffset;
            currentOffset += pct * circumference;
            const color = colors[i % colors.length];
            
            const isHovered = hovered?._id === b._id;

            return (
              <circle
                key={b._id}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? 35 : 25}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: "all 0.3s ease", cursor: "pointer", opacity: hovered ? (isHovered ? 1 : 0.2) : 1 }}
                onMouseEnter={() => setHovered(b)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>
        
        {/* TEXT DI TENGAH DONUT */}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <p style={{ margin: 0, fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>
              {hovered ? "TARGET" : "TOTAL LIMIT"}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 900, color: C.text, fontFamily: C.mono }}>
                {hovered ? formatCurrency(hovered.scaledTarget, currency) : formatCurrency(totalTarget, currency)}
            </p>
        </div>
      </div>
      
      {/* PANEL DETAIL (SEBELAH KANAN) */}
      <div style={{ flex: 1, minWidth: 200 }}>
        {hovered ? (
          <div style={{ animation: "fadeIn 0.3s ease" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: colors[budgets.findIndex((x:any)=>x._id===hovered._id) % colors.length] }} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text }}>{hovered.category}</h3>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ background: C.surface, padding: 12, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Budget Limit</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.text, fontFamily: C.mono }}>{formatCurrency(hovered.scaledTarget, currency)}</p>
                </div>
                <div style={{ background: C.surface, padding: 12, borderRadius: 10, border: `1px solid ${C.border}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>Spent So Far</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: hovered.dynamicSpent > hovered.scaledTarget ? C.danger : C.text, fontFamily: C.mono }}>{formatCurrency(hovered.dynamicSpent, currency)}</p>
                </div>
            </div>
            
            <div style={{ marginTop: 12, background: C.surface, borderRadius: 6, height: 8, overflow: "hidden", border: `1px solid ${C.border}` }}>
                <div style={{ height: "100%", width: `${Math.min(100, (hovered.dynamicSpent / hovered.scaledTarget) * 100)}%`, background: hovered.dynamicSpent > hovered.scaledTarget ? C.danger : C.accent, borderRadius: 6, transition: "width 0.5s ease" }} />
            </div>
            {hovered.dynamicSpent > hovered.scaledTarget && (
              <p style={{ margin: "8px 0 0", fontSize: 10, color: C.danger, fontWeight: 700, letterSpacing: 1 }}>⚠ OVER BUDGET</p>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", color: C.muted, padding: "20px 0" }}>
             <p style={{ margin: 0, fontSize: 13 }}>Arahkan kursor / sentuh grafik untuk melihat detail alokasi budget.</p>
          </div>
        )}
      </div>
    </div>
  );
}




function BudgetsModule({ budgets, setBudgets, transactions, timeFrame, customRange, currency }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null); 
  const [form, setForm] = useState({ category: "", period: "MONTHLY", targetAmount: "" });
  const [inputCurrency, setInputCurrency] = useState<"USD" | "IDR">("IDR"); 

  const inp = { background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box" as any };
  const validBudgets = Array.isArray(budgets) ? budgets : [];
  const validTx = Array.isArray(transactions) ? transactions : []; // Transaksi yang SUDAH DIFILTER oleh timeframe

  // MESIN MATEMATIKA: Skala Budget Dinamis
  const getScaleMultiplier = (budgetPeriod: string, targetTimeFrame: string, customR: any) => {
    // 1. Ubah periode default ke nilai per 1 hari
    let dailyAmount = 1;
    if (budgetPeriod === "DAILY") dailyAmount = 1;
    else if (budgetPeriod === "WEEKLY") dailyAmount = 1 / 7;
    else if (budgetPeriod === "MONTHLY") dailyAmount = 1 / 30; // Rata-rata 30 hari
    else if (budgetPeriod === "YEARLY") dailyAmount = 1 / 365;

    // 2. Kalikan dengan jumlah hari pada layar yang sedang dibuka user
    let targetDays = 30; 
    if (targetTimeFrame === "DAILY") targetDays = 1;
    else if (targetTimeFrame === "WEEKLY") targetDays = 7;
    else if (targetTimeFrame === "MONTHLY") targetDays = 30;
    else if (targetTimeFrame === "YEARLY") targetDays = 365;
    else if (targetTimeFrame === "CUSTOM" && customR?.start && customR?.end) {
      targetDays = Math.max(1, (new Date(customR.end).getTime() - new Date(customR.start).getTime()) / 86400000 + 1);
    }

    return dailyAmount * targetDays;
  };

  // MEMBUAT DATA BUDGET YANG SUDAH DI SKALA
  const scaledBudgets = validBudgets.map((b: any) => {
    const multiplier = getScaleMultiplier(b.period, timeFrame, customRange);
    const scaledTarget = b.targetAmount * multiplier;
    
    // Tarik total spent REAL-TIME dari data transaksi (Hanya Expense + Kategori Cocok)
    const dynamicSpent = validTx
      .filter((t: any) => t.type === "EXPENSE" && t.category.toLowerCase() === b.category.toLowerCase())
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    return { ...b, scaledTarget, dynamicSpent };
  });

  const totalTarget = scaledBudgets.reduce((s: any, b: any) => s + b.scaledTarget, 0);
  const totalSpent = scaledBudgets.reduce((s: any, b: any) => s + b.dynamicSpent, 0);

  // Fungsi CRUD tetap sama
  const openEdit = (b: any) => {
    setEditTarget(b);
    setInputCurrency("USD");
    setForm({ category: b.category, period: b.period, targetAmount: b.targetAmount.toString() });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.category || !form.targetAmount) return;
    setIsSubmitting(true);
    const method = editTarget ? 'PUT' : 'POST';
    const url = editTarget ? `/api/budgets/${editTarget._id}` : '/api/budgets';

    const rawInput = Number(form.targetAmount);
    const finalTargetAmount = inputCurrency === "IDR" ? rawInput / DYNAMIC_RATE : rawInput;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: form.category, targetAmount: finalTargetAmount, period: form.period })
      });
      if (response.ok) {
        const savedData = await response.json();
        setBudgets(editTarget ? validBudgets.map((b: any) => b._id === editTarget._id ? savedData : b) : [savedData, ...validBudgets]);
        closeForm();
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const closeForm = () => {
    setShowForm(false); setEditTarget(null); setForm({ category: "", period: "MONTHLY", targetAmount: "" }); setInputCurrency("IDR");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/budgets/${deleteTarget._id}`, { method: 'DELETE' });
      if (res.ok) { setBudgets(validBudgets.filter((b: any) => b._id !== deleteTarget._id)); setDeleteTarget(null); }
    } catch (error) { console.error(error); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>Budgets</h2>
        <button onClick={() => showForm ? closeForm() : setShowForm(true)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, cursor: "pointer", fontSize: 11, textTransform: "uppercase" }}>
          {showForm ? "CANCEL" : "+ ADD"}
        </button>
      </div>

      {/* RENDER GRAFIK BARU DI SINI */}
      <BudgetAllocationChart budgets={scaledBudgets} currency={currency} />

      <div style={{ background: C.accent, borderRadius: 14, padding: "20px 22px 0", marginBottom: 16, overflow: "hidden" }}>
        <p style={{ margin: "0 0 2px", fontSize: 9, color: C.accentDark, letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>
          Financial ({timeFrame})
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <p style={{ margin: "6px 0 16px", fontSize: 30, fontWeight: 900, color: "#000", fontFamily: C.mono, letterSpacing: -1 }}>
            {formatCurrency(totalTarget, currency)}
          </p>
          <BarcodeStripes count={20} color="#000" opacity={0.15} style={{ marginBottom: 16 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: "1px solid rgba(0,0,0,0.12)" }}>
          {[["LIMIT", totalTarget], ["SPENT", totalSpent], ["LEFT", totalTarget - totalSpent]].map(([label, val]: any) => (
            <div key={label} style={{ padding: "10px 0" }}>
              <p style={{ margin: "0 0 2px", fontSize: 9, color: C.accentDark, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>{label}</p>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: "#000", fontFamily: C.mono }}>{formatCurrency(val, currency)}</p>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div style={{ background: C.sageCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 800, color: C.accentDark }}>{editTarget ? "EDIT BUDGET" : "NEW BUDGET"}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <input placeholder="Category name" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp} />
            <select value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} style={inp}>
              <option value="DAILY">DAILY</option> 
              <option value="WEEKLY">WEEKLY</option>
              <option value="MONTHLY">MONTHLY</option>
              <option value="YEARLY">YEARLY</option>
            </select>
            
            <div style={{ display: "flex", gap: 6, gridColumn: "span 2" }}>
              <input placeholder={`Target amount in ${inputCurrency}`} type="number" value={form.targetAmount} onChange={e => setForm({ ...form, targetAmount: e.target.value })} style={{ ...inp, flex: 1 }} />
              <button type="button" onClick={() => setInputCurrency(inputCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 60, fontWeight: 800, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {inputCurrency}
              </button>
            </div>
          </div>
          <button onClick={handleSave} disabled={isSubmitting} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: 10, fontWeight: 800, cursor: "pointer" }}>
            {isSubmitting ? "SAVING..." : "SAVE CHANGES"}
          </button>
        </div>
      )}

      {/* MENGGUNAKAN SCALED BUDGETS DI BAWAH SINI */}
      {scaledBudgets.map((b: any) => {
        const pct = Math.min(100, Math.round(((b.dynamicSpent || 0) / (b.scaledTarget || 1)) * 100));
        return (
          <div key={b._id} onClick={() => openEdit(b)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 10, position: "relative", cursor: "pointer" }}>
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(b); }} style={{ position: "absolute", right: -6, top: -6, width: 22, height: 22, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", cursor: "pointer", zIndex: 10 }}>×</button>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: "uppercase" }}>Base: {b.period}</p>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 15, color: C.text }}>{b.category}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{formatCurrency(b.scaledTarget, currency)}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: pct >= 100 ? C.danger : C.text }}>{formatCurrency(b.dynamicSpent || 0, currency)}</p>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: 2, height: 24, alignItems: "flex-end" }}>
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 6 + (i % 3) * 4, background: (i / 24 < pct / 100) ? C.accent : C.border, borderRadius: 1 }} />
              ))}
            </div>
            {pct >= 100 && <p style={{ margin: "8px 0 0", fontSize: 9, color: C.danger, letterSpacing: 2, fontWeight: 700 }}>BUDGET OVERRUN</p>}
          </div>
        );
      })}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.card, padding: 24, borderRadius: 16, width: "90%", maxWidth: 320, textAlign: "center", border: `1px solid ${C.border}` }}>
            <p style={{ color: C.text, marginBottom: 16 }}>Hapus budget <b>{deleteTarget.category}</b>?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: 10, borderRadius: 8, background: C.surface, color: C.text, border: "none", fontWeight: 700, cursor: "pointer" }}>BATAL</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 10, borderRadius: 8, background: C.danger, color: "#fff", border: "none", fontWeight: 700, cursor: "pointer" }}>HAPUS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function TimeFrameSelector({ selected, onChange, custom, setCustom }: any) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 10 }}>
        {["DAILY", "WEEKLY", "MONTHLY", "YEARLY", "CUSTOM"].map((tf) => (
          <button
            key={tf}
            onClick={() => onChange(tf)}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 1,
              background: selected === tf ? C.accent : C.surface,
              color: selected === tf ? "#000" : C.muted,
              border: `1px solid ${selected === tf ? C.accent : C.border}`,
              cursor: "pointer",
              whiteSpace: "nowrap"
            }}
          >
            {tf}
          </button>
        ))}
      </div>
      
      {selected === "CUSTOM" && (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <input type="date" value={custom.start} onChange={e => setCustom({...custom, start: e.target.value})} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, padding: 8, borderRadius: 8, fontSize: 11 }} />
          <input type="date" value={custom.end} onChange={e => setCustom({...custom, end: e.target.value})} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, padding: 8, borderRadius: 8, fontSize: 11 }} />
        </div>
      )}
    </div>
  );
}


function TransactionsModule({ transactions, setTransactions, assets = [], setAssets, currency }: any) {
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editTarget, setEditTarget] = useState<any>(null);
  
  const [form, setForm] = useState({ assetId: "", type: "EXPENSE", category: "", amount: "", note: "", date: new Date().toISOString().slice(0, 10) });
  const [inputCurrency, setInputCurrency] = useState<"USD" | "IDR">("IDR"); 

  const inp = { background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box" as any };
  const catIcons: any = { Salary: "◈", Freelance: "◆", Groceries: "⊛", Transport: "◎", Education: "▣", Health: "◉" };

  const safeDate = (d: any) => {
    if (!d) return "";
    try { return new Date(d).toISOString().slice(0, 10); } catch { return String(d).slice(0, 10); }
  };

  const updateAssetQuantityDB = async (assetId: string, newQuantity: number) => {
    try {
      await fetch(`/api/assets/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity })
      });
    } catch (err) { console.error("Gagal update DB aset:", err); }
  };

  // KALKULASI PINTAR UNTUK MENGHINDARI BOCOR KURS
  const calculateQuantityChange = (asset: any, amountInUSD: number, rawInputAmount: number) => {
    if (asset.assetClass === "CASH" && asset.assetTicker === "IDR") {
      // Potong angkanya MENTAH-MENTAH (Native Subtraction).
      return inputCurrency === "IDR" ? rawInputAmount : rawInputAmount * DYNAMIC_RATE;
    }
    const price = asset.currentPrice > 0 ? asset.currentPrice : 1;
    return amountInUSD / price;
  };

  const handleAddTransaction = async () => {
    if (!form.assetId || !form.category || !form.amount || !form.date) return alert("Pilih sumber aset dan isi semua data!");
    setIsSubmitting(true);

    const rawInput = Number(form.amount);
    const finalAmountUSD = inputCurrency === "IDR" ? rawInput / DYNAMIC_RATE : rawInput;

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: form.assetId,
          type: form.type,
          category: form.category,
          amount: finalAmountUSD,
          date: new Date(form.date),
          note: form.note
        })
      });

      if (response.ok) {
        const newTransaction = await response.json();
        setTransactions([newTransaction, ...transactions]); 
        
        // POTONG SALDO ASET SECARA PRESISI
        const targetAsset = assets.find((a: any) => a._id === form.assetId);
        if (targetAsset) {
            const qChange = calculateQuantityChange(targetAsset, finalAmountUSD, rawInput);
            const newQty = form.type === "INCOME" ? targetAsset.quantity + qChange : targetAsset.quantity - qChange;
            
            setAssets(assets.map((a: any) => a._id === form.assetId ? { ...a, quantity: newQty } : a));
            await updateAssetQuantityDB(targetAsset._id, newQty); // Simpan ke Backend!
        }

        setShowForm(false);
        setForm({ assetId: "", type: "EXPENSE", category: "", amount: "", note: "", date: new Date().toISOString().slice(0, 10) });
      }
    } catch (error) { console.error(error); } finally { setIsSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editTarget) return;
    setIsSubmitting(true);
    const rawInput = Number(form.amount);
    const finalAmountUSD = inputCurrency === "IDR" ? rawInput / DYNAMIC_RATE : rawInput;

    try {
      const response = await fetch(`/api/transactions/${editTarget._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: form.assetId,
          category: form.category,
          amount: finalAmountUSD,
          type: form.type,
          note: form.note,
          date: new Date(form.date)
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setTransactions((prev: any[]) => prev.map(t => t._id === editTarget._id ? updated : t));
        
        // Optional: Logika rumit refund selisih aset bisa ditaruh di sini jika diperlukan.
        setEditTarget(null);
        setSelected(null);
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  const confirmDeleteTransaction = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${deleteTarget._id}`, { method: 'DELETE' });
      
      if (response.ok) {
        const targetAsset = assets.find((a: any) => a._id === deleteTarget.assetId);
        if (targetAsset) {
            // REFUND OTOMATIS SAAT DIHAPUS (Berdasarkan jumlah asli transaksi)
            const refundAmountUSD = deleteTarget.amount;
            // Gunakan nilai transaksi untuk menghitung ulang nilai IDR asli saat refund
            const rawRefundIDR = refundAmountUSD * DYNAMIC_RATE; 
            
            const qChange = calculateQuantityChange(targetAsset, refundAmountUSD, rawRefundIDR);
            const newQty = deleteTarget.type === "EXPENSE" ? targetAsset.quantity + qChange : targetAsset.quantity - qChange;
            
            setAssets(assets.map((a: any) => a._id === targetAsset._id ? { ...a, quantity: newQty } : a));
            await updateAssetQuantityDB(targetAsset._id, newQty);
        }

        setTransactions(transactions.filter((x: any) => x._id !== deleteTarget._id));
        setDeleteTarget(null);
        setSelected(null);
      }
    } catch (error) { console.error(error); } finally { setIsDeleting(false); }
  };

  const openEditForm = (t: any) => {
    setEditTarget(t);
    setInputCurrency("USD");
    setForm({
      assetId: t.assetId,
      type: t.type,
      category: t.category,
      amount: t.amount.toString(),
      note: t.note || "",
      date: safeDate(t.date)
    });
  };

  if (selected) {
    const t = selected;
    const usedAsset = assets.find((a: any) => a._id === t.assetId);
    
    return (
      <div>
        <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDeleteTransaction} isDeleting={isDeleting} title="Delete Transaction?" message="Yakin hapus transaksi ini? Saldo aset akan dikembalikan (refund) otomatis." />
        <button onClick={() => { setSelected(null); setEditTarget(null); }} style={{ background: "transparent", border: "none", color: C.muted, cursor: "pointer", fontSize: 13, marginBottom: 16, padding: 0 }}>← Back</button>
        
        {editTarget ? (
          <div style={{ background: C.sageCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18 }}>
            <h3 style={{ margin: "0 0 16px", color: C.text, fontSize: 16 }}>Edit Transaction</h3>
            <div style={{ marginBottom: 10 }}>
               <select value={form.assetId} onChange={e => setForm({ ...form, assetId: e.target.value })} style={{ ...inp, background: C.surface, borderColor: C.accent, marginBottom: 8 }}>
                  <option value="" disabled>-- Pilih Sumber Asset / Wallet --</option>
                  {assets.map((a: any) => <option key={a._id} value={a._id}>{a.assetTicker} [{a.location || "Vault"}]</option>)}
               </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inp, background: C.surface }}><option>INCOME</option><option>EXPENSE</option></select>
              <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp} />
              
              <div style={{ display: "flex", gap: 6, gridColumn: "span 2" }}>
                <input placeholder={`Amount in ${inputCurrency}`} type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ ...inp, flex: 1 }} />
                <button type="button" onClick={() => setInputCurrency(inputCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 60, fontWeight: 800, fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {inputCurrency}
                </button>
              </div>

              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
              <input placeholder="Note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={inp} />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setEditTarget(null)} style={{ flex: 1, padding: 10, background: C.surface, color: C.text, border: "none", borderRadius: 8, fontWeight: 800 }}>CANCEL</button>
              <button onClick={handleUpdate} disabled={isSubmitting} style={{ flex: 1, padding: 10, background: C.accent, color: "#000", border: "none", borderRadius: 8, fontWeight: 800 }}>{isSubmitting ? "SAVING..." : "SAVE"}</button>
            </div>
          </div>
        ) : (
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
            <div style={{ background: C.sageCard, padding: "28px 24px 20px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: C.sageDark, margin: "0 auto 16px" }}>{catIcons[t.category] || "◈"}</div>
              <p style={{ margin: "0 0 6px", fontSize: 34, fontWeight: 900, color: t.type === "INCOME" ? C.success : C.danger, fontFamily: C.mono, letterSpacing: -1 }}>{t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount, currency)}</p>
            </div>
            <div style={{ padding: "0 24px" }}>
              <p style={{ margin: "16px 0 12px", fontSize: 18, fontWeight: 800, color: C.text }}>{t.category}</p>
              {[["WALLET/ASSET", usedAsset ? `${usedAsset.assetTicker} [${usedAsset.location}]` : "Unknown"], ["DATE", safeDate(t.date)], ["TYPE", t.type], ["NOTE", t.note || "—"]].map(([label, val]) => (
                <div key={label} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px 0", borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>{label}</span>
                  <span style={{ fontSize: 12, color: C.text, fontFamily: C.mono, textAlign: "right" }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 20, display: "flex", gap: 10 }}>
              <button onClick={() => openEditForm(t)} style={{ flex: 1, background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: 14, fontWeight: 800, cursor: "pointer", fontSize: 11, letterSpacing: 1 }}>EDIT</button>
              <button onClick={() => setDeleteTarget(t)} disabled={isDeleting} style={{ flex: 1, background: C.danger, color: "#fff", border: "none", borderRadius: 10, padding: 14, fontWeight: 800, cursor: "pointer", fontSize: 11, letterSpacing: 1 }}>DELETE</button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <SectionHeader light="All Recent" bold="Transactions" />
        <button onClick={() => showForm ? setShowForm(false) : setShowForm(true)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, cursor: "pointer", fontSize: 11, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
          {showForm ? "CANCEL" : "+ ADD"}
        </button>
      </div>
      
      {showForm && (
        <div style={{ background: C.sageCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
          {assets.length === 0 ? (
             <div style={{ padding: 20, textAlign: "center", color: C.dangerLight, fontSize: 12 }}>⚠ Belum memiliki aset apapun.</div>
          ) : (
            <>
              <div style={{ marginBottom: 10 }}>
                 <select 
                    value={form.assetId} 
                    onChange={e => setForm({ ...form, assetId: e.target.value })} 
                    style={{ ...inp, background: C.surface, borderColor: C.accent, marginBottom: 8 }}
                 >
                    <option value="" disabled>-- Pilih Sumber Asset / Wallet --</option>
                    {assets.map((a: any) => (
                       <option key={a._id} value={a._id}>
                          {a.assetTicker} [{a.location || "Vault"}] — {a.quantity.toLocaleString()} unit
                       </option>
                    ))}
                 </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inp, background: C.surface }}><option>INCOME</option><option>EXPENSE</option></select>
                <input placeholder="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={inp} />
                
                <div style={{ display: "flex", gap: 6, gridColumn: "span 2" }}>
                  <input placeholder={`Amount in ${inputCurrency}`} type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={() => setInputCurrency(inputCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 60, fontWeight: 800, fontSize: 11 }}>{inputCurrency}</button>
                </div>

                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} style={inp} />
                <input placeholder="Note" value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} style={inp} />
              </div>
              <button onClick={handleAddTransaction} disabled={isSubmitting} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: 10, fontWeight: 800 }}>
                {isSubmitting ? "ADDING..." : "ADD TRANSACTION"}
              </button>
            </>
          )}
        </div>
      )}
      
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {transactions.length === 0 && <p style={{ margin: 0, padding: "20px", textAlign: "center", fontSize: 12, color: C.muted }}>Belum ada transaksi tersimpan.</p>}
        {transactions.map((t: any, i: number) => {
          const usedAsset = assets.find((a: any) => a._id === t.assetId);
          return (
            <div key={t._id} onClick={() => setSelected(t)} style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: i < transactions.length - 1 ? `1px solid ${C.border}` : "none", cursor: "pointer" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.type === "INCOME" ? "rgba(126,200,122,0.1)" : C.sageCard, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: t.type === "INCOME" ? C.success : C.sageDark, marginRight: 14 }}>{catIcons[t.category] || "◈"}</div>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: C.text }}>{t.category}</p>
                <p style={{ margin: "2px 0 0", fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: 1 }}>{usedAsset ? `${usedAsset.assetTicker} [${usedAsset.location}]` : "N/A"} · {safeDate(t.date).slice(5)}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: 13, fontFamily: C.mono, color: t.type === "INCOME" ? C.success : C.text }}>{t.type === "INCOME" ? "+" : "-"}{formatCurrency(t.amount, currency)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}



function MilestonesModule({ milestones, setMilestones, transactions = [], budgets = [], assets = [], currency }: any) {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editQuest, setEditQuest] = useState<any>(null);

  const [form, setForm] = useState({
    title: "", type: "TX_EXPENSE_SUM", category: "", timeframe: "30",
    condition: "<=", targetValue: "", deadline: "", xpReward: "100", penalty: "50"
  });

  const [inputCurrency, setInputCurrency] = useState<"USD" | "IDR">("IDR"); 
  const inp = { background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, width: "100%", boxSizing: "border-box" as any };

  const isCountMetric = (type: string) => type === "TX_EXPENSE_FREQ" || type.includes("DIVERSIFICATION");
  const now = new Date().getTime();

  const getAssetValueUSD = (a: any) => {
    if (a.assetClass === "CASH") {
      return a.quantity / (typeof DYNAMIC_RATE !== "undefined" ? DYNAMIC_RATE : 17000);
    }
    return (a.currentPrice || 0) * (a.quantity || 0);
  };

  let totalXP = 0;

  const evaluatedQuests = (Array.isArray(milestones) ? milestones : []).map((q: any) => {
    if (q.isCompleted) {
      totalXP += (q.xpReward || 0);
      return { ...q, isSuccess: true, isFailed: false, isClaimable: false, progressStr: "MISSION ACCOMPLISHED 🏆" };
    }

    let currentVal = 0; let isSuccess = false; let isFailed = false; let isClaimable = false;

    const tfDays = q.timeframe === "ALL" ? Infinity : Number(q.timeframe || 30);
    const cutoffTime = now - (tfDays * 86400000);
    const activeTx = transactions.filter((t: any) => new Date(t.date).getTime() >= cutoffTime);

    if (q.type === "TX_EXPENSE_SUM") currentVal = activeTx.filter((t:any) => t.type === "EXPENSE" && (q.category ? t.category.toLowerCase() === q.category.toLowerCase() : true)).reduce((s:any, t:any) => s + t.amount, 0);
    else if (q.type === "TX_INCOME_SUM") currentVal = activeTx.filter((t:any) => t.type === "INCOME" && (q.category ? t.category.toLowerCase() === q.category.toLowerCase() : true)).reduce((s:any, t:any) => s + t.amount, 0);
    else if (q.type === "TX_EXPENSE_FREQ") currentVal = activeTx.filter((t:any) => t.type === "EXPENSE" && (q.category ? t.category.toLowerCase() === q.category.toLowerCase() : true)).length;
    else if (q.type === "TX_NET_SAVINGS") {
      const inc = activeTx.filter((t:any) => t.type === "INCOME").reduce((s:any, t:any) => s + t.amount, 0);
      const exp = activeTx.filter((t:any) => t.type === "EXPENSE").reduce((s:any, t:any) => s + t.amount, 0);
      currentVal = inc - exp;
    } 
    else if (q.type === "ASSET_VALUE_TOTAL") currentVal = assets.reduce((s:any, a:any) => s + getAssetValueUSD(a), 0);
    else if (q.type === "ASSET_VALUE_SPECIFIC") {
      const targetAssets = assets.filter((a:any) => a.assetClass === q.category || a.assetTicker === q.category);
      currentVal = targetAssets.reduce((s:any, a:any) => s + getAssetValueUSD(a), 0);
    } 
    else if (q.type === "ASSET_PNL") {
      const invested = assets.filter((a:any) => (q.category ? a.assetTicker === q.category : true) && a.averagePurchasePrice > 0 && a.assetClass !== "CASH");
      const curVal = invested.reduce((s:any, a:any) => s + getAssetValueUSD(a), 0);
      const cost = invested.reduce((s:any, a:any) => s + ((a.averagePurchasePrice || 0) * (a.quantity || 0)), 0);
      currentVal = curVal - cost;
    }
    else if (q.type === "DIVERSIFICATION_TICKER") currentVal = new Set(assets.filter((a:any) => a.quantity > 0 && a.assetClass !== "CASH").map((a:any) => a.assetTicker)).size;
    else if (q.type === "DIVERSIFICATION_CLASS") currentVal = new Set(assets.filter((a:any) => a.quantity > 0).map((a:any) => a.assetClass)).size;

    const target = q.targetValue || 0;
    const cond = q.condition || "<="; 
    const EPSILON = 0.0001;
    
    if (cond === "<=") { isSuccess = currentVal <= target + EPSILON; isFailed = currentVal > target + EPSILON; } 
    else if (cond === "<") { isSuccess = currentVal < target; isFailed = currentVal >= target; } 
    else if (cond === ">=") { isSuccess = currentVal + EPSILON >= target; isFailed = currentVal + EPSILON < target; } 
    else if (cond === ">") { isSuccess = currentVal > target; isFailed = currentVal <= target; }

    let progressStr = isCountMetric(q.type) ? `${Math.floor(currentVal)} / ${Math.floor(target)}` : `${formatCurrency(currentVal, currency)} / ${formatCurrency(target, currency)}`;

    const isSurvival = cond === "<=" || cond === "<";

    if (q.deadline) {
      const d = new Date(q.deadline); d.setHours(23,59,59);
      const isExpired = now > d.getTime();

      if (isSurvival) {
        if (isExpired) {
          if (isSuccess) { isClaimable = true; progressStr = "SURVIVED! READY TO CLAIM 🏆"; }
          else { isSuccess = false; isFailed = true; progressStr = "FAILED 💀 (LIMIT BROKEN)"; }
        } else {
          if (isSuccess) { isClaimable = false; progressStr = `SURVIVING... (${progressStr})`; }
          else { isSuccess = false; isFailed = true; progressStr = "FAILED 💀 (LIMIT BROKEN)"; }
        }
      } else {
        if (isSuccess) { isClaimable = true; progressStr = "TARGET HIT! READY TO CLAIM 🏆"; } 
        else {
          if (isExpired) { isFailed = true; progressStr = "EXPIRED ⌛ (TARGET MISSED)"; }
          else { isClaimable = false; }
        }
      }
    } else {
      if (isSuccess) {
        isClaimable = true; 
        if (!isSurvival) progressStr = "TARGET HIT! READY TO CLAIM 🏆";
      }
    }

    if (isSuccess) totalXP += (q.xpReward || 0);
    if (isFailed) totalXP -= (q.penalty || 0);

    return { ...q, condition: cond, isSuccess, isFailed, isClaimable, progressStr };
  }).sort((a:any, b:any) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));

  const displayXP = Math.max(0, totalXP);
  const currentLevel = Math.floor(displayXP / 1000) + 1;
  const levelProgress = (displayXP % 1000) / 10;

  const handleSaveQuest = async () => {
    if (!form.title || !form.targetValue) return alert("data tidak lengkap!");
    setIsSubmitting(true);
    
    const rawVal = Number(form.targetValue);
    const activeRate = typeof DYNAMIC_RATE !== "undefined" ? DYNAMIC_RATE : 17000;
    const finalVal = (inputCurrency === "IDR" && !isCountMetric(form.type)) ? rawVal / activeRate : rawVal;
    
    const finalDeadline = form.deadline ? new Date(form.deadline) : null;
    
    const payload = { 
      title: form.title, type: form.type, category: form.category.toUpperCase(), 
      timeframe: form.timeframe, condition: form.condition, targetValue: finalVal, 
      deadline: finalDeadline, xpReward: Number(form.xpReward), penalty: Number(form.penalty), 
      isQuest: true, isCompleted: false 
    };
    
    const method = editQuest ? 'PUT' : 'POST';
    const url = editQuest ? `/api/milestones/${editQuest._id}` : '/api/milestones';

    try {
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (res.ok) {
        const saved = await res.json();
        setMilestones((prev: any[]) => editQuest ? prev.map(m => m._id === saved._id ? saved : m) : [saved, ...prev]);
        setShowForm(false); setEditQuest(null);
        setForm({ title: "", type: "TX_EXPENSE_SUM", category: "", timeframe: "30", condition: "<=", targetValue: "", deadline: "", xpReward: "100", penalty: "50" });
      } else { alert("gagal menyimpan: " + await res.text()); }
    } catch (e) { console.error(e); } finally { setIsSubmitting(false); }
  };

  const handleClaim = async (q: any) => {
    try {
      const res = await fetch(`/api/milestones/${q._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true })
      });
      if (res.ok) {
        const updated = await res.json();
        setMilestones((prev: any[]) => prev.map(m => m._id === q._id ? updated : m));
      }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/milestones/${deleteTarget._id}`, { method: 'DELETE' });
      if (res.ok) {
        setMilestones((prev: any[]) => prev.filter(m => m._id !== deleteTarget._id));
        setDeleteTarget(null);
      }
    } catch (e) { console.error(e); }
  };

  const openEdit = (q: any) => {
    setEditQuest(q);
    setInputCurrency("USD");
    
    setForm({
      title: q.title || "", type: q.type || "TX_EXPENSE_SUM", category: q.category || "", 
      timeframe: q.timeframe || "30", condition: q.condition || "<=", targetValue: (q.targetValue ?? 0).toString(),
      deadline: q.deadline ? new Date(q.deadline).toISOString().slice(0,10) : "",
      xpReward: (q.xpReward ?? 100).toString(), penalty: (q.penalty ?? 50).toString()
    });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <SectionHeader light="Custom" bold="Quest Engine" />
        <button onClick={() => { setShowForm(!showForm); setEditQuest(null); }} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: "9px 16px", fontWeight: 800, cursor: "pointer", fontSize: 11 }}>
          {showForm ? "CANCEL" : "+ FORGE"}
        </button>
      </div>

      <div style={{ background: C.sageCard, borderRadius: 16, padding: 24, marginBottom: 16, border: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 10, color: C.accent, fontWeight: 800, letterSpacing: 2 }}>RANK</p>
            <h2 style={{ margin: 0, fontSize: 32, fontWeight: 900, fontFamily: C.mono }}>LVL {currentLevel}</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, fontFamily: C.mono }}>{displayXP} XP</p>
            <p style={{ margin: 0, fontSize: 10, color: C.muted }}>NEXT: {currentLevel * 1000}</p>
          </div>
        </div>
        <div style={{ height: 6, background: C.surface, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ width: `${levelProgress}%`, height: "100%", background: C.accent, transition: "width 0.5s ease" }} />
        </div>
      </div>

      {showForm && !editQuest && (
        <div style={{ background: C.card, border: `1px dashed ${C.accent}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
          <p style={{ margin: "0 0 16px", fontSize: 11, color: C.accent, fontWeight: 800 }}>BUILD NEW QUEST</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input placeholder="Judul Misi (cth: Puasa Kopi)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ ...inp, gridColumn: "span 2" }} />
            
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>1. METRIK YANG DIUKUR (APA TARGETNYA?)</label>
              <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inp}>
                 <optgroup label="💸 Cashflow & Transaksi">
                   <option value="TX_EXPENSE_SUM">📉 Total Pengeluaran Uang (Expense Sum)</option>
                   <option value="TX_EXPENSE_FREQ">🛒 Frekuensi Pengeluaran (Berapa Kali)</option>
                   <option value="TX_INCOME_SUM">💸 Total Pemasukan (Income Sum)</option>
                   <option value="TX_NET_SAVINGS">🏦 Sisa Uang Bersih (Net Savings)</option>
                 </optgroup>
                 <optgroup label="💎 Kekayaan & Aset">
                   <option value="ASSET_VALUE_TOTAL">💰 Total Kekayaan Bersih (Semua Aset & Uang)</option>
                   <option value="ASSET_VALUE_SPECIFIC">🎯 Saldo Aset Tertentu (CASH/CRYPTO/SAHAM)</option>
                   <option value="ASSET_PNL">📈 Keuntungan Portofolio (Unrealized P&L)</option>
                 </optgroup>
                 <optgroup label="🌐 Diversifikasi">
                   <option value="DIVERSIFICATION_TICKER">🧩 Jumlah Jenis Koin/Saham Berbeda</option>
                   <option value="DIVERSIFICATION_CLASS">📦 Jumlah Jenis Kelas Aset Berbeda</option>
                 </optgroup>
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>2. FILTER KATEGORI / TICKER (KOSONGKAN UNTUK SEMUA)</label>
              <input placeholder="Ketik nama kategori (cth: Food) atau Ticker (cth: BTC-USD)" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inp} />
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>3. RENTANG WAKTU (MUNDUR KE BELAKANG)</label>
              <select value={form.timeframe} onChange={e => setForm({...form, timeframe: e.target.value})} style={inp}>
                 <option value="1">⏳ 1 Hari (24 Jam Terakhir)</option>
                 <option value="7">📅 7 Hari (Satu Minggu Terakhir)</option>
                 <option value="30">🌙 30 Hari (Satu Bulan Terakhir)</option>
                 <option value="365">☀️ 1 Tahun (Satu Tahun Terakhir)</option>
                 <option value="ALL">🌌 Seumur Hidup (All Time)</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>4. ATURAN & TARGET ANGKA</label>
              <div style={{ display: "flex", gap: 6 }}>
                <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} style={{ ...inp, flex: 0.6 }}>
                  <option value="<=">🛑 Maksimal ({"<="}) - Bertahan</option>
                  <option value="<">🚧 Kurang Dari ({"<"}) - Sangat Ketat</option>
                  <option value=">=">🚀 Minimal ({">="}) - Kumpul Uang</option>
                  <option value=">">🔥 Lebih Dari ({">"}) - Lewati Batas</option>
                </select>
                <input type="number" placeholder="Target Angka" value={form.targetValue} onChange={e => setForm({...form, targetValue: e.target.value})} style={{ ...inp, flex: 1 }} />
                {!isCountMetric(form.type) && <button onClick={() => setInputCurrency(inputCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 50, fontSize: 10, fontWeight: 800 }}>{inputCurrency}</button>}
              </div>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>5. BATAS WAKTU HANGUS (DEADLINE) - OPSIONAL</label>
              <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={inp} />
            </div>

            <div style={{ gridColumn: "span 1" }}>
              <label style={{ fontSize: 9, color: C.success, marginBottom: 4, display: "block" }}>HADIAH XP (+)</label>
              <input type="number" placeholder="Hadiah XP" value={form.xpReward} onChange={e => setForm({...form, xpReward: e.target.value})} style={{ ...inp, borderColor: C.success }} />
            </div>
            <div style={{ gridColumn: "span 1" }}>
              <label style={{ fontSize: 9, color: C.danger, marginBottom: 4, display: "block" }}>HUKUMAN XP (-)</label>
              <input type="number" placeholder="Hukuman XP" value={form.penalty} onChange={e => setForm({...form, penalty: e.target.value})} style={{ ...inp, borderColor: C.danger }} />
            </div>
          </div>
          <button onClick={handleSaveQuest} disabled={isSubmitting} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 800, marginTop: 16 }}>{isSubmitting ? "FORGING..." : "FORGE QUEST"}</button>
        </div>
      )}

      {evaluatedQuests.map((q: any) => (
        <div key={q._id} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 10, position: "relative", opacity: q.isCompleted ? 0.5 : 1 }}>
          <div style={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 6 }}>
            {!q.isCompleted && <button onClick={(e) => { e.stopPropagation(); openEdit(q); }} style={{ width: 24, height: 24, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, color: C.text, cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>✎</button>}
            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(q); }} style={{ width: 24, height: 24, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingRight: 60 }}>
            <div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: C.text }}>{q.title}</p>
              <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{q.type.replace(/_/g, " ")} {q.deadline && `· ⌛ ${new Date(q.deadline).toISOString().slice(0,10)}`}</p>
            </div>
            {q.isClaimable && !q.isCompleted ? (
               <button onClick={() => handleClaim(q)} style={{ background: C.accent, color: "#000", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 10, fontWeight: 900, cursor: "pointer", animation: "pulse 2s infinite" }}>CLAIM +{q.xpReward || 0} XP!</button>
            ) : (
               <div style={{ fontSize: 11, fontWeight: 800, color: q.isSuccess ? C.success : (q.isFailed ? C.danger : C.text) }}>
                 {q.isCompleted ? "DONE" : (q.isFailed ? `-${q.penalty || 0} XP` : "IN PROGRESS")}
               </div>
            )}
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${C.border}`, paddingTop: 10 }}>
             <p style={{ margin: 0, fontSize: 12, fontFamily: C.mono, color: q.isCompleted ? C.success : C.muted }}>{q.progressStr}</p>
             <p style={{ margin: 0, fontSize: 9, color: C.muted }}>RULE: {q.condition}</p>
          </div>
        </div>
      ))}

      {editQuest && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 450, overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.5)", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ background: C.sageCard, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <div><p style={{ margin: 0, fontSize: 10, color: C.muted, letterSpacing: 2, textTransform: "uppercase" }}>Modify Quest</p><p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 800, color: C.text }}>{editQuest.title}</p></div>
              <button onClick={() => setEditQuest(null)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: 20, overflowY: "auto" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <input placeholder="Judul Misi" value={form.title} onChange={e => setForm({...form, title: e.target.value})} style={{ ...inp, gridColumn: "span 2" }} />
                
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>1. METRIK (YANG DIUKUR)</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})} style={inp}>
                     <optgroup label="💸 Cashflow & Transaksi">
                       <option value="TX_EXPENSE_SUM">📉 Total Pengeluaran Uang</option>
                       <option value="TX_EXPENSE_FREQ">🛒 Frekuensi Pengeluaran</option>
                       <option value="TX_INCOME_SUM">💸 Total Pemasukan</option>
                       <option value="TX_NET_SAVINGS">🏦 Sisa Uang Bersih</option>
                     </optgroup>
                     <optgroup label="💎 Kekayaan & Aset">
                       <option value="ASSET_VALUE_TOTAL">💰 Total Kekayaan Bersih</option>
                       <option value="ASSET_VALUE_SPECIFIC">🎯 Saldo Aset Tertentu</option>
                       <option value="ASSET_PNL">📈 Keuntungan P&L</option>
                     </optgroup>
                     <optgroup label="🌐 Diversifikasi">
                       <option value="DIVERSIFICATION_TICKER">🧩 Jumlah Jenis Koin/Saham</option>
                       <option value="DIVERSIFICATION_CLASS">📦 Jumlah Jenis Kelas Aset</option>
                     </optgroup>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>2. FILTER (KATEGORI / TICKER)</label>
                  <input placeholder="Kosongkan jika untuk semua" value={form.category} onChange={e => setForm({...form, category: e.target.value})} style={inp} />
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>3. RENTANG WAKTU (MUNDUR)</label>
                  <select value={form.timeframe} onChange={e => setForm({...form, timeframe: e.target.value})} style={inp}>
                     <option value="1">⏳ 1 Hari (24 Jam)</option>
                     <option value="7">📅 7 Hari (Mingguan)</option>
                     <option value="30">🌙 30 Hari (Bulanan)</option>
                     <option value="365">☀️ 1 Tahun (Tahunan)</option>
                     <option value="ALL">🌌 Seumur Hidup (All Time)</option>
                  </select>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>4. ATURAN TARGET</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    <select value={form.condition} onChange={e => setForm({...form, condition: e.target.value})} style={{ ...inp, flex: 0.6 }}>
                      <option value="<=">🛑 Maksimal ({"<="}) - Bertahan</option>
                      <option value="<">🚧 Kurang Dari ({"<"}) - Sangat Ketat</option>
                      <option value=">=">🚀 Minimal ({">="}) - Kumpul Uang</option>
                      <option value=">">🔥 Lebih Dari ({">"}) - Lewati Batas</option>
                    </select>
                    <input type="number" placeholder="Target Angka" value={form.targetValue} onChange={e => setForm({...form, targetValue: e.target.value})} style={{ ...inp, flex: 1 }} />
                    {!isCountMetric(form.type) && <button onClick={() => setInputCurrency(inputCurrency === "USD" ? "IDR" : "USD")} style={{ background: C.surface, color: C.accent, border: `1px solid ${C.border}`, borderRadius: 8, width: 50, fontSize: 10, fontWeight: 800 }}>{inputCurrency}</button>}
                  </div>
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 9, color: C.muted, marginBottom: 4, display: "block" }}>5. DEADLINE (OPSIONAL)</label>
                  <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} style={inp} />
                </div>

                <div style={{ gridColumn: "span 1" }}>
                  <label style={{ fontSize: 9, color: C.success, marginBottom: 4, display: "block" }}>HADIAH XP (+)</label>
                  <input type="number" placeholder="Hadiah XP" value={form.xpReward} onChange={e => setForm({...form, xpReward: e.target.value})} style={{ ...inp, color: C.success }} />
                </div>
                <div style={{ gridColumn: "span 1" }}>
                  <label style={{ fontSize: 9, color: C.danger, marginBottom: 4, display: "block" }}>HUKUMAN XP (-)</label>
                  <input type="number" placeholder="Hukuman XP" value={form.penalty} onChange={e => setForm({...form, penalty: e.target.value})} style={{ ...inp, color: C.danger }} />
                </div>
              </div>
              <button onClick={handleSaveQuest} disabled={isSubmitting} style={{ width: "100%", background: C.accent, color: "#000", border: "none", borderRadius: 8, padding: 12, fontWeight: 800, marginTop: 16, cursor: "pointer" }}>{isSubmitting ? "UPDATING..." : "SAVE CHANGES"}</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: C.card, padding: 24, borderRadius: 16, width: "90%", maxWidth: 320, textAlign: "center", border: `1px solid ${C.border}` }}>
            <p style={{ color: C.text, marginBottom: 16 }}>Hapus quest permanen?</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: 10, borderRadius: 8, background: C.surface, color: C.text, border: "none", fontWeight: 700 }}>BATAL</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: 10, borderRadius: 8, background: C.danger, color: "#fff", border: "none", fontWeight: 700 }}>HAPUS</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function AIModule({ assets, transactions, budgets, milestones, analyses = [], setAnalyses, timeFrame, currency }: any) {
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [viewingReport, setViewingReport] = useState<any>(null);
  
  const [debugOutput, setDebugOutput] = useState<string | null>(null);
  
  // default ke model stabil yang gratis dan cepat
  const [selectedAI, setSelectedAI] = useState("gemini-2.5-flash");
  const [customPrompt, setCustomPrompt] = useState("");
  
  const nw = assets.reduce((s: any, a: any) => s + (a.currentPrice || 0) * (a.quantity || 0), 0);
  const income = transactions.filter((t: any) => t.type === "INCOME").reduce((s: any, t: any) => s + t.amount, 0);
  const expense = transactions.filter((t: any) => t.type === "EXPENSE").reduce((s: any, t: any) => s + t.amount, 0);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

  // kalkulasi tambahan untuk quant engine
  const monthlyBurn = expense; 
  const runwayLength = monthlyBurn > 0 ? (nw / monthlyBurn).toFixed(1) : 999;

  const generatePrompt = () => {
    const ctx = { 
      currentTimeframe: timeFrame,
      macroContext: { riskFreeRate: "6.25%", marketBenchmarkYTD: "4.5%" }, 
      netWorthUSD: Math.round(nw), 
      totalIncomeUSD: Math.round(income), 
      totalExpenseUSD: Math.round(expense),
      savingsRate: savingsRate + "%", 
      burnRateAndRunway: { 
          burnAmount: Math.round(monthlyBurn), 
          runwayMonths: Number(runwayLength) 
      },
      assets: assets.map((a: any) => {
        const pnl = a.averagePurchasePrice > 0 ? ((a.currentPrice - a.averagePurchasePrice) / a.averagePurchasePrice) * 100 : 0;
        return { 
          class: a.assetClass, 
          ticker: a.assetTicker, 
          qty: a.quantity, 
          currentPrice: a.currentPrice, 
          avgBuyPrice: a.averagePurchasePrice, 
          unrealizedPnlPct: pnl.toFixed(2) + "%",
          location: a.location 
        };
      }), 
      transactions: transactions.map((t: any) => ({ 
          datetime: t.date, 
          type: t.type, 
          category: t.category, 
          amount: t.amount, 
          note: t.note 
      })),
      budgets: budgets.map((b: any) => ({ category: b.category, period: b.period, target: b.targetAmount, spent: b.dynamicSpent })), 
      milestones: milestones.map((m: any) => ({ title: m.title, type: m.type, condition: m.condition, target: m.targetValue, deadline: m.deadline, isCompleted: m.isCompleted })) 
    };

    const userInstruction = customPrompt.trim() !== "" 
      ? `\n\nUSER SPECIFIC INSTRUCTION: "${customPrompt}"\nYou MUST explicitly answer this specific request in the dedicated section below.` 
      : "";

    const customHeader = customPrompt.trim() !== ""
      ? `\n## 🔍 Custom Request Analysis\n[Directly answer and focus heavily on the USER SPECIFIC INSTRUCTION here]`
      : "";

    return `You are ZENITH, an elite Quant Engine and Behavioral Finance Expert. Analyze the data for timeframe: ${timeFrame}.${userInstruction}\n\nDATA:\n${JSON.stringify(ctx)}\n\nRULES:\n1. Be highly analytical, actionable, and data-driven. NO fluff or generic advice.\n2. Use exact numbers, asset tickers, categories, and notes from the data.\n3. Calculate and display structural metrics: VaR (Value at Risk) estimates, portfolio diversification percentages, and transaction fee drag.\n4. Call out specific behavioral anomalies based on transaction times, categories, or budget overruns.\n5. FORMATTING STRICT RULE: DO NOT use markdown tables (|---|), code blocks, or complex non-text symbols. Use plain text and standard bullet points (- ) ONLY. Explain comparisons using lists.\n\nStructure your response EXACTLY as:\n## 📊 Cashflow & Liquidity Forecast\n[Analysis including burn rate, runway, and liquidity buffer]\n## 💎 Asset & Quant Strategy\n[Analysis including portfolio weighting, implied VaR, and rebalancing alerts. Use bullet points for asset lists, NO TABLES]\n## 🧠 Behavioral Insights & Anomalies\n[Analysis of spending patterns, psychological triggers, and fee leakages]\n## 🎯 Quest & Milestone Execution\n[Analysis of milestone progress and probability of hitting deadlines]${customHeader}\n## ⚡ Priority Actions\n- [Action 1 with exact metrics/tickers]\n- [Action 2 with exact metrics/tickers]`;
  };

  
  const extractError = (errData: any) => {
    if (typeof errData === 'string') return errData;
    if (errData?.message) return errData.message;
    if (errData?.error?.message) return errData.error.message;
    return JSON.stringify(errData);
  };

  const runAnalysis = async () => {
    setLoading(true); setError(""); 
    try {
      const res = await fetch("/api/ai", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ promptText: generatePrompt(), modelId: selectedAI }) 
      });
      
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`server tidak membalas dengan json: ${textResponse}`);
      }
      
      if (!res.ok || data.error) throw new Error(extractError(data.error || data));

      if (data.content?.[0]?.text) {
        const report = data.content[0].text;

        if (selectedAI === "cek-model") {
          setDebugOutput(report);
          setLoading(false);
          return;
        }

        const saveRes = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reportMarkdown: report, timeframe: timeFrame,
            netWorthUSD: Math.round(nw), incomeUSD: Math.round(income), expenseUSD: Math.round(expense)
          })
        });
        if (saveRes.ok) {
          const savedReport = await saveRes.json();
          setAnalyses((prev: any) => [savedReport, ...prev]);
          setCustomPrompt(""); 
        } else {
          throw new Error(`gagal menyimpan ke database: ${await saveRes.text()}`);
        }
      } else setError("gagal mendapatkan respons ai. format api salah.");
    } catch (e: any) { setError("ai request failed: " + e.message); }
    setLoading(false);
  };

  const reEvaluateAnalysis = async (id: string) => {
    setUpdatingId(id); setError("");
    try {
      const res = await fetch("/api/ai", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ promptText: generatePrompt(), modelId: selectedAI }) 
      });
      
      const textResponse = await res.text();
      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (e) {
        throw new Error(`server tidak membalas dengan json: ${textResponse}`);
      }
      
      if (!res.ok || data.error) throw new Error(extractError(data.error || data));

      if (data.content?.[0]?.text) {
        const report = data.content[0].text;
        const updateRes = await fetch(`/api/analysis/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            reportMarkdown: report, timeframe: timeFrame,
            netWorthUSD: Math.round(nw), incomeUSD: Math.round(income), expenseUSD: Math.round(expense)
          })
        });

        if (updateRes.ok) {
          const updatedReport = await updateRes.json();
          setAnalyses((prev: any[]) => prev.map(a => a._id === id ? updatedReport : a));
          if (viewingReport && viewingReport._id === id) setViewingReport(updatedReport);
          setCustomPrompt("");
        }
      }
    } catch (e: any) { setError("update failed: " + e.message); }
    setUpdatingId(null);
  };

  const deleteAnalysis = async (e: any, id: string) => {
    e.stopPropagation(); 
    try {
      const res = await fetch(`/api/analysis/${id}`, { method: 'DELETE' });
      if (res.ok) setAnalyses((prev: any[]) => prev.filter(a => a._id !== id));
      if (viewingReport && viewingReport._id === id) setViewingReport(null);
    } catch (e: any) { console.error(e); }
  };

  const renderMd = (text: string) => text.split("\n").map((line, i) => {
    if (line.startsWith("## ")) return <p key={i} style={{ margin: "16px 0 6px", fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 800 }}>{line.slice(3)}</p>;
    if (line.startsWith("- ")) return <p key={i} style={{ margin: "4px 0", fontSize: 13, color: C.text, paddingLeft: 14, borderLeft: `2px solid ${C.accent}`, lineHeight: 1.6 }}>{line.slice(2)}</p>;
    if (line.trim()) return <p key={i} style={{ margin: "4px 0", fontSize: 13, color: C.muted, lineHeight: 1.7 }}>{line}</p>;
    return <div key={i} style={{ height: 8 }} />;
  });

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
        <SectionHeader light="Quant & Behavioral" bold="AI Analytics Engine" />
      </div>

      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: 18, marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" }}>Pilih Model AI</label>
            <select value={selectedAI} onChange={e => setSelectedAI(e.target.value)} style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 12, width: "100%", outline: "none" }}>
              <optgroup label="System / Debug">
                <option value="cek-model">🔎 DEBUG: CEK DAFTAR MODEL API</option>
              </optgroup>
              
              <optgroup label="Google: Generation 3 (Preview)">
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
                <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
                <option value="gemini-3.1-pro-preview-customtools">Gemini 3.1 Pro Custom Tools</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
                <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                <option value="gemini-3.1-flash-image-preview">Gemini 3.1 Flash Image Preview</option>
                <option value="gemini-3.1-flash-tts-preview">Gemini 3.1 Flash TTS Preview</option>
                <option value="gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</option>
              </optgroup>

              <optgroup label="Google: Generation 2.5">
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                <option value="gemini-2.5-flash-image">Gemini 2.5 Flash Image</option>
                <option value="gemini-2.5-pro-preview-tts">Gemini 2.5 Pro TTS Preview</option>
                <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash TTS Preview</option>
                <option value="gemini-2.5-computer-use-preview-10-2025">Gemini 2.5 Computer Use</option>
              </optgroup>

              <optgroup label="Google: Generation 2.0 & Legacy">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                <option value="gemini-2.0-flash-001">Gemini 2.0 Flash 001</option>
                <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
                <option value="gemini-2.0-flash-lite-001">Gemini 2.0 Flash Lite 001</option>
                <option value="gemini-pro-latest">Gemini Pro Latest</option>
                <option value="gemini-flash-latest">Gemini Flash Latest</option>
                <option value="gemini-flash-lite-latest">Gemini Flash Lite Latest</option>
              </optgroup>

              <optgroup label="Google: Specialized Models">
                <option value="gemma-4-31b-it">Gemma 4 31B IT</option>
                <option value="gemma-4-26b-a4b-it">Gemma 4 26B IT</option>
                <option value="nano-banana-pro-preview">Nano Banana Pro Preview</option>
                <option value="lyria-3-pro-preview">Lyria 3 Pro Preview</option>
                <option value="lyria-3-clip-preview">Lyria 3 Clip Preview</option>
                <option value="deep-research-max-preview-04-2026">Deep Research Max</option>
                <option value="deep-research-preview-04-2026">Deep Research Preview</option>
                <option value="deep-research-pro-preview-12-2025">Deep Research Pro (Legacy)</option>
                <option value="gemini-robotics-er-1.6-preview">Gemini Robotics ER 1.6</option>
                <option value="gemini-robotics-er-1.5-preview">Gemini Robotics ER 1.5</option>
              </optgroup>

              <optgroup label="Groq: Llama & Qwen">
                <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B</option>
                <option value="qwen/qwen3-32b">Qwen 3 32B</option>
              </optgroup>

              <optgroup label="Groq: Specialized / Oss">
                <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                <option value="openai/gpt-oss-20b">GPT OSS 20B</option>
                <option value="openai/gpt-oss-safeguard-20b">GPT OSS Safeguard 20B</option>
                <option value="canopylabs/orpheus-v1-english">Orpheus v1 English</option>
                <option value="canopylabs/orpheus-arabic-saudi">Orpheus Arabic Saudi</option>
                <option value="allam-2-7b">Allam 2 7B</option>
                <option value="groq/compound">Groq Compound</option>
                <option value="groq/compound-mini">Groq Compound Mini</option>
                <option value="meta-llama/llama-prompt-guard-2-86m">Prompt Guard 2 86M</option>
                <option value="meta-llama/llama-prompt-guard-2-22m">Prompt Guard 2 22M</option>
                <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo</option>
                <option value="whisper-large-v3">Whisper Large v3</option>
              </optgroup>
            </select>
          </div>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, display: "block" }}>Custom Prompt / Instruksi Khusus (Opsional)</label>
          <textarea 
            placeholder="contoh: 'fokus cek kenapa budget makanan saya selalu jebol minggu ini...'" 
            value={customPrompt} 
            onChange={e => setCustomPrompt(e.target.value)}
            style={{ background: C.surface, color: C.text, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, width: "100%", height: 60, resize: "none", outline: "none", fontFamily: C.mono }}
          />
        </div>

        <button onClick={runAnalysis} disabled={loading} style={{ width: "100%", background: loading ? C.sageCard : C.accent, color: loading ? C.muted : "#000", border: "none", borderRadius: 8, padding: "12px 16px", fontWeight: 800, cursor: loading ? "wait" : "pointer", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" }}>
          {loading ? "ANALYZING..." : "GENERATE NEW REPORT"}
        </button>
      </div>

      {error && (
        <div style={{ background: C.danger + "22", border: `1px solid ${C.danger}44`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <p style={{ margin: "0 0 4px", color: C.dangerLight, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>Error Detected</p>
          <p style={{ margin: 0, color: C.dangerLight, fontSize: 13, fontFamily: C.mono }}>{error}</p>
        </div>
      )}

      {analyses.length === 0 && <p style={{ textAlign: "center", color: C.muted, fontSize: 12, padding: "20px 0" }}>Belum ada laporan analisis.</p>}
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        {analyses.map((a: any) => (
          <div key={a._id} onClick={() => setViewingReport(a)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, cursor: "pointer", position: "relative", transition: "transform 0.1s" }}>
            <div style={{ position: "absolute", right: 8, top: 8, display: "flex", gap: 6 }}>
              <button onClick={(e) => { e.stopPropagation(); reEvaluateAnalysis(a._id); }} disabled={updatingId === a._id} style={{ width: 26, height: 26, borderRadius: "50%", background: C.surface, border: `1px solid ${C.border}`, color: C.accent, cursor: "pointer", fontSize: 14 }}>
                {updatingId === a._id ? "..." : "⟳"}
              </button>
              <button onClick={(e) => deleteAnalysis(e, a._id)} style={{ width: 26, height: 26, borderRadius: "50%", background: C.danger, border: "none", color: "#fff", cursor: "pointer", fontSize: 14 }}>×</button>
            </div>

            <div style={{ paddingRight: 60 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 9, background: C.accent+"22", color: C.accent, padding: "2px 6px", borderRadius: 4, fontWeight: 800 }}>{a.timeframe} VIEW</span>
                <span style={{ fontSize: 10, color: C.muted }}>{new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <p style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: C.text }}>AI Financial Report</p>
              
              <div style={{ display: "flex", gap: 16, borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                <div>
                  <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: "uppercase" }}>Net Worth</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: C.mono, color: C.text }}>{formatCurrency(a.netWorthUSD, currency)}</p>
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 9, color: C.muted, textTransform: "uppercase" }}>Savings Rate</p>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, fontFamily: C.mono, color: a.incomeUSD > a.expenseUSD ? C.success : C.danger }}>
                    {a.incomeUSD > 0 ? Math.round(((a.incomeUSD - a.expenseUSD) / a.incomeUSD) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingReport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20, backdropFilter: "blur(4px)" }}>
          {/* overflow: hidden ditambah disini agar background header tidak keluar dari border radius */}
          <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 750, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.8)", overflow: "hidden" }}>
            
            {/* flexWrap: wrap ditambah agar kalau layarnya sempit, tombolnya turun ke bawah dan tidak nabrak border */}
            <div style={{ background: C.sageCard, padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: "1 1 auto", minWidth: 200 }}>
                <p style={{ margin: 0, fontSize: 11, color: C.accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 800 }}>ZENITH AI REPORT • {viewingReport.timeframe}</p>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: C.muted }}>{new Date(viewingReport.createdAt).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                <button onClick={() => reEvaluateAnalysis(viewingReport._id)} disabled={updatingId === viewingReport._id} style={{ background: "transparent", border: `1px solid ${C.border}`, color: C.text, padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 800, cursor: updatingId === viewingReport._id ? "wait" : "pointer", transition: "0.2s" }}>
                  {updatingId === viewingReport._id ? "⏳ RE-THINKING..." : "⟳ RE-EVALUATE"}
                </button>
                <button onClick={() => setViewingReport(null)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 26, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}>&times;</button>
              </div>
            </div>

            <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
              {renderMd(viewingReport.reportMarkdown)}
            </div>
          </div>
        </div>
      )}

      {debugOutput && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20, backdropFilter: "blur(4px)" }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, width: "100%", maxWidth: 800, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 40px rgba(0,0,0,0.8)" }}>
            <div style={{ background: C.surface, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}` }}>
              <p style={{ margin: 0, fontSize: 12, color: C.accent, letterSpacing: 1, textTransform: "uppercase", fontWeight: 800 }}>system debug: available api models</p>
              <button onClick={() => setDebugOutput(null)} style={{ background: "transparent", border: "none", color: C.muted, fontSize: 24, cursor: "pointer" }}>×</button>
            </div>
            <div style={{ padding: "20px", overflowY: "auto", flex: 1, fontFamily: C.mono, fontSize: 13, color: C.text, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
              {debugOutput}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



// 1. Variabel ini sekarang KITA KUNCI MATI (Gunakan const, bukan let)
const DYNAMIC_RATE = 17000; 

const formatCurrency = (value: number, currency: string) => {
  if (currency === "IDR") {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      maximumFractionDigits: 0 
    }).format(value * DYNAMIC_RATE);
  }
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(value);
};

// Fungsi Pintar untuk Menghitung Level dari Total XP Milestone
const calculateLevel = (milestones: any[], assets: any[]) => {
  if (!milestones || !assets) return 1;

  const currentNetWorth = assets.reduce((s: any, a: any) => s + (a.currentPrice || 0) * (a.quantity || 0), 0);
  const currentCrypto = assets.filter((a:any) => a.assetClass === "CRYPTO").reduce((s: any, a: any) => s + (a.currentPrice || 0) * (a.quantity || 0), 0);
  const currentStock = assets.filter((a:any) => a.assetClass === "STOCK").reduce((s: any, a: any) => s + (a.currentPrice || 0) * (a.quantity || 0), 0);
  const currentGold = assets.filter((a:any) => a.assetClass === "COMMODITY").reduce((s: any, a: any) => s + (a.currentPrice || 0) * (a.quantity || 0), 0);

  const getProgress = (type: string, target: number) => {
    let current = 0;
    if (type === "NET_WORTH") current = currentNetWorth;
    if (type === "ASSET_CRYPTO") current = currentCrypto;
    if (type === "ASSET_STOCK") current = currentStock;
    if (type === "ASSET_GOLD") current = currentGold;
    return Math.min(100, Math.round((current / target) * 100));
  };

  let totalXP = 0;
  milestones.forEach((m: any) => {
    const progressPct = getProgress(m.type, m.targetValue);
    if (progressPct >= 100 && m.trophy?.xpReward) {
      totalXP += m.trophy.xpReward;
    }
  });

  return Math.floor(Math.sqrt(totalXP / 100)) + 1;
};

const NAV = [
  { id: "dashboard", icon: "◈", label: "Dashboard" },
  { id: "assets", icon: "◆", label: "Assets" },
  { id: "budgets", icon: "▦", label: "Budgets" }, // <--- TAMBAHKAN HURUF 's' DI SINI (id dan label)
  { id: "transactions", icon: "↕", label: "Transactions" },
  { id: "milestones", icon: "⚡", label: "Milestones" },
  { id: "ai", icon: "✦", label: "AI Analyst" },
];

import { useUser } from "@clerk/nextjs";

export default function DashboardPage() {
  type TimeFrame = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | "CUSTOM";
  const { user } = useUser(); // Ambil data user yang login
  const [currency, setCurrency] = useState<"USD" | "IDR">("USD");
  const [active, setActive] = useState("dashboard");
  
  
  const [assets, setAssets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);

  const [timeFrame, setTimeFrame] = useState<TimeFrame>("MONTHLY");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const [analyses, setAnalyses] = useState<any[]>([]);

  const filteredTransactions = transactions.filter((t: any) => {
  const tDate = new Date(t.date);
  const now = new Date();
  
  if (timeFrame === "DAILY") return tDate.toDateString() === now.toDateString();
  if (timeFrame === "WEEKLY") {
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);
    return tDate >= weekAgo;
  }
  if (timeFrame === "MONTHLY") return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
  if (timeFrame === "YEARLY") return tDate.getFullYear() === now.getFullYear();
  if (timeFrame === "CUSTOM" && customRange.start && customRange.end) {
    return tDate >= new Date(customRange.start) && tDate <= new Date(customRange.end);
  }
  return true;
  });
  // PASTIKAN STATE INI BERADA DI LUAR useEffect (Sejajar dengan state assets, dll)
  const [isRateLoaded, setIsRateLoaded] = useState(true); // Langsung set true karena kurs sudah pasti 17.000

  useEffect(() => {
    // fungsi fetch paralel
    const fetchAllData = async () => {
      try {
        const reqOptions = { cache: 'no-store' as RequestCache };

        // perbaikan: hapus fetch market IDR=X dari array ini
        const [assetsRes, transRes, budgetsRes, milesRes, analysisRes] = await Promise.all([
          fetch('/api/assets', reqOptions),
          fetch('/api/transactions', reqOptions),
          fetch('/api/budgets', reqOptions),
          fetch('/api/milestones', reqOptions),
          fetch('/api/analysis', reqOptions) 
        ]);

        // langsung set true karena kurs sudah pasti (17.000 atau sesuai const kamu)
        setIsRateLoaded(true);

        if (assetsRes.ok) setAssets(await assetsRes.json());
        if (transRes.ok) setTransactions(await transRes.json());
        if (budgetsRes.ok) setBudgets(await budgetsRes.json());
        if (milesRes.ok) setMilestones(await milesRes.json());
        if (analysisRes && analysisRes.ok) setAnalyses(await analysisRes.json());
      } catch (error) {
        console.error("gagal menarik data dari database:", error);
      }
    };

    fetchAllData();
  }, []);



  return (
    <div className="flex min-h-screen font-sans bg-[#0A0A0B] text-[#E8EDE5]">
      
      {/* 1. LEFT SIDEBAR (Tetap sempit di HP, melebar di layar Desktop) */}
      <div className="w-[72px] lg:w-[260px] shrink-0 flex flex-col pt-6 border-r border-[#2A3530] bg-[#111713] h-screen sticky top-0 transition-all duration-300">
        
        {/* Logo Utama */}
        <div className="flex items-center justify-center lg:justify-start lg:px-7 mb-10 gap-4">
          <div style={{ width: 34, height: 34, background: C.accent, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: "#000", fontFamily: C.mono }}>Z</span>
          </div>
          {/* Teks ZENITH hanya muncul di Desktop (lg) */}
          <span className="hidden lg:block text-2xl font-black tracking-widest text-[#E8EDE5]">ZENITH</span>
        </div>

        {/* Menu Navigasi */}
        <div className="flex flex-col gap-2 px-0 lg:px-4">
          {NAV.map(n => (
            <button 
              key={n.id} 
              onClick={() => setActive(n.id)} 
              title={n.label} 
              // Lebar w-[44px] di HP, menjadi melar penu w-full di Desktop
              className={`flex items-center justify-center lg:justify-start gap-4 h-[44px] w-[44px] lg:w-full rounded-xl mx-auto lg:mx-0 transition-all duration-200 lg:px-4
                ${active === n.id 
                  ? 'bg-[#C8FF00]/15 border border-[#C8FF00]/30 text-[#C8FF00]' 
                  : 'bg-transparent border border-transparent text-[#5A6E60] hover:text-[#C8D5B9] hover:bg-[#1C2420]'
                }`}
            >
              <span className="text-[18px]">{n.icon}</span>
              {/* Nama menu hanya muncul di Desktop (lg) */}
              <span className="hidden lg:block text-[12px] font-bold tracking-widest uppercase">{n.label}</span>
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />
        
        {/* Area Bawah: Currency Slider & User Profile */}
        <div className="mt-auto mb-6 flex flex-col items-center lg:items-start lg:px-6 gap-5">
          
          {/* Currency Toggle Slider */}
          <div className="flex bg-[#1C2420] rounded-full p-1 border border-[#2A3530] w-[52px] lg:w-full mx-auto lg:mx-0">
            <button 
              onClick={() => setCurrency("USD")} 
              className={`flex-1 rounded-full text-[11px] font-black py-1.5 transition-all ${currency === "USD" ? "bg-[#C8FF00] text-black shadow-sm" : "text-[#5A6E60] hover:text-white"}`}
            >
              $
            </button>
            <button 
              onClick={() => setCurrency("IDR")} 
              className={`flex-1 rounded-full text-[11px] font-black py-1.5 transition-all ${currency === "IDR" ? "bg-[#C8FF00] text-black shadow-sm" : "text-[#5A6E60] hover:text-white"}`}
            >
              Rp
            </button>
          </div>

          {/* User Profile Clerk */}
          <div className="flex items-center gap-3">
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs text-[#E8EDE5] font-bold">My Account</span>
              <span className="text-[10px] text-[#5A6E60]">Settings & Logout</span>
            </div>
          </div>
        </div>

      </div>

      {/* 2. CENTER CONTENT (Lebar dinamis mengikuti layar) */}
      <div className="flex-1 overflow-y-auto">
        
        {/* CONTAINER INDUK: Mengatur semua lebar, padding, dan jarak bawah (pb-24) */}
        <div className="w-full max-w-md md:max-w-2xl lg:max-w-5xl mx-auto p-6 md:p-10 pb-24 transition-all duration-500">
          
          {active === "dashboard" && (
            <> {/* Cukup gunakan fragment kosong karena lebarnya sudah diurus Induk */}
              <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} custom={customRange} setCustom={setCustomRange} />
              <DashboardOverview 
                assets={assets} 
                transactions={filteredTransactions} 
                user={{ name: user?.fullName || "User", level: calculateLevel(milestones, assets) }} 
                currency={currency} 
              />
            </>
          )}

          {active === "transactions" && (
            <>
              <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} custom={customRange} setCustom={setCustomRange} />
              <TransactionsModule 
                transactions={filteredTransactions} 
                setTransactions={setTransactions} 
                assets={assets} 
                setAssets={setAssets} 
                currency={currency} 
              />
            </>
          )}

          {active === "assets" && (
            <>
              <AssetsModule 
                assets={assets} 
                setAssets={setAssets} 
                currency={currency} 
              />
            </>
          )}

          {active === "budgets" && (
            <>
              {/* Tambahkan TimeFrameSelector di atas Budget */}
              <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} custom={customRange} setCustom={setCustomRange} />
              
              <BudgetsModule 
                budgets={budgets} 
                setBudgets={setBudgets} 
                
                // OPER DATA INI AGAR BUDGET BISA DIHITUNG DINAMIS
                transactions={filteredTransactions} 
                timeFrame={timeFrame}
                customRange={customRange}
                
                currency={currency} 
              />
            </>
          )}

          {active === "milestones" && (
            <>
              <MilestonesModule 
                milestones={milestones} 
                setMilestones={setMilestones} 
                
                // Tambahkan dua baris ini agar mesin Quest bisa membaca sejarah aslimu:
                transactions={transactions} 
                budgets={budgets}
                
                assets={assets} 
                currency={currency} 
              />
            </>
          )}

          {active === "ai" && (
            <>
              {/* INI YANG BIKIN MUNCUL PILIHAN WEEKLY, MONTHLY, DLL */}
              <TimeFrameSelector selected={timeFrame} onChange={setTimeFrame} custom={customRange} setCustom={setCustomRange} />
              
              <AIModule 
                assets={assets}
                transactions={filteredTransactions} // Transaksi akan otomatis terfilter sesuai timeframe yang dipilih!
                budgets={budgets}
                milestones={milestones}
                analyses={analyses}         
                setAnalyses={setAnalyses}   
                timeFrame={timeFrame}       
                currency={currency}
              />
            </>
          )}
        </div>
      </div>

    </div>
  );
}