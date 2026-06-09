import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  ShoppingCart,
  ChefHat,
  Truck,
  ClipboardCheck,
  Search,
  Bell,
  User,
  LogOut,
  Maximize2,
  Minimize2,
  Menu,
  X,
  ChevronDown,
  Store,
  MapPin,
  Users,
  CreditCard,
  FileBarChart,
  AlertTriangle,
  Settings,
  Package,
  Recycle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { formatDateTime } from '@/utils/format';
import { RoleLevel } from '@/../shared/types';

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  minLevel: RoleLevel;
}

const menuItems: MenuItem[] = [
  { path: '/dashboard', label: '数据看板', icon: <LayoutDashboard size={20} />, minLevel: 1 },
  { path: '/forecast', label: '销量预测', icon: <TrendingUp size={20} />, minLevel: 2 },
  { path: '/purchase', label: '采购管理', icon: <ShoppingCart size={20} />, minLevel: 2 },
  { path: '/production', label: '生产计划', icon: <ChefHat size={20} />, minLevel: 2 },
  { path: '/delivery', label: '配送监控', icon: <Truck size={20} />, minLevel: 2 },
  { path: '/inspection', label: '质检巡检', icon: <ClipboardCheck size={20} />, minLevel: 2 },
  { path: '/recall', label: '追溯召回', icon: <Recycle size={20} />, minLevel: 3 },
  { path: '/equipment', label: '设备管理', icon: <Package size={20} />, minLevel: 2 },
  { path: '/maintenance', label: '工单管理', icon: <Settings size={20} />, minLevel: 2 },
  { path: '/stores', label: '门店管理', icon: <Store size={20} />, minLevel: 3 },
  { path: '/regions', label: '区域管理', icon: <MapPin size={20} />, minLevel: 4 },
  { path: '/members', label: '会员管理', icon: <Users size={20} />, minLevel: 2 },
  { path: '/finance', label: '财务对账', icon: <CreditCard size={20} />, minLevel: 4 },
  { path: '/reports', label: '运营报表', icon: <FileBarChart size={20} />, minLevel: 3 },
  { path: '/alerts', label: '告警中心', icon: <AlertTriangle size={20} />, minLevel: 2 },
];

export default function Layout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(formatDateTime(new Date()));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  const filteredMenuItems = menuItems.filter(
    (item) => user && user.roleLevel >= item.minLevel
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 flex flex-col',
          'bg-gradient-to-b from-slate-900 to-slate-950',
          'border-r border-slate-800/50',
          'transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-64' : 'w-20 lg:w-20',
          !sidebarOpen && 'lg:w-20'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <span className="text-white font-bold text-xl">智</span>
            </div>
            {sidebarOpen && (
              <div className="flex flex-col">
                <span className="font-bold text-lg bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  智慧餐饮
                </span>
                <span className="text-xs text-slate-500">智能运营平台</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-800/50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {filteredMenuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                  'group relative overflow-hidden',
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50',
                  !sidebarOpen && 'justify-center'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-cyan-400 to-blue-500 rounded-r-full" />
                  )}
                  <span
                    className={cn(
                      'transition-transform duration-200',
                      isActive && 'scale-110'
                    )}
                  >
                    {item.icon}
                  </span>
                  {sidebarOpen && (
                    <span className="font-medium text-sm">{item.label}</span>
                  )}
                  {!sidebarOpen && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Info Mini */}
        {user && (
          <div className="p-3 border-t border-slate-800/50">
            <div
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg bg-slate-800/30',
                !sidebarOpen && 'justify-center'
              )}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-medium">
                {user.name.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-slate-500">L{user.roleLevel}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-800/50"
            >
              <Menu size={20} />
            </button>
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <Search size={16} className="text-slate-500" />
              <input
                type="text"
                placeholder="搜索菜单、数据..."
                className="bg-transparent border-none outline-none text-sm w-48 placeholder:text-slate-600"
              />
              <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-xs text-slate-500 bg-slate-700/50 rounded">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* System Time */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/50">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-sm text-slate-300 font-mono">{currentTime}</span>
            </div>

            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-100"
              title="全屏"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            {/* Alerts */}
            <div className="relative">
              <button
                onClick={() => setAlertOpen(!alertOpen)}
                className="p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-400 hover:text-slate-100 relative"
              >
                <Bell size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </button>

              {alertOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="p-3 border-b border-slate-800/50">
                    <h3 className="font-semibold">告警通知</h3>
                    <p className="text-xs text-slate-500">3 条未读告警</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-3 border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle size={14} className="text-red-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">温度异常告警</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              北京朝阳店冷链车温度超标
                            </p>
                            <p className="text-xs text-slate-600 mt-1">5分钟前</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 border-t border-slate-800/50">
                    <button className="w-full py-1.5 text-sm text-cyan-400 hover:text-cyan-300">
                      查看全部
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium">{user?.name || '用户'}</p>
                  <p className="text-xs text-slate-500">
                    L{user?.roleLevel || 1}
                  </p>
                </div>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
                  <div className="p-4 border-b border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg font-bold">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold">{user?.name}</p>
                        <p className="text-sm text-slate-400">{user?.username}</p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-cyan-500/20 text-cyan-400 mt-1">
                          L{user?.roleLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                      <User size={16} />
                      个人中心
                    </button>
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-300 hover:bg-slate-800/50 transition-colors">
                      <Settings size={16} />
                      系统设置
                    </button>
                  </div>
                  <div className="p-2 border-t border-slate-800/50">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut size={16} />
                      退出登录
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
