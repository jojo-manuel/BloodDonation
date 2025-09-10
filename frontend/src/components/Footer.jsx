import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-white/20 bg-white/10 backdrop-blur-md dark:border-white/10 dark:bg-white/5">
      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg ring-1 ring-black/10 dark:ring-white/10">
                <span className="text-xl">🩸</span>
              </div>
              <div className="leading-tight">
                <p className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent dark:from-rose-300 dark:to-amber-200">
                  Blood Donation
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Connect. Donate. Save lives.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Connecting donors with those in need, saving lives one donation at a time.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-sm text-gray-600 transition hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-300">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/donor-register" className="text-sm text-gray-600 transition hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-300">
                  Become a Donor
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-600 transition hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-300">
                  Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-gray-600 transition hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-300">
                  Register
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Services</h3>
            <ul className="space-y-2">
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">Blood Bank Registration</span>
              </li>
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">Donor Management</span>
              </li>
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">Patient Records</span>
              </li>
              <li>
                <span className="text-sm text-gray-600 dark:text-gray-400">Emergency Requests</span>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Contact</h3>
            <ul className="space-y-2">
              <li className="text-sm text-gray-600 dark:text-gray-400">
                📧 support@blooddonation.com
              </li>
              <li className="text-sm text-gray-600 dark:text-gray-400">
                📞 Emergency: 1800-BLOOD
              </li>
              <li className="text-sm text-gray-600 dark:text-gray-400">
                🏥 24/7 Support Available
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8 border-t border-white/20 pt-8 dark:border-white/10">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2024 Blood Donation Platform. All rights reserved.
            </p>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-gray-600 transition hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-300">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-600 transition hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-300">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
