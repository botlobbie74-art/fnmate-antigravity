import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import LandingPage from './pages/LandingPage';
import Matchmaking from './pages/Matchmaking';
import PlayersList from './pages/PlayersList';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import Auth from './pages/Auth';
import Billing from './pages/Billing';
import React, { useEffect } from 'react';
import { useAppStore } from './store/useAppStore';
import { supabase } from './lib/supabase';
import { SocialProofTicker } from './components/ui/SocialProofTicker';
import { PaymentCallback } from './components/ui/PaymentCallback';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { authUserId, isAuthLoading } = useAppStore();
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (!authUserId) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { authUserId, isAuthLoading } = useAppStore();
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  if (authUserId) {
    return <Navigate to="/players" replace />;
  }
  return children;
}

function App() {
  const { setAuthUserId, setCurrentUser, setIsAuthLoading } = useAppStore();

  useEffect(() => {
    // Force dark mode always
    document.body.classList.add('dark');

    // Setup Supabase Auth State tracking
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (error) throw error;
        setAuthUserId(session?.user?.id || null);
        setIsAuthLoading(false);
      }).catch(err => {
        console.error("Session fetch error:", err);
        setIsAuthLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          setAuthUserId(session?.user?.id || null);
          if (session?.user?.id) {
            if (session.user.email === 'botlobbie74@gmail.com') {
              await supabase.from('profiles').update({ 
                 plan: 'pro', 
                 has_badge: true, 
                 divin_balance: 999 
              }).eq('id', session.user.id);
            }
            const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            if (error) throw error;
            setCurrentUser(data || null);
          } else {
            setCurrentUser(null);
          }
        } catch (err) {
          console.error("Auth state change error:", err);
          setCurrentUser(null);
        } finally {
          setIsAuthLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } else {
      setIsAuthLoading(false);
    }
  }, [setAuthUserId, setCurrentUser, setIsAuthLoading]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-50 selection:bg-blue-500/30">
        <Navbar />
        <main className="flex-1 pt-24 pb-12 px-6 w-full max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>} />
            <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
            <Route path="/matchmaking" element={<ProtectedRoute><Matchmaking /></ProtectedRoute>} />
            <Route path="/players" element={<ProtectedRoute><PlayersList /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
          </Routes>
        </main>
        <footer className="w-full text-center py-8 pb-16 border-t border-slate-200 dark:border-white/10 text-sm opacity-80 mt-auto bg-black/5 dark:bg-black/20 backdrop-blur-sm">
          <p className="text-slate-500 dark:text-slate-400">Matchmaking FNMATE.</p>
        </footer>
        <SocialProofTicker />
        <PaymentCallback />
      </div>
    </Router>
  );
}

export default App;
