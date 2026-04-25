import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2, UserCircle, MessageCircle, LogOut, CreditCard } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';

export function Navbar() {
  const { authUserId, currentUser, unreadCount, setAuthUserId, setCurrentUser } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link to={authUserId ? "/players" : "/"} className="flex items-center gap-2 group">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-2 rounded-xl text-white shadow-lg transition-transform group-hover:scale-105">
            <Gamepad2 size={24} />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500 tracking-tight">
            FNMATE
          </span>
        </Link>

        {authUserId ? (
          <div className="flex items-center gap-6">
            <Link 
              to="/matchmaking" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/matchmaking') ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Live
            </Link>
            <Link 
              to="/players" 
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${isActive('/players') ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
            >
              Joueurs
            </Link>
            <Link 
              to="/messages" 
              className={`relative flex items-center justify-center p-2 rounded-full transition-colors ${isActive('/messages') ? 'bg-blue-500/10 text-blue-500' : 'text-slate-600 dark:text-slate-300 hover:bg-white/10'}`}
            >
              <MessageCircle size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-red-500 flex items-center justify-center text-[10px] font-bold text-white shadow-[0_0_10px_rgba(239,68,68,0.5)] border border-slate-900 px-1">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link 
              to="/billing" 
              className={`flex items-center gap-2 p-2 rounded-full transition-colors ${isActive('/billing') ? 'bg-purple-500/10 text-purple-500' : 'text-slate-600 dark:text-slate-300 hover:bg-white/10'}`}
              title="Abonnement"
            >
              <CreditCard size={20} />
            </Link>
            <Link 
              to="/profile" 
              className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center overflow-hidden border border-white/20 shadow-md transition-transform hover:scale-105"
            >
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserCircle size={24} className="text-slate-400" />
              )}
            </Link>
            <button 
              onClick={async () => {
                setAuthUserId(null);
                setCurrentUser(null);
                navigate('/');
                try {
                  if (supabase) await supabase.auth.signOut();
                } catch(e) {
                  console.error("Erreur deconnexion:", e);
                }
              }} 
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-red-500 hover:text-red-400"
              title="Se déconnecter"
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/auth" className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95">
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
