import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { useAppStore } from '../../store/useAppStore';
import { supabase } from '../../lib/supabase';
import { Crown, Zap, ShieldCheck } from 'lucide-react';

export function PaymentCallback() {
  const { width, height } = useWindowSize();
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const { currentUser, setCurrentUser } = useAppStore();
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    const params = new URLSearchParams(window.location.search);
    const success = params.get('success');
    const plan = params.get('plan');
    
    if (success === 'true' && plan && currentUser && supabase) {
      hasProcessed.current = true;
      setShow(true);
      
      // Nettoyer l'URL immédiatement pour éviter toute boucle infinie liée au rendu React
      window.history.replaceState({}, document.title, window.location.pathname);

      // Update local profile based on the purchased plan to simulate webhook
      const updateProfile = async () => {
        let updates: any = {};
        let successMessage = "";
        
        switch(plan) {
          case 'pro':
            updates = { plan: 'pro' };
            successMessage = "Bienvenue dans l'Élite PRO ! Tes avantages sont débloqués.";
            break;
          case 'grinder':
            updates = { plan: 'grinder' };
            successMessage = "Pass Grinder activé. Écrase la concurrence.";
            break;
          case 'match-divin':
            updates = { 
              divin_balance: (currentUser.divin_balance || 0) + 1 
            };
            successMessage = "Match Divin acquis ! Utilise-le quand tu veux.";
            break;
          case 'badge':
            updates = { has_badge: true };
            successMessage = "Félicitations, ton profil est officiellement certifié FNMATE.";
            break;
          case 'karma':
            updates = { reputation: 100 };
            successMessage = "Ton historique a été blanchi. Reviens sur le droit chemin.";
            break;
          case 'analyse-flash':
            successMessage = "Analyse terminée.";
            break;
        }

        setMessage(successMessage);

        if (Object.keys(updates).length > 0) {
          const { data } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', currentUser.id)
            .select()
            .single();
            
          if (data) {
            setCurrentUser(data);
          }
        }
      };

      updateProfile();
    }
  }, [currentUser, setCurrentUser]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <Confetti width={width} height={height} recycle={false} numberOfPieces={500} colors={['#a855f7', '#3b82f6', '#facc15']} />
      
      <div className="bg-gradient-to-b from-slate-900 to-black border border-white/20 p-8 rounded-3xl max-w-md w-full mx-4 text-center shadow-2xl relative animate-fade-in-slide-up">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
          <Crown size={40} className="text-white" />
        </div>
        
        <h2 className="text-2xl font-black text-white mt-10 mb-2">PAIEMENT RÉUSSI</h2>
        <p className="text-slate-400 mb-8 font-medium">
          {message}
        </p>
        
        <button 
          onClick={() => setShow(false)}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors"
        >
          Continuer vers FNMATE
        </button>
      </div>
    </div>
  );
}
