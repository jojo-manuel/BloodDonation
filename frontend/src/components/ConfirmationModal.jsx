import React, { useState } from 'react';

const ConfirmationModal = ({ isOpen, title, message, type = 'confirm', onConfirm, onCancel, inputPlaceholder }) => {
    const [inputValue, setInputValue] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-gray-700 transform transition-all scale-100">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

                {(type === 'prompt_required' || type === 'prompt_optional') && (
                    <input
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white mb-6 focus:ring-2 focus:ring-rose-500 outline-none transition-all"
                        placeholder={inputPlaceholder || "Enter value..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        autoFocus
                    />
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={() => { setInputValue(''); onCancel(); }}
                        className="px-5 py-2.5 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (type === 'prompt_required' && !inputValue.trim()) return;
                            onConfirm(inputValue);
                            setInputValue('');
                        }}
                        className="px-5 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg hover:shadow-red-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={type === 'prompt_required' && !inputValue.trim()}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
