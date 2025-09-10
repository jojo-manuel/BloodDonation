import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";

export default function BloodBankUpdateDetails() {
  const navigate = useNavigate();

  const handleBackToPending = () => {
    navigate("/bloodbank-pending-approval");
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl w-full">
          <div className="rounded-2xl border border-blue-300 bg-blue-50 p-8 shadow-2xl backdrop-blur-2xl transition dark:border-blue-600 dark:bg-blue-900/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white md:text-4xl mb-2">
                Update Blood Bank Details
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Please update your blood bank registration details below.
              </p>
            </div>

            {/* Form or details to update blood bank info can be added here */}

            <div className="mt-8 text-center">
              <button
                onClick={handleBackToPending}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-3 font-semibold text-white shadow-lg ring-1 ring-black/10 transition hover:scale-[1.02] hover:shadow-blue-500/30 active:scale-[0.99]"
              >
                Back to Pending Approval
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
