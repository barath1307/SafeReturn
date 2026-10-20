import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Smartphone,
  QrCode,
  ScanLine,
  ArrowLeft,
} from "lucide-react";

function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Smartphone,
      title: "Register Your Item",
      text: "Add your phone, laptop, document, keys or other valuable item to SafeReturn and create its secure digital identity.",
    },
    {
      number: "02",
      icon: QrCode,
      title: "Generate Safe QR",
      text: "SafeReturn generates a unique privacy-safe QR identity. Your personal information is never stored directly inside the QR code.",
    },
    {
      number: "03",
      icon: ScanLine,
      title: "Finder Scans QR",
      text: "If someone finds your lost item, they can scan the QR code and safely reach the owner without seeing private contact details.",
    },
    {
      number: "04",
      icon: ShieldCheck,
      title: "Verify & Return",
      text: "The owner verifies their ownership using registered information. Once verified, the finder and owner can safely arrange the return.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <nav className="border-b border-white/10 bg-[#020617]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="text-xl font-bold">
            Safe<span className="text-cyan-400">Return</span>
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

      <main className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            How SafeReturn Works
          </p>

          <h1 className="mt-5 text-5xl font-black sm:text-6xl">
            Lost item.
            <br />
            <span className="text-cyan-400">Safe return.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            SafeReturn creates a privacy-safe connection between the person who
            lost an item and the person who found it.
          </p>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.number}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-7 transition hover:-translate-y-1 hover:border-cyan-400/30"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                    <Icon size={24} />
                  </div>

                  <span className="text-sm font-bold text-slate-700">
                    {step.number}
                  </span>
                </div>

                <h2 className="mt-7 text-xl font-bold">{step.title}</h2>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  {step.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-20 max-w-4xl rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-10 text-center">
          <ShieldCheck className="mx-auto text-cyan-400" size={40} />

          <h2 className="mt-5 text-3xl font-bold">
            Privacy is part of the design.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-400">
            The QR code identifies the registered item, not the owner's
            private information. SafeReturn is designed to make recovery
            possible without unnecessarily exposing personal details.
          </p>

          <Link
            to="/report"
            className="mt-7 inline-flex items-center rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300"
          >
            Register Your Item
          </Link>
        </div>
      </main>
    </div>
  );
}

export default HowItWorks;