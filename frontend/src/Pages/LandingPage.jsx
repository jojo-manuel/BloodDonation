import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserAvatar from "../components/UserAvatar";

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const stats = [
    { value: "5000+", label: "Donors", icon: "👥" },
    { value: "1200+", label: "Saved", icon: "❤️" },
    { value: "150+", label: "Hospitals", icon: "🏥" },
    { value: "24/7", label: "Help", icon: "🕒" },
  ];

  const steps = [
    {
      title: "Register",
      description: "Sign up in <2 mins.",
      icon: "1",
    },
    {
      title: "Get Notified",
      description: "Alerts for your blood type.",
      icon: "2",
    },
    {
      title: "Donate",
      description: "Save a life safely.",
      icon: "3",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-red-500/30 overflow-x-hidden flex flex-col relative">

      {/* Navbar - Fixed */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled || mobileMenuOpen ? "bg-neutral-950/90 backdrop-blur-md border-b border-white/5 py-3" : "bg-transparent py-5"
          }`}
      >
        <div className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/")}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-900/20 group-hover:shadow-red-900/40 transition-shadow duration-300">
              <span className="text-xl">🩸</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400 group-hover:from-white group-hover:to-white transition-all">
              Hope Web
            </span>
          </div>

          {/* Desktop Navigation - Button Style */}
          <div className="hidden lg:flex items-center gap-3">
            <a href="#how-it-works" className="px-4 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-all hover:scale-105 active:scale-95">
              Process
            </a>
            <a href="#impact" className="px-4 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-all hover:scale-105 active:scale-95">
              Impact
            </a>
            <a href="#about" className="px-4 py-2 rounded-lg bg-neutral-900/50 border border-neutral-800 text-neutral-400 text-sm font-medium hover:bg-neutral-800 hover:text-white transition-all hover:scale-105 active:scale-95">
              About
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={() => navigate("/login")}
              className="px-6 py-2.5 rounded-lg border border-neutral-700 text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all hover:border-neutral-600"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="px-6 py-2.5 rounded-lg bg-white text-black text-sm font-bold hover:bg-neutral-200 transition-all shadow-lg shadow-white/5 hover:shadow-white/10 hover:-translate-y-0.5"
            >
              Get Started
            </button>
            <div className="hidden sm:block">
              <UserAvatar size="sm" />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-4 lg:hidden">
            <UserAvatar size="sm" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-300 hover:text-white transition-colors bg-neutral-900 rounded-lg"
            >
              <span className="text-xl">{mobileMenuOpen ? "✕" : "☰"}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-neutral-950 border-t border-b border-white/5 p-6 shadow-2xl backdrop-blur-3xl">
            <div className="flex flex-col space-y-3">
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-neutral-900 text-neutral-300 font-medium">Process</a>
              <a href="#impact" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-neutral-900 text-neutral-300 font-medium">Impact</a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 rounded-xl bg-neutral-900 text-neutral-300 font-medium">About</a>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => { navigate("/login"); setMobileMenuOpen(false); }}
                  className="px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-medium"
                >
                  Sign In
                </button>
                <button
                  onClick={() => { navigate("/register"); setMobileMenuOpen(false); }}
                  className="px-4 py-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-900/20"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area - Full Screen Hero */}
      <main className="w-full max-w-[1920px] mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center min-h-screen pt-24 pb-12 overflow-hidden relative">

        {/* Abstract Backgrounds */}
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[130px] rounded-full pointer-events-none opacity-50 mix-blend-screen z-0"></div>
        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-rose-900/10 blur-[130px] rounded-full pointer-events-none opacity-40 mix-blend-screen z-0"></div>

        {/* Left Content */}
        <div className="relative z-10 flex flex-col justify-center text-left pb-12 lg:pb-0">
          <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Urgent Needs in Your Area
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-bold tracking-tight mb-8 leading-[1.05]">
            <span className="text-white block">Donate Blood.</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-600 block mt-2">Save a Life.</span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-400 max-w-xl mb-10 leading-relaxed">
            Experience the fastest way to help those in need. Connect directly with patients, hospitals, and blood banks in your community.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/donor-register")}
              className="px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-500 transition-all shadow-xl shadow-red-900/20 hover:shadow-red-900/40 hover:-translate-y-1"
            >
              Become a Donor
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-8 py-4 rounded-xl bg-neutral-900 border border-neutral-800 text-white font-bold text-lg hover:bg-neutral-800 transition-all hover:-translate-y-1"
            >
              Find Blood
            </button>
            <button
              onClick={() => navigate("/staff-login")}
              className="px-8 py-4 rounded-xl bg-blue-600/20 border border-blue-500/50 text-blue-400 font-bold text-lg hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-900/10 hover:shadow-blue-900/40 hover:-translate-y-1"
            >
              Staff Login
            </button>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5 grid grid-cols-3 gap-8">
            {stats.slice(0, 3).map((stat, idx) => (
              <div key={idx}>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-neutral-500 uppercase font-semibold tracking-wide">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Content - Interactive Card */}
        <div className="hidden lg:flex h-full items-center justify-center relative z-10">
          <div className="w-full max-w-lg bg-neutral-900/30 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">Simple 3-Step Process</h3>
              <div className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-neutral-400 border border-white/5">FAST & SAFE</div>
            </div>

            <div className="space-y-6">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-5 items-start p-4 rounded-2xl bg-neutral-950/50 border border-white/5 hover:border-red-500/30 transition-colors group/item">
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-lg font-bold text-white shadow-lg group-hover/item:text-red-500 transition-colors">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg mb-1">{step.title}</h4>
                    <p className="text-sm text-neutral-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-8 border-t border-white/5">
              <button
                onClick={() => navigate("/register")}
                className="w-full py-4 rounded-xl bg-white text-black font-bold hover:bg-neutral-200 transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                Start Saving Lives Now
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Proper Web Footer */}
      <footer className="bg-black border-t border-neutral-900 py-16 px-6 lg:px-12 z-10 relative">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-24 mb-16">
            <div className="col-span-1 lg:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-900/20">
                  <span className="text-xl">🩸</span>
                </div>
                <span className="text-xl font-bold text-white">Hope Web</span>
              </div>
              <p className="text-neutral-500 leading-relaxed mb-6">
                Connecting donors with patients in need. We are on a mission to make blood donation accessible, transparent, and efficient for everyone.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all">𝕏</a>
                <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all">In</a>
                <a href="#" className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:bg-white hover:text-black transition-all">Ig</a>
              </div>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-red-500 transition-colors">Find Blood</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Register as Donor</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Partner Hospitals</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Mobile App</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-red-500 transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Press Kit</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-red-500 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-red-500 transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-600">
            <p>&copy; {new Date().getFullYear()} Hope Web Inc. All rights reserved.</p>
            <div className="flex gap-8">
              <a href="#" className="hover:text-neutral-400">Privacy</a>
              <a href="#" className="hover:text-neutral-400">Terms</a>
              <a href="#" className="hover:text-neutral-400">Sitemap</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
