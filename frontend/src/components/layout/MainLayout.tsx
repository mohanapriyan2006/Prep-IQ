import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { AuthModal } from '../auth/AuthModal';
import { SetupOnboardingModal } from '../auth/SetupOnboardingModal';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useState } from 'react';

export function MainLayout() {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isWorkspaceRoute = location.pathname.startsWith('/problems/');

  return (
    <div className="flex min-h-screen bg-[#0B0F14]">
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <div className="flex-1 lg:ml-65">
        <Navbar onMenuClick={() => setMobileSidebarOpen((prev) => !prev)} />
        <main className={isWorkspaceRoute ? 'p-3 sm:p-4 lg:p-5' : 'p-4 sm:p-6 lg:p-8'}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <AuthModal />
      <SetupOnboardingModal />
    </div>
  );
}
