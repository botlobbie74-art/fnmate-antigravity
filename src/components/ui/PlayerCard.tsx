import React from 'react';
import { Profile } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { MessageSquare, Target, User, Shield, Crosshair, Brain, ShieldCheck, Monitor, Gamepad2, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PlayerCard: React.FC<{ 
  player: Profile, 
  matchScore?: number
}> = ({ player, matchScore }) => {
  const { currentUser } = useAppStore();

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Unreal': return 'from-red-500 to-purple-600 border-red-500/50';
      case 'Champion': return 'from-orange-400 to-red-500 border-orange-500/50';
      case 'Elite': return 'from-slate-700 to-slate-900 border-slate-500/50';
      case 'Diamond': return 'from-cyan-400 to-blue-500 border-cyan-500/50';
      case 'Platinum': return 'from-teal-300 to-teal-500 border-teal-500/50';
      case 'Gold': return 'from-yellow-300 to-yellow-500 border-yellow-500/50';
      case 'Silver': return 'from-slate-300 to-slate-400 border-slate-400/50';
      default: return 'from-orange-700 to-orange-800 border-orange-700/50'; // Bronze
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-[2px] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-${getRankColor(player.rank).split('-')[1]}/20 group`}>
      {/* Background Gradient Border */}
      <div className={`absolute inset-0 bg-gradient-to-br ${getRankColor(player.rank)} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
      
      {/* Card Body */}
      <div className="relative h-full bg-white dark:bg-slate-900 rounded-[14px] p-5 flex flex-col gap-4">
        
        {/* Header & Avatar */}
        <div className="flex gap-4 items-start">
          <div className="relative">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 overflow-hidden shadow-inner border-2 border-white/10">
              {player.avatar_url ? (
                <img src={player.avatar_url} alt={player.epic_name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User size={40} className="text-slate-400 opacity-50" />
                </div>
              )}
            </div>
            {matchScore !== undefined && (
              <div className="absolute -bottom-3 -right-3 bg-slate-900 dark:bg-slate-800 rounded-full p-1 border-2 border-slate-800 shadow-xl z-10">
                <div className={`w-10 h-10 flex flex-col items-center justify-center rounded-full font-black text-white
                  ${matchScore >= 80 ? 'bg-green-500' : matchScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}
                `}>
                  <span className="text-xs leading-none">{matchScore}%</span>
                  <span className="text-[8px] leading-none opacity-80 uppercase">Match</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex-1 pt-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white truncate max-w-full">
                {player.epic_name}
              </h3>
              {player.has_badge && (
                <div className="relative group/badge flex items-center shrink-0 cursor-help">
                  <div className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] animate-pulse">
                    <ShieldCheck size={20} fill="currentColor" className="text-yellow-600" />
                  </div>
                  <div className="absolute hidden group-hover/badge:block z-50 w-56 p-3 bg-slate-900 text-white text-[10px] rounded-xl shadow-2xl bottom-full mb-2 -translate-x-1/2 left-1/2 border border-yellow-500/30 text-center leading-relaxed font-bold normal-case">
                    <div className="text-yellow-400 mb-1">VÉRIFIÉ & SYNC</div>
                    Ce joueur a prouvé son engagement. Obtiens ton badge pour être prioritaire.
                  </div>
                </div>
              )}
              {player.age && <span className="text-sm text-slate-500 font-medium shrink-0">{player.age}A</span>}
            </div>
            <p className="text-sm font-bold text-blue-500 dark:text-blue-400 mb-2 truncate">
              {player.role?.toUpperCase() || 'FRAGGER'}
            </p>
            <div className={`inline-block px-3 py-1 rounded-sm text-xs font-black uppercase tracking-widest bg-gradient-to-r text-white shadow-sm ${getRankColor(player.rank)}`}>
              {player.rank}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-200 dark:border-white/10 mt-2">
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
            <Crosshair size={16} className="text-red-400 mb-1" />
            <span className="text-lg font-black leading-none">{player.aim_score || 50}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Aim</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
            <Shield size={16} className="text-blue-400 mb-1" />
            <span className="text-lg font-black leading-none">{player.build_score || 50}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">Build</span>
          </div>
          <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-black/5 dark:bg-white/5">
            <Brain size={16} className="text-purple-400 mb-1" />
            <span className="text-lg font-black leading-none">{player.iq_score || 50}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider opacity-60">IQ</span>
          </div>
        </div>

        {/* Bio & Modes & Platforms */}
        <div className="flex-1 flex flex-col justify-between mt-2">
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic mb-3">
            "{player.bio || "Pas de bio renseignée"}"
          </p>
          <div className="flex flex-col gap-2">
            {player.platform && (
              <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-500">
                {player.platform.includes('PC') && <Monitor size={12} className="text-slate-400"/>}
                {(player.platform.includes('PlayStation') || player.platform.includes('Xbox') || player.platform.includes('Switch')) && <Gamepad2 size={12} className="text-purple-400"/>}
                {player.platform.includes('Mobile') && <Smartphone size={12} className="text-green-400"/>}
                <span className="truncate">{player.platform}</span>
              </div>
            )}
            <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-slate-500">
              <Target size={12} /> <span className="truncate">{player.mode_preference || 'Tous modes'}</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex flex-col gap-2">
          <Link 
            to={`/messages?user=${player.id}`}
            className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-black uppercase tracking-wider transition-all
              ${currentUser ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
          >
            <MessageSquare size={16} /> Contacter
          </Link>
        </div>
      </div>
    </div>
  );
}
