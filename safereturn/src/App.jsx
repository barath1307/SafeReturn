import { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  QrCode,
  Search,
  Smartphone,
  Lock,
  BrainCircuit,
  ArrowRight,
  CheckCircle2,
  ScanLine,
  KeyRound,
  MessageCircle,
  Bell,
  X,
} from "lucide-react";

import ReportItem from "./pages/ReportItem";
import ScanQR from "./pages/ScanQR";
import Login from "./pages/Login";
import Register from "./pages/Register";
import HowItWorks from "./pages/HowItWorks";
import Features from "./pages/Features";
import FinderItem from "./pages/FinderItem";
import OwnerDashboard from "./pages/OwnerDashboard";

// ===============================
// HOME PAGE
// ===============================

function Home() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [showTrackStatus, setShowTrackStatus] = useState(false);
  const [trackingId, setTrackingId] = useState("");
  const [trackingStatus, setTrackingStatus] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("safereturn_user")) || null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem("safereturn_token");
    localStorage.removeItem("safereturn_user");
    setUser(null);
    navigate("/");
  };
  const fetchNotifications = async () => {
  const token = localStorage.getItem("safereturn_token");

  if (!token) {
    setNotifications([]);
    setUnreadCount(0);
    return;
  }

  try {
    const response = await fetch("https://safereturn-pwra.onrender.com/api/notifications", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load notifications.");
    }

    setNotifications(data.notifications || []);
    setUnreadCount(data.unreadCount || 0);
    setNotificationError("");
  } catch (error) {
    console.error("Notifications fetch error:", error);
    setNotificationError("Unable to load notifications.");
  }
};
useEffect(() => {
  if (!user) return;

  fetchNotifications();

  const interval = setInterval(fetchNotifications, 30000);

  return () => clearInterval(interval);
}, [user]);
const handleTrackStatus = async (event) => {
  event.preventDefault();

  const id = trackingId.trim();

  if (!id) {
    setTrackingError("Please enter your Request ID.");
    return;
  }

  try {
    setTrackingLoading(true);
    setTrackingError("");
    setTrackingStatus(null);

    const response = await fetch(
      `https://safereturn-pwra.onrender.com/api/contact-request-status/${encodeURIComponent(id)}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Request not found.");
    }

    setTrackingStatus(data.request);
  } catch (error) {
    setTrackingError(error.message || "Unable to check request status.");
  } finally {
    setTrackingLoading(false);
  }
};
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#020617]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <ShieldCheck className="text-cyan-400" size={24} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-tight">
                Safe<span className="text-cyan-400">Return</span>
              </h1>

              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Smart Lost & Found
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          {/* Desktop Menu */}
<div className="hidden items-center gap-8 md:flex">
  <Link
    to="/how-it-works"
    className="text-sm text-slate-400 transition hover:text-white"
  >
    How It Works
  </Link>

  <Link
    to="/features"
    className="text-sm text-slate-400 transition hover:text-white"
  >
    Features
  </Link>

  {user ? (
    <>
    <button
  type="button"
  onClick={() => {
    setShowNotifications((previous) => !previous);
    fetchNotifications();
  }}
  className="relative rounded-xl border border-white/10 p-2.5 text-slate-300 transition hover:border-cyan-400/30 hover:text-cyan-300"
  aria-label="Notifications"
>
  <Bell size={20} />

  {unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</button>
      <span className="text-sm font-semibold text-cyan-300">
        Hi, {user.name?.split(" ")[0] || "User"}!
      </span>

      <Link
        to="/owner-dashboard"
        className="rounded-xl border border-cyan-400/30 px-4 py-2.5 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/10"
      >
        Dashboard
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10"
      >
        Logout
      </button>
    </>
  ) : (
    <Link
      to="/login"
      className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/20"
    >
      Sign In
    </Link>
  )}
</div>

          {/* Mobile Sign In */}
          {/* Mobile User Menu */}
<div className="flex items-center gap-2 md:hidden">
  {user ? (
    <>
      <Link
        to="/owner-dashboard"
        className="rounded-lg border border-cyan-400/30 px-3 py-2 text-sm text-cyan-300"
      >
        Dashboard
      </Link>

      <button
        type="button"
        onClick={handleLogout}
        className="rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300"
      >
        Logout
      </button>
    </>
  ) : (
    <Link
      to="/login"
      className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-300"
    >
      Sign In
    </Link>
  )}
</div>

  </div>
  </nav>
{showNotifications && user && (
  <div className="fixed right-4 top-20 z-[60] w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[#07111f] shadow-2xl sm:right-8">
    <div className="flex items-center justify-between border-b border-white/10 p-4">
      <div>
        <h3 className="font-bold text-white">Notifications</h3>
        <p className="mt-1 text-xs text-slate-400">
          {unreadCount} pending request{unreadCount === 1 ? "" : "s"}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setShowNotifications(false)}
        className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white"
        aria-label="Close notifications"
      >
        <X size={18} />
      </button>
    </div>

    {notificationError && (
      <p className="p-4 text-sm text-red-400">{notificationError}</p>
    )}

    <div className="max-h-96 overflow-y-auto">
      {notifications.length === 0 ? (
        <p className="p-5 text-sm text-slate-400">
          No contact requests yet.
        </p>
      ) : (
        notifications.map((notification) => (
          <button
            key={notification.id}
            type="button"
            onClick={() => {
              setShowNotifications(false);
              navigate("/owner-dashboard");
            }}
            className="block w-full border-b border-white/5 p-4 text-left transition hover:bg-white/5"
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                  notification.status === "Pending"
                    ? "bg-cyan-400"
                    : "bg-slate-600"
                }`}
              />

              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {notification.message}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  From: {notification.finderName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {notification.safeReturnId} · {notification.status}
                </p>

                {notification.createdAt && (
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))
      )}
    </div>

    <button
      type="button"
      onClick={() => {
        setShowNotifications(false);
        navigate("/owner-dashboard");
      }}
      className="w-full border-t border-white/10 p-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-400/5"
    >
      Open Owner Dashboard
    </button>
  </div>
)}
      {/* ===============================
          HERO SECTION
      =============================== */}

      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 pb-24 pt-20 lg:grid-cols-2 lg:pt-28">
          {/* Hero Left */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-2 text-sm text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_12px_#22d3ee]" />
              Privacy-first lost & found
            </div>

            <h2 className="max-w-3xl text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Lost something?
              <br />

              <span className="text-cyan-400">Bring it back.</span>
            </h2>

            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">
              SafeReturn helps people reconnect with lost phones, laptops,
              documents, keys and other valuable items using secure QR
              identity, AI-powered matching and privacy-safe communication.
            </p>

            {/* Hero Buttons */}
            <div className="mt-9 flex flex-col gap-4 sm:flex-row">
              <Link
                to="/report"
                className="group flex items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Register Your Item

                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/scan"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                <ScanLine size={18} />

                Report Lost Item
              </Link>
            </div>
<button
  type="button"
  onClick={() => {
    setShowTrackStatus((previous) => !previous);
    setTrackingError("");
    setTrackingStatus(null);
  }}
  className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/5 px-6 py-3.5 font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
>
  <Search size={18} />
  Track Request Status
</button>
{showTrackStatus && (
  <div className="mt-5 max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-5">
    <h3 className="text-lg font-bold">Track Your Request</h3>

    <p className="mt-2 text-sm leading-6 text-slate-400">
      Enter the Request ID you received after contacting the owner.
    </p>

    <form onSubmit={handleTrackStatus} className="mt-4 space-y-3">
      <input
        type="text"
        value={trackingId}
        onChange={(event) => setTrackingId(event.target.value)}
        placeholder="Enter your Request ID"
        className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
      />

      <button
        type="submit"
        disabled={trackingLoading}
        className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
      >
        {trackingLoading ? "Checking..." : "Search Status"}
      </button>
    </form>

    {trackingError && (
      <p className="mt-3 text-sm text-red-400">{trackingError}</p>
    )}

    {trackingStatus && (
      <div className="mt-4 rounded-xl border border-white/10 bg-[#020617] p-4">
        <p className="text-xs uppercase tracking-wider text-slate-500">
          Request ID
        </p>

        <p className="mt-1 break-all font-semibold text-cyan-400">
          {trackingStatus.requestId}
        </p>

        <p className="mt-4 text-sm text-slate-400">Current Status</p>

        <span
          className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
            trackingStatus.status === "Resolved"
              ? "bg-green-400/10 text-green-400"
              : trackingStatus.status === "Reviewed"
              ? "bg-blue-400/10 text-blue-400"
              : "bg-yellow-400/10 text-yellow-400"
          }`}
        >
          {trackingStatus.status}
        </span>

        <p className="mt-3 text-xs text-slate-500">
          SafeReturn ID: {trackingStatus.safeReturnId}
        </p>
      </div>
    )}
  </div>
)}
            {/* Hero Highlights */}
            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Privacy protected
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cyan-400" />
                AI assisted
              </span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Secure verification
              </span>
            </div>
          </div>

          {/* Hero Right */}
          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute inset-0 rounded-[2rem] bg-cyan-400/10 blur-3xl" />

            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-3xl border border-cyan-400/20 bg-[#07111f] p-8">
                {/* QR Icon */}
                <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/5">
                  <QrCode
                    size={78}
                    strokeWidth={1.2}
                    className="text-cyan-400"
                  />
                </div>

                <div className="mt-7 text-center">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    SafeReturn Identity
                  </p>

                  <h3 className="mt-2 text-xl font-bold">
                    Scan to safely reconnect
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Personal information stays protected while the finder can
                    securely contact the owner.
                  </p>
                </div>

                {/* QR Features */}
                <div className="mt-7 grid grid-cols-3 gap-3">
                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <Lock size={18} className="mx-auto text-cyan-400" />

                    <p className="mt-2 text-[11px] text-slate-500">
                      Private
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <BrainCircuit
                      size={18}
                      className="mx-auto text-cyan-400"
                    />

                    <p className="mt-2 text-[11px] text-slate-500">
                      AI Match
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
                    <ShieldCheck
                      size={18}
                      className="mx-auto text-cyan-400"
                    />

                    <p className="mt-2 text-[11px] text-slate-500">
                      Verified
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===============================
          PROBLEM / SOLUTION
      =============================== */}

      <section className="border-y border-white/10 bg-white/[0.015] py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              The Problem
            </p>

            <h2 className="mt-4 text-3xl font-bold sm:text-4xl">
              Finding the owner shouldn't mean exposing their identity.
            </h2>

            <p className="mt-5 leading-7 text-slate-400">
              SafeReturn creates a secure bridge between the person who found
              an item and the person who lost it — without unnecessarily
              exposing phone numbers, addresses or other private information.
            </p>
          </div>
        </div>
      </section>

      {/* ===============================
          HOW IT WORKS
      =============================== */}

      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
              How It Works
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              From lost to returned in four steps.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                icon: Smartphone,
                title: "Register Item",
                text: "Register your valuable item and create its secure digital identity.",
              },

              {
                number: "02",
                icon: QrCode,
                title: "Attach QR",
                text: "Place the privacy-safe SafeReturn QR on the item.",
              },

              {
                number: "03",
                icon: ScanLine,
                title: "Finder Scans",
                text: "A finder scans the QR and gets a safe way to contact the owner.",
              },

              {
                number: "04",
                icon: ShieldCheck,
                title: "Verify & Return",
                text: "Ownership is verified before the item is safely returned.",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.number}
                  className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-1 hover:border-cyan-400/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                      <Icon size={22} />
                    </div>

                    <span className="text-sm font-bold text-slate-700">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold">
                    {step.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===============================
          FEATURES
      =============================== */}

      <section
        id="features"
        className="border-t border-white/10 bg-white/[0.01] py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Built For Real-World Recovery
              </p>

              <h2 className="mt-4 text-4xl font-bold sm:text-5xl">
                Smart enough to help.
                <br />
                Private enough to trust.
              </h2>
            </div>

            <p className="max-w-xl text-slate-400 lg:justify-self-end lg:text-right">
              SafeReturn combines modern web technology, QR identity,
              intelligent matching and secure communication into one simple
              lost-and-found experience.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: BrainCircuit,
                title: "AI Item Analysis",
                text: "Analyze uploaded item images and automatically generate useful item characteristics.",
              },

              {
                icon: Search,
                title: "Smart Matching",
                text: "Find potential matches using item details, images and relevant recovery information.",
              },

              {
                icon: Lock,
                title: "Privacy-Safe Identity",
                text: "Keep personal contact information protected while enabling communication.",
              },

              {
                icon: KeyRound,
                title: "Ownership Verification",
                text: "Use registered information and verification signals before completing a return.",
              },

              {
                icon: MessageCircle,
                title: "Secure Contact",
                text: "Allow finder and owner to communicate without immediately exposing private details.",
              },

              {
                icon: Smartphone,
                title: "Works Across Items",
                text: "Designed for phones, laptops, documents, keys and other valuable belongings.",
              },
            ].map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition hover:border-cyan-400/25 hover:bg-cyan-400/[0.03]"
                >
                  <Icon size={25} className="text-cyan-400" />

                  <h3 className="mt-5 text-lg font-bold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    {feature.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===============================
          CTA
      =============================== */}

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-8 sm:p-12">
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
                Start With SafeReturn
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Your item deserves a safe way home.
              </h2>
            </div>

            <Link
              to="/report"
              className="group flex shrink-0 items-center gap-2 rounded-xl bg-cyan-400 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Get Started

              <ArrowRight
                size={18}
                className="transition group-hover:translate-x-1"
              />
            </Link>
          </div>
        </div>
      </section>

      {/* ===============================
          FOOTER
      =============================== */}

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © 2026 Safe<span className="text-slate-400">Return</span>
          </p>

          <p>Privacy-first lost & found platform</p>
        </div>
      </footer>
    </div>
  );
}

// ===============================
// APP ROUTES
// ===============================
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("safereturn_token");

  if (!token) {
    return <Navigate to="/login" replace state={{ from: "/report" }} />;
  }

  return children;
}
function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
  path="/report"
  element={
    <ProtectedRoute>
      <ReportItem />
    </ProtectedRoute>
  }
/>
      <Route path="/item/:id" element={<FinderItem />} />
      <Route path="/scan" element={<ScanQR />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/features" element={<Features />} />
      <Route
  path="/owner-dashboard"
  element={<OwnerDashboard />}
/>
    </Routes>
  );
}

export default App;