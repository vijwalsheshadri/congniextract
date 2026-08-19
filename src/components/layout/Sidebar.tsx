import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Network,
  FileBarChart,
  LogOut,
  Menu,
  X,
  Brain,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'Analyze Text', icon: FileText },
  { path: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
  { path: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-slate-200"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-slate-700" />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-white border-r border-slate-200 flex flex-col z-40 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-[15px] tracking-tight">CogniExtract</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = isActive(path);
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-teal-50 text-teal-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] ${active ? 'text-teal-600' : 'text-slate-400'}`} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3.5 py-2 mb-2">
            <p className="text-xs text-slate-400 font-medium truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            <LogOut className="w-[18px] h-[18px] text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
