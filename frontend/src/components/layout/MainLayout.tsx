/**
 * MainLayout - 主布局容器
 */
import React, { useState } from 'react';
import Sidebar, { PageType, MobileMenuButton } from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
    currentPage: PageType;
    onNavigate: (page: PageType) => void;
}

export default function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div
            className="min-h-screen flex"
            style={{ backgroundColor: 'var(--md-surface)' }}
        >
            {/* Sidebar */}
            <Sidebar
                currentPage={currentPage}
                onNavigate={onNavigate}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            {/* Main content */}
            <div className="flex-1 lg:ml-72 flex flex-col min-h-screen">
                {/* Mobile header */}
                <header
                    className="lg:hidden h-16 px-4 flex items-center gap-3 sticky top-0 z-10 elevation-1"
                    style={{ backgroundColor: 'var(--md-surface-container)' }}
                >
                    <MobileMenuButton onClick={() => setSidebarOpen(true)} />
                    <span
                        className="font-medium text-lg"
                        style={{ color: 'var(--md-on-surface)' }}
                    >
                        EduAIHub
                    </span>
                </header>

                {/* Page content */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export type { PageType };
