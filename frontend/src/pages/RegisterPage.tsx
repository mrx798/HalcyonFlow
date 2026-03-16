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
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-purple-600/20 rounded-2xl border border-purple-500/30 mb-4"
          >
            <UserPlus className="w-8 h-8 text-purple-500" />
          </motion.div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Join FlowForge
          </h1>
          <p className="text-slate-400 mt-2">Automate your workflows today</p>
        </div>

        <div className="glass-card p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4" /> Full Name
              </label>
              <input
                {...register('name')}
                type="text"
                placeholder="John Doe"
                className={`w-full input-field ${errors.name ? 'border-red-500' : ''}`}
              />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Mail className="w-4 h-4" /> Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                placeholder="name@company.com"
                className={`w-full input-field ${errors.email ? 'border-red-500' : ''}`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4" /> Password
              </label>
              <input
                {...register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full input-field ${errors.password ? 'border-red-500' : ''}`}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center gap-2 group !bg-purple-600 hover:!bg-purple-500 shadow-purple-900/20"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-700/50 text-center">
            <p className="text-slate-400 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-purple-500 hover:text-purple-400 font-medium hover:underline transition-colors">
                Sign in instead
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
