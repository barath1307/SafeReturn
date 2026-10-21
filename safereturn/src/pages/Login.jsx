import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
} from "lucide-react";

function Login() {
  const navigate = useNavigate();
const location = useLocation();

const redirectTo = location.state?.from || "/owner-dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
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
      console.error("Google login error:", err);
      setError(err.message === "Failed to fetch" ? "Unable to connect to the server. Please try again." : err.message || "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "https://safereturn-pwra.onrender.com/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to sign in. Please try again."
        );
      }

      localStorage.setItem("safereturn_token", data.token);
      localStorage.setItem(
        "safereturn_user",
        JSON.stringify(data.user)
      );

      navigate("/owner-dashboard");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.message === "Failed to fetch"
          ? "Unable to connect to the server. Please try again."
          : err.message || "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#020617] px-4 py-10 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.025] p-6 sm:p-10">

        {/* LOGO */}
        <Link to="/" className="mb-8 inline-flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 ring-1 ring-cyan-400/30">
            <ShieldCheck size={27} className="text-cyan-400" />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              Safe<span className="text-cyan-400">Return</span>
            </h2>
            <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
              Owner Portal
            </p>
          </div>
        </Link>

        {/* HEADING */}
        <h1 className="text-4xl font-black tracking-tight">
          Welcome to SafeReturn
        </h1>

        <p className="mt-4 text-base text-slate-400">
          Sign in to manage your registered items.
        </p>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
          >
            {error}
          </div>
        )}

        {/* GOOGLE SIGN-IN */}
        <div className="mt-7 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in was cancelled or failed. Please try again.")}
            text="signin_with"
            shape="rectangular"
            theme="filled_black"
            width="320"
          />
        </div>
        <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-widest text-slate-600">
          <span className="h-px flex-1 bg-white/10" />
          or use email
          <span className="h-px flex-1 bg-white/10" />
        </div>

        {/* LOGIN FORM */}
        <form onSubmit={handleLogin} className="mt-6 space-y-6">

          {/* EMAIL */}
          <div>
            <label
              htmlFor="email"
              className="mb-3 block text-sm font-medium text-slate-200"
            >
              Email address
            </label>

            <div className="relative w-full">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-14 items-center justify-center text-slate-500">
                <Mail size={20} />
              </div>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                className="block w-full rounded-2xl border border-white/10 bg-[#07111f] py-5 pl-14 pr-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div>
            <label
              htmlFor="password"
              className="mb-3 block text-sm font-medium text-slate-200"
            >
              Password
            </label>

            <div className="relative w-full">

              {/* LOCK ICON */}
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-14 items-center justify-center text-slate-500">
                <Lock size={20} />
              </div>

              {/* PASSWORD INPUT */}
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="block w-full rounded-2xl border border-white/10 bg-[#07111f] py-5 pl-14 pr-14 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />

              {/* SHOW / HIDE PASSWORD */}
              <button
                type="button"
                onClick={() =>
                  setShowPassword((previous) => !previous)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                title={
                  showPassword ? "Hide password" : "Show password"
                }
                className="absolute inset-y-0 right-0 z-20 flex w-12 items-center justify-center rounded-r-2xl text-slate-400 transition hover:text-cyan-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
              >
                {showPassword ? (
                  <EyeOff size={21} />
                ) : (
                  <Eye size={21} />
                )}
              </button>

            </div>
          </div>

          {/* SIGN IN BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-400 px-5 py-5 text-lg font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={21} className="animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* REGISTER LINK */}
        <p className="mt-8 text-center text-sm text-slate-400">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-cyan-400 transition hover:text-cyan-300"
          >
            Create account
          </Link>
        </p>

        {/* HOME LINK */}
        <div className="mt-7 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Login;