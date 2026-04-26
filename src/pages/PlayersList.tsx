import { useEffect, useState } from 'react';
import { PlayerCard } from '../components/ui/PlayerCard';
import { Profile, supabase } from '../lib/supabase';
import { Search, Users } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function PlayersList() {
  const { currentUser } = useAppStore();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRank, setFilterRank] = useState<string>('Tous les rangs');
  const [filterPlatform, setFilterPlatform] = useState<string>('Toutes plateformes');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.from('profiles').select('*').limit(100);
        if (!error && data) {
          setPlayers(data as Profile[]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, []);

  const filteredPlayers = players.filter(p => {
    if (p.id === currentUser?.id) return false;
    
    // Search filter
    const matchesSearch = (p.epic_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.bio && p.bio.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch && searchTerm) return false;

    // Rank filter
    if (filterRank !== 'Tous les rangs' && p.rank !== filterRank) return false;

    // Platform filter
    if (filterPlatform !== 'Toutes plateformes' && (!p.platform || !p.platform.includes(filterPlatform))) return false;

    return true;
  }).sort((a, b) => {
    if (a.has_badge && !b.has_badge) return -1;
    if (!a.has_badge && b.has_badge) return 1;
    if (a.plan === 'pro' && b.plan !== 'pro') return -1;
    if (a.plan !== 'pro' && b.plan === 'pro') return 1;
    return 0;
  });

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <Users className="text-blue-500" size={32} />
            Joueurs
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Recherche un joueur spécifique ou découvre ton futur duo ici !
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dropdown Rangs */}
          <div className="glass px-3 py-2 rounded-2xl border border-blue-500/20">
            <select 
              value={filterRank} 
              onChange={(e) => setFilterRank(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option className="bg-slate-900 text-white" value="Tous les rangs">Tous les rangs</option>
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

          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block"></div>

          {/* Dropdown Plateforme */}
          <div className="glass px-3 py-2 rounded-2xl border border-blue-500/20">
            <select 
              value={filterPlatform} 
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option className="bg-slate-900 text-white" value="Toutes plateformes">Plateformes</option>
              <option className="bg-slate-900 text-white" value="PC">PC</option>
              <option className="bg-slate-900 text-white" value="PlayStation">PlayStation</option>
              <option className="bg-slate-900 text-white" value="Xbox">Xbox</option>
              <option className="bg-slate-900 text-white" value="Switch">Switch</option>
              <option className="bg-slate-900 text-white" value="Mobile">Mobile</option>
            </select>
          </div>

          <div className="relative w-full md:w-64 glass rounded-2xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher un pseudo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent border-none py-3 pl-10 pr-4 outline-none dark:text-white"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map(player => (
              <PlayerCard key={player.id} player={player} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center text-slate-500">
              Aucun joueur trouvé pour cette recherche.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
