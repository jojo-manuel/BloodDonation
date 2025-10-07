import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "../context/ThemeContext";
import ThemeToggle from "../components/ThemeToggle";
import "../styles/reflective-effects.css";

export default function LandingPage() {
  const navigate = useNavigate();
  const { theme } = useContext(ThemeContext);
  const isDarkMode = theme === 'dark';

  // Dummy stats for demonstration
  const stats = [
    { icon: "📅", value: "1,247", label: "Total Requests", color: "from-red-500 to-red-500" },
    { icon: "💚", value: "892", label: "Completed Donations", color: "from-red-600 to-red-400" },
    { icon: "👥", value: "3,456", label: "Active Donors", color: "from-red-600 to-red-400" },
    { icon: "📍", value: "78", label: "Partner Blood Banks", color: "from-red-500 to-red-500" },
  ];

  const features = [
    {
      icon: "👤",
      title: "Register as Donor",
      desc: "Sign up with your details, blood type, and availability to help save lives in your community with our secure platform.",
      color: "bg-white/20",
    },
    {
      icon: "📅",
      title: "Receive Requests",
      desc: "Get notified when someone needs your blood type and accept or decline requests based on your availability and schedule.",
      color: "bg-gray-200/20",
    },
    {
      icon: "❤️",
      title: "Save Lives",
      desc: "Book a convenient time slot, donate blood safely at certified centers, and make a real difference in someone's life.",
      color: "bg-white/20",
    },
  ];

  return (
    <div className={`fixed inset-0 min-h-screen w-screen overflow-x-hidden ${isDarkMode ? 'bg-black' : 'bg-gradient-to-br from-red-100 via-red-50 to-red-100'} reflective-bg`}>
      <>
        <div className="light-beam absolute top-0 left-0 w-full h-full" style={{ animationDelay: '0s' }}></div>
        <div className="light-beam absolute top-0 left-0 w-full h-full" style={{ animationDelay: '2s' }}></div>
        <div className="light-beam absolute top-0 left-0 w-full h-full" style={{ animationDelay: '4s' }}></div>
        <div className="light-beam absolute top-0 left-0 w-full h-full" style={{ animationDelay: '6s' }}></div>
        <div className="light-beam absolute top-0 left-0 w-full h-full" style={{ animationDelay: '8s' }}></div>
        <div className="shimmer absolute inset-0"></div>
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/5' : 'bg-white/5'} backdrop-blur-[0.5px]`}></div>
        <div className={`absolute inset-0 bg-gradient-to-br ${isDarkMode ? 'from-gray-900/10 via-transparent to-gray-900/10' : 'from-red-200/10 via-transparent to-red-200/10'}`}></div>
      </>

      {/* Top Navigation */}
      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-6 glass-nav">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-500 text-white shadow-lg ring-1 ring-black/10">
              <span className="text-xl">❤️</span>
            </div>
            <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Hope Web</span>
          </div>
          <div className="flex gap-3">
            <ThemeToggle />
            <button
              onClick={() => navigate("/dashboard")}
              className={`px-4 sm:px-5 py-2 rounded-full glass-button text-sm font-medium shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Find Donors
            </button>
            <button
              onClick={() => navigate("/login")}
              className={`px-4 sm:px-5 py-2 rounded-full glass-button text-sm font-medium shadow-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
            >
              Login
            </button>
            <button
              onClick={() => navigate("/register")}
              className={`px-4 sm:px-5 py-2 rounded-full glass-button text-sm font-medium shadow-lg bg-red-500 text-white hover:bg-red-600 ${isDarkMode ? 'text-white' : 'text-white'}`}
            >
              Register
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 pb-24 pt-10 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <section className="w-full flex flex-col items-center px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <h1 className={`text-4xl sm:text-5xl md:text-6xl font-extrabold text-center mb-2 leading-tight sm:leading-tight md:leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Save Lives Through <span className={isDarkMode ? 'text-red-400' : 'text-red-500'}>Blood Donation</span>
          </h1>
          <p className={`text-base sm:text-lg md:text-lg text-center mb-8 max-w-2xl leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            Connect blood donors with those in need. Hope Web makes blood donation accessible, efficient, and life-saving for communities worldwide.
          </p>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 w-full max-w-5xl">
            {stats.map((stat, idx) => (
              <div key={idx} className={`glass-card p-4 sm:p-6 text-center relative group rounded-2xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-black/70 border border-white/30' : 'bg-white/70 border border-black/30'}`}>
                <div className={`absolute inset-0 bg-gradient-to-r ${isDarkMode ? 'from-white/10 to-white/5' : 'from-black/10 to-black/5'} rounded-2xl opacity-90`}></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-3">
                    <span className={`text-2xl sm:text-3xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.icon}</span>
                  </div>
                  <div className={`text-2xl sm:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</div>
                  <div className={`text-xs sm:text-sm opacity-90 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stat.label}</div>
                </div>
                {/* Multiple light beams for enhanced reflections */}
                <div className="light-beam slow-move" style={{ animationDelay: `${idx * 0.3}s` }}></div>
                <div className="light-beam slow-move" style={{ animationDelay: `${idx * 0.3 + 1}s` }}></div>
                <div className="light-beam slow-move" style={{ animationDelay: `${idx * 0.3 + 2}s` }}></div>
                {/* Edge-travelling reflections */}
                <div className="edge-reflection slow-move" style={{ animationDelay: `${idx * 0.4}s` }}></div>
                <div className="edge-reflection slow-move" style={{ animationDelay: `${idx * 0.4 + 1}s` }}></div>
                <div className="edge-reflection slow-move" style={{ animationDelay: `${idx * 0.4 + 2}s` }}></div>
                <div className="edge-reflection slow-move" style={{ animationDelay: `${idx * 0.4 + 3}s` }}></div>
                {/* Shimmer effect */}
                <div className="shimmer absolute inset-0 rounded-2xl"></div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
           <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center mb-12 px-4">
             <button
               onClick={() => navigate("/donor-register")}
               className={`px-6 py-3 rounded-full glass-button font-semibold shadow-lg flex items-center justify-center gap-2 min-w-[200px] relative overflow-hidden ${isDarkMode ? 'bg-black/70 border border-white/30 text-white hover:bg-white/10' : 'bg-white/70 border border-black/30 text-gray-900 hover:bg-black/10'}`}
             >
               <span>❤️</span> Become a Donor
               <div className="light-beam slow-move absolute inset-0 rounded-full pointer-events-none"></div>
             </button>
             <button
               onClick={() => navigate("/find-blood")}
               className={`px-6 py-3 rounded-full glass-button font-semibold shadow-lg flex items-center justify-center gap-2 min-w-[200px] relative overflow-hidden ${isDarkMode ? 'bg-black/70 border border-white/30 text-white hover:bg-white/10' : 'bg-white/70 border border-black/30 text-gray-900 hover:bg-black/10'}`}
             >
               <span>👥</span> Find Blood
               <div className="light-beam slow-move absolute inset-0 rounded-full pointer-events-none"></div>
             </button>
             <button
               onClick={() => navigate("/bloodbank-login")}
               className={`px-6 py-3 rounded-full glass-button font-semibold shadow-lg flex items-center justify-center gap-2 min-w-[200px] relative overflow-hidden ${isDarkMode ? 'bg-black/70 border border-white/30 text-white hover:bg-white/10' : 'bg-white/70 border border-black/30 text-gray-900 hover:bg-black/10'}`}
             >
               <span>🏥</span> Blood Bank Login
               <div className="light-beam slow-move absolute inset-0 rounded-full pointer-events-none"></div>
             </button>
           </div>
         </section>

        {/* How Hope Web Works Section */}
        <section className="w-full flex flex-col items-center mt-8">
          <h2 className={`text-3xl md:text-4xl font-bold text-center mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>How Hope Web Works</h2>
          <p className={`text-md text-center mb-8 max-w-2xl ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
            Join thousands of heroes making a difference through our streamlined donation process
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 w-full max-w-5xl px-4">
            {features.map((feature, idx) => (
              <div key={idx} className={`glass-card p-6 lg:p-8 text-center relative group ${isDarkMode ? 'bg-black/30 border border-white/20' : ''}`}>
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-gray-800/20' : feature.color} rounded-2xl opacity-80`}></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <span className={`text-3xl lg:text-4xl ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{feature.icon}</span>
                  </div>
                  <div className={`text-lg lg:text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{feature.title}</div>
                  <div className={`text-sm lg:text-base opacity-90 ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} leading-relaxed`}>{feature.desc}</div>
                </div>
                {/* Multiple light beams for enhanced reflections */}
                <div className="light-beam" style={{ animationDelay: `${idx * 0.4}s` }}></div>
                <div className="light-beam" style={{ animationDelay: `${idx * 0.4 + 1.5}s` }}></div>
                <div className="light-beam" style={{ animationDelay: `${idx * 0.4 + 3}s` }}></div>
                {/* Edge-travelling reflections */}
                <div className="edge-reflection" style={{ animationDelay: `${idx * 0.5}s` }}></div>
                <div className="edge-reflection" style={{ animationDelay: `${idx * 0.5 + 1}s` }}></div>
                <div className="edge-reflection" style={{ animationDelay: `${idx * 0.5 + 2}s` }}></div>
                <div className="edge-reflection" style={{ animationDelay: `${idx * 0.5 + 3}s` }}></div>
                {/* Shimmer effect */}
                <div className="shimmer absolute inset-0 rounded-2xl"></div>
              </div>
            ))}
          </div>
        </section>
      </main>
      {/* Footer Section */}
      <footer className="w-full bg-transparent py-12 flex flex-col items-center relative">
        <div className={`glass-card p-8 max-w-4xl w-full mx-4 ${isDarkMode ? 'bg-black/30 border border-white/20' : ''}`}>
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-gray-700 to-gray-500 text-white' : 'bg-gradient-to-br from-white to-gray-200 text-black'} shadow-lg ring-1 ring-white/20 shimmer`}>
                <span className="text-xl">❤️</span>
              </div>
            <span className={`text-2xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Hope Web</span>
            </div>
            <p className={`text-base lg:text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-900'} mb-6 max-w-2xl leading-relaxed`}>
              Connecting hearts, saving lives. Join our community of heroes making a difference through blood donation.
            </p>
            <div className={`flex flex-wrap gap-6 lg:gap-8 justify-center ${isDarkMode ? 'text-red-400' : 'text-red-500'} text-sm`}>
              <div className="flex items-center gap-2"><span>🔒</span> Secure & Safe</div>
              <div className="flex items-center gap-2"><span>🕑</span> 24/7 Support</div>
              <div className="flex items-center gap-2"><span>💖</span> Lives Saved Daily</div>
            </div>
          </div>
          {/* Light beam for footer */}
          <div className="light-beam absolute bottom-0 left-0 right-0"></div>
        </div>
      </footer>
    </div>
  );
}
