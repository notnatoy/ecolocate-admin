'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';

// Constants matching your PHP file
const STATUS_OPTIONS = [
  "Not Threatened", "Least Concern", "Near Threatened", 
  "Vulnerable", "Endangered", "Critically Endangered"
];

export default function AdminDashboard() {
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  // --- AUTH CHECK ---
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/'); // Kick out if not logged in
    };
    checkUser();
    fetchTrees();
  }, []);

  // --- FETCH DATA (Replaces get_trees.php & search-filter.php) ---
  const fetchTrees = async () => {
    setLoading(true);
    let query = supabase.from('trees').select('*').order('id', { ascending: false });

    if (search) query = query.ilike('common_name', `%${search}%`);
    if (statusFilter) query = query.eq('conservation_status', statusFilter);

    const { data, error } = await query;
    if (error) console.error('Error fetching trees:', error);
    else setTrees(data || []);
    setLoading(false);
  };

  // --- ADD TREE (Replaces add-tree.php) ---
  const handleAddTree = async () => {
    // For a quick MVP, we use prompts. You can upgrade to a Modal later!
    const name = prompt("Enter Common Name:");
    if (!name) return;
    const sciName = prompt("Enter Scientific Name:");
    const status = prompt("Enter Conservation Status (e.g. Least Concern):");

    const { error } = await supabase.from('trees').insert([{
      common_name: name,
      scientific_name: sciName || '',
      conservation_status: status || 'Not Threatened',
      last_updated: new Date().toISOString()
    }]);

    if (error) alert("Error adding: " + error.message);
    else {
      alert("Tree added!");
      fetchTrees();
    }
  };

  // --- DELETE TREE (Replaces delete-tree.php) ---
  const handleDeleteTree = async (id: number) => {
    if (!confirm("Are you sure you want to delete this tree?")) return;

    const { error } = await supabase.from('trees').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else fetchTrees();
  };

  // --- EDIT TREE (Replaces update-tree.php) ---
  const handleEditTree = async (tree: any) => {
    const newName = prompt("Update Common Name:", tree.common_name);
    if (newName === null) return; // User cancelled

    const { error } = await supabase.from('trees').update({
      common_name: newName,
      last_updated: new Date().toISOString()
    }).eq('id', tree.id);

    if (error) alert("Error updating: " + error.message);
    else fetchTrees();
  };

  // --- LOGOUT ---
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // --- HELPER: Badge Color ---
  const getBadgeColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('endangered')) return 'bg-red-100 text-red-800';
    if (s.includes('vulnerable') || s.includes('near')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="min-h-screen bg-[#F5EFE6]">
      {/* HEADER */}
      <nav className="bg-white shadow px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-green-800">EcoLocate Admin</h1>
        </div>
        <button onClick={handleLogout} className="text-red-600 font-bold hover:underline">
          Logout
        </button>
      </nav>

      {/* CONTROLS */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-4 items-center justify-between">
          
          {/* Filters */}
          <div className="flex gap-4 flex-1">
            <input 
              placeholder="Search tree name..." 
              className="border p-2 rounded w-full max-w-xs text-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select 
              className="border p-2 rounded text-black"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={fetchTrees} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              Filter
            </button>
          </div>

          {/* Add Button */}
          <button onClick={handleAddTree} className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">
            + Add Tree
          </button>
        </div>

        {/* TREE CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {loading ? (
             <p className="text-center col-span-3 text-gray-500">Loading trees...</p>
          ) : trees.length === 0 ? (
             <p className="text-center col-span-3 text-gray-500">No trees found.</p>
          ) : (
            trees.map((tree) => (
              <div key={tree.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition">
                {/* Image Placeholder */}
                <div className="h-48 bg-gray-200 relative">
                  {tree.image_path ? (
                    <img 
                      src={`https://swtbavepamdvogyvhrdz.supabase.co/storage/v1/object/public/images/${tree.image_path}`} 
                      alt={tree.common_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="font-bold text-xl text-gray-800">{tree.common_name}</h3>
                  <p className="text-sm text-gray-500 italic mb-2">{tree.scientific_name}</p>
                  
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(tree.conservation_status)}`}>
                    {tree.conservation_status}
                  </span>

                  <div className="mt-4 flex gap-2">
                    <button 
                      onClick={() => handleEditTree(tree)}
                      className="flex-1 border border-blue-500 text-blue-500 py-1 rounded hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTree(tree.id)}
                      className="flex-1 bg-red-500 text-white py-1 rounded hover:bg-red-600 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}