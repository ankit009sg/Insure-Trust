import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin, useRegister } from '../hooks/useAuth';
import { Shield, Mail, Lock, LogIn, UserPlus, HelpCircle } from 'lucide-react';
import { Role } from '../types';

export const Login: React.FC = () => {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: '',
    }
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setError(null);
    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
      // Use role from the response directly (not from stale mutation state)
      if (result.role === 'applicant') navigate('/dashboard');
      else if (result.role === 'policy_manager') navigate('/policy-dashboard');
      else if (result.role === 'senior_manager') navigate('/senior-dashboard');
      else navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // Quick seed / login helper
  const handlePresetLogin = async (role: Role, email: string) => {
    setError(null);
    setLoading(true);
    const password = 'password123';
    
    // Set form fields for visual feedback
    setValue('email', email);
    setValue('password', password);

    const doRedirect = (r: string) => {
      if (r === 'applicant') navigate('/dashboard');
      else if (r === 'policy_manager') navigate('/policy-dashboard');
      else if (r === 'senior_manager') navigate('/senior-dashboard');
    };

    try {
      // 1. Try to login
      const result = await loginMutation.mutateAsync({ email, password });
      doRedirect(result.role);
    } catch (err: any) {
      // 2. If user doesn't exist, auto-register them
      if (err.response?.status === 401 || err.response?.data?.detail?.includes('Incorrect')) {
        try {
          await registerMutation.mutateAsync({ email, password, role });
          // Now login
          const result = await loginMutation.mutateAsync({ email, password });
          doRedirect(result.role);
        } catch (regErr: any) {
          setError(regErr.response?.data?.detail || 'Failed to auto-seed preset role.');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to authenticate preset.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl"></div>

      <div className="w-full max-w-md glass-panel p-8 border-slate-800 shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 shadow-lg shadow-brand-500/20 mb-3 animate-pulse">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            Welcome to Insure<span className="text-brand-400">Verify</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
            AI-powered life insurance application intake platform.
          </p>
        </div>

        {error && (
          <div className="mb-5 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs font-semibold">
            {error}
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
                {...register('password', { required: 'Password is required' })}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-850 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 backdrop-blur-sm transition-all"
              />
            </div>
            {errors.password && (
              <span className="text-[10px] text-red-400 mt-1 block">{errors.password.message}</span>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-brand-500/10 hover:shadow-brand-500/20 active:scale-98 transition-all disabled:opacity-50 mt-6 text-sm"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                <span>Securing session...</span>
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </div>

        {/* Preset Testing Credentials Bar */}
        <div className="mt-8 pt-6 border-t border-slate-850">
          <div className="flex items-center gap-1.5 mb-3 text-slate-400">
            <HelpCircle className="h-3.5 w-3.5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Testing Presets (Auto-Seed & Login)
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handlePresetLogin('applicant', 'applicant@insureverify.com')}
              disabled={loading}
              className="bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Applicant
            </button>
            <button
              onClick={() => handlePresetLogin('policy_manager', 'policy@insureverify.com')}
              disabled={loading}
              className="bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Policy Mgr
            </button>
            <button
              onClick={() => handlePresetLogin('senior_manager', 'senior@insureverify.com')}
              disabled={loading}
              className="bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 text-purple-400 rounded-lg py-2 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-40"
            >
              Senior Mgr
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
