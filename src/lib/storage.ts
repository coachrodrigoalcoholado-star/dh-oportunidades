
export interface LoanConfig {
    id: number;
    installments: number;
    rate: number;
    active: boolean;
}

export interface User {
    id: string;
    email: string;
    role: 'admin' | 'advisor';
    name: string;
    password?: string; // Simple mock password
}

export interface Analytics {
    [userId: string]: number; // userId -> count of budgets generated
}

const STORAGE_KEYS = {
    CONFIG: 'dh_loan_config',
    USERS: 'dh_users',
    ANALYTICS: 'dh_analytics',
};

// Initial Data Seeds
const DEFAULT_CONFIG: LoanConfig[] = [
    { id: 1, installments: 4, rate: 0.35, active: true },
    { id: 2, installments: 6, rate: 0.47, active: true },
    { id: 3, installments: 8, rate: 0.65, active: true },
    { id: 4, installments: 10, rate: 0.85, active: true },
];

const DEFAULT_USERS: User[] = [
    { id: 'admin-1', email: 'admin@dh.com', role: 'admin', name: 'Super Admin', password: 'admin' },
    { id: 'advisor-1', email: 'user@dh.com', role: 'advisor', name: 'Asesor Demo', password: 'user' },
];

export const storage = {
    // Initialize Storage if empty
    init: () => {
        if (typeof window === 'undefined') return;

        if (!localStorage.getItem(STORAGE_KEYS.CONFIG)) {
            localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
        }
        if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(DEFAULT_USERS));
        }
        if (!localStorage.getItem(STORAGE_KEYS.ANALYTICS)) {
            localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify({}));
        }
    },

    // --- CONFIGURATION ---
    getConfig: (): LoanConfig[] => {
        if (typeof window === 'undefined') return DEFAULT_CONFIG;
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || '[]');
    },

    saveConfig: (config: LoanConfig[]) => {
        localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    },

    // --- USERS ---
    getUsers: (): User[] => {
        if (typeof window === 'undefined') return [];
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    },

    saveUser: (newUser: User) => {
        const users = storage.getUsers();
        // Update if exists, else add
        const index = users.findIndex(u => u.id === newUser.id);
        if (index >= 0) {
            users[index] = newUser;
        } else {
            users.push(newUser);
        }
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    deleteUser: (userId: string) => {
        const users = storage.getUsers().filter(u => u.id !== userId);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    },

    // --- ANALYTICS ---
    incrementBudgetCount: (userId: string) => {
        const analytics = JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || '{}');
        analytics[userId] = (analytics[userId] || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.ANALYTICS, JSON.stringify(analytics));
    },

    getAnalytics: (): Analytics => {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ANALYTICS) || '{}');
    }
};
