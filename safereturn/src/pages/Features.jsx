import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Search,
  Lock,
  KeyRound,
  MessageCircle,
  Smartphone,
  ArrowLeft,
} from "lucide-react";

function Features() {
  const features = [
    {
      icon: BrainCircuit,
      title: "AI Item Analysis",
      text: "Analyze uploaded item images and automatically identify useful characteristics such as category, brand and visual details.",
    },
    {
      icon: Search,
      title: "AI Smart Matching",
      text: "Compare lost and found item information to identify potential matches and help speed up the recovery process.",
    },
    {
      icon: Lock,
      title: "Privacy-Safe Identity",
      text: "Personal phone numbers, email addresses and other sensitive information are not exposed through the QR code.",
    },
    {
      icon: KeyRound,
      title: "Ownership Verification",
      text: "Registered item information and verification signals help confirm that a person is the legitimate owner.",
    },
    {
      icon: MessageCircle,
      title: "Secure Contact",
      text: "Finder and owner can communicate through a privacy-focused contact flow without immediately revealing personal details.",
    },
    {
      icon: Smartphone,
      title: "Multiple Item Types",
      text: "Designed for phones, laptops, documents, keys, bags and other valuable personal belongings.",
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
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">
            SafeReturn Features
          </p>

          <h1 className="mt-5 text-5xl font-black sm:text-6xl">
            Smart recovery.
            <br />
            <span className="text-cyan-400">Built with privacy.</span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-400">
            SafeReturn combines AI, QR identity, secure communication and
            ownership verification to create a modern lost-and-found platform.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/[0.025] p-8 transition hover:-translate-y-1 hover:border-cyan-400/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-400">
                  <Icon size={25} />
                </div>

                <h2 className="mt-6 text-xl font-bold">{feature.title}</h2>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  {feature.text}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-20 rounded-3xl border border-cyan-400/20 bg-cyan-400/[0.04] p-10 text-center">
          <h2 className="text-3xl font-bold">
            Ready to protect your valuable items?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Create a SafeReturn identity and give your lost items a safer way
            back home.
          </p>

          <Link
            to="/report"
            className="mt-7 inline-flex rounded-xl bg-cyan-400 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-300"
          >
            Get Started
          </Link>
        </div>
      </main>
    </div>
  );
}

export default Features;