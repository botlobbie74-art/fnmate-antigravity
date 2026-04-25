import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Gamepad2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setAuthUserId } = useAppStore();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Hébergement Supabase non configuré.");
      return;
    }

    setLoading(true);
    setError(null);

    if (!isLogin && refCode) {
      localStorage.setItem('fnmate_referred_by', refCode);
    }

    try {
      if (isLogin) {
        let authUser = null;
        
        // 1. Tente de se connecter
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          // 2. Si ça échoue, on tente directement de l'inscrire en arrière-plan sans checker l'erreur exacte
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
          
          if (signUpError) {
             // Si l'inscription indique que l'utilisateur existe déjà, c'est que son login a merdé à cause d'un mauvais mot de passe
             if (signUpError.message.toLowerCase().includes('registered') || signUpError.message.toLowerCase().includes('already')) {
                throw new Error("Mot de passe incorrect.");
             } else {
                // Autre erreur (ex: mot de passe trop court)
                throw signUpError;
             }
          }
          
          // L'inscription a fonctionné
          if (signUpData.user && signUpData.session) {
             setAuthUserId(signUpData.user.id);
             navigate('/profile');
             return;
          } else if (signUpData.user && !signUpData.session) {
             setError("Compte créé automatiquement ! Va dans Supabase -> Authentication -> Providers -> Email -> et décoche 'Confirm email' pour pouvoir jouer directement la prochaine fois.");
             return;
          } else {
             throw new Error("Impossible de créer le compte.");
          }
        } else if (data.user) {
          // La connexion normale a fonctionné
          setAuthUserId(data.user.id);
          navigate('/matchmaking');
        }
      } else {
        // Flux d'inscription explicite
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user && data.session) {
          setAuthUserId(data.user.id);
          navigate('/profile'); 
        } else if (data.user && !data.session) {
          setError("Compte créé ! Va dans ton tableau de bord Supabase -> Authentication -> Providers -> Email -> et décoche 'Confirm email' pour que ça marche directement !");
        } else {
          setError("Erreur à l'inscription.");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="glass-panel p-8 rounded-3xl w-full max-w-md animate-slide-up shadow-2xl border border-white/10">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-500 p-3 rounded-2xl text-white shadow-lg mb-4">
            <Gamepad2 size={32} />
          </div>
          <h2 className="text-2xl font-bold">{isLogin ? 'Bon retour' : 'Créer un compte'}</h2>
          <p className="text-slate-400 text-sm mt-1">
            {isLogin ? 'Connecte-toi pour trouver ton duo.' : 'Rejoins la communauté FNMATE.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white"
              placeholder="ninja@fortnite.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 opacity-70">Mot de passe</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium mb-1 opacity-70">Code affilié (4 chiffres, optionnel)</label>
              <input 
                type="text" 
                maxLength={4}
                value={refCode}
                onChange={(e) => setRefCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-white font-mono tracking-widest"
                placeholder="Ex: 1234"
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isLogin ? "Pas encore de compte ? " : "Déjà membre ? "}
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); setRefCode(''); }} 
            className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors"
          >
            {isLogin ? "Créer un compte" : "Se connecter"}
          </button>
        </div>
      </div>
    </div>
  );
}
