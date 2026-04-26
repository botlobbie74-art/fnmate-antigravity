import { useEffect, useState } from 'react';
import { PlayerCard } from '../components/ui/PlayerCard';
import { Profile, supabase } from '../lib/supabase';
import { Filter, Radar, HelpCircle, Zap, Loader2, X, Brain } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const AVAILABLE_MODES = [
  'Reload',
  'Reload Classé',
  'Battle Royale',
  'Battle Royale Classé',
  'Zero Build',
  'Zero Build Reload'
];

function calculateSynergy(myProfile: Profile, theirProfile: Profile, mode: 'miroir' | 'complementaire') {
  let synergyScore = 50;

  const role1 = (myProfile.role || "Fragger").toUpperCase();
  const role2 = (theirProfile.role || "Fragger").toUpperCase();

  // 1. ROLE COMPLEMENTARITY (ALEX MATRIX)
  if (mode === 'complementaire') {
    if ((role1 === 'FRAGGER' && role2 === 'IGL') || (role1 === 'IGL' && role2 === 'FRAGGER')) {
      synergyScore += 45; // 95% de base
    } else if (role1 === 'FRAGGER' && role2 === 'FRAGGER') {
      synergyScore -= 10; // 40% (Double push débile)
    } else if (role1 === 'IGL' && role2 === 'IGL') {
      synergyScore -= 5; // 45% (Double IGL)
    } else if (role1 === 'SUPPORT' || role2 === 'SUPPORT') {
      synergyScore += 20; // Support flex
    }
  } else {
    // Mode miroir : on cherche son clone
    if (role1 === role2) synergyScore += 30;
    else synergyScore -= 20;
    
    const aimDiff = Math.abs((myProfile.aim_score || 50) - (theirProfile.aim_score || 50));
    synergyScore += (15 - (aimDiff / 2));
  }

  // 2. TEMPERAMENT & GRIND VARIABLES
  // Estimation via les stats : 70+ IQ = Analytique, 70+ Aim = Agressif
  const isAggro1 = (myProfile.play_style || '').toLowerCase().includes('agressif') || (myProfile.aim_score || 50) > 70;
  const isAggro2 = (theirProfile.play_style || '').toLowerCase().includes('agressif') || (theirProfile.aim_score || 50) > 70;
  const isBrain1 = (myProfile.play_style || '').toLowerCase().includes('calme') || (myProfile.iq_score || 50) > 70;
  const isBrain2 = (theirProfile.play_style || '').toLowerCase().includes('calme') || (theirProfile.iq_score || 50) > 70;

  if (mode === 'complementaire') {
    if ((isAggro1 && isBrain2) || (isBrain1 && isAggro2)) {
      synergyScore += 15; // Un chien enragé tenu en laisse par un tacticien
    } else if (isAggro1 && isAggro2) {
      synergyScore -= 15; // Trop agressif
    }
  }

  // 3. INPUT BALANCING (Si disponible, sinon simulé par le style de jeu)
  // Souvent les builders fous = KBM, gros aimers = Manette (grosse grosse simplif meta)
  const probableKBM1 = (myProfile.build_score || 50) > (myProfile.aim_score || 50);
  const probableKBM2 = (theirProfile.build_score || 50) > (theirProfile.aim_score || 50);
  
  if (probableKBM1 !== probableKBM2) {
    synergyScore += 5; // KBM x Manette = Aim Assist + Mechanics
  } else {
    synergyScore -= 5;
  }

  return Math.max(10, Math.min(99, Math.round(synergyScore)));
}

