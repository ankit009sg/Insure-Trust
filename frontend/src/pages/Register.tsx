import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister } from '../hooks/useAuth';
import { Shield, Mail, Lock, UserPlus, ArrowLeft, Users } from 'lucide-react';
import { Role } from '../types';

export const Register: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
      role: 'applicant' as Role,
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const registerMutation = useRegister();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setError(null);
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        password: data.password,
        role: data.role,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Email might already exist.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background glow bubbles */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-brand-500/5 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 border-slate-800 shadow-2xl relative z-10">
        <Link to="/login" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-6 inline-flex">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Login</span>
        </Link>

        <div className="flex flex-col items-center mb-6 text-center">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-lg shadow-brand-500/20 mb-3 text-white">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">Create Portal Account</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
            Set up credentials to access the InsureVerify underwriting portal.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs font-semibold">
            Account created successfully! Redirecting to login...
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                type="email"
                {...register('email', { required: 'Email is required' })}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 backdrop-blur-sm transition-all"
              />
            </div>
            {errors.email && (
              <span className="text-[10px] text-red-400 mt-1 block">{errors.email.message}</span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                type="password"
                {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 backdrop-blur-sm transition-all"
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-red-400 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1.5">
              Portal Account Role
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                <Users className="h-4 w-4" />
              </span>
              <select
                {...register('role', { required: 'Role is required' })}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-850 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 backdrop-blur-sm transition-all"
              >
                <option value="applicant">Applicant</option>
                <option value="policy_manager">Policy Manager (Underwriter)</option>
                <option value="senior_manager">Senior Manager (Executive Underwriter)</option>
              </select>
            </div>
            {errors.role && (
              <span className="text-[10px] text-red-400 mt-1 block">{errors.role.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={registerMutation.isPending || success}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98 transition-all disabled:opacity-50 mt-6 text-sm"
          >
            {registerMutation.isPending ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                <span>Creating profile...</span>
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                <span>Create Portal Account</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
