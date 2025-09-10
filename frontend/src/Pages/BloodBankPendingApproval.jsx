import React from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";

export default function BloodBankPendingApproval() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/bloodbank-login";
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full overflow-auto max-h-[600px]">
          {/* Pending Approval Card */}
          <div className="rounded-2xl border border-yellow-300 bg-yellow-50 p-8 shadow-2xl backdrop-blur-2xl transition dark:border-yellow-600 dark:bg-yellow-900/20">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <span className="bg-yellow-400/20 rounded-full p-6 text-6xl">⏳</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl mb-2">
                Registration Pending Approval
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Your blood bank registration is currently under review by our administrators.
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  What happens next?
                </h3>
                <div className="space-y-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-3">
                    <span className="bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">1</span>
                    <p>Our administrators will review your registration details and documentation.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">2</span>
                    <p>You will receive an email notification once a decision has been made.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-yellow-400 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5">3</span>
                    <p>If approved, you'll gain full access to the blood bank dashboard and features.</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Need Help?
                </h3>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  If you have any questions about your registration or need to update your information,
                  please contact our support team.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href="mailto:support@hopeweb.com"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    📧 Contact Support
                  </a>
                  <a
                    href="tel:+1234567890"
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-700 transition"
                  >
                    📞 Call Support
                  </a>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-green-900 dark:text-green-100 mb-3">
                  While You Wait
                </h3>
                <p className="text-green-800 dark:text-green-200 mb-4">
                  You can still access some features of our platform as a regular user.
                </p>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  🔐 Login as User
                </Link>
                <Link
                  to="/bloodbank-update-details"
                  className="inline-flex items-center justify-center mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  ✏️ Update Blood Bank Details
                </Link>
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-rose-500 px-6 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-rose-500/30 active:scale-[0.99]"
              >
                <span className="mr-2">🚪</span>
                Logout
              </button>
              <div className="mt-4">
                <Link to="/" className="text-sm text-gray-600 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
