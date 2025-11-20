'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Search, Plus, Edit2, Trash2, MapPin, Leaf, Info, X, Sprout, UploadCloud, Loader2 
} from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Dashboard | EcoLocate",
};
const STATUS_OPTIONS = [
  "Not Threatened", "Least Concern", "Near Threatened", 
  "Vulnerable", "Endangered", "Critically Endangered"
];

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

  // Modal & Upload State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [uploading, setUploading] = useState(false); // NEW: Track upload status

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/');
    };
    checkUser();
    fetchTrees();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchTrees();
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const fetchTrees = async () => {
    setLoading(true);
    let query = supabase.from('trees').select('*').order('id', { ascending: false });
    if (search) query = query.ilike('common_name', `%${search}%`);
    if (statusFilter) query = query.eq('conservation_status', statusFilter);
    const { data, error } = await query;
    if (!error && data) setTrees(data);
    setLoading(false);
  };

  // --- NEW: IMAGE UPLOAD FUNCTION ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      // Create a unique filename: timestamp-filename.jpg
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to Supabase "trees" bucket
      const { error: uploadError } = await supabase.storage
        .from('trees')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // If successful, update the form data with the new filename
      setFormData({ ...formData, image_path: filePath });
      alert("Image uploaded successfully!");

    } catch (error: any) {
      alert('Error uploading image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const openAddModal = () => {
    setFormData(INITIAL_FORM);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (tree: any) => {
    setFormData({ ...tree });
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
      fetchTrees();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('trees').delete().eq('id', id);
    if (!error) fetchTrees();
  };

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg'; 
    return `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${path}`;
  };

  const getBadgeColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('endangered')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('vulnerable')) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* HEADER */}
      <nav className="bg-white border-b sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          {/* Logo placeholder - ensure logo.png is in public folder */}
          <div className="w-10 h-10 relative">
            <Image src="/logo.png" alt="Logo" fill className="object-contain"/>
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-teal-600">
            EcoLocate Admin
          </h1>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-gray-500 hover:text-red-600 font-semibold transition">
          Logout
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        {/* MAP PLACEHOLDER */}
        <div className="w-full h-64 bg-green-900 rounded-2xl overflow-hidden shadow-xl mb-8 relative group">
            <Image src="/Map.png" alt="Park Map" fill className="object-cover opacity-90 group-hover:scale-105 transition duration-700"/>
            <div className="absolute bottom-0 left-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent w-full">
                <h2 className="text-white text-3xl font-bold flex items-center gap-2">
                    <MapPin className="text-green-400 fill-green-400" /> Park Overview
                </h2>
                <p className="text-gray-200 mt-2 text-lg">Cavite State University Agri-Eco Tourism Park</p>
            </div>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
                <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                <input 
                  placeholder="Search species..." 
                  className="pl-10 p-3 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-green-500 outline-none"
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
          <button onClick={openAddModal} className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 shadow-md transition">
            <Plus className="w-5 h-5" /> Add New Tree
          </button>
        </div>

        {/* TREE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
             [...Array(3)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-96 animate-pulse shadow-sm border border-gray-100" />)
          ) : trees.length === 0 ? (
             <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-2xl border border-dashed border-gray-300">
                <Leaf className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl font-semibold">No trees found.</p>
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
                      <button onClick={() => openEditModal(tree)} className="flex-1 flex items-center justify-center gap-2 text-blue-600 bg-blue-50 py-2.5 rounded-xl hover:bg-blue-100 transition text-sm font-bold">
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(tree.id)} className="flex-1 flex items-center justify-center gap-2 text-red-600 bg-red-50 py-2.5 rounded-xl hover:bg-red-100 transition text-sm font-bold">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{isEditMode ? "Edit Tree" : "Add Tree"}</h2>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
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
                            <select className="w-full border border-gray-300 p-3 rounded-xl bg-white" value={formData.conservation_status} onChange={e => setFormData({...formData, conservation_status: e.target.value})}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1 flex items-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer bg-green-50 px-4 py-3 rounded-xl w-full border border-green-100 hover:bg-green-100">
                                <input type="checkbox" className="w-5 h-5 text-green-600 rounded" checked={formData.native_to_ph} onChange={e => setFormData({...formData, native_to_ph: e.target.checked})} />
                                <span className="text-gray-800 font-semibold">Native to Philippines?</span>
                            </label>
                        </div>

                        {/* NEW: IMAGE UPLOAD INPUT */}
                        <div className="col-span-full">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Tree Image</label>
                            <div className="flex gap-2 items-center">
                                <label className="flex items-center gap-2 cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg border border-blue-200 hover:bg-blue-100 transition font-semibold">
                                    {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <UploadCloud className="w-5 h-5"/>}
                                    {uploading ? "Uploading..." : "Choose File"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                                <span className="text-sm text-gray-500 italic truncate max-w-xs">
                                    {formData.image_path || "No file selected"}
                                </span>
                            </div>
                        </div>

                        <div className="col-span-full border-t border-gray-100 pt-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-teal-600"/> Ecological Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Flowering Season</label>
                                    <input className="w-full border border-gray-300 p-3 rounded-xl" value={formData.flowering_season} onChange={e => setFormData({...formData, flowering_season: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Ecological Role</label>
                                    <input className="w-full border border-gray-300 p-3 rounded-xl" value={formData.ecological_role} onChange={e => setFormData({...formData, ecological_role: e.target.value})} />
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local Uses</label>
                                    <textarea rows={2} className="w-full border border-gray-300 p-3 rounded-xl" value={formData.local_uses} onChange={e => setFormData({...formData, local_uses: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Environmental Impact</label>
                                    <textarea rows={2} className="w-full border border-gray-300 p-3 rounded-xl" value={formData.environmental_impact} onChange={e => setFormData({...formData, environmental_impact: e.target.value})} />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Propagation Tips</label>
                                    <textarea rows={2} className="w-full border border-gray-300 p-3 rounded-xl" value={formData.propagation_tips} onChange={e => setFormData({...formData, propagation_tips: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition">Cancel</button>
                        <button type="submit" disabled={uploading} className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg transition flex items-center gap-2 disabled:opacity-50">
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