import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { planId, isAnnual, userId } = req.body;
      
  if (!userId) {
    return res.status(401).json({ error: 'Tu dois être connecté pour souscrire à un abonnement.' });
  }

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return res.status(500).json({ 
      error: "La clé Stripe (STRIPE_SECRET_KEY) n'est pas configurée. Ajoute-la dans les variables d'environnement Vercel." 
    });
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16' as any });

  // Configuration du prix selon le plan
  let unitAmount = 0;
  let productName = '';
  let productDescription = '';
  
  let planKey = planId;
  if (planKey === 'tryharder' || planKey === 'elite' || planKey === 'pro-sync') {
    planKey = planKey === 'tryharder' ? 'grinder' : 'pro';
  }

  if (planKey === 'grinder') {
    productName = 'Pass GRINDER';
    productDescription = `FNMATE - Accès exclusif : ${productName} (${isAnnual ? 'Annuel' : 'Mensuel'})`;
    unitAmount = isAnnual ? 4900 : 499; // en centimes
  } else if (planKey === 'pro') {
    productName = 'Pass PRO';
    productDescription = `FNMATE - Accès exclusif : ${productName} (${isAnnual ? 'Annuel' : 'Mensuel'})`;
    unitAmount = isAnnual ? 7900 : 999;
  } else if (planKey === 'match-divin') {
    productName = 'Matchmaking Divin (1h)';
    productDescription = 'Boost de priorité Serveur. Matchmaking Premium activé.';
    unitAmount = 149; // 1.49€
  } else if (planId === 'analyse-flash') {
    productName = 'Rapport de Frappe ALEX';
    productDescription = 'Une analyse brutale et honnête post-game de ton IA Coach.';
    unitAmount = 99; // 0.99€
  } else if (planId === 'badge') {
    productName = 'Badge de Certification';
    productDescription = 'Badge Exclusif permanent sur ton profil FNMATE.';
    unitAmount = 299; // 2.99€
  } else if (planId === 'karma') {
    productName = 'Reset du Cash & Karma';
    productDescription = 'Efface ton historique toxique et retrouve la lumière. Pardon accordé.';
    unitAmount = 199; // 1.99€
  } else {
    return res.status(400).json({ error: 'Plan invalide.' });
  }

  try {
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const host = req.headers.host;
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: productName,
              description: productDescription,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      client_reference_id: userId,
      success_url: `${protocol}://${host}/?success=true&plan=${planKey}`,
      cancel_url: `${protocol}://${host}/?cancel=true`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error("Erreur Checkout Stripe:", error);
    res.status(500).json({ error: error.message });
  }
}
