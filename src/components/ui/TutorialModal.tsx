import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { Gamepad2, Brain, Users, Crown, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TUTORIAL_STEPS = [
  {
    icon: <Gamepad2 size={40} className="text-blue-500" />,
    title: "Bienvenue sur FNMATE !",
    description: "Ton profil est prêt. FNMATE est l'outil ultime pour trouver le duo parfait et dominer le lobby. Laisse-moi te faire visiter.",
    bg: "from-blue-500 to-purple-500"
  },
  {
    icon: <Brain size={40} className="text-purple-500" />,
    title: "Matchmaking IA (ALEX)",
    description: "Sur la page Matchmaking, notre IA ALEX te trouve instantanément ton alter ego. On scanne ton style, tes mécaniques et ton rôle pour créer un duo inarrêtable.",
    bg: "from-purple-500 to-pink-500",
    path: "/matchmaking"
  },
  {
    icon: <Users size={40} className="text-green-500" />,
    title: "Liste des Joueurs",
    description: "Envie de fouiller par toi-même ? Utilise les filtres précis (Rang, Plateforme, etc.) pour sniper exactement le joueur dont tu as besoin.",
    bg: "from-green-500 to-emerald-500",
    path: "/players"
  },
  {
    icon: <Crown size={40} className="text-yellow-500" />,
    title: "Deviens une Légende",
    description: "Passe au plan Grinder ou Elite pour ignorer la file d'attente, activer le bouclier anti-toxique et obtenir le matchmaking instantané.",
    bg: "from-yellow-500 to-orange-500",
    path: "/billing"
  }
];

export function TutorialModal() {
  const { showTutorial, setShowTutorial } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!showTutorial) return null;

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      const nextPath = TUTORIAL_STEPS[currentStep + 1].path;
      if (nextPath) navigate(nextPath);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setShowTutorial(false);
    setCurrentStep(0);
    navigate('/matchmaking');
  };

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-white/20 relative animate-scale-in">
        
        {/* Skip button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-slate-400 hover:text-white bg-black/20 p-2 rounded-full transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header Graphic */}
        <div className={`h-32 bg-gradient-to-tr ${step.bg} opacity-20 w-full absolute top-0 left-0`} />
        
        <div className="p-8 pt-12 relative flex flex-col items-center text-center">
          <div className="w-24 h-24 bg-slate-900 rounded-3xl shadow-xl flex items-center justify-center mb-6 border border-white/10 relative z-10 transform transition-transform duration-500 hover:scale-105">
            {step.icon}
          </div>
          
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">{step.title}</h2>
          <p className="text-slate-300 mb-10 leading-relaxed">
            {step.description}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {TUTORIAL_STEPS.map((_, idx) => (
              <div 
                key={idx} 
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentStep ? 'w-8 bg-blue-500' : 'w-2 bg-white/20'
                }`}
              />
            ))}
          </div>

          <div className="w-full flex gap-3">
            <button 
              onClick={handleClose}
              className="flex-1 py-3.5 rounded-xl font-bold border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
            >
              Skip
            </button>
            <button 
              onClick={handleNext}
              className="flex-[2] py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? "Commencer" : "Suivant"} <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
