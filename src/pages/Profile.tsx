import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { generateBio } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/supabase';

import { Wand2, Save, User as UserIcon, ShieldAlert, Upload, X, Users, Brain, Zap } from 'lucide-react';

const AVAILABLE_MODES = [
  'Reload',
  'Reload Classé',
  'Battle Royale',
  'Battle Royale Classé',
  'Zero Build',
  'Zero Build Reload'
];

export default function ProfilePage() {
  const { authUserId, currentUser, setCurrentUser, toxicityFilterEnabled, toggleToxicityFilter } = useAppStore();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{type: 'error'|'success', text: string} | null>(null);
  const [rewardChoice, setRewardChoice] = useState<'flash' | 'divin' | null>(null);
  
  const [formData, setFormData] = useState<Partial<Profile>>(currentUser || {
    epic_name: '',
    age: undefined,
    country: 'FR',
    bio: '',
    rank: 'Gold',
    mode_preference: '',
    play_style: '',
    build_score: 50,
    aim_score: 50,
    iq_score: 50,
    role: 'Fragger',
    avatar_url: '',
    ref_code: Math.floor(1000 + Math.random() * 9000).toString()
  });

  const [selectedModes, setSelectedModes] = useState<string[]>(
    (currentUser?.mode_preference || '').split(',').map(m => m.trim()).filter(Boolean)
  );

  const [keywords, setKeywords] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const checkBadgePayment = async () => {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get('success') === 'true';
      const plan = params.get('plan');

      if (isSuccess && authUserId && supabase) {
        if (plan === 'badge') {
          // Unlock badge in DB
          const { data, error } = await supabase
            .from('profiles')
            .update({ has_badge: true })
            .eq('id', authUserId)
            .select()
            .single();
          
          if (!error && data) {
            setCurrentUser(data);
            setFormData(prev => ({...prev, has_badge: true}));
            setStatus({ type: 'success', text: 'Paiement réussi ! Badge de Certification débloqué 🌟' });
          }
        } 
        else if (plan === 'karma') {
          // Reset Reputation in DB
          const { data, error } = await supabase
            .from('profiles')
            .update({ reputation: 100 })
            .eq('id', authUserId)
            .select()
            .single();

          if (!error && data) {
            setCurrentUser(data);
            setFormData(prev => ({...prev, reputation: 100}));
            setStatus({ type: 'success', text: 'Paiement réussi ! Ton Karma est réinitialisé, les pros te parlent à nouveau.' });
          }
        }
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };
    checkBadgePayment();
  }, [authUserId]);

  const toggleMode = (mode: string) => {
    setSelectedModes(prev => 
      prev.includes(mode) ? prev.filter(m => m !== mode) : [...prev, mode]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', text: "L'image est trop lourde (2Mo max)." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convert to WebP for better compression
        const dataUrl = canvas.toDataURL('image/webp', 0.8);
        setFormData(prev => ({ ...prev, avatar_url: dataUrl }));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setFormData(prev => ({ ...prev, avatar_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenBio = async () => {
    if (!keywords.trim()) {
      setStatus({ type: 'error', text: "Entre quelques mots clés d'abord ! (ex: tryhard, snipe)" });
      return;
    }
    setStatus(null);
    setGenerating(true);
    const keys = keywords.split(',').map(k => k.trim());
    const bio = await generateBio(keys);
    setFormData(prev => ({ ...prev, bio, play_style: keys.join(' ') }));
    setGenerating(false);
  };

  const handleSave = async (showSuccess = true) => {
    try {
      if (!formData.epic_name && !currentUser?.epic_name) return;
      
      if (supabase) {
        const { data: authData } = await supabase.auth.getUser();
        const userId = authData?.user?.id || authUserId;
        if (!userId) return;

        const storedReferredBy = localStorage.getItem('fnmate_referred_by');
        const finalRefCode = currentUser?.ref_code || formData.ref_code || Math.floor(1000 + Math.random() * 9000).toString();
        const finalReferredBy = currentUser?.referred_by || formData.referred_by || storedReferredBy || undefined;

        const { data, error } = await supabase.from('profiles').upsert({
          id: userId,
          epic_name: formData.epic_name || currentUser?.epic_name || 'Joueur',
          age: formData.age || null,
          country: formData.country || 'FR',
          bio: formData.bio || '',
          rank: formData.rank || 'Gold',
          mode_preference: selectedModes.join(', '),
          play_style: formData.play_style || '',
          build_score: formData.build_score || 50,
          aim_score: formData.aim_score || 50,
          iq_score: formData.iq_score || 50,
          role: formData.role || 'Fragger',
          avatar_url: formData.avatar_url || null,
          has_badge: currentUser?.has_badge || false,
          platform: formData.platform || '',
          ref_code: finalRefCode,
          referred_by: finalReferredBy
        }).select().single();

        if (error) {
          setStatus({ type: 'error', text: "Erreur lors de la sauvegarde." });
          return;
        }

        if (storedReferredBy && !currentUser?.referred_by) {
          localStorage.removeItem('fnmate_referred_by');
        }

        setCurrentUser(data);
        if (showSuccess) {
          setStatus({ type: 'success', text: "Modifications sauvegardées ✅" });
          setTimeout(() => setStatus(null), 3000);
        }
      }
    } catch (err: any) {
      console.error("Auto-save error:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass rounded-3xl p-8">
        <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
          <UserIcon size={32} className="text-blue-500" />
          Configuration du Profil
        </h2>

        {status && (
          <div className={`p-4 rounded-xl mb-8 border ${status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
            {status.text}
          </div>
        )}

        <div className="space-y-8">
          
          {/* Avatar Upload */}
          <div className="flex items-center gap-6 p-4 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-800 flex-shrink-0 border border-white/20">
              {formData.avatar_url ? (
                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={32} className="text-slate-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-bold mb-2">Photo de profil</p>
              <div className="flex flex-wrap items-center gap-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  <Upload size={16} /> Parcourir
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
                {formData.avatar_url && (
                  <button 
                    onClick={removeAvatar}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-sm font-medium transition-colors"
                  >
                    <X size={16} /> Supprimer
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-2">JPG, PNG ou WebP. Max 2Mo.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Pseudo Epic Games *</label>
              <input 
                type="text" 
                value={formData.epic_name || ''}
                onChange={e => setFormData({...formData, epic_name: e.target.value})}
                className="w-full bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="Ninja"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 opacity-70">Âge (optionnel)</label>
              <input 
                type="number" 
                value={formData.age || ''}
                onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                className="w-full bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                placeholder="18"
              />
            </div>
          </div>

          {/* FIFA Style Stats */}
          <div className="p-6 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800/50 dark:to-slate-900/50 border border-slate-300 dark:border-white/10 rounded-2xl">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">🕹️ Stats PlayerCard</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium mb-2 opacity-70">Rôle Principal</label>
                <select 
                  value={formData.role || 'Fragger'}
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-black/5 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
                >
                  <option className="bg-slate-900 text-white" value="IGL (Leader)">IGL (Leader : Stratégie & Rotations)</option>
                  <option className="bg-slate-900 text-white" value="Fragger">Fragger (Dégâts & Kills)</option>
                  <option className="bg-slate-900 text-white" value="Support">Support (Heal / Stuff / Couverture)</option>
                  <option className="bg-slate-900 text-white" value="Polyvalent">Polyvalent</option>
                </select>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium opacity-70">Aim Score (Shoot)</label>
                    <span className="text-sm font-bold text-blue-500">{formData.aim_score || 50}/100</span>
                  </div>
                  <input type="range" min="0" max="100" value={formData.aim_score || 50} onChange={e => setFormData({...formData, aim_score: Number(e.target.value)})} className="w-full accent-blue-500" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium opacity-70">Build Score (Mécaniques)</label>
                    <span className="text-sm font-bold text-blue-500">{formData.build_score || 50}/100</span>
                  </div>
                  <input type="range" min="0" max="100" value={formData.build_score || 50} onChange={e => setFormData({...formData, build_score: Number(e.target.value)})} className="w-full accent-blue-500" />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium opacity-70">Game Sense (IQ)</label>
                    <span className="text-sm font-bold text-blue-500">{formData.iq_score || 50}/100</span>
                  </div>
                  <input type="range" min="0" max="100" value={formData.iq_score || 50} onChange={e => setFormData({...formData, iq_score: Number(e.target.value)})} className="w-full accent-blue-500" />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {['PC', 'PlayStation', 'Xbox', 'Switch', 'Mobile'].map(platform => {
                const selectedPlatforms = (formData.platform || '').split(',').map(p => p.trim()).filter(Boolean);
                const isSelected = selectedPlatforms.includes(platform);
                return (
                  <button
                    key={platform}
                    onClick={() => {
                      const newPlatforms = isSelected 
                        ? selectedPlatforms.filter(p => p !== platform)
                        : [...selectedPlatforms, platform];
                      setFormData({...formData, platform: newPlatforms.join(', ')});
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                      isSelected 
                        ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                        : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {platform}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Modes Préférés</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_MODES.map(mode => (
                <button
                  key={mode}
                  onClick={() => toggleMode(mode)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                    selectedModes.includes(mode) 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' 
                      : 'bg-black/20 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70">Rang Actuel</label>
            <select 
              value={formData.rank || 'Gold'}
              onChange={e => setFormData({...formData, rank: e.target.value as any})}
              className="w-full bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors"
            >
              <option className="bg-slate-900 text-white" value="Bronze">Bronze</option>
              <option className="bg-slate-900 text-white" value="Silver">Silver</option>
              <option className="bg-slate-900 text-white" value="Gold">Gold</option>
              <option className="bg-slate-900 text-white" value="Platinum">Platinum</option>
              <option className="bg-slate-900 text-white" value="Diamond">Diamond</option>
              <option className="bg-slate-900 text-white" value="Elite">Elite</option>
              <option className="bg-slate-900 text-white" value="Champion">Champion</option>
              <option className="bg-slate-900 text-white" value="Unreal">Unreal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 opacity-70 flex items-center justify-between">
              Bio Classique
              <div className="flex bg-blue-500/10 rounded-full p-1 border border-blue-500/20 group">
                <input 
                  type="text" 
                  value={keywords}
                  onChange={e => setKeywords(e.target.value)}
                  placeholder="Mots-clés (tryhard, fun...)" 
                  className="bg-transparent border-none text-xs w-32 px-2 outline-none"
                />
                <button 
                  onClick={handleGenBio}
                  disabled={generating}
                  className="text-xs font-bold text-blue-500 px-3 py-1 bg-white dark:bg-slate-900 rounded-full shadow hover:bg-blue-500 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
                >
                  {generating ? "..." : <><Wand2 size={12}/> Auto-Bio IA</>}
                </button>
              </div>
            </label>
            <textarea 
              value={formData.bio || ''}
              onChange={e => setFormData({...formData, bio: e.target.value})}
              rows={3}
              className="w-full bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors resize-none"
              placeholder="Décris brièvement tes dispos ou une envie..."
            />
            
            <div className="mt-6">
              <button 
                onClick={() => handleSave(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-600/20"
              >
                <Save size={20} />
                Sauvegarder mon profil
              </button>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200 dark:border-white/10 mt-6 space-y-4 animate-fade-in">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert size={24} className="text-blue-500" />
              Réglages & Sécurité
            </h3>
            
            <div className="flex items-center justify-between glass p-4 rounded-xl">
              <div>
                <p className="font-bold">Toxic-Shield IA</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Analyse et masque automatiquement le contenu offensant dans la messagerie.</p>
              </div>
              <button 
                onClick={toggleToxicityFilter} 
                className={`w-14 h-8 rounded-full transition-colors relative flex-shrink-0 ${toxicityFilterEnabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-700'}`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${toxicityFilterEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
              <div>
                <p className="font-bold flex items-center gap-2 text-yellow-500">
                  Badge de Certification FNMATE 🌟
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Prouve que ton compte est légitime. Badge permanent sur ton profil. Paiement Unique.</p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const token = await useAppStore.getState().fetchSessionToken();
                    if(!token) return;
                    const response = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ userId: currentUser?.id, planId: 'badge' }),
                    });
                    const data = await response.json();
                    if(data.url) window.location.href = data.url;
                  } catch(e) {}
                }} 
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold rounded-xl whitespace-nowrap active:scale-95 transition-transform"
              >
                Acheter {currentUser?.has_badge ? '(Déjà Possédé)' : '(2.99€)'}
              </button>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <div>
                <p className="font-bold flex items-center gap-2 text-red-500">
                  Rachat de Karma (Score: {currentUser?.reputation ?? 100}/100)
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Tu es shadow-ban car tu as été jugé fraude ou toxique ? Réinitialise ton historique.</p>
              </div>
              <button 
                onClick={async () => {
                  try {
                    const token = await useAppStore.getState().fetchSessionToken();
                    if(!token) return;
                    const response = await fetch('/api/create-checkout-session', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({ userId: currentUser?.id, planId: 'karma' }),
                    });
                    const data = await response.json();
                    if(data.url) window.location.href = data.url;
                  } catch(e) {}
                }} 
                disabled={(currentUser?.reputation ?? 100) >= 80}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 text-white font-bold rounded-xl whitespace-nowrap active:scale-95 transition-transform"
              >
                Reset (1.99€)
              </button>
            </div>
            
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-900/20 border border-green-500/30 mt-8 animate-fade-in relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                <Users size={120} />
              </div>
              <h4 className="text-xl font-black mb-2 flex items-center gap-2 text-green-500">
                <Users size={24} /> Programme Ambassadeur (BETA)
              </h4>
              <p className="text-sm text-slate-400 mb-6 font-medium">
                Amène un pote sur FNMATE. S'il s'inscrit, tu gagnes un boost.<br/>
                <span className="text-white font-bold">Pas de cash. C'est soit une Analyse Flash (0.99€), soit un Match Divin (1.49€) gratuit. IL FAUT CHOISIR.</span>
              </p>
              
              <div className="mb-6 relative z-10">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Choisis ta récompense parrainage :</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button 
                    onClick={() => setRewardChoice('flash')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                      rewardChoice === 'flash' 
                        ? 'bg-red-500/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                        : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${rewardChoice === 'flash' ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      <Brain size={20} />
                    </div>
                    <div className="text-left leading-tight">
                      <div className={`font-bold ${rewardChoice === 'flash' ? 'text-red-400' : 'text-slate-400'}`}>Analyse Flash</div>
                      <div className="text-[10px] text-slate-500 uppercase">Le roast d'ALEX</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => setRewardChoice('divin')}
                    className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${
                      rewardChoice === 'divin' 
                        ? 'bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                        : 'bg-black/20 border-white/5 hover:border-white/20'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${rewardChoice === 'divin' ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-slate-500'}`}>
                      <Zap size={20} />
                    </div>
                    <div className="text-left leading-tight">
                      <div className={`font-bold ${rewardChoice === 'divin' ? 'text-yellow-400' : 'text-slate-400'}`}>Match Divin</div>
                      <div className="text-[10px] text-slate-500 uppercase">Top Priorité</div>
                    </div>
                  </button>
                </div>
              </div>

              <div className={`transition-all duration-300 relative z-10 ${rewardChoice ? 'opacity-100 translate-y-0' : 'opacity-50 pointer-events-none translate-y-2'}`}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Ton code affilié de 4 chiffres :</label>
                <div className="flex bg-black/40 border-2 border-green-500/30 rounded-xl overflow-hidden focus-within:border-green-500 transition-colors">
                  <input 
                    type="text" 
                    readOnly 
                    value={currentUser?.ref_code || formData.ref_code || '----'} 
                    className="flex-1 bg-transparent px-4 py-3 text-xl text-green-100 font-mono font-bold tracking-[0.5em] outline-none text-center" 
                  />
                  <button 
                    onClick={async () => {
                      const code = currentUser?.ref_code || formData.ref_code;
                      if (!code) return;
                      try {
                        await navigator.clipboard.writeText(code);
                        setStatus({ type: 'success', text: 'Code copié ! Va spam tes mates.' });
                      } catch(e) {
                        setStatus({ type: 'error', text: 'Sélectionne et copie le code manuellement.' });
                      }
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-wider transition-colors flex items-center gap-2"
                  >
                    Copier
                  </button>
                </div>
              </div>

              <div className="pt-8 mt-4 border-t border-red-500/10 flex justify-center">
                <button 
                  onClick={async () => {
                    if (window.confirm("Veux-tu vraiment supprimer définitivement ton compte FNMATE ? Cette action est irréversible.")) {
                      if (supabase) {
                        try {
                          await supabase.from('profiles').delete().eq('id', authUserId);
                          await supabase.auth.signOut();
                          window.location.href = '/';
                        } catch (err) {
                          console.error("Erreur suppression compte", err);
                        }
                      }
                    }
                  }}
                  className="text-xs font-bold text-red-500/60 hover:text-red-500 uppercase tracking-widest transition-colors flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-red-500/10"
                >
                  <X size={14} /> Supprimer mon compte
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
