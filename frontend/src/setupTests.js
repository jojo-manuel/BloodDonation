
import '@testing-library/jest-dom';

// Polyfill for TextEncoder/TextDecoder
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

process.env.VITE_API_BASE_URL = 'http://localhost:5000/api';

// Mock window.alert
Object.defineProperty(window, 'alert', { writable: true, value: jest.fn() });

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Jest Mock for API
jest.mock('./lib/api', () => {
    const mockApi = {
        get: jest.fn(() => Promise.resolve({ data: { success: true, data: [] } })),
        post: jest.fn(() => Promise.resolve({ data: { success: true } })),
        put: jest.fn(() => Promise.resolve({ data: { success: true } })),
        patch: jest.fn(() => Promise.resolve({ data: { success: true } })),
        delete: jest.fn(() => Promise.resolve({ data: { success: true } })),
        interceptors: {
            request: { use: jest.fn(), eject: jest.fn() },
            response: { use: jest.fn(), eject: jest.fn() }
        },
        defaults: { headers: { common: {} } }
    };

    return {
        __esModule: true,
        default: mockApi,
        ...mockApi, // Allow named imports if any matching keys
        // Specific named exports
        getAddressByPostalCode: jest.fn(() => Promise.resolve({})),
        getAddressFromPincodeAPI: jest.fn(() => Promise.resolve({})),
        createReview: jest.fn(() => Promise.resolve({})),
        getDonorReviews: jest.fn(() => Promise.resolve({})),
        getBloodBankReviews: jest.fn(() => Promise.resolve({})),
        getMyReviews: jest.fn(() => Promise.resolve({})),
        updateReview: jest.fn(() => Promise.resolve({})),
        deleteReview: jest.fn(() => Promise.resolve({})),
        getReviewableDonors: jest.fn(() => Promise.resolve({})),
        getReviewableBloodBanks: jest.fn(() => Promise.resolve({})),
        getSettings: jest.fn(() => Promise.resolve({})),
        updateSettings: jest.fn(() => Promise.resolve({})),
        resetSettings: jest.fn(() => Promise.resolve({})),
        updateSettingCategory: jest.fn(() => Promise.resolve({}))
    };
});
