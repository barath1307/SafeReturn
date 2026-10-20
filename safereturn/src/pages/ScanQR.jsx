import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import {
  ArrowLeft,
  Camera,
  Search,
  QrCode,
  ShieldCheck,
  AlertCircle,
  Loader2,
} from "lucide-react";

function ScanQR() {
  const navigate = useNavigate();

  const scannerRef = useRef(null);
  const startingRef = useRef(false);
  const handledRef = useRef(false);

  const [safeReturnId, setSafeReturnId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        scanner
          .stop()
          .catch((err) => console.warn("Scanner cleanup:", err));
      }

      scannerRef.current = null;
    };
  }, []);

  const openItem = async (value) => {
    const input = value.trim();

    if (!input) {
      setError("Please enter a SafeReturn ID or scan an item's QR code.");
      return;
    }

    let id = input;

    // QR code may contain a full SafeReturn URL.
    try {
      if (/^https?:\/\//i.test(input)) {
        const url = new URL(input);
        const match = url.pathname.match(/\/item\/([^/]+)/i);

        if (!match) {
          setError("This QR code is not a valid SafeReturn item link.");
          return;
        }

        id = decodeURIComponent(match[1]);
      } else {
        id = input.replace(/^\/?item\//i, "").replace(/\/$/, "");
      }
    } catch {
      setError("Invalid QR code or SafeReturn ID.");
      return;
    }

    id = id.trim();

    if (!id || id.includes("/")) {
      setError("Please enter a valid SafeReturn ID.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify that the item exists before opening its details.
      const response = await fetch(
        `http://localhost:5000/api/identities/${encodeURIComponent(id)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Item not found. Check the SafeReturn ID."
        );
      }

      await stopScanner();
      navigate(`/item/${encodeURIComponent(id)}`);
    } catch (err) {
      setError(
        err.message ||
          "Unable to find this item. Check your backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const startScanner = async () => {
    if (startingRef.current || scanning) return;

    startingRef.current = true;
    handledRef.current = false;
    setError("");
    setCameraError("");

    try {
      const scanner = new Html5Qrcode("safereturn-qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 230, height: 230 },
        },
        async (decodedText) => {
          if (handledRef.current) return;

          handledRef.current = true;
          setScanning(false);

          await openItem(decodedText);
        },
        () => {
          // Ignore temporary camera frames without a QR code.
        }
      );

      setScanning(true);
    } catch (err) {
      scannerRef.current = null;
      setCameraError(
        "Camera couldn't start. Allow camera permission or enter the SafeReturn ID below."
      );
      console.error("QR scanner error:", err);
    } finally {
      startingRef.current = false;
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;

    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch (err) {
        console.warn("Could not stop scanner:", err);
      }
    }

    scannerRef.current = null;
    setScanning(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await openItem(safeReturnId);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <nav className="border-b border-white/10 bg-[#020617]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <ShieldCheck size={23} className="text-cyan-400" />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Safe<span className="text-cyan-400">Return</span>
              </h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Smart Lost & Found
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back Home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-6 py-14">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
            <QrCode size={29} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Report Found Item
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Help an item{" "}
            <span className="text-cyan-400">find its owner.</span>
          </h1>

          <p className="mt-5 leading-7 text-slate-400">
            Scan the item's SafeReturn QR code or enter its SafeReturn ID
            to find the registered item and contact its owner.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Camera size={23} className="text-cyan-400" />
              <h2 className="text-xl font-bold">Scan QR Code</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Point your camera at the SafeReturn QR code attached to the item.
            </p>

            <div
              id="safereturn-qr-reader"
              className="mt-6 min-h-24 overflow-hidden rounded-xl border border-white/10 bg-[#07111f] p-2"
            />

            {cameraError && (
              <div className="mt-4 flex gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-sm text-amber-200">
                <AlertCircle size={18} className="shrink-0" />
                <p>{cameraError}</p>
              </div>
            )}

            <button
              type="button"
              onClick={scanning ? stopScanner : startScanner}
              disabled={startingRef.current || loading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              <Camera size={19} />
              {scanning ? "Stop Camera" : "Start QR Scanner"}
            </button>

            <p className="mt-3 text-xs leading-5 text-slate-500">
              Camera access is required to scan QR codes. If the camera
              doesn't work, use manual ID search.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <Search size={23} className="text-cyan-400" />
              <h2 className="text-xl font-bold">Search by SafeReturn ID</h2>
            </div>

            <p className="mt-3 text-sm leading-6 text-slate-400">
              Enter the ID printed below the item's QR code.
            </p>

            <form onSubmit={handleSubmit} className="mt-8">
              <label
                htmlFor="safeReturnId"
                className="mb-2 block text-sm font-semibold text-slate-200"
              >
                SafeReturn ID
              </label>

              <input
                id="safeReturnId"
                type="text"
                value={safeReturnId}
                onChange={(event) => {
                  setSafeReturnId(event.target.value);
                  setError("");
                }}
                placeholder="Example: SR-CF664DA9"
                className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3.5 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={19} className="animate-spin" />
                    Finding Item...
                  </>
                ) : (
                  <>
                    <Search size={19} />
                    Find Item
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
              <div className="flex gap-3">
                <ShieldCheck size={20} className="shrink-0 text-cyan-400" />
                <p className="text-sm leading-6 text-slate-400">
                  Owner contact details remain private. After finding the item,
                  use the Contact Owner option to send a message.
                </p>
              </div>
            </div>
          </section>
        </div>

        {error && (
          <div className="mx-auto mt-6 flex max-w-4xl gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300">
            <AlertCircle size={19} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default ScanQR;