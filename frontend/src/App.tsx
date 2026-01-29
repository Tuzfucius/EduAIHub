import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';

function AppContent() {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-600 dark:text-slate-400">加载中...</p>
                </div>
            </div>
        );
    }

    return user ? <Dashboard /> : <AuthPage />;
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
