export interface GameStats {
  mats: number;
  stuff: string; // The user inputs their whole stuff
  zone: number;
  placement: string; // 'Edge', 'Center', 'Highground', 'Lowground'
}

export function analyzeGameByAlex(stats: GameStats): string[] {
  const feedback: string[] = [];
  const stuffLower = stats.stuff.toLowerCase();

  // Si Mats == 0 et Zone < 5
  if (stats.mats === 0 && stats.zone < 5) {
    feedback.push("T'es un clochard ? Pourquoi t'as zéro build avant même la mid-game ? Apprends à farm ou arrête de spam les murs pour rien.");
  }

  // Si le stuff mentionne des heals (pot, kit, mini, splash, poissons)
  const hasHeals = ['splash', 'mini', 'kit', 'pot', 'grosse', 'poisson', 'heal'].some(h => stuffLower.includes(h));
  if (hasHeals) {
    feedback.push(`T'es mort avec ça dans ton stuff ("${stats.stuff}") ? C'est une erreur de débutant. On se soigne avant de peek, t'es pas un bot.`);
  } else if (!hasHeals && stats.zone > 3) {
    feedback.push(`Même pas un seul heal dans ton stuff ("${stats.stuff}") en Zone ${stats.zone} ? Ta gestion d'inventaire est éclatée au sol.`);
  }

  // Si Zone > 7 et Placement == 'Edge'
  if (stats.zone > 7 && stats.placement === 'Edge') {
    feedback.push("T'es coincé en bord de zone 8 alors que t'avais de la mobilité ? Ta rotat était lente. L'IGL dormait ou quoi ?");
  }

  if (feedback.length === 0) {
    if (stats.zone > 7) {
      feedback.push("Pas de grosse erreur de macro détectée. Si t'es mort au spawn ou en late, c'est juste que t'as perdu ton 1v1. Go DM ou retravaille ton piece control.");
    } else {
      feedback.push("Mort prématurée. Pas assez de données macro pour une analyse. Arrête de 50/50 au spawn.");
    }
  }

  return feedback;
}
