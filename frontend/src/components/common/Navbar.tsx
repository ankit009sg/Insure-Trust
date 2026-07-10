import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, LogOut, User as UserIcon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { email, role, logout, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) return null;

  const roleLabels: Record<string, string> = {
    applicant: 'Applicant',
    policy_manager: 'Policy Manager',
    senior_manager: 'Senior Manager',
  };

  const roleColors: Record<string, string> = {
    applicant: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    policy_manager: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    senior_manager: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-lg shadow-brand-500/20">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Insure<span className="text-brand-400">Verify</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-1.5">
            <div className="p-1 rounded-lg bg-slate-850">
              <UserIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 max-w-[150px] truncate font-medium">{email}</span>
              <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border inline-block max-w-max mt-0.5 ${roleColors[role || ''] || ''}`}>
                {roleLabels[role || ''] || role}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white px-4 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};
