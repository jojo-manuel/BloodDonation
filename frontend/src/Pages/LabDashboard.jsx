import React from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import AIAnalysisModule from "../components/AIAnalysisModule";

export default function LabDashboard() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/staff-login");
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50 p-6 md:p-8">
                <div className="max-w-7xl mx-auto space-y-8 animate-fadeIn">
                    {/* Header */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white flex items-center gap-3">
                                <span className="text-4xl">🔬</span>
                                Laboratory Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                AI Blood Infection Analysis & Smear Testing
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="px-6 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-2"
                        >
                            <span>🚪</span> Logout
                        </button>
                    </div>

                    {/* AI Infection Module */}
                    <div className="w-full">
                        <AIAnalysisModule
                            patientId=""
                            patientName=""
                        />
                    </div>
                </div>
            </div>
        </Layout>
    );
}
