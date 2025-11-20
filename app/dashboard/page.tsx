'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, Plus, Edit2, Trash2, MapPin, Leaf, Info, X, Sprout, Droplets 
} from 'lucide-react';

// --- CONSTANTS ---
const STATUS_OPTIONS = [
  "Not Threatened", "Least Concern", "Near Threatened", 
  "Vulnerable", "Endangered", "Critically Endangered"
];

// Matches your Database Columns exactly
const INITIAL_FORM = {
  common_name: '',
  scientific_name: '',
  conservation_status: 'Not Threatened',
  native_to_ph: false,
  image_path: '',
  flowering_season: '',
  ecological_role: '',
  local_uses: '',
  environmental_impact: '',
  propagation_tips: ''
};

export default function AdminDashboard() {
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // --- 1. AUTH & INITIAL LOAD ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/');
    };
    checkUser();
    fetchTrees();
  }, []);

  // --- 2. DYNAMIC SEARCH (Auto-runs when you type) ---
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTrees();
    }, 300); // 300ms delay to prevent spamming database while typing
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const fetchTrees = async () => {
    setLoading(true);
    let query = supabase.from('trees').select('*').order('id', { ascending: false });

    // Dynamic Search Logic: "ma" finds "Mango" and "Mangosteen"
    if (search) query = query.ilike('common_name', `%${search}%`);
    if (statusFilter) query = query.eq('conservation_status', statusFilter);

    const { data, error } = await query;
    if (!error && data) setTrees(data);
    setLoading(false);
  };

  // --- 3. CRUD ACTIONS ---
  const openAddModal = () => {
    setFormData(INITIAL_FORM);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (tree: any) => {
    setFormData({
      common_name: tree.common_name || '',
      scientific_name: tree.scientific_name || '',
      conservation_status: tree.conservation_status || 'Not Threatened',
      native_to_ph: tree.native_to_ph || false,
      image_path: tree.image_path || '',
      flowering_season: tree.flowering_season || '',
      ecological_role: tree.ecological_role || '',
      local_uses: tree.local_uses || '',
      environmental_impact: tree.environmental_impact || '',
      propagation_tips: tree.propagation_tips || ''
    });
    setCurrentId(tree.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, last_updated: new Date().toISOString() };

    let error;
    if (isEditMode && currentId) {
      const res = await supabase.from('trees').update(payload).eq('id', currentId);
      error = res.error;
    } else {
      const res = await supabase.from('trees').insert([payload]);
      error = res.error;
    }

    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchTrees(); // Refresh list instantly
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tree?")) return;
    const { error } = await supabase.from('trees').delete().eq('id', id);
    if (!error) fetchTrees();
  };

  // --- 4. HELPER: Get Image URL ---
  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg'; // Ensure you have a placeholder image in public/
    // Replace with your ACTUAL Supabase project URL
    return `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${path}`;
  };

  const getBadgeColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('endangered') || s.includes('critical')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('vulnerable') || s.includes('near')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* --- HEADER --- */}
      <nav className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-teal-600">
            EcoLocate Admin
          </h1>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
          className="text-gray-500 hover:text-red-600 font-semibold transition flex items-center gap-2"
        >
          Logout
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">

        {/* --- MAP PLACEHOLDER (Suggestion #5) --- */}
        <div className="w-full h-64 bg-green-900 rounded-2xl overflow-hidden shadow-xl mb-8 relative group">
            {/* Make sure Map.png exists in your public folder */}
            <Image 
              src="/Map.png" 
              alt="Park Map"
              fill
              className="object-cover opacity-90 group-hover:scale-105 transition duration-700"
            />
            <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent w-full">
                <h2 className="text-white text-3xl font-bold flex items-center gap-2">
                    <MapPin className="text-green-400 fill-green-400" /> Park Overview
                </h2>
                <p className="text-gray-200 mt-2 text-lg">Manage the flora of Cavite State University Agri-Eco Tourism Park</p>
            </div>
        </div>

        {/* --- CONTROLS (Dynamic Search & Add) --- */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input 
                  placeholder="Search species (e.g. 'ma' for Mango)..." 
                  className="pl-10 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <select 
                className="p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 outline-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
            >
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <button 
            onClick={openAddModal} 
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" /> Add New Tree
          </button>
        </div>

        {/* --- TREE GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
             [...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse shadow-sm border border-gray-100" />
             ))
          ) : trees.length === 0 ? (
             <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold">No trees found.</p>
                <p className="text-sm">Try adjusting your search terms.</p>
             </div>
          ) : (
            trees.map((tree) => (
              <div key={tree.id} className="bg-white rounded-2xl shadow-sm hover:shadow-2xl border border-gray-100 overflow-hidden transition duration-300 flex flex-col group h-full">
                <div className="relative w-full h-64 overflow-hidden bg-gray-100">
                    <Image 
                        src={getImageUrl(tree.image_path)} 
                        alt={tree.common_name}
                        fill
                        className="object-cover group-hover:scale-105 transition duration-500"
                    />
                    {tree.native_to_ph && (
                        <span className="absolute top-3 right-3 bg-green-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                            <Sprout className="w-3 h-3" /> Native
                        </span>
                    )}
                </div>

                <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-3">
                        <h3 className="font-bold text-2xl text-gray-800 mb-1">{tree.common_name}</h3>
                        <p className="text-sm text-gray-500 italic font-serif">{tree.scientific_name}</p>
                    </div>
                    
                    <div className="mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColor(tree.conservation_status)}`}>
                        {tree.conservation_status}
                        </span>
                    </div>

                    <div className="mt-auto pt-4 flex gap-3 border-t border-gray-100">
                      <button 
                        onClick={() => openEditModal(tree)}
                        className="flex-1 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-2.5 rounded-xl hover:bg-blue-100 transition text-sm font-bold"
                      >
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(tree.id)}
                        className="flex-1 flex items-center justify-center gap-2 text-red-600 bg-red-50 py-2.5 rounded-xl hover:bg-red-100 transition text-sm font-bold"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- FULL FORM MODAL (Suggestion #2 & #3) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col animate-in fade-in zoom-in duration-200">
                
                {/* Modal Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">
                            {isEditMode ? "Edit Tree Details" : "Add New Tree"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Fill in all details to update the database.</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Basic Info Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Common Name</label>
                            <input required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" 
                                value={formData.common_name} onChange={e => setFormData({...formData, common_name: e.target.value})} />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Scientific Name</label>
                            <input required className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none italic" 
                                value={formData.scientific_name} onChange={e => setFormData({...formData, scientific_name: e.target.value})} />
                        </div>
                        
                        <div className="col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Conservation Status</label>
                            <select className="w-full border border-gray-300 p-3 rounded-xl bg-white focus:ring-2 focus:ring-green-500 outline-none" 
                                value={formData.conservation_status} onChange={e => setFormData({...formData, conservation_status: e.target.value})}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="col-span-1 flex items-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer bg-green-50 px-4 py-3 rounded-xl w-full border border-green-100 hover:bg-green-100 transition">
                                <input type="checkbox" className="w-5 h-5 text-green-600 rounded focus:ring-green-500" 
                                    checked={formData.native_to_ph} onChange={e => setFormData({...formData, native_to_ph: e.target.checked})} />
                                <span className="text-gray-800 font-semibold">Native to Philippines?</span>
                            </label>
                        </div>

                        <div className="col-span-full">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Image Filename</label>
                            <div className="flex gap-2">
                                <input className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm" 
                                    placeholder="e.g. mango.jpg"
                                    value={formData.image_path} onChange={e => setFormData({...formData, image_path: e.target.value})} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 ml-1">Ensure this file exists in your Supabase "trees" bucket.</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-gray-100 pt-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Info className="w-5 h-5 text-teal-600"/> Ecological Details
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Flowering Season</label>
                                <input className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                                    placeholder="e.g. April - May"
                                    value={formData.flowering_season} onChange={e => setFormData({...formData, flowering_season: e.target.value})} />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Ecological Role</label>
                                <input className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                                    placeholder="e.g. Provides shade, nitrogen fixing"
                                    value={formData.ecological_role} onChange={e => setFormData({...formData, ecological_role: e.target.value})} />
                            </div>
                            <div className="col-span-full">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Local Uses</label>
                                <textarea rows={2} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                                    placeholder="e.g. Timber, medicinal, edible fruit"
                                    value={formData.local_uses} onChange={e => setFormData({...formData, local_uses: e.target.value})} />
                            </div>
                            
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Environmental Impact</label>
                                <textarea rows={2} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                                    value={formData.environmental_impact} onChange={e => setFormData({...formData, environmental_impact: e.target.value})} />
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Propagation Tips</label>
                                <textarea rows={2} className="w-full border border-gray-300 p-3 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" 
                                    value={formData.propagation_tips} onChange={e => setFormData({...formData, propagation_tips: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">
                            Cancel
                        </button>
                        <button type="submit" className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2">
                            {isEditMode ? <><Edit2 className="w-4 h-4"/> Save Changes</> : <><Plus className="w-4 h-4"/> Add Tree</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}