import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogOut, User as UserIcon, Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { email, role, logout, isAuthenticated } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const roleLabels: Record<string, string> = {
    applicant:       'Applicant',
    policy_manager:  'Policy Manager',
    senior_manager:  'Senior Manager',
  };

  const roleColors: Record<string, string> = {
    applicant:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    policy_manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    senior_manager: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  const isLight = theme === 'light';

  return (
    <nav
      className="border-b sticky top-0 z-50 px-6 py-3.5 transition-all duration-300"
      style={{
        background: isLight
          ? '#1a2738'
          : 'rgba(10,13,22,0.88)',
        borderBottomColor: isLight
          ? 'rgba(255,255,255,0.07)'
          : 'rgba(30,41,59,0.80)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-lg shadow-brand-500/25">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className={`text-xl font-bold tracking-tight ${isLight ? 'text-white' : 'text-white'}`}>
            Insure<span className="text-brand-300">Trust</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User pill */}
          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-1.5 border transition-colors"
            style={{
              background: isLight ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.60)',
              borderColor: isLight ? 'rgba(255,255,255,0.12)' : 'rgba(30,41,59,0.80)',
            }}
          >
            <div
              className="p-1 rounded-lg"
              style={{ background: isLight ? 'rgba(255,255,255,0.15)' : 'rgba(30,41,59,0.80)' }}
            >
              <UserIcon className={`h-4 w-4 ${isLight ? 'text-slate-200' : 'text-slate-400'}`} />
            </div>
            <div className="flex flex-col">
              <span
                className="text-xs max-w-[150px] truncate font-medium"
                style={{ color: isLight ? '#e2e8f0' : '#94a3b8' }}
              >
                {email}
              </span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border inline-block max-w-max mt-0.5 ${
                  roleColors[role || ''] || ''
                }`}
              >
                {roleLabels[role || ''] || role}
              </span>
            </div>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: isLight ? 'rgba(255,255,255,0.10)' : 'rgba(15,23,42,0.70)',
              borderColor: isLight ? 'rgba(255,255,255,0.15)' : 'rgba(30,41,59,0.80)',
            }}
          >
            {isLight ? (
              <Moon className="h-4 w-4 text-slate-200" />
            ) : (
              <Sun className="h-4 w-4 text-amber-400" />
            )}
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 border px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium"
            style={{
              background: isLight ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.70)',
              borderColor: isLight ? 'rgba(255,255,255,0.12)' : 'rgba(30,41,59,0.80)',
              color: isLight ? '#e2e8f0' : '#94a3b8',
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
