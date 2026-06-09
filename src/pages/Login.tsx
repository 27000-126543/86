import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Lock, User, UtensilsCrossed, ChefHat } from 'lucide-react';
import { Loading } from '../components/Loading';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login({ username, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || '登录失败，请检查用户名和密码');
    }
  };

  const quickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1929 via-[#0F2B5B] to-[#163a75] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#00D4FF] to-[#0066FF] rounded-2xl mb-6 shadow-lg shadow-[#00D4FF]/20">
            <UtensilsCrossed className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            智慧运营平台
          </h1>
          <p className="text-[#8CA2BD] text-lg">Smart Operation Platform</p>
        </div>

        <div className="bg-[#0A1929]/80 backdrop-blur-xl rounded-2xl p-8 border border-[#1E3A5F]/50 shadow-2xl">
          <div className="flex items-center gap-2 mb-6">
            <ChefHat className="w-6 h-6 text-[#00D4FF]" />
            <h2 className="text-xl font-semibold text-white">账号登录</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#8CA2BD] mb-2">用户名</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A7FA6]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0D1B2A] border border-[#1E3A5F] rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-[#5A7FA6] focus:outline-none focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 transition-all"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#8CA2BD] mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5A7FA6]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0D1B2A] border border-[#1E3A5F] rounded-xl py-3.5 pl-12 pr-12 text-white placeholder-[#5A7FA6] focus:outline-none focus:border-[#00D4FF] focus:ring-2 focus:ring-[#00D4FF]/20 transition-all"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5A7FA6] hover:text-[#8CA2BD] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#00D4FF] to-[#0066FF] text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#00D4FF]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <Loading type="spinner" size="sm" /> : null}
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#1E3A5F]/50">
            <p className="text-sm text-[#5A7FA6] mb-3 text-center">快捷登录（密码均为 123456）</p>
            <div className="grid grid-cols-5 gap-2">
              <button onClick={() => quickLogin('admin')} className="text-xs bg-[#0D1B2A] hover:bg-[#1E3A5F] text-[#8CA2BD] py-2 px-1 rounded-lg transition-colors" title="总经理">总经理</button>
              <button onClick={() => quickLogin('finance01')} className="text-xs bg-[#0D1B2A] hover:bg-[#1E3A5F] text-[#8CA2BD] py-2 px-1 rounded-lg transition-colors" title="财务">财务</button>
              <button onClick={() => quickLogin('region01')} className="text-xs bg-[#0D1B2A] hover:bg-[#1E3A5F] text-[#8CA2BD] py-2 px-1 rounded-lg transition-colors" title="区域经理">区域</button>
              <button onClick={() => quickLogin('manager01')} className="text-xs bg-[#0D1B2A] hover:bg-[#1E3A5F] text-[#8CA2BD] py-2 px-1 rounded-lg transition-colors" title="店长">店长</button>
              <button onClick={() => quickLogin('staff01')} className="text-xs bg-[#0D1B2A] hover:bg-[#1E3A5F] text-[#8CA2BD] py-2 px-1 rounded-lg transition-colors" title="店员">店员</button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-[#5A7FA6]">
          <p>© 2024 智慧餐饮集团 · 智慧运营与食安管理平台</p>
        </div>
      </div>
    </div>
  );
}
