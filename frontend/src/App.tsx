import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import MainLayout, { PageType } from './components/layout/MainLayout';
import AuthPage from './pages/Auth';
import Dashboard from './pages/Dashboard';
import AISolver from './pages/AISolver';
import Materials from './pages/Materials';
import Settings from './pages/Settings';

function AppContent() {
    const { user, isLoading } = useAuth();
    const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

    if (isLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--md-surface)' }}
            >
                <div className="text-center">
                    <div
                        className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4"
                        style={{ borderColor: 'var(--md-primary)', borderTopColor: 'transparent' }}
                    />
                    <p style={{ color: 'var(--md-on-surface-variant)' }}>加载中...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    // Render current page
    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard />;
            case 'ai-solver':
                return <AISolver />;
            case 'materials':
                return <Materials />;
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard />;
        }
    };

    return (
        <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
            {renderPage()}
        </MainLayout>
    );
}

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
