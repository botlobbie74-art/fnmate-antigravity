import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Target, Users, CheckCircle, Crown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function LandingPage() {
  const { authUserId } = useAppStore();
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setLoadingPlan(null);
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  const handleCheckout = async (planId: string) => {
    if (!authUserId) return; // Managed by UI links
    
    setLoadingPlan(planId);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          isAnnual,
          userId: authUserId
        }),
      });
      
      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error("Non-JSON response received:", text);
        throw new Error("Le serveur a renvoyé une réponse invalide (HTML). Vérifiez que le serveur backend est bien lancé.");
      }

      if (data && data.url) {
        window.location.href = data.url;
      } else {
        console.error(data?.error || 'Erreur Stripe');
        alert(data?.error || "Erreur lors de la création de la session de paiement.");
        setLoadingPlan(null);
      }
    } catch (err: any) {
      console.error("Stripe error", err);
      alert(err.message || "Erreur de connexion au serveur de paiement.");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center relative">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 blur-[100px] rounded-full -z-10 pointer-events-none"></div>

      <div className="glass-panel px-6 py-2 rounded-full mb-8 inline-flex items-center gap-2 text-sm font-medium animate-fade-in border border-white/10">
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
        Actif
      </div>
      
      <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white leading-tight">
        Marre des randoms <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">éclatés ?</span>
      </h1>
      
      <p className="text-lg md:text-xl text-slate-300 max-w-2xl mb-12">
        Notre moteur scanne ton style de jeu et te trouve le duo parfait. Zéro frustration.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-24 animate-slide-up">
        <Link 
          to="/auth" 
          className="px-8 py-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] transition-all hover:scale-105 active:scale-95 w-full sm:w-auto"
        >
          Commencer
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl mt-8">
        <div className="glass-panel p-10 rounded-3xl text-left flex flex-col items-start hover:-translate-y-1 hover:border-blue-500/30 transition-all">
          <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
            <Zap size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-blue-200">
            L'Algorithme qui lit dans ton jeu.
          </h3>
          <p className="text-slate-400 text-lg leading-relaxed mb-6">
            Oublie les filtres basiques, notre moteur analyse ton style (Agressif, Support, Sniper) et tes stats réelles. Il ne te trouve pas juste un joueur, il te trouve ton alter-égo. C'est la précision chirurgicale pour ton prochain Top 1.
          </p>
          <div className="mt-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-semibold">
             <Target size={14} /> Analyse de 50+ critères de skill
          </div>
        </div>

        <div className="glass-panel p-10 rounded-3xl text-left flex flex-col items-start hover:-translate-y-1 hover:border-purple-500/30 transition-all">
          <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
            <Users size={28} />
          </div>
          <h3 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-200">
            Ton Duo Unreal t'attend déjà.
          </h3>
          <p className="text-slate-400 text-lg leading-relaxed mb-6">
            Rejoins l'élite de FNMATE. Ici, on ne perd pas de temps dans des lobbys vides. Connecte-toi instantanément à une commu qui a la même soif de victoire que toi. Que tu sois sur ton setup pro ou en détente, trouve un mate à ta hauteur en un clic.
          </p>
          <div className="mt-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 1,240 joueurs cherchent un mate actuellement
          </div>
        </div>
      </div>

      {/* Pourquoi devenir Elite ? */}
      <div className="w-full max-w-4xl mt-32 relative text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
          Pourquoi devenir Elite ?
        </h2>
        <div className="glass-panel p-8 rounded-3xl border border-white/10 text-left">
          <p className="text-lg text-slate-300 leading-relaxed">
            La version standard de FNMATE est top pour jouer chill. Mais si tu veux monter Unreal, tu ne peux pas te permettre de perdre du temps. Le rang <span className="font-bold text-yellow-500">Elite</span>, c'est ton coupe-file. Pendant que les autres attendent 5 minutes pour trouver un duo aléatoire, notre algorithme travaille pour toi en tâche de fond et t'envoie une notification dès qu'il te trouve la perle rare. Tu rejoins des lobbys sécurisés, tu participes à nos tournois privés et ton profil est certifié. C'est l'investissement ultime pour ton rang.
          </p>
        </div>
      </div>

      {/* Section Tarifs */}
      <div className="w-full max-w-6xl mt-32 mb-16 relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4 pb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Passe à la vitesse supérieure.
          </h2>
          <p className="text-xl text-slate-400 mb-8">
           <span className="text-blue-400 font-bold">Active le mode Elite et laisse notre outil te dénicher le mate qui va carry tes prochaines games.</span>
          </p>

          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-bold ${!isAnnual ? 'text-white' : 'text-slate-400'}`}>Mensuel</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-16 h-8 rounded-full bg-blue-600/30 border border-blue-500/50 relative px-1 flex items-center transition-colors"
            >
              <div className={`w-6 h-6 rounded-full bg-blue-500 transition-transform ${isAnnual ? 'translate-x-8' : 'translate-x-0'}`}></div>
            </button>
            <span className={`text-sm font-bold flex items-center gap-2 ${isAnnual ? 'text-white' : 'text-slate-400'}`}>
              Annuel <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">-20%</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Bambi */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col border border-white/5 opacity-80">
            <h3 className="text-2xl font-bold text-white mb-2">Bambi</h3>
            <div className="text-4xl font-extrabold text-white mb-6">0€<span className="text-lg text-slate-500 font-medium"> /mois</span></div>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-slate-500"/> 3 Matchs IA par jour</li>
              <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-slate-500"/> Profil public standard</li>
              <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-slate-500"/> Financement par la pub</li>
            </ul>
            <Link to={authUserId ? "/matchmaking" : "/auth"} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/10 text-white font-bold transition-colors block text-center">
              Rejoindre (Gratuit)
            </Link>
          </div>

          {/* Tryharder */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col border-2 border-blue-500 shadow-[0_0_40px_-10px_rgba(37,99,235,0.4)] relative transform md:-translate-y-4 hover:border-purple-500 hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.5)] transition-all duration-300 group">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold tracking-wide w-max group-hover:bg-purple-500 transition-colors">
              LE PLUS POPULAIRE
            </div>
            <h3 className="text-2xl font-bold text-blue-400 mb-2 group-hover:text-purple-400 transition-colors">Tryharder</h3>
            <div className="text-4xl font-extrabold text-white mb-6">
              {isAnnual ? '49€' : '4,99€'}
              <span className="text-lg text-slate-500 font-medium"> {isAnnual ? '/an' : '/mois'}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium mb-4 italic">Tout ce qui est inclus dans Bambi, avec :</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-blue-400"/> Matchmaking Illimité</li>
              <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-blue-400"/> Badge Premium (Elite)</li>
              <li className="flex items-center gap-3 text-slate-300"><CheckCircle size={18} className="text-blue-400"/> Zéro Publicité</li>
            </ul>
            {authUserId ? (
              <button 
                onClick={() => handleCheckout('grinder')}
                disabled={loadingPlan === 'grinder'}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 group-hover:bg-purple-600 group-hover:hover:bg-purple-700 text-white font-bold transition-colors shadow-lg shadow-blue-500/25 group-hover:shadow-purple-500/25 block text-center disabled:opacity-50"
              >
                {loadingPlan === 'grinder' ? 'Création de la session...' : 'Devenir Tryharder'}
              </button>
            ) : (
              <Link to="/auth" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 group-hover:bg-purple-600 group-hover:hover:bg-purple-700 text-white font-bold transition-colors shadow-lg shadow-blue-500/25 group-hover:shadow-purple-500/25 block text-center">
                Devenir Tryharder
              </Link>
            )}
          </div>

          {/* Elite */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col border border-purple-500/30 hover:border-yellow-400/50 hover:shadow-[0_0_40px_-5px_rgba(168,85,247,0.4),0_0_20px_-5px_rgba(250,204,21,0.4)] hover:-translate-y-2 transition-all duration-300 group">
            <h3 className="text-2xl font-bold text-purple-400 mb-2 flex items-center gap-2 group-hover:text-yellow-400 transition-colors">Elite <Crown size={20} className="text-yellow-400"/></h3>
            <div className="text-4xl font-extrabold text-white mb-6">
              {isAnnual ? '79€' : '9,99€'}
              <span className="text-lg text-slate-500 font-medium"> {isAnnual ? '/an' : '/mois'}</span>
            </div>
            <p className="text-sm text-slate-400 font-medium mb-4 italic">Tout ce qui est inclus dans Tryharder, avec :</p>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle size={18} className="text-purple-400 flex-shrink-0"/> 
                <span><strong className="text-white">Fast-Track :</strong> Priorité absolue du matchmaking & Alertes AFK</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle size={18} className="text-purple-400 flex-shrink-0"/> 
                <span><strong className="text-white">Accès VIP :</strong> Lobbies Privés & Tournois hebdomadaires</span>
              </li>
              <li className="flex items-center gap-3 text-slate-300">
                <CheckCircle size={18} className="text-purple-400 flex-shrink-0"/> 
                <span><strong className="text-white">Profil Premium :</strong> Profil mis en avant, Upload Clips</span>
              </li>
              <li className="text-sm text-purple-400/80 font-semibold pl-8 italic mt-4 group-hover:text-yellow-400/80 transition-colors">
                ... et bien plus encore !
              </li>
            </ul>
            {authUserId ? (
              <button 
                onClick={() => handleCheckout('pro')}
                disabled={loadingPlan === 'pro'}
                className="w-full py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 group-hover:bg-yellow-400/20 group-hover:border-yellow-400/50 group-hover:text-yellow-300 text-purple-300 font-bold transition-colors border border-purple-500/30 block text-center disabled:opacity-50"
              >
                {loadingPlan === 'pro' ? 'Création de la session...' : 'Passer Elite'}
              </button>
            ) : (
              <Link to="/auth" className="w-full py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/40 group-hover:bg-yellow-400/20 group-hover:border-yellow-400/50 group-hover:text-yellow-300 text-purple-300 font-bold transition-colors border border-purple-500/30 block text-center">
                Passer Elite
              </Link>
            )}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-slate-500 flex items-center justify-center gap-2">
          Paiement sécurisé par <span className="font-bold text-slate-400">Stripe</span>. Annule à tout moment.
        </div>
      </div>
    </div>
  );
}
