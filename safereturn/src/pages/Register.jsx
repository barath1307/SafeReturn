import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, User, Mail, Lock, Loader2 } from "lucide-react";

function Register() {
  const navigate = useNavigate();
  const location = useLocation();

const redirectTo = location.state?.from || "/owner-dashboard";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setSuccess("");
    try {
      if (!credentialResponse?.credential) throw new Error("Google did not return a sign-in credential.");
      const response = await fetch("https://safereturn-pwra.onrender.com/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Google sign-in failed.");
      localStorage.setItem("safereturn_token", data.token);
      localStorage.setItem("safereturn_user", JSON.stringify(data.user));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("Google registration error:", err);
      setError(err.message === "Failed to fetch" ? "Cannot connect to server. Please try again." : err.message || "Google sign-in failed.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "https://safereturn-pwra.onrender.com/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      setSuccess("Account created successfully! Please sign in...");

setTimeout(() => {
  navigate("/login", {
    replace: true,
    state: { from: redirectTo },
  });
}, 1200);
    } catch (err) {
      setError(
        err.message === "Failed to fetch"
          ? "Cannot connect to server. Please try again."
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-5 py-10 text-white">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
            <ShieldCheck size={27} className="text-cyan-400" />
          </div>

          <h1 className="text-2xl font-bold">
            Safe<span className="text-cyan-400">Return</span>
          </h1>
        </Link>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-2xl sm:p-9">
          <h2 className="text-3xl font-black">Create account</h2>

          <p className="mt-3 text-sm text-slate-400">
            Join SafeReturn to manage your registered items.
          </p>

          {error && (
            <div role="alert" className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div role="status" className="mt-5 rounded-xl border border-green-400/20 bg-green-400/10 p-3 text-sm text-green-300">
              {success}
            </div>
          )}

          <div className="mt-7 flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError("Google sign-in was cancelled or failed. Please try again.")}
              text="signup_with"
              shape="rectangular"
              theme="filled_black"
              width="300"
            />
          </div>
          <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-600">
            <span className="h-px flex-1 bg-white/10" />
            or register with email
            <span className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleRegister} className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Full name
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#07111f] px-4">
                <User size={18} className="text-slate-500" />

                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full bg-transparent py-3.5 text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Email address
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#07111f] px-4">
                <Mail size={18} className="text-slate-500" />

                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-3.5 text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#07111f] px-4">
                <Lock size={18} className="text-slate-500" />

                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full bg-transparent py-3.5 text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Confirm password
              </label>

              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#07111f] px-4">
                <Lock size={18} className="text-slate-500" />

                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-transparent py-3.5 text-white outline-none placeholder:text-slate-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 py-3.5 font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-cyan-400 hover:text-cyan-300">
              Sign In
            </Link>
          </p>

          <Link to="/" className="mt-5 block text-center text-sm text-slate-500 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;