import { useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import {
  ArrowLeft,
  ShieldCheck,
  Upload,
  Image as ImageIcon,
  X,
  Sparkles,
  Package,
  FileText,
  ChevronDown,
  Loader2,
  BrainCircuit,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

function ReportItem() {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const [identity, setIdentity] = useState(null);
  const [generatingIdentity, setGeneratingIdentity] = useState(false);

  const [error, setError] = useState("");

  // ===============================
  // IMAGE SELECT
  // ===============================

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setAnalysis(null);
    setIdentity(null);

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ===============================
  // REMOVE IMAGE
  // ===============================

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setIdentity(null);
    setError("");
  };

  // ===============================
  // AI ANALYSIS
  // ===============================

  const analyzeItem = async () => {
    if (!image) {
      setError("Please upload an item image first.");
      return;
    }

    setAnalyzing(true);
    setAnalysis(null);
    setIdentity(null);
    setError("");

    try {
      const formData = new FormData();

      formData.append("image", image);

      const response = await fetch(
        "http://localhost:5000/api/analyze-item",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "AI analysis failed."
        );
      }

      setAnalysis(data.analysis);
    } catch (error) {
      console.error("AI analysis error:", error);

      setError(
        error.message ||
          "Unable to connect to SafeReturn AI backend."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ===============================
  // CREATE SAFERETURN IDENTITY
  // ===============================

 const createSafeReturnIdentity = async () => {
  if (!analysis) {
    setError("Please analyze the item first.");
    return;
  }

  setGeneratingIdentity(true);
  setError("");

  try {
  const token = localStorage.getItem("safereturn_token");

  if (!token) {
    setError("Please sign in before registering an item.");
    return;
  }

  const response = await fetch(
    "http://localhost:5000/api/identities",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        itemName,
        category,
        description,
        imageName: image?.name || "",
        analysis,
      }),
    }
  );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Unable to create SafeReturn identity."
      );
    }

    const safeReturnId = data.identity.id;

    // Local development URL for now
    const qrUrl = `${window.location.origin}/item/${safeReturnId}`;

    const qrCode = await QRCode.toDataURL(qrUrl, {
      width: 320,
      margin: 2,
      color: {
        dark: "#020617",
        light: "#ffffff",
      },
    });

    const identityData = {
      ...data.identity,
      qrCode,
    };

    setIdentity(identityData);
  } catch (error) {
    console.error(
      "Identity generation error:",
      error
    );

    setError(
      error.message ||
        "Unable to create SafeReturn identity."
    );
  } finally {
    setGeneratingIdentity(false);
  }
};

  // ===============================
  // FORM SUBMIT
  // ===============================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!itemName.trim()) {
      setError("Please enter the item name.");
      return;
    }

    if (!category) {
      setError("Please select an item category.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter an item description.");
      return;
    }

    if (!image) {
      setError("Please upload an item image.");
      return;
    }

    await analyzeItem();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* ===============================
          NAVBAR
      =============================== */}

      <nav className="border-b border-white/10 bg-[#020617]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <ShieldCheck
                className="text-cyan-400"
                size={23}
              />
            </div>

            <div>
              <h1 className="text-xl font-bold">
                Safe<span className="text-cyan-400">
                  Return
                </span>
              </h1>

              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
                Smart Lost & Found
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Back Home
          </Link>
        </div>
      </nav>

      {/* ===============================
          MAIN
      =============================== */}

      <main className="mx-auto max-w-5xl px-6 py-14">
        {/* HEADER */}

        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 ring-1 ring-cyan-400/20">
            <Package size={28} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Register Your Item
          </p>

          <h1 className="mt-4 text-4xl font-black sm:text-5xl">
            Give your item a{" "}
            <span className="text-cyan-400">
              safe identity.
            </span>
          </h1>

          <p className="mt-5 leading-7 text-slate-400">
            Add your item details and image. SafeReturn AI
            will analyze the image and create useful visual
            characteristics for future recovery.
          </p>
        </div>

        {/* ===============================
            FORM
        =============================== */}

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-12 max-w-3xl rounded-3xl border border-white/10 bg-white/[0.025] p-6 shadow-2xl sm:p-8"
        >
          {/* PROGRESS */}

          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400 text-sm font-bold text-slate-950">
              1
            </div>

            <div className="h-px flex-1 bg-white/10" />

            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                analysis
                  ? "border-cyan-400 bg-cyan-400 text-slate-950"
                  : "border-white/10 text-slate-600"
              }`}
            >
              2
            </div>

            <div className="h-px flex-1 bg-white/10" />

            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                identity
                  ? "border-cyan-400 bg-cyan-400 text-slate-950"
                  : "border-white/10 text-slate-600"
              }`}
            >
              3
            </div>
          </div>

          {/* ITEM NAME */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Item Name
            </label>

            <div className="relative">
              <Package
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
              />

              <input
                type="text"
                value={itemName}
                onChange={(event) =>
                  setItemName(event.target.value)
                }
                placeholder="Example: Fire-Boltt Aero"
                className="w-full rounded-xl border border-white/10 bg-[#07111f] py-3.5 pl-11 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* CATEGORY */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Item Category
            </label>

            <div className="relative">
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value)
                }
                className="w-full appearance-none rounded-xl border border-white/10 bg-[#07111f] px-4 py-3.5 text-white outline-none focus:border-cyan-400/50"
              >
                <option
                  value=""
                  className="bg-[#07111f]"
                >
                  Select category
                </option>

                <option value="Phone">Phone</option>
                <option value="Laptop">Laptop</option>
                <option value="Tablet">Tablet</option>
                <option value="Earbuds">Earbuds</option>
                <option value="Smartwatch">
                  Smartwatch
                </option>
                <option value="Document">Document</option>
                <option value="Keys">Keys</option>
                <option value="Bag">Bag</option>
                <option value="Other">Other</option>
              </select>

              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="mt-6">
            <label className="mb-2 block text-sm font-semibold text-slate-200">
              Item Description
            </label>

            <div className="relative">
              <FileText
                size={18}
                className="absolute left-4 top-4 text-slate-500"
              />

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                placeholder="Describe your item. Example: Peacock blue Fire-Boltt Aero earbuds with an oval-shaped charging case."
                rows={5}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#07111f] py-3.5 pl-11 pr-4 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
              />
            </div>
          </div>

          {/* IMAGE UPLOAD */}

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-200">
                Item Image
              </label>

              <span className="text-xs text-slate-600">
                JPG, PNG, WEBP • Max 5MB
              </span>
            </div>

            {!imagePreview ? (
              <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#07111f] px-6 py-12 text-center transition hover:border-cyan-400/40 hover:bg-cyan-400/[0.03]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400 transition group-hover:scale-105">
                  <Upload size={25} />
                </div>

                <h3 className="mt-5 font-semibold">
                  Upload your item image
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Choose a clear photo of the item
                </p>

                <span className="mt-5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
                  Choose Image
                </span>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#07111f]">
                <img
                  src={imagePreview}
                  alt="Selected item"
                  className="max-h-[420px] w-full object-contain"
                />

                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-black/70 text-white backdrop-blur transition hover:bg-red-500/80"
                >
                  <X size={19} />
                </button>

                <div className="absolute bottom-0 left-0 right-0 bg-black/70 px-5 py-3 backdrop-blur">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <ImageIcon
                      size={16}
                      className="text-cyan-400"
                    />

                    {image?.name}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ERROR */}

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] p-4 text-sm text-red-300">
              <AlertCircle
                size={18}
                className="mt-0.5 shrink-0"
              />

              <p>{error}</p>
            </div>
          )}

          {/* AI INFO */}

          <div className="mt-7 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-5">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Sparkles size={20} />
              </div>

              <div>
                <h3 className="font-semibold text-cyan-300">
                  AI-powered item analysis
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Gemini AI will analyze the uploaded image and
                  identify the item's type, brand, color, shape,
                  visual characteristics and confidence.
                </p>
              </div>
            </div>
          </div>

          {/* ANALYZE BUTTON */}

          <button
            type="submit"
            disabled={analyzing}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {analyzing ? (
              <>
                <Loader2
                  size={20}
                  className="animate-spin"
                />

                Analyzing Item...
              </>
            ) : (
              <>
                <BrainCircuit size={20} />

                Analyze With SafeReturn AI
              </>
            )}
          </button>

          {/* ===============================
              AI RESULT
          =============================== */}

          {analysis && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-cyan-400/20 bg-[#07111f]">
              {/* RESULT HEADER */}

              <div className="border-b border-white/10 bg-cyan-400/[0.04] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                    <Sparkles size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-white">
                      AI Analysis Complete
                    </h2>

                    <p className="text-xs text-slate-500">
                      SafeReturn Gemini Vision Analysis
                    </p>
                  </div>

                  <CheckCircle2
                    size={22}
                    className="ml-auto text-green-400"
                  />
                </div>
              </div>

              {/* RESULT CONTENT */}

              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Item Type
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {analysis.itemType || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Brand
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {analysis.brand || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Main Color
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {analysis.color || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Shape
                  </p>

                  <p className="mt-2 text-lg font-semibold text-white">
                    {analysis.shape || "Unknown"}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:col-span-2">
                  <p className="text-xs uppercase tracking-wider text-slate-600">
                    Visual Details
                  </p>

                  <p className="mt-2 leading-7 text-slate-300">
                    {analysis.visualDetails ||
                      "No additional details identified."}
                  </p>
                </div>

                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs uppercase tracking-wider text-slate-600">
                      AI Confidence
                    </p>

                    <p className="font-bold text-cyan-400">
                      {Number.isFinite(
                        Number(analysis.confidence)
                      )
                        ? `${Math.round(
                            Number(analysis.confidence)
                          )}%`
                        : "N/A"}
                    </p>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-cyan-400 transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Number(analysis.confidence) || 0
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* ===============================
                  SAFE RETURN IDENTITY
              =============================== */}

              <div className="border-t border-white/10 p-5">
                {!identity ? (
                  <div>
                    <div className="flex gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-cyan-400"
                      />

                      <div>
                        <p className="font-semibold text-cyan-300">
                          AI identity information ready
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          Your item has been analyzed successfully.
                          Create a unique SafeReturn identity and
                          QR code for this item.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={createSafeReturnIdentity}
                      disabled={generatingIdentity}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {generatingIdentity ? (
                        <>
                          <Loader2
                            size={20}
                            className="animate-spin"
                          />

                          Creating SafeReturn Identity...
                        </>
                      ) : (
                        <>
                          <ShieldCheck size={20} />

                          Create SafeReturn Identity
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* SUCCESS */}

                    <div className="rounded-xl border border-green-400/20 bg-green-400/[0.04] p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2
                          size={22}
                          className="text-green-400"
                        />

                        <div>
                          <p className="font-semibold text-green-300">
                            SafeReturn Identity Created
                          </p>

                          <p className="text-sm text-slate-500">
                            Your item now has a secure digital identity.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ID + QR */}

                    <div className="grid gap-6 rounded-2xl border border-white/10 bg-[#020617] p-6 md:grid-cols-2">
                      {/* QR */}

                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-2xl bg-white p-4">
                          <img
                            src={identity.qrCode}
                            alt="SafeReturn QR Code"
                            className="h-56 w-56"
                          />
                        </div>

                        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-600">
                          Scan to reconnect
                        </p>
                      </div>

                      {/* DETAILS */}

                      <div className="flex flex-col justify-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
                          SafeReturn ID
                        </p>

                        <p className="mt-2 text-3xl font-black tracking-wider text-cyan-400">
                          {identity.id}
                        </p>

                        <div className="mt-6 space-y-4">
                          <div>
                            <p className="text-xs text-slate-600">
                              Registered Item
                            </p>

                            <p className="mt-1 font-semibold">
                              {identity.itemName}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-600">
                              AI Classification
                            </p>

                            <p className="mt-1 font-semibold">
                              {identity.analysis.itemType}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-600">
                              AI Confidence
                            </p>

                            <p className="mt-1 font-semibold text-cyan-400">
                              {Math.round(
                                Number(
                                  identity.analysis.confidence
                                ) || 0
                              )}
                              %
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* PRIVACY NOTICE */}

                    <div className="flex gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4">
                      <ShieldCheck
                        size={20}
                        className="mt-0.5 shrink-0 text-cyan-400"
                      />

                      <p className="text-sm leading-6 text-slate-500">
                        Your QR code contains a SafeReturn identity
                        link. It does not directly expose your personal
                        phone number, email or address.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

export default ReportItem;