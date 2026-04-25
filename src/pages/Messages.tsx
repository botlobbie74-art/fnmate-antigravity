import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldAlert, Send } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { supabase, Profile } from '../lib/supabase';
import { analyzeToxicity } from '../lib/gemini';
import { playNotificationSound } from '../lib/audio';

type ChatMessage = {
  id: string;
  text: string;
  sender_id: string;
  receiver_id: string;
  is_toxic: boolean;
  created_at: string;
};

export default function Messages() {
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get('user');
  
  const { currentUser, resetUnread, toxicityFilterEnabled } = useAppStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [targetUserProfile, setTargetUserProfile] = useState<Profile | null>(null);
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    resetUnread();
    
    if (!currentUser || !targetUserId || !supabase) return;

    let active = true;
    
    const fetchTargetProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', targetUserId).single();
      if (data && active) setTargetUserProfile(data as Profile);
    };

    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
        
      if (!error && data && active) {
        setMessages(data as ChatMessage[]);
      }
      if (active) setLoadingMessages(false);
    };

    fetchTargetProfile();
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat:messages`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`
      }, payload => {
        const newMsg = payload.new as ChatMessage;
        if (newMsg.sender_id === targetUserId) {
          setMessages(prev => [...prev, newMsg]);
          playNotificationSound();
        }
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [targetUserId, currentUser, resetUnread]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || !currentUser || !targetUserId) return;
    
    const textToSend = inputText;
    setInputText(''); 
    
    let isToxic = false;
    if (toxicityFilterEnabled) {
      setIsAnalyzing(true);
      isToxic = await analyzeToxicity(textToSend);
      setIsAnalyzing(false);
    }

    if (isToxic) {
      const newReputation = Math.max(0, (currentUser.reputation ?? 100) - 20);
      if (supabase) {
        await supabase
          .from('profiles')
          .update({ reputation: newReputation })
          .eq('id', currentUser.id);
      }
      useAppStore.getState().setCurrentUser({ ...currentUser, reputation: newReputation });
      
      // We block the message
      return;
    }

    if (!supabase) return;

    const optimisticMsg: ChatMessage = {
      id: Date.now().toString(),
      text: textToSend,
      sender_id: currentUser.id,
      receiver_id: targetUserId,
      is_toxic: isToxic,
      created_at: new Date().toISOString()
    };
    
    // Optimistic update
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: targetUserId,
        text: textToSend,
        is_toxic: isToxic
      });
      if (error) throw error;
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setInputText(textToSend); // put back in input
      alert("❌ Une erreur est survenue lors de l'envoi. Ton message a été remis dans la zone de texte. Réessaie !");
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="glass p-8 rounded-2xl text-center">
          <p className="mb-4">Tu dois créer un profil pour accéder à la messagerie.</p>
          <a href="/profile" className="text-blue-500 font-bold hover:underline">Créer mon profil</a>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-140px)] flex glass rounded-3xl overflow-hidden shadow-2xl border border-white/20">
      
      {/* Sidebar - Contacts */}
      <div className="hidden md:block w-1/3 border-r border-slate-200 dark:border-white/10 bg-white/30 dark:bg-black/30 backdrop-blur-md">
        <div className="p-4 border-b border-slate-200 dark:border-white/10">
          <h2 className="font-bold text-lg">Discussions</h2>
        </div>
        <div className="overflow-y-auto h-full p-2">
          {targetUserId && (
             <div className="p-3 rounded-xl bg-white/50 dark:bg-white/10 flex items-center gap-3 cursor-pointer">
               {targetUserProfile?.avatar_url ? (
                  <img src={targetUserProfile.avatar_url} className="w-10 h-10 rounded-full object-cover" />
               ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">{targetUserProfile?.epic_name?.charAt(0).toUpperCase() || 'J'}</div>
               )}
               <div className="flex-1 overflow-hidden">
                 <p className="font-bold truncate">{targetUserProfile?.epic_name || `Joueur #${targetUserId.substring(0, 4)}`}</p>
                 <p className="text-xs text-slate-500 truncate">Discussion active</p>
               </div>
             </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {targetUserId ? (
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0f111a]/50 backdrop-blur-sm relative">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-6 bg-white/40 dark:bg-black/40 backdrop-blur-md">
           <div className="flex items-center gap-3">
             {targetUserProfile?.avatar_url ? (
                <img src={targetUserProfile.avatar_url} className="w-8 h-8 rounded-full object-cover" />
             ) : (
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">{targetUserProfile?.epic_name?.charAt(0).toUpperCase() || 'P'}</div>
             )}
             <span className="font-bold">{targetUserProfile?.epic_name || "Partenaire"}</span>
           </div>
           
           <div className="flex items-center gap-2">
             <span className="text-[10px] font-bold uppercase text-slate-500 hidden sm:block">Évaluer ce mate:</span>
             <button 
                onClick={async () => {
                   if (!supabase || !targetUserId) return;
                   
                   // Check recent positive report
                   const { data: recentReports } = await supabase
                     .from('reports')
                     .select('created_at')
                     .eq('reporter_id', currentUser.id)
                     .eq('reported_id', targetUserId)
                     .eq('type', 'crack')
                     .order('created_at', { ascending: false })
                     .limit(1);

                   if (recentReports && recentReports.length > 0) {
                     const lastReport = new Date(recentReports[0].created_at);
                     const diffDays = (new Date().getTime() - lastReport.getTime()) / (1000 * 3600 * 24);
                     if (diffDays < 7) {
                       return;
                     }
                   }

                   await supabase.from('reports').insert({ reporter_id: currentUser.id, reported_id: targetUserId, type: 'crack' });
                   
                   const { data } = await supabase.from('profiles').select('reputation').eq('id', targetUserId).single();
                   const currentRep = data?.reputation ?? 100;
                   const newRep = Math.min(100, currentRep + 5);
                   await supabase.from('profiles').update({ reputation: newRep }).eq('id', targetUserId);
                }}
                className="px-3 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg text-xs font-bold uppercase transition-colors"
             >
                Crack 🔥
             </button>
             <button 
                onClick={async () => {
                   if (!supabase || !targetUserId) return;
                   
                   // Rate limiting: 1 fraud report per 7 days per target
                   const { data: recentReports } = await supabase
                     .from('reports')
                     .select('created_at')
                     .eq('reporter_id', currentUser.id)
                     .eq('reported_id', targetUserId)
                     .eq('type', 'fraude')
                     .order('created_at', { ascending: false })
                     .limit(1);

                   if (recentReports && recentReports.length > 0) {
                     const lastReport = new Date(recentReports[0].created_at);
                     const diffDays = (new Date().getTime() - lastReport.getTime()) / (1000 * 3600 * 24);
                     if (diffDays < 7) {
                       return;
                     }
                   }

                   // Record the report
                   await supabase.from('reports').insert({ reporter_id: currentUser.id, reported_id: targetUserId, type: 'fraude' });

                   const { data } = await supabase.from('profiles').select('reputation').eq('id', targetUserId).single();
                   const currentRep = data?.reputation ?? 100;
                   const newRep = Math.max(0, currentRep - 15);
                   await supabase.from('profiles').update({ reputation: newRep }).eq('id', targetUserId);
                }}
                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 rounded-lg text-xs font-bold uppercase transition-colors"
             >
                Fraude 🚮
             </button>
           </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {toxicityFilterEnabled && (
            <div className="flex justify-center mb-8">
              <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20 rounded-full text-xs font-medium flex items-center gap-2">
                <ShieldAlert size={14} /> 
                Toxic-Shield activé. Ce chat est surveillé par l'IA FNMATE.
              </div>
            </div>
          )}
          
          {loadingMessages && <div className="text-center text-slate-500 py-4">Chargement...</div>}
          {messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] rounded-2xl px-5 py-3 
                  ${isMe 
                    ? 'bg-blue-600 text-white rounded-br-sm' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-bl-sm'}
                  ${msg.is_toxic ? 'blur-sm hover:blur-none transition-all cursor-help border-red-500 border-2' : ''}
                `}
                title={msg.is_toxic ? "Message masqué par le Toxic-Shield. Survolez pour révéler." : ""}
              >
                {msg.text}
                {msg.is_toxic && (
                  <p className="text-[10px] opacity-70 mt-1 uppercase font-bold text-red-300">
                    <ShieldAlert size={10} className="inline mr-1"/> Contenu Toxique Détecté
                  </p>
                )}
              </div>
            </div>
            );
          })}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white/40 dark:bg-black/40 border-t border-slate-200 dark:border-white/10 backdrop-blur-md">
          <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full px-4 py-2">
            <input 
               type="text"
               value={inputText}
               onChange={e => setInputText(e.target.value)}
               onKeyDown={e => e.key === 'Enter' && handleSend()}
               placeholder="Envoyer un message"
               className="flex-1 bg-transparent border-none outline-none py-2"
            />
            <button 
              onClick={handleSend}
              disabled={isAnalyzing || !inputText.trim()}
              className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Send size={20} />}
            </button>
          </div>
        </div>
      </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-50/50 dark:bg-[#0f111a]/50 backdrop-blur-sm">
          <p className="text-slate-500 font-medium">Pas de messages</p>
        </div>
      )}
    </div>
  );
}
