import express from 'express';
import { createServer as createViteServer } from 'vite';
import Stripe from 'stripe';
import path from 'path';

let stripeClient: Stripe | null = null;

function getStripe() {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      console.warn("ATTENTION: STRIPE_SECRET_KEY est manquant. Le paiement est simulé ou plantera.");
      return null;
    }
    stripeClient = new Stripe(key, { apiVersion: '2023-10-16' as any });
  }
  return stripeClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  // --- STRIPE ENDPOINT ---
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { planId, isAnnual, userId } = req.body;
      
      if (!userId) {
        return res.status(401).json({ error: 'Tu dois être connecté pour souscrire à un abonnement.' });
      }

      const stripe = getStripe();
      if (!stripe) {
        return res.status(500).json({ 
          error: "La clé Stripe (STRIPE_SECRET_KEY) n'est pas configurée côté serveur. Ajoute-la dans les variables d'environnement." 
        });
      }

      // Configuration du prix selon le plan
      let unitAmount = 0;
      let productName = '';
      let productDescription = '';
      
      let planKey = planId;
      // Normalisation des IDs de plans
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

      // Par défaut, Stripe Checkout active Apple Pay/Google Pay si 'payment_method_types' n'est pas restreint à ['card'].
      const session = await stripe.checkout.sessions.create({
        // On omet `payment_method_types` pour laisser le Dashboard décider et inclure Apple Pay
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
        success_url: `${req.protocol}://${req.get('host')}/?success=true&plan=${planKey}`,
        cancel_url: `${req.protocol}://${req.get('host')}/?cancel=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Erreur Checkout Stripe:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite Middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Mode Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
