import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertTriangle, Activity, Database, Loader } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function AIAnalysisModule({ patientId, patientName, onComplete }) {
    const { showToast } = useToast();
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [hbCount, setHbCount] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [results, setResults] = useState(null);

    const fileInputRef = useRef(null);

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showToast("Please select a valid image file", "error");
                return;
            }
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResults(null);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResults(null);
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) {
            showToast("Please upload a blood smear image", "error");
            return;
        }
        if (!hbCount || isNaN(hbCount)) {
            showToast("Please enter a valid Hemoglobin (Hb) count", "error");
            return;
        }

        setIsAnalyzing(true);
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('hbCount', parseFloat(hbCount));
        if (patientId) formData.append('patientId', patientId);

        try {
            const res = await api.post('/analysis/blood-sample', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                setResults(res.data.data);
                if (onComplete) onComplete(res.data.data);
                showToast("Analysis complete", "success");
            }
        } catch (err) {
            console.error("AI Analysis Error:", err);
            showToast(err.response?.data?.message || "Failed to analyze blood sample", "error");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const resetAnalysis = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setHbCount('');
        setResults(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700 animate-fadeIn">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="w-6 h-6 text-indigo-500" />
                AI Blood Sample Analysis (Experimental)
            </h3>

            {(patientName || patientId) && (
                <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex gap-4">
                    <div>
                        <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">Patient context</p>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                            {patientName || "Unknown"} <span className="opacity-50">({patientId || "No MRID"})</span>
                        </p>
                    </div>
                </div>
            )}

            {!results ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left side - Image Upload */}
                    <div
                        className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[300px] hover:bg-gray-50 dark:hover:bg-gray-700/50
                            ${previewUrl ? 'border-indigo-500 bg-indigo-50/10' : 'border-gray-300 dark:border-gray-600'}
                        `}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/jpeg, image/png"
                            className="hidden"
                        />

                        {previewUrl ? (
                            <div className="relative w-full h-full flex flex-col items-center">
                                <img src={previewUrl} alt="Preview" className="max-h-[220px] rounded-lg shadow-md mb-4 object-contain" />
                                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Click or drag to replace image</p>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                                    <UploadCloud className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Upload Microscopic Image</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                                    Drag and drop a peripheral blood smear image (PNG, JPG) or click to browse.
                                </p>
                            </>
                        )}
                    </div>

                    {/* Right side - Data Input & Action */}
                    <div className="flex flex-col justify-center space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                <Database className="w-4 h-4 text-indigo-500" />
                                Patient Hemoglobin (Hb) Count
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    value={hbCount}
                                    onChange={(e) => setHbCount(e.target.value)}
                                    placeholder="e.g. 13.5"
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                                />
                                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                    g/dL
                                </span>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30">
                            <h5 className="text-sm font-bold text-indigo-800 dark:text-indigo-300 flex items-center gap-2 mb-2">
                                💡 How it works
                            </h5>
                            <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80 leading-relaxed">
                                Our multi-modal AI model uses a Convolutional Neural Network (CNN) to detect anomalies in cell morphology, passing it alongside numerical tabular data (Hb Count) directly through a fused classification head.
                            </p>
                        </div>

                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing || !selectedFile || !hbCount}
                            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${isAnalyzing || !selectedFile || !hbCount
                                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/30 hover:scale-[1.02]'
                                }`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <Loader className="w-6 h-6 animate-spin" />
                                    Analyzing Data...
                                </>
                            ) : (
                                <>
                                    <Activity className="w-6 h-6" />
                                    Run AI Analysis
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                /* Results View */
                <div className="animate-fadeIn">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                        {/* Overall Result Banner */}
                        <div className={`col-span-1 md:col-span-3 rounded-2xl p-6 border-2 flex items-center justify-between ${results.infectionDetected
                                ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50'
                                : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800/50'
                            }`}>
                            <div className="flex items-center gap-4">
                                {results.infectionDetected ? (
                                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                                        <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                                    </div>
                                ) : (
                                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center">
                                        <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                                    </div>
                                )}
                                <div>
                                    <h4 className={`text-2xl font-bold ${results.infectionDetected ? 'text-red-800 dark:text-red-300' : 'text-emerald-800 dark:text-emerald-300'}`}>
                                        {results.infectionDetected ? 'Infection Anomaly Detected' : 'Sample Appears Normal'}
                                    </h4>
                                    <p className={`text-sm mt-1 font-medium ${results.infectionDetected ? 'text-red-600/80 dark:text-red-400/80' : 'text-emerald-600/80 dark:text-emerald-400/80'}`}>
                                        AI Confidence Prediction Score: {results.infectionProbability}%
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={resetAnalysis}
                                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                New Analysis
                            </button>
                        </div>

                        {/* Image Preview Block */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-col">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Analyzed Image</p>
                            <img src={previewUrl} alt="Analyzed Sample" className="w-full h-40 object-cover rounded-lg shadow-sm" />
                        </div>

                        {/* Tabular Data Block */}
                        <div className="col-span-1 md:col-span-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-4">Diagnostics Reasoning</p>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-600/50 shadow-sm">
                                    <p className="text-xs text-gray-500 mb-1">Provided Hb Count</p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">{results.hbCount} <span className="text-sm font-normal text-gray-400">g/dL</span></p>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4">
                                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-2">Algorithm Flags:</p>
                                {results.anomalies?.length > 0 ? (
                                    results.anomalies.map((anomaly, idx) => (
                                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                                            {anomaly}
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                        No specific metric anomalies flagged.
                                    </div>
                                )}
                            </div>

                            {results.warning && (
                                <p className="text-xs text-orange-500 mt-4 italic font-medium opacity-80 border-t border-gray-200 dark:border-gray-700 pt-4">
                                    * {results.warning}
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
