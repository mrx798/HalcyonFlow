import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { authApi } from '../api/auth.api';
import { ApiResponse, AuthResponse } from '../types/auth';
import { toast } from 'sonner';
import { User, Mail, Lock, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterForm = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      const authData = response.data.data;
      setAuth(
        authData.accessToken,
        authData.refreshToken,
        { id: authData.userId, name: authData.name, email: authData.email, role: authData.role } as any
      );
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Registration failed';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080808]">
      {/* Left panel (40% width) */}
      <div className="hidden lg:flex flex-col justify-between w-[40%] bg-[#0a0a0a] p-12 border-r border-white/[0.06] relative">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
        
        {/* Top: Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="text-amber-400 text-2xl">⚡</div>
          <span className="text-[#fafafa] font-semibold text-2xl tracking-tight">HalcyonFlow</span>
        </div>

        {/* Middle: Tagline and features */}
        <div className="relative z-10">
          <h1 className="text-[#fafafa] text-4xl font-bold tracking-tight leading-tight mb-8">
            Automate your business.<br />Without limits.
          </h1>
          <div className="flex flex-wrap gap-3">
            <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-[#a1a1a1]">⚡ Rule Engine</span>
            <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-[#a1a1a1]">🔄 Visual Builder</span>
            <span className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-xs text-[#a1a1a1]">📊 Real-time Logs</span>
          </div>
        </div>

        {/* Bottom: Quote */}
        <div className="relative z-10">
          <p className="text-[#525252] text-sm italic">"Built for teams who move fast"</p>
        </div>
      </div>

      {/* Right panel (60% width) */}
      <div className="w-full lg:w-[60%] flex items-center justify-center p-8 bg-[#080808]">
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.3 }}
           className="w-full max-w-sm"
        >
          <div className="bg-[#0e0e0e] border border-white/[0.08] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h2 className="text-[#fafafa] text-xl font-semibold tracking-tight mb-6">Create your account</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-[#a1a1a1] text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  Full Name
                </label>
                <input
                  {...register('name')}
                  type="text"
                  placeholder="John Doe"
                  className={`bg-[#141414] border border-white/[0.10] rounded-lg px-4 py-2.5 text-[#fafafa] text-sm placeholder-[#525252] focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-150 w-full ${errors.name ? '!border-red-500/60 !ring-red-500/30' : ''}`}
                />
                {errors.name && (
                  <p className="text-[10px] text-red-500 mt-1.5">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[#a1a1a1] text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  Email Address
                </label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="name@company.com"
                  className={`bg-[#141414] border border-white/[0.10] rounded-lg px-4 py-2.5 text-[#fafafa] text-sm placeholder-[#525252] focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-150 w-full ${errors.email ? '!border-red-500/60 !ring-red-500/30' : ''}`}
                />
                {errors.email && (
                  <p className="text-[10px] text-red-500 mt-1.5">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-[#a1a1a1] text-xs font-medium uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  Password
                </label>
                <input
                  {...register('password')}
                  type="password"
                  placeholder="••••••••"
                  className={`bg-[#141414] border border-white/[0.10] rounded-lg px-4 py-2.5 text-[#fafafa] text-sm placeholder-[#525252] focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 outline-none transition-all duration-150 w-full ${errors.password ? '!border-red-500/60 !ring-red-500/30' : ''}`}
                />
                {errors.password && (
                  <p className="text-[10px] text-red-500 mt-1.5">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-black font-semibold py-2.5 rounded-lg w-full transition-all duration-150 text-sm mt-4 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-[#525252] text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
                  Sign in instead
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;

