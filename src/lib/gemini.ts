import { GoogleGenAI } from "@google/genai";

const getAi = () => {
  const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY || (process as any).env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export async function generateBio(keywords: string[]): Promise<string> {
  const ai = getAi();
  if (!ai) return "IA non configurée.";

  try {
    const prompt = `Agis comme un simple assistant. Construis une courte phrase (ou 2 au max) très chill et basique à partir de ces mots-clés : ${(keywords || []).join(', ')}. Pas de jeu de rôle, pas d'histoires de gladiateur ou de surenchère. Fais juste une phrase naturelle, directe et amicale à la 1ère personne pour mon profil. Ne retourne QUE la bio générée.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    
    return response.text || "Bio non générée.";
  } catch (e: any) {
    console.error("Gemini Bio Error:", e);
    return "Erreur lors de la génération.";
  }
}

export async function matchCompatibility(player1: any, player2: any): Promise<{score: number, explanation: string}> {
  // Logic remained similar but now on frontend with valid model
  let synergyScore = 50;
  let reasons: string[] = [];

  const role1 = (player1.role || "Fragger").toUpperCase();
  const role2 = (player2.role || "Fragger").toUpperCase();

  if ((role1 === 'FRAGGER' && role2 === 'IGL') || (role1 === 'IGL' && role2 === 'FRAGGER')) {
    synergyScore += 45;
    reasons.push("Combo IGL/Fragger parfait.");
  } else if (role1 === 'FRAGGER' && role2 === 'FRAGGER') {
    synergyScore -= 10;
    reasons.push("Double Fragger : Trop agressif.");
  }

  const ai = getAi();
  if (!ai) return { score: synergyScore, explanation: "Analyse technique: " + reasons.join(' ') };

  try {
    const prompt = `Agis comme ALEX, l'IA provocatrice et experte de FNMATE.
Analyse ce matchmaking Fortnite. Le score mathématique est de ${synergyScore}%.
Joueur 1 : Rôle ${role1}, Bio "${player1.bio || ''}"
Joueur 2 : Rôle ${role2}, Bio "${player2.bio || ''}"

Rédige un verdict brutal, technique (jargon fortnite) et ultra-punchy en 2 phrases max.`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    
    return { score: synergyScore, explanation: response.text || "Match validé par ALEX." };
  } catch (e) {
    console.error("Gemini Match Error:", e);
    return { score: synergyScore, explanation: "Erreur d'analyse IA." };
  }
}

export async function analyzeToxicity(message: string): Promise<boolean> {
  const ai = getAi();
  if (!ai) return false;

  try {
    const prompt = `Analyse ce message de chat gaming: "${message}". Est-il clairement toxique ou insultant ? Répond uniquement par "true" ou "false".`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    
    return response.text?.toLowerCase().includes("true") ?? false;
  } catch (e) {
    console.error("Gemini Toxicity Error:", e);
    return false;
  }
}

export async function alexCoachAnalysis(stats: any): Promise<string[]> {
  const ai = getAi();
  if (!ai) return ["IA non connectée. Mais je parie que t'es nul."];

  try {
    const prompt = `Agis comme ALEX, le coach le plus brutal et honnête de l'histoire de Fortnite.
Analyse ces stats de mort :
Mats : ${stats.mats}
Stuff : ${stats.stuff}
Zone : ${stats.zone}
Placement : ${stats.placement}

Donne 2 ou 3 conseils ultra-violents, provocateurs et techniques (piece control, rotation, spray meta).
Chaque conseil doit piquer. Format: Retourne une liste de phrases curtes séparées par des pipes (|).`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });
    
    return (response.text || "").split('|').map(s => s.trim()).filter(s => s.length > 0);
  } catch (e) {
    console.error("Gemini Coach Error:", e);
    return ["Erreur d'analyse. Probablement ton niveau de jeu qui fait crash l'IA."];
  }
}
