import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="glass-card w-full py-12 flex flex-col items-center">
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
            <span className="text-xl">❤️</span>
          </div>
          <span className="text-2xl font-bold text-white">Hope Web</span>
        </div>
        <p className="text-md text-gray-200 text-center mb-4 max-w-xl">
          Connecting hearts, saving lives. Join our community of heroes making a difference through blood donation.
        </p>
        <div className="flex gap-8 justify-center mt-2 text-pink-300 text-sm">
          <div className="flex items-center gap-2"><span>🔒</span> Secure &amp; Safe</div>
          <div className="flex items-center gap-2"><span>🕑</span> 24/7 Support</div>
          <div className="flex items-center gap-2"><span>💖</span> Lives Saved Daily</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
