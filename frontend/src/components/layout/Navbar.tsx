import { useLocation } from 'react-router-dom';
import { BellDot, Search, Flame, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'AI-powered overview of your placement readiness' },
  '/problems': { title: 'Problems', subtitle: 'LeetCode-style list with premium filters, tags, bookmarks, and status' },
  '/roadmap': { title: 'Roadmap', subtitle: 'AI-generated personalized study plan' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into your performance metrics' },
  '/tutorials': { title: 'Tutorials', subtitle: 'Topic-wise concept guides, examples, and complexity notes' },
  '/contests': { title: 'Contests', subtitle: 'Track upcoming, live, and past coding contests' },
  '/profile': { title: 'Profile', subtitle: 'Connect external coding profiles and sync platform stats' },
};

function resolvePageInfo(pathname: string): { title: string; subtitle: string } {
  if (pathname.startsWith('/problems/')) {
    return { title: 'Problem Workspace', subtitle: 'Solve, run, and submit code with real test case evaluation' };
  }
  return pageTitles[pathname] || { title: 'PrepIQ', subtitle: '' };
}

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const location = useLocation();
  const pageInfo = resolvePageInfo(location.pathname);

  return (
    <header className="sticky top-0 z-40 h-20 bg-[#0B0F14]/90 backdrop-blur-xl border-b border-[#222A33]">
      <div className="flex items-center justify-between h-full px-8">
        {/* Left side - Page title */}
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-lg font-bold text-[#E5E7EB]">{pageInfo.title}</h1>
          <p className="text-xs text-[#9CA3AF] mt-0.5">{pageInfo.subtitle}</p>
        </motion.div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2.5 rounded-xl bg-[#111827]/60 border border-[#1F2937]/40 hover:bg-[#1F2937]/60 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-4 h-4 text-[#9CA3AF]" />
          </button>

          {/* Search bar */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search problems, topics..."
              className="w-64 pl-10 pr-4 py-2 rounded-xl bg-[#111827]/80 border border-[#1F2937]/60 text-sm text-[#E5E7EB] placeholder-[#9CA3AF]/60 focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all"
            />
            <kbd className="absolute right-3 text-[10px] text-[#9CA3AF]/40 border border-[#1F2937] rounded px-1.5 py-0.5">
              ⌘K
            </kbd>
          </div>

          {/* Streak indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F97316]/10 border border-[#F97316]/20">
            <Flame className="w-3.5 h-3.5 text-[#F97316]" />
            <span className="text-xs font-semibold text-[#F97316]">7 day streak</span>
          </div>

          {/* Notification bell */}
          <button className="relative p-2.5 rounded-xl bg-[#111827]/60 border border-[#1F2937]/40 hover:bg-[#1F2937]/60 transition-colors">
            <BellDot className="w-4 h-4 text-[#9CA3AF]" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#6366F1] border-2 border-[#0B1120]" />
          </button>
        </div>
      </div>
    </header>
  );
}
