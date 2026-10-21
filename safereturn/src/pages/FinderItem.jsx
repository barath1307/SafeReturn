import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ShieldCheck,
  Package,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

function FinderItem() {
  const { id } = useParams();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Contact Owner states
  const [showContact, setShowContact] = useState(false);
  const [finderName, setFinderName] = useState("");
  const [finderContact, setFinderContact] = useState("");
  const [finderMessage, setFinderMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [requestStatus, setRequestStatus] = useState("");
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Prefill the contact form from the signed-in account, if present.
  useEffect(() => {
    try {
      const savedUser = JSON.parse(localStorage.getItem("safereturn_user") || "null");
      if (savedUser) {
        setFinderName((current) => current || savedUser.name || "");
        setFinderContact((current) => current || savedUser.email || "");
      }
    } catch (storageError) {
      console.warn("Unable to read saved SafeReturn user:", storageError);
    }
  }, []);

  // ==========================================
  // FETCH SAFERETURN IDENTITY
  // ==========================================

  useEffect(() => {
    const fetchIdentity = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `https://safereturn-pwra.onrender.com//api/identities/${id}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "SafeReturn identity not found."
          );
        }

        setItem(data.identity);
      } catch (error) {
        console.error(
          "Identity fetch error:",
          error
        );

        setError(
          error.message ||
            "Unable to connect to SafeReturn backend."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchIdentity();
    }
  }, [id]);

  // ==========================================
  // SEND CONTACT REQUEST
  // ==========================================

  const sendContactRequest = async (event) => {
    event.preventDefault();

    if (!finderName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!finderContact.trim()) {
      setError(
        "Please enter your contact information."
      );
      return;
    }

    if (!finderMessage.trim()) {
      setError("Please enter a message.");
      return;
    }

    setSendingRequest(true);
    setError("");

    try {
      const response = await fetch(
        "https://safereturn-pwra.onrender.com//api/contact-owner",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(localStorage.getItem("safereturn_token")
              ? { Authorization: `Bearer ${localStorage.getItem("safereturn_token")}` }
              : {}),
          },
          body: JSON.stringify({
            safeReturnId: item.id,
            finderName,
            finderContact,
            message: finderMessage,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to send contact request."
        );
      }

      setRequestId(data.requestId);
setRequestStatus("Pending");
setStatusError("");
setContactSuccess(true);

      setFinderName("");
      setFinderContact("");
      setFinderMessage("");
    } catch (error) {
      console.error(
        "Contact request error:",
        error
      );

      setError(
        error.message ||
          "Unable to send contact request."
      );
    } finally {
      setSendingRequest(false);
    }
  };

// ==========================================
// CHECK FINDER REQUEST STATUS
// ==========================================

const checkRequestStatus = async () => {
  if (!requestId) return;

  try {
    setCheckingStatus(true);
    setStatusError("");

    const response = await fetch(
      `https://safereturn-pwra.onrender.com//api/contact-request-status/${encodeURIComponent(
        requestId
      )}`
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to check request status.");
    }

    setRequestStatus(data.request.status || "Pending");
  } catch (error) {
    console.error("Request status error:", error);
    setStatusError(error.message || "Unable to check request status.");
  } finally {
    setCheckingStatus(false);
  }
};

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
            <Loader2
              size={28}
              className="animate-spin"
            />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Verifying SafeReturn identity...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR / NOT FOUND
  // ==========================================

  if (error && !item) {
    return (
      <div className="min-h-screen bg-[#020617] text-white">
        <nav className="border-b border-white/10">
          <div className="mx-auto max-w-5xl px-6 py-5">
            <Link
              to="/"
              className="flex w-fit items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
                <ShieldCheck
                  size={22}
                  className="text-cyan-400"
                />
              </div>

              <div>
                <h1 className="font-bold">
                  Safe
                  <span className="text-cyan-400">
                    Return
                  </span>
                </h1>

                <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600">
                  Smart Lost & Found
                </p>
              </div>
            </Link>
          </div>
        </nav>

        <main className="flex min-h-[75vh] items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-400/10 text-red-400">
              <AlertCircle size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-black">
              Identity Not Found
            </h1>

            <p className="mt-3 leading-7 text-slate-500">
              {error}
            </p>

            <p className="mt-2 text-sm text-slate-600">
              SafeReturn ID: {id}
            </p>

            <Link
              to="/"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              <ArrowLeft size={18} />
              Back Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* =====================================
          NAVBAR
      ===================================== */}

      <nav className="border-b border-white/10 bg-[#020617]">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <Link
            to="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <ShieldCheck
                size={22}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1 className="font-bold">
                Safe
                <span className="text-cyan-400">
                  Return
                </span>
              </h1>

              <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600">
                Smart Lost & Found
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 text-xs text-green-400 sm:flex">
            <CheckCircle2 size={15} />
            Verified Identity
          </div>
        </div>
      </nav>

      {/* =====================================
          MAIN
      ===================================== */}

      <main className="mx-auto max-w-3xl px-6 py-14">
        {/* VERIFIED HEADER */}

        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-400/10 text-green-400 ring-1 ring-green-400/20">
            <CheckCircle2 size={32} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.25em] text-green-400">
            SafeReturn Verified
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            You found a registered item.
          </h1>

          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-500">
            This item has a SafeReturn digital identity.
            The owner's personal information remains
            protected.
          </p>
        </div>

        {/* =====================================
            ITEM CARD
        ===================================== */}

        <div className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-2xl">
          {/* STATUS */}

          <div className="border-b border-white/10 bg-green-400/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-400/10 text-green-400">
                <ShieldCheck size={21} />
              </div>

              <div>
                <p className="font-semibold text-green-300">
                  SafeReturn Identity Verified
                </p>

                <p className="text-xs text-slate-600">
                  ID: {item.id}
                </p>
              </div>
            </div>
          </div>

          {/* ITEM DETAILS */}

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
                  Registered Item
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  {item.itemName}
                </h2>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
                <Package size={28} />
              </div>
            </div>

            {/* INFO GRID */}

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/5 bg-[#07111f] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Category
                </p>

                <p className="mt-2 font-semibold">
                  {item.category || "Other"}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#07111f] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  AI Classification
                </p>

                <p className="mt-2 font-semibold">
                  {item.analysis?.itemType ||
                    "Unknown"}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#07111f] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Main Color
                </p>

                <p className="mt-2 font-semibold">
                  {item.analysis?.color ||
                    "Unknown"}
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-[#07111f] p-4">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Shape
                </p>

                <p className="mt-2 font-semibold">
                  {item.analysis?.shape ||
                    "Unknown"}
                </p>
              </div>
            </div>

            {/* AI VISUAL DETAILS */}

            <div className="mt-4 rounded-xl border border-white/5 bg-[#07111f] p-5">
              <div className="flex items-center gap-2">
                <Sparkles
                  size={17}
                  className="text-cyan-400"
                />

                <p className="text-xs uppercase tracking-wider text-slate-600">
                  AI Visual Details
                </p>
              </div>

              <p className="mt-3 leading-7 text-slate-300">
                {item.analysis?.visualDetails ||
                  "No visual details available."}
              </p>
            </div>

            {/* OWNER DESCRIPTION */}

            {item.description && (
              <div className="mt-4 rounded-xl border border-white/5 bg-[#07111f] p-5">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  Owner Description
                </p>

                <p className="mt-3 leading-7 text-slate-300">
                  {item.description}
                </p>
              </div>
            )}

            {/* AI CONFIDENCE */}

            <div className="mt-4 rounded-xl border border-white/5 bg-[#07111f] p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wider text-slate-600">
                  AI Confidence
                </p>

                <p className="font-bold text-cyan-400">
                  {Math.round(
                    Number(
                      item.analysis?.confidence
                    ) || 0
                  )}
                  %
                </p>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-cyan-400"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        Number(
                          item.analysis?.confidence
                        ) || 0
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* PRIVACY */}

            <div className="mt-7 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-5">
              <div className="flex gap-3">
                <ShieldCheck
                  size={21}
                  className="mt-0.5 shrink-0 text-cyan-400"
                />

                <div>
                  <p className="font-semibold text-cyan-300">
                    Owner privacy protected
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    SafeReturn does not reveal the owner's
                    phone number, email address or home
                    address on this page.
                  </p>
                </div>
              </div>
            </div>

            {/* CONTACT OWNER BUTTON */}

            <button
              type="button"
              onClick={() => {
                setShowContact(true);
                setContactSuccess(false);
                setError("");
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-6 py-4 font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              <MessageCircle size={20} />
              Contact Owner
            </button>

            <p className="mt-4 text-center text-xs text-slate-600">
              Your contact request can be sent without
              exposing personal information.
            </p>
          </div>
        </div>
      </main>

      {/* ==========================================
          CONTACT OWNER MODAL
      ========================================== */}

      {showContact && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 px-4 py-6 backdrop-blur-sm sm:items-center">
          <div className="my-auto w-full max-w-lg rounded-3xl border border-white/10 bg-[#07111f] p-6 shadow-2xl sm:p-8">
            {!contactSuccess ? (
              <>
                {/* MODAL HEADER */}

                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                        <MessageCircle size={22} />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold">
                          Contact Owner
                        </h2>

                        <p className="text-xs text-slate-600">
                          SafeReturn ID: {item.id}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setShowContact(false)
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white/5 hover:text-white"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* PRIVACY NOTICE */}

                <div className="mt-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4">
                  <div className="flex gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-cyan-400"
                    />

                    <p className="text-sm leading-6 text-slate-400">
                      Your message will be sent through
                      SafeReturn. The owner's personal
                      contact information will not be revealed
                      to you.
                    </p>
                  </div>
                </div>

                {/* FORM */}

                <form
                  onSubmit={sendContactRequest}
                  className="mt-6 space-y-5"
                >
                  {/* NAME */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Your Name
                    </label>

                    <input
                      type="text"
                      value={finderName}
                      onChange={(event) =>
                        setFinderName(event.target.value)
                      }
                      placeholder="Enter your name"
                      className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                    />
                  </div>

                  {/* CONTACT */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Your Contact
                    </label>

                    <input
                      type="text"
                      value={finderContact}
                      onChange={(event) =>
                        setFinderContact(event.target.value)
                      }
                      placeholder="Email or phone number"
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/10 bg-[#020617] px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                    />
                  </div>

                  {/* MESSAGE */}

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Message
                    </label>

                    <textarea
                      value={finderMessage}
                      onChange={(event) =>
                        setFinderMessage(event.target.value)
                      }
                      rows={4}
                      placeholder="Example: I found your item. Please contact me through SafeReturn."
                      className="w-full resize-none rounded-xl border border-white/10 bg-[#020617] px-4 py-3.5 text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                    />
                  </div>

                  {/* ERROR */}

                  {error && (
                    <div className="rounded-xl border border-red-400/20 bg-red-400/[0.04] p-3 text-sm text-red-300">
                      {error}
                    </div>
                  )}

                  {/* SEND */}

                  <button
                    type="submit"
                    disabled={sendingRequest}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-4 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingRequest ? (
                      <>
                        <Loader2
                          size={19}
                          className="animate-spin"
                        />
                        Sending Secure Request...
                      </>
                    ) : (
                      <>
                        <MessageCircle size={19} />
                        Send Secure Message
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              /* SUCCESS */

              <div className="py-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-400/10 text-green-400">
                  <CheckCircle2 size={32} />
                </div>

                <h2 className="mt-6 text-2xl font-black">
                  Message Sent Successfully
                </h2>

                <p className="mx-auto mt-3 max-w-sm leading-7 text-slate-500">
                  Your secure contact request has been
                  submitted to SafeReturn.
                </p>
<div className="mt-6 rounded-xl border border-white/10 bg-[#020617] p-5 text-left">
  <p className="text-xs uppercase tracking-wider text-slate-500">
    Your Request ID
  </p>

  <p className="mt-2 break-all font-bold text-cyan-400">
    {requestId}
  </p>

  <p className="mt-4 text-sm text-slate-400">
    Current Status
  </p>

  <span
    className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${
      requestStatus === "Resolved"
        ? "bg-green-400/10 text-green-400"
        : requestStatus === "Reviewed"
        ? "bg-blue-400/10 text-blue-400"
        : "bg-yellow-400/10 text-yellow-400"
    }`}
  >
    {requestStatus || "Pending"}
  </span>

  <button
    type="button"
    onClick={checkRequestStatus}
    disabled={checkingStatus}
    className="mt-4 block w-full rounded-lg border border-cyan-400/30 px-4 py-3 text-sm font-semibold text-cyan-400 hover:bg-cyan-400/10 disabled:opacity-50"
  >
    {checkingStatus ? "Checking..." : "Check Latest Status"}
  </button>

  {statusError && (
    <p className="mt-3 text-sm text-red-400">{statusError}</p>
  )}
</div>
                <div className="mt-6 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-4 text-left">
                  <div className="flex gap-3">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-cyan-400"
                    />

                    <p className="text-sm leading-6 text-slate-400">
                      The owner's phone number and email
                      address remain hidden from you.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowContact(false)
                  }
                  className="mt-6 rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FinderItem;