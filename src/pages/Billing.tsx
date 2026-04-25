import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { CreditCard, CheckCircle2, AlertTriangle, ExternalLink, Loader2 } from 'lucide-react';

export default function Billing() {
  const { currentUser } = useAppStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isGrinder = currentUser?.plan === 'grinder';
  const isPro = currentUser?.plan === 'pro';

  const getPlanName = () => {
    if (isPro) return "PRO (Élite)";
    if (isGrinder) return "GRINDER";
    return "Bambi (Gratuit)";
  };

  const handleCheckout = async (planId: string) => {
    if (!currentUser) {
      setError("Tu dois être connecté");
      return;
    }
    
    setLoadingPlan(planId);
    setError(null);
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          isAnnual: false,
          userId: currentUser.id
        })
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error("Réponse invalide du serveur. Le backend n'est probablement pas configuré pour gérer les requêtes API.");
      }
      
      if (!response.ok) {
        throw new Error(data.error || "Erreur de paiement");
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de redirection manquante");
      }
    } catch (err: any) {
      setError(err.message);
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
        <CreditCard className="text-blue-500" size={32} />
        Abonnement & Facturation
      </h2>

      {error && (
        <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h5 className="font-bold text-red-500">Erreur lors de la redirection</h5>
            <p className="text-sm text-red-500/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="glass rounded-3xl p-8 mb-8 border border-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Plan Actuel</p>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-3xl font-black text-white">{getPlanName()}</h3>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold border border-green-500/30 flex items-center gap-1">
                <CheckCircle2 size={12} /> Actif
              </span>
            </div>
            <p className="text-slate-400 max-w-lg">
              {isPro 
                ? "Tu as atteint le sommet. Matchmaking instantané, badge PRO, tu as l'arsenal complet pour dominer."
                : isGrinder
                ? "Tu es sur la bonne voie. Ton shield est actif et tu es prioritaire. Mais le plan PRO t'attend."
                : "Tu utilises actuellement la version gratuite de FNMATE. Passe à un abonnement supérieur pour accéder au Matchmaking instantané et aux outils d'IA avancés (Toxic-Shield, Synergie d'équipe)."
              }
            </p>
          </div>

          <div className="text-right flex flex-col gap-3">
            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2">
              <ExternalLink size={18} /> Gérer mon abonnement (Stripe)
            </button>
            <p className="text-xs text-slate-500 text-center md:text-right">
              Gère tes paiements en toute sécurité.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-8 border border-blue-500/20 relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-blue-600/10 transition-colors"></div>
          <div className="relative">
            <h4 className="text-xl font-black text-blue-400 mb-2">Plan GRINDER</h4>
            <p className="text-3xl font-black text-white mb-4">4.99€<span className="text-sm text-slate-500 font-normal">/mois</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-blue-500" /> 🛡️ <span className="font-bold text-white">Toxic-Shield Actif</span> (zéro gamin, zéro rageux)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-blue-500" /> 🚀 <span className="font-bold text-white">Matchmaking Prioritaire</span> (passe devant la plèbe)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-blue-500" /> 🎯 <span className="font-bold text-white">Filtres Sniper</span> (trouve le mate EXACT)
              </li>
            </ul>
            <button 
              onClick={() => handleCheckout('grinder')}
              disabled={loadingPlan !== null || isGrinder || isPro}
              className={`w-full py-3 rounded-xl font-bold border transition-colors flex justify-center items-center gap-2 ${
                isGrinder || isPro 
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed' 
                  : 'bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-500/30'
              }`}
            >
              {loadingPlan === 'grinder' ? <Loader2 size={20} className="animate-spin" /> : isPro || isGrinder ? 'Déjà Actif' : 'Passer GRINDER'}
            </button>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 border border-purple-500/30 relative overflow-hidden group">
          <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-lg">
            Meta Officielle
          </div>
          <div className="absolute inset-0 bg-purple-600/5 group-hover:bg-purple-600/10 transition-colors"></div>
          <div className="relative">
            <h4 className="text-xl font-black text-purple-400 mb-2">Plan PRO</h4>
            <p className="text-3xl font-black text-white mb-4">9.99€<span className="text-sm text-slate-500 font-normal">/mois</span></p>
            <ul className="space-y-3 mb-8">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-purple-500" /> 🧠 <span className="font-bold text-white">Algo Combo de Rôle</span> (Fragger trouve son IGL)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-purple-500" /> ⚡ <span className="font-bold text-white">Matchmaking Instantané</span> (zéro délai de recherche)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle2 size={16} className="text-purple-500" /> 👑 <span className="font-bold text-white">Badge PRO</span> (impose ton statut au lobby)
              </li>
            </ul>
            <button 
              onClick={() => handleCheckout('pro')}
              disabled={loadingPlan !== null || isPro}
              className={`w-full py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                isPro 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' 
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
               {loadingPlan === 'pro' ? <Loader2 size={20} className="animate-spin" /> : isPro ? 'Déjà Actif' : 'Passer PRO'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
