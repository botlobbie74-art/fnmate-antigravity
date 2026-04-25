import React, { useState, useEffect } from 'react';
import { Users, Crown, Zap } from 'lucide-react';

const FAKE_NOTIFICATIONS = [
  { text: "Un joueur vient de débloquer l'Analyse Flash pour clasher son mate...", type: 'achat', prefix: '[ACHAT]' },
  { text: "Duo Elite formé : Fragger (Diamant) + IGL (Unreal) - Combo 96%", type: 'match', prefix: '[MATCH]' },
  { text: "Enzo vient de passer du plan Bambi au plan PRO.", type: 'pro', prefix: '[LEVEL UP]' },
  { text: "Priorité Matchmaking activée pour 'DarkKnight92' (Match Divin)...", type: 'boost', prefix: '[BOOST]' },
  { text: "Un duel explosif : ALEX vient d'humilier un IGL en Analyse Flash.", type: 'achat', prefix: '[ACHAT]' }
];

export const SocialProofTicker = () => {
  const [duoCount, setDuoCount] = useState(1427);
  const [currentNotifIndex, setCurrentNotifIndex] = useState(0);

  // Compteur dynamique
  useEffect(() => {
    // Restored cache if existing
    const cachedCount = localStorage.getItem('fnmate_fake_counter');
    if (cachedCount) {
      setDuoCount(parseInt(cachedCount, 10));
    }

    const interval = setInterval(() => {
      setDuoCount(prev => {
        const next = prev + Math.floor(Math.random() * 2) + 1;
        localStorage.setItem('fnmate_fake_counter', next.toString());
        return next;
      });
    }, Math.random() * (480000 - 180000) + 180000); // Entre 3 et 8 minutes (180k - 480k ms), let's make it 3-8 seconds just for the demo effect? No, user requested 3 to 8 minutes. Let's stick to 3-8 mins, but for visual effect during dev maybe 30s-60s? Let's use 30s - 2m to be actually visible: 30000 - 120000

    return () => clearInterval(interval);
  }, []);

  // Ticker animation loop
  useEffect(() => {
    const tickerInterval = setInterval(() => {
      setCurrentNotifIndex((prev) => (prev + 1) % FAKE_NOTIFICATIONS.length);
    }, 6000); // Change notif every 6 seconds

    return () => clearInterval(tickerInterval);
  }, []);

  const notif = FAKE_NOTIFICATIONS[currentNotifIndex];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex flex-col md:flex-row items-center border-t border-white/10 bg-black/80 backdrop-blur-md">
      {/* Compteur FOMO */}
      <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border-r border-white/10 whitespace-nowrap hidden md:flex">
        <Users size={18} className="text-blue-400" />
        <span className="font-black text-white text-sm">
          {duoCount.toLocaleString('fr-FR')} <span className="text-blue-200">duos formés ces dernières 24h</span>
        </span>
      </div>

      {/* Ticker Notifications */}
      <div className="flex-1 w-full overflow-hidden relative h-12 flex items-center">
        <div key={currentNotifIndex} className="animate-fade-in-slide-up absolute left-6 right-6 flex items-center gap-3 text-sm font-medium">
          {notif.type === 'match' && <Zap size={16} className="text-yellow-500 shrink-0" />}
          {notif.type === 'achat' && <Crown size={16} className="text-pink-500 shrink-0" />}
          {notif.type === 'pro' && <div className="px-1.5 py-0.5 bg-purple-600 text-white text-[10px] rounded font-black shrink-0">PRO</div>}
          {notif.type === 'boost' && <Zap size={16} className="text-orange-500 shrink-0" />}
          
          <p className="text-slate-300 truncate">
            <span className={`font-bold mr-2 ${
              notif.type === 'achat' ? 'text-pink-400' :
              notif.type === 'match' ? 'text-yellow-400' :
              notif.type === 'pro' ? 'text-purple-400' :
              'text-orange-400'
            }`}>
              {notif.prefix}
            </span>
            {notif.text}
          </p>
        </div>
      </div>
      
      <style>{`
        @keyframes fade-in-slide-up {
          0% { opacity: 0; transform: translateY(10px); }
          10% { opacity: 1; transform: translateY(0); }
          90% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-10px); }
        }
        .animate-fade-in-slide-up {
          animation: fade-in-slide-up 6s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};
