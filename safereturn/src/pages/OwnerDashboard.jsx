import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Package,
  MessageCircle,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Mail,
  Loader2,
  Trash2,
  MoreVertical,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000";

function OwnerDashboard() {
  const [items, setItems] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [updatingRequestId, setUpdatingRequestId] = useState(null);
  const [deletingRequestId, setDeletingRequestId] = useState(null);
  const [openRequestMenu, setOpenRequestMenu] = useState(null);
  const [error, setError] = useState("");

  // ===============================
  // LOAD ITEMS AND CONTACT REQUESTS
  // ===============================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("safereturn_token");

        if (!token) {
          setError("Please sign in to view your dashboard.");
          return;
        }

        const response = await fetch(
          `${API_BASE}/api/identities/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (response.status === 401) {
          setError("Your session has expired. Please sign in again.");
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load your registered items."
          );
        }

        const storedItems = Array.isArray(data.items)
          ? data.items
          : Array.isArray(data.identities)
          ? data.identities
          : [];

        const normalizedItems = storedItems.map((item) => ({
          ...item,
          id: item.id || item.safeReturnId,
          safeReturnId: item.safeReturnId || item.id,
        }));

        setItems(normalizedItems);

        const allRequests = [];

        for (const item of normalizedItems) {
          if (!item.id) continue;

          try {
            const requestResponse = await fetch(
              `${API_BASE}/api/contact-requests/${encodeURIComponent(
                item.id
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const requestData = await requestResponse.json();

            if (
              requestResponse.ok &&
              requestData.success &&
              Array.isArray(requestData.requests)
            ) {
              allRequests.push(
                ...requestData.requests.map((request) => ({
                  ...request,
                  id: request.id || request._id,
                  safeReturnId: item.id,
                  itemName: item.itemName,
                  itemCategory: item.category,
                }))
              );
            } else if (requestResponse.status === 401) {
              setError(
                "Your session has expired. Please sign in again."
              );
              return;
            }
          } catch (requestError) {
            console.error(
              `Unable to load requests for ${item.id}:`,
              requestError
            );
          }
        }

        setRequests(allRequests);
      } catch (loadError) {
        console.error("Dashboard loading error:", loadError);

        setError(
          loadError.message || "Unable to load your dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // ===============================
  // DELETE REGISTERED ITEM
  // ===============================

  const handleDeleteItem = async (item) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${item.itemName}" (${item.id})?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setError("");

      const token = localStorage.getItem("safereturn_token");

      if (!token) {
        setError("Please sign in to delete an item.");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/identities/${encodeURIComponent(item.id)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        setError("Your session has expired. Please sign in again.");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete this item."
        );
      }

      setItems((previous) =>
        previous.filter(
          (existingItem) => existingItem.id !== item.id
        )
      );

      setRequests((previous) =>
        previous.filter(
          (request) => request.safeReturnId !== item.id
        )
      );

      window.alert("Item deleted successfully.");
    } catch (deleteError) {
      console.error("Delete item error:", deleteError);

      setError(
        deleteError.message ||
          "Unable to delete this item. Try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  // ===============================
  // UPDATE CONTACT REQUEST STATUS
  // ===============================

  const handleUpdateStatus = async (request, status) => {
    try {
      setUpdatingRequestId(request.id);
      setError("");

      const token = localStorage.getItem("safereturn_token");

      if (!token) {
        setError("Please sign in to update the request.");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/contact-requests/${encodeURIComponent(
          request.id
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update request status."
        );
      }

      setRequests((previous) =>
        previous.map((item) =>
          item.id === request.id
            ? { ...item, status }
            : item
        )
      );
    } catch (error) {
      console.error("Status update error:", error);

      setError(
        error.message || "Unable to update request status."
      );
    } finally {
      setUpdatingRequestId(null);
    }
  };

  // ===============================
  // DELETE SINGLE CONTACT REQUEST
  // ===============================

  const handleDeleteRequest = async (request) => {
    const confirmed = window.confirm(
      `Delete this contact request (${request.id})? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingRequestId(request.id);
      setError("");

      const token = localStorage.getItem("safereturn_token");

      if (!token) {
        setError("Please sign in to delete this request.");
        return;
      }

      const response = await fetch(
        `${API_BASE}/api/contact-requests/${encodeURIComponent(
          request.id
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        throw new Error(
          "Your session has expired. Please sign in again."
        );
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to delete this request."
        );
      }

      // Remove only the selected contact request from the UI.
      setRequests((previous) =>
        previous.filter((item) => item.id !== request.id)
      );

      setOpenRequestMenu(null);
    } catch (deleteError) {
      console.error(
        "Delete contact request error:",
        deleteError
      );

      setError(
        deleteError.message ||
          "Unable to delete this request."
      );
    } finally {
      setDeletingRequestId(null);
    }
  };

  // ===============================
  // COUNTS
  // ===============================

  const totalItems = items.length;
  const totalRequests = requests.length;

  const pendingRequests = requests.filter(
    (request) => (request.status || "Pending") === "Pending"
  ).length;

  // ===============================
  // LOADING SCREEN
  // ===============================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-400">
            <Loader2 size={28} className="animate-spin" />
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Loading your SafeReturn dashboard...
          </p>
        </div>
      </div>
    );
  }

  // ===============================
  // DASHBOARD UI
  // ===============================

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <nav className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
              <ShieldCheck
                size={23}
                className="text-cyan-400"
              />
            </div>

            <div>
              <h1 className="font-bold">
                Safe<span className="text-cyan-400">Return</span>
              </h1>

              <p className="text-[9px] uppercase tracking-[0.25em] text-slate-600">
                Owner Dashboard
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft size={17} />
            Home
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            Owner Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-black sm:text-5xl">
            Manage your
            <span className="text-cyan-400">
              {" "}SafeReturn items.
            </span>
          </h1>

          <p className="mt-4 max-w-2xl leading-7 text-slate-500">
            View your registered items and securely receive messages
            from people who found them.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
          >
            {error}

            {error.toLowerCase().includes("sign in") && (
              <Link
                to="/login"
                className="ml-2 font-bold underline"
              >
                Sign in
              </Link>
            )}
          </div>
        )}

        {/* DASHBOARD COUNTS */}

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                <Package size={22} />
              </div>

              <span className="text-xs uppercase tracking-wider text-slate-600">
                Items
              </span>
            </div>

            <p className="mt-6 text-4xl font-black">
              {totalItems}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Registered items
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-400/10 text-purple-400">
                <MessageCircle size={22} />
              </div>

              <span className="text-xs uppercase tracking-wider text-slate-600">
                Messages
              </span>
            </div>

            <p className="mt-6 text-4xl font-black">
              {totalRequests}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Finder requests
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-400/10 text-yellow-400">
                <Clock size={22} />
              </div>

              <span className="text-xs uppercase tracking-wider text-slate-600">
                Pending
              </span>
            </div>

            <p className="mt-6 text-4xl font-black">
              {pendingRequests}
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Awaiting response
            </p>
          </div>
        </div>

        {/* REGISTERED ITEMS */}

        <section className="mt-12">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
            Your Items
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Registered Items
          </h2>

          {items.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 p-10 text-center">
              <Package
                size={30}
                className="mx-auto text-slate-700"
              />

              <p className="mt-4 font-semibold">
                No registered items yet
              </p>

              <p className="mt-2 text-sm text-slate-600">
                Register an item to create a SafeReturn identity.
              </p>

              <Link
                to="/report"
                className="mt-5 inline-flex rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950"
              >
                Register Item
              </Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                        <Package size={23} />
                      </div>

                      <div>
                        <h3 className="font-bold">
                          {item.itemName}
                        </h3>

                        <p className="mt-1 text-xs text-slate-600">
                          {item.id}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center gap-1 text-xs text-green-400">
                        <CheckCircle2 size={15} />
                        Registered
                      </div>

                      <button
                        type="button"
                        disabled={deletingId === item.id}
                        onClick={() => handleDeleteItem(item)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {deletingId === item.id ? (
                          <Loader2
                            size={14}
                            className="animate-spin"
                          />
                        ) : (
                          <Trash2 size={14} />
                        )}

                        {deletingId === item.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#07111f] p-4">
                      <p className="text-xs text-slate-600">
                        Category
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {item.category || "Other"}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#07111f] p-4">
                      <p className="text-xs text-slate-600">
                        AI Type
                      </p>

                      <p className="mt-2 text-sm font-semibold">
                        {item.analysis?.itemType || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-[#07111f] p-4">
                    <p className="text-xs text-slate-600">
                      SafeReturn Identity
                    </p>

                    <p className="mt-2 font-bold text-cyan-400">
                      {item.safeReturnId || item.id}
                    </p>
                  </div>

                  <div className="mt-4">
                    <Link
                      to={`/item/${encodeURIComponent(
                        item.safeReturnId || item.id
                      )}`}
                      className="text-sm font-semibold text-cyan-400 hover:text-cyan-300"
                    >
                      View item details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CONTACT REQUESTS */}

        <section className="mt-12">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-600">
            Finder Activity
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Contact Requests
          </h2>

          {requests.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025] p-10 text-center">
              <MessageCircle
                size={30}
                className="mx-auto text-slate-700"
              />

              <p className="mt-4 font-semibold">
                No contact requests yet
              </p>

              <p className="mt-2 text-sm text-slate-600">
                When someone contacts you about an item, their
                message will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-6"
                >
                  {/* REQUEST HEADER */}

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                        <MessageCircle size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold">
                          Someone found your item
                        </h3>

                        <p className="break-all text-xs text-slate-600">
                          {request.id}
                        </p>
                      </div>
                    </div>

                    {/* STATUS BUTTONS + MENU ON THE RIGHT */}

                    <div className="flex flex-wrap items-center justify-start gap-2 sm:justify-end">
                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          request.status === "Resolved"
                            ? "bg-green-400/10 text-green-400"
                            : request.status === "Reviewed"
                            ? "bg-blue-400/10 text-blue-400"
                            : "bg-yellow-400/10 text-yellow-400"
                        }`}
                      >
                        {request.status || "Pending"}
                      </span>

                      {["Pending", "Reviewed", "Resolved"].map(
                        (status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={
                              updatingRequestId === request.id ||
                              (request.status || "Pending") === status
                            }
                            onClick={() =>
                              handleUpdateStatus(request, status)
                            }
                            className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-cyan-400/50 hover:text-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {updatingRequestId === request.id &&
                            request.status !== status
                              ? "Updating..."
                              : status}
                          </button>
                        )
                      )}

                      {/* THREE-DOT MENU — AFTER RESOLVED */}

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRequestMenu((previous) =>
                              previous === request.id
                                ? null
                                : request.id
                            )
                          }
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-400"
                          aria-label="Request options"
                          title="Request options"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {openRequestMenu === request.id && (
                          <div className="absolute right-0 top-12 z-30 w-48 rounded-xl border border-white/10 bg-[#07111f] p-2 shadow-2xl">
                            <button
                              type="button"
                              onClick={() =>
                                handleDeleteRequest(request)
                              }
                              disabled={
                                deletingRequestId === request.id
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-400 transition hover:bg-red-400/10 disabled:opacity-50"
                            >
                              {deletingRequestId === request.id ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin"
                                />
                              ) : (
                                <Trash2 size={16} />
                              )}

                              {deletingRequestId === request.id
                                ? "Deleting..."
                                : "Delete Request"}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenRequestMenu(null)
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 transition hover:bg-white/5"
                            >
                              <X size={16} />
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ITEM AND FINDER DETAILS */}

                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-xl bg-[#07111f] p-4">
                      <p className="text-xs text-slate-600">
                        Item
                      </p>

                      <p className="mt-2 font-semibold">
                        {request.itemName || request.safeReturnId}
                      </p>
                    </div>

                    <div className="rounded-xl bg-[#07111f] p-4">
                      <p className="text-xs text-slate-600">
                        Finder
                      </p>

                      <p className="mt-2 font-semibold">
                        {request.finderName}
                      </p>
                    </div>
                  </div>

                  {request.finderEmail && (
                    <div className="mt-3 rounded-xl bg-[#07111f] p-4">
                      <p className="text-xs text-slate-600">
                        Finder Email
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                        <Mail size={15} className="shrink-0" />

                        <a
                          className="break-all hover:text-cyan-300"
                          href={`mailto:${request.finderEmail}`}
                        >
                          {request.finderEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 rounded-xl bg-[#07111f] p-4">
                    <p className="text-xs text-slate-600">
                      Finder Contact
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-sm text-slate-300">
                      <Mail size={15} className="shrink-0" />

                      <span className="break-all">
                        {request.finderContact}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl bg-[#07111f] p-4">
                    <p className="text-xs text-slate-600">
                      Message
                    </p>

                    <p className="mt-2 break-words leading-7 text-slate-300">
                      {request.message}
                    </p>
                  </div>

                  <p className="mt-4 text-xs text-slate-700">
                    Request received{" "}
                    {request.createdAt
                      ? new Date(
                          request.createdAt
                        ).toLocaleString()
                      : "recently"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* PRIVACY NOTE */}

        <div className="mt-12 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] p-6">
          <div className="flex gap-4">
            <ShieldCheck
              size={23}
              className="mt-0.5 shrink-0 text-cyan-400"
            />

            <div>
              <h3 className="font-semibold text-cyan-300">
                Privacy-first communication
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-500">
                SafeReturn keeps the owner's personal information
                hidden from the finder. Only the information required
                to reconnect is exchanged through the platform.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default OwnerDashboard;