export default function Matchmaking() {
  const { setOnlineUsers, onlineUsers, currentUser, authUserId, fetchSessionToken } = useAppStore();
  const [filterMode, setFilterMode] = useState<string>('Tous les modes');
  const [filterRank, setFilterRank] = useState<string>('Tous les rangs');
  const [filterPlatform, setFilterPlatform] = useState<string>('Toutes plateformes');
  const [synergyMode, setSynergyMode] = useState<'miroir' | 'complementaire'>('complementaire');
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);

  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [matchCounts, setMatchCounts] = useState<{[key: string]: number}>({});
  const [selectedAnalysisPlayer, setSelectedAnalysisPlayer] = useState<Profile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{score: number, explanation: string} | null>(null);

  const isPro = currentUser?.plan === 'pro' || currentUser?.plan === 'grinder';
  const balance = currentUser?.divin_balance || 0;
  
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(`fnmate_matches_${authUserId}_${today}`);
    if (stored) {
      setMatchCounts({ [today]: parseInt(stored) });
    }
  }, [authUserId]);

  const incrementMatchCount = () => {
    const today = new Date().toISOString().split('T')[0];
    const currentCount = matchCounts[today] || 0;
    const newCount = currentCount + 1;
    setMatchCounts({ [today]: newCount });
    localStorage.setItem(`fnmate_matches_${authUserId}_${today}`, newCount.toString());
  };

  const canUseMatchmaking = isPro || (matchCounts[new Date().toISOString().split('T')[0]] || 0) < 3;

  const startMatchmaking = async () => {
    if (!canUseMatchmaking) {
      alert("Tu as atteint ta limite de 3 matchmakings gratuits aujourd'hui. Passe au plan Grinder ou Elite pour continuer !");
      return;
    }
    
    if (!isPro) incrementMatchCount();
    
    setIsScanning(true);
    setHasScanned(true);

    if (!supabase) {
      setIsScanning(false);
      return;
    }
    try {
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        console.error('Erreur récupération profils:', error);
      } else if (data) {
        setOnlineUsers(data as Profile[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsScanning(false);
      }, 1500); // minimum 1.5s visual scan
    }
  };
  
  const handleRunAIAnalysis = async (player: Profile) => {
    setIsAnalyzing(true);
    setSelectedAnalysisPlayer(player);
    
    // Call Gemini
    import('../lib/gemini').then(async (m) => {
      try {
        const result = await m.matchCompatibility(currentUser, player);
        setAnalysisResult(result);
      } catch (err) {
        console.error("AI Analysis failed", err);
        setAnalysisResult({ 
          score: 0, 
          explanation: "Impossible de générer l'analyse (erreur réseau ou IA indisponible).",
          synergyFactors: []
        });
      } finally {
        setIsAnalyzing(false);
      }
    }).catch((err) => {
      console.error("Failed to load Gemini module", err);
      setIsAnalyzing(false);
    });
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentUser?.divin_active_until) {
        const diff = new Date(currentUser.divin_active_until).getTime() - new Date().getTime();
        setTimeLeft(Math.max(0, Math.floor(diff / 1000)));
      } else {
        setTimeLeft(0);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  const handleActivateDivine = async () => {
    if (!currentUser || !supabase) return;
    try {
      setLoadingPayment(true);
      const newActiveUntil = new Date(Date.now() + 10 * 60000).toISOString();
      let newBalance = balance;

      if (!isPro) {
        if (balance > 0) {
          newBalance -= 1;
        } else {
          // Solde insuffisant, rediriger vers paiement
          const token = await fetchSessionToken();
          if (!token) throw new Error("Erreur token");

          const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ userId: authUserId, planId: 'match-divin' }),
          });

          const data = await response.json();
          if (data.url) return window.location.href = data.url;
          throw new Error(data.error || "Erreur de paiement");
        }
      }

      const { data, error } = await supabase.from('profiles').update({
        divin_active_until: newActiveUntil,
        divin_balance: newBalance
      }).eq('id', currentUser.id).select().single();
      
      if (error) throw error;
      
      const store = useAppStore.getState();
      store.setCurrentUser(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayment(false);
    }
  };

  const filteredUsers = onlineUsers
    .filter(u => {
      if (u.id === currentUser?.id) return false;
      if (filterMode !== 'Tous les modes' && (!u.mode_preference || !u.mode_preference.includes(filterMode))) return false;
      if (filterRank !== 'Tous les rangs' && u.rank !== filterRank) return false;
      if (filterPlatform !== 'Toutes plateformes' && (!u.platform || !u.platform.includes(filterPlatform))) return false;
      return true;
    })
    .map(u => ({
      ...u,
      matchScore: currentUser ? calculateSynergy(currentUser, u, synergyMode) : undefined
    }))
    .sort((a, b) => {
      if (a.has_badge && !b.has_badge) return -1;
      if (!a.has_badge && b.has_badge) return 1;
      if (a.matchScore && b.matchScore) return b.matchScore - a.matchScore;
      return 0;
    });

  return (
    <div className="w-full">
      {/* Modal Analyse IA */}
      {selectedAnalysisPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-lg p-8 rounded-3xl animate-scale-in relative border border-white/10 shadow-2xl">
            <button 
              onClick={() => { setSelectedAnalysisPlayer(null); setAnalysisResult(null); }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white shadow-lg mb-6">
                <Brain size={40} className={isAnalyzing ? "animate-pulse" : ""} />
              </div>
              
              <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">
                Analyse de Synergie <span className="text-blue-500">ALEX</span>
              </h3>
              <p className="text-sm text-slate-400 mb-8">
                Matching : {currentUser?.epic_name} x {selectedAnalysisPlayer.epic_name}
              </p>

              {isAnalyzing ? (
                <div className="py-12 flex flex-col items-center gap-4">
                  <Loader2 size={40} className="animate-spin text-blue-500" />
                  <p className="text-sm font-bold text-slate-500 animate-pulse uppercase tracking-widest">Calcul de la meta en cours...</p>
                </div>
              ) : analysisResult ? (
                <div className="space-y-6 w-full">
                  <div className="flex items-center justify-center gap-4">
                    <div className={`text-6xl font-black ${analysisResult.score >= 80 ? 'text-green-500' : analysisResult.score >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>
                      {analysisResult.score}%
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Compatibilité</div>
                      <div className="text-sm font-black text-white uppercase">{analysisResult.score >= 80 ? 'Perfect Combo' : analysisResult.score >= 50 ? 'Good Potential' : 'Stay Away'}</div>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 italic text-sm leading-relaxed">
                    "{analysisResult.explanation}"
                  </div>

                  <Link 
                    to={`/messages?user=${selectedAnalysisPlayer.id}`}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Lancer l'invitation <Zap size={18} fill="currentColor" />
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Radar className={isScanning ? "animate-spin text-blue-500" : "text-blue-500"} size={28} />
            Live Matchmaking
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 dark:text-slate-400">
              L'Algorithme IA trouve ton mate idéal en fonction de vos stats.
            </p>
            {!isPro && (
              <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest text-blue-400">
                Matchmakings Gratuits : {3 - (matchCounts[new Date().toISOString().split('T')[0]] || 0)} / 3
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {timeLeft > 0 ? (
            <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black shadow-lg flex items-center gap-2 border border-yellow-300">
              <Zap size={18} className="fill-white animate-pulse" />
              <div>
                <div className="leading-none text-sm uppercase tracking-wider">Boost Actif</div>
                <div className="leading-none text-[10px] font-mono mt-0.5">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} min
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleActivateDivine}
              disabled={loadingPayment}
              className="group relative overflow-hidden px-4 py-2 rounded-2xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-black shadow-lg shadow-yellow-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[0%] transition-transform duration-300"></div>
              {loadingPayment ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="fill-white" />}
              <div>
                <div className="leading-none text-sm uppercase tracking-wider">
                  {isPro ? "Activer Priorité PRO" : balance > 0 ? "Activer Boost Divin" : "Match Divin"}
                </div>
                <div className="leading-none text-[10px] opacity-90">
                  {isPro ? "Illimité" : balance > 0 ? `Reste: ${balance}` : "Priorité (1.49€)"}
                </div>
              </div>
            </button>
          )}
          
          <div className="glass px-4 py-2 rounded-2xl flex flex-wrap items-center gap-4 border border-blue-500/20">
            <div className="flex items-center gap-2 relative group cursor-help">
            <Filter size={18} className="text-blue-500" />
            <select 
              value={synergyMode} 
              onChange={(e) => setSynergyMode(e.target.value as 'miroir' | 'complementaire')}
              className="bg-transparent border-none text-sm font-bold text-blue-600 dark:text-blue-400 outline-none cursor-pointer"
            >
              <option className="bg-slate-900 text-white" value="complementaire">Mode Inversé (Complémentaire)</option>
              <option className="bg-slate-900 text-white" value="miroir">Mode Pareil (Miroir)</option>
            </select>
            <HelpCircle size={16} className="text-slate-400" />
            
            {/* Tooltip */}
            <div className="absolute hidden group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-2xl -bottom-2 translate-y-full left-0 border border-white/10">
              <p className="font-bold mb-1 text-blue-400">Mode Inversé :</p>
              <p className="mb-2">Trouve un mate qui comble tes faiblesses. Si tu es un tireur d'élite, on te trouve un architecte du build. (Conseillé)</p>
              <p className="font-bold mb-1 text-purple-400">Mode Pareil :</p>
              <p>Trouve un mate qui a les mêmes points forts que toi. Idéal pour un jeu ultra-spécifique.</p>
            </div>
          </div>

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>
          
          <select 
            value={filterMode} 
            onChange={(e) => setFilterMode(e.target.value)}
            className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer dark:text-white"
          >
            <option className="bg-slate-900 text-white" value="Tous les modes">Tous les modes</option>
            {AVAILABLE_MODES.map(m => (
              <option className="bg-slate-900 text-white" key={m} value={m}>{m}</option>
            ))}
          </select>

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10"></div>

          <select 
            value={filterRank} 
            onChange={(e) => setFilterRank(e.target.value)}
            className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer dark:text-white"
          >
            <option className="bg-slate-900 text-white" value="Tous les rangs">Tous les rangs</option>
            <option className="bg-slate-900 text-white" value="Bronze">Bronze</option>
            <option className="bg-slate-900 text-white" value="Silver">Silver</option>
            <option className="bg-slate-900 text-white" value="Gold">Gold</option>
            <option className="bg-slate-900 text-white" value="Platinum">Platinum</option>
            <option className="bg-slate-900 text-white" value="Diamond">Diamond</option>
            <option className="bg-slate-900 text-white" value="Elite">Elite</option>
            <option className="bg-slate-900 text-white" value="Champion">Champion</option>
            <option className="bg-slate-900 text-white" value="Unreal">Unreal</option>
          </select>

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

          <select 
            value={filterPlatform} 
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="bg-transparent border-none text-sm font-medium outline-none cursor-pointer dark:text-white"
          >
            <option className="bg-slate-900 text-white" value="Toutes plateformes">Toutes plateformes</option>
            <option className="bg-slate-900 text-white" value="PC">PC</option>
            <option className="bg-slate-900 text-white" value="PlayStation">PlayStation</option>
            <option className="bg-slate-900 text-white" value="Xbox">Xbox</option>
            <option className="bg-slate-900 text-white" value="Switch">Switch</option>
            <option className="bg-slate-900 text-white" value="Mobile">Mobile</option>
          </select>
          </div>
        </div>
      </div>

      {isScanning ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-8">
          <div className="relative flex items-center justify-center w-24 h-24">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-l-2 border-purple-500 animate-[spin_1.5s_linear_infinite_reverse]"></div>
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full animate-pulse shadow-[0_0_30px_rgba(59,130,246,0.6)]"></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Analyse de Combo FNMATE
            </p>
            <p className="text-sm text-slate-500 font-medium animate-pulse">
              Matching selon ton style de jeu...
            </p>
          </div>
        </div>
      ) : !hasScanned ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-8 glass-panel rounded-3xl border border-blue-500/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Radar size={40} />
          </div>
          <div className="text-center max-w-md px-4">
            <h3 className="text-2xl font-black mb-2">Prêt à trouver ton duo ?</h3>
            <p className="text-slate-400 mb-6">
              L'algorithme ALEX va scanner les joueurs en ligne et te trouver ceux qui correspondent parfaitement à ton style de jeu (Role, Aim, IQ).
            </p>
            <button 
              onClick={startMatchmaking}
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto"
            >
              <Zap size={20} className="fill-white" />
              Lancer le Matchmaking
            </button>
            {!isPro && (
              <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-bold">
                {3 - (matchCounts[new Date().toISOString().split('T')[0]] || 0)} essais gratuits restants aujourd'hui
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(player => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                matchScore={player.matchScore} 
                onAnalyze={handleRunAIAnalysis}
                canAnalyze={true}
              />
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-500">
              Aucun joueur ne correspond à vos filtres. <br/>
              Élargissez vos critères de recherche ou attendez que plus de joueurs se connectent !
            </div>
          )}
        </div>
      )}
    </div>
  );
}
