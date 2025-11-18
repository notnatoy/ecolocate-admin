'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase'; 
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const STATUS_OPTIONS = [
    "Not Threatened", "Least Concern", "Near Threatened", "Vulnerable", "Endangered", "Critically Endangered"
];

export default function AdminDashboard() {
  const [trees, setTrees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    // 1. Authentication Check
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/');
    };
    checkUser();
    
    // 2. Initial Data Load
    fetchTrees();
  }, []);

  // --- DATA FETCHING & FILTERING ---
  // Replaces the PHP curl_init and SQL filter logic
  const fetchTrees = async () => {
    let query = supabase.from('trees').select('*').order('id');
    
    if (search) query = query.ilike('common_name', `%${search}%`);
    if (statusFilter) query = query.eq('conservation_status', statusFilter);

    const { data, error } = await query;
    if (!error && data) setTrees(data);
    else console.error("Error fetching trees:", error);
  };
  
  // --- CRUD ACTIONS (Replacing *.php files) ---

  // Replaces add-tree.php
  const handleAddTree = async (formData: any) => {
    const dataToSend = {
      ...formData,
      native_to_ph: formData.native_to_ph ? true : false,
      last_updated: new Date().toISOString()
    };
    
    const { error } = await supabase.from('trees').insert([dataToSend]);

    if (error) alert("Error adding tree: " + error.message);
    else {
      alert("Tree added successfully! Syncing to mobile apps.");
      fetchTrees(); // Refresh the list
    }
  };

  // Replaces update-tree.php
  const handleUpdateTree = async (id: number, updatedFields: any) => {
    const { error } = await supabase
      .from('trees')
      .update({ ...updatedFields, last_updated: new Date().toISOString() })
      .eq('id', id);

    if (error) alert("Error updating tree: " + error.message);
    else {
        alert("Tree updated!");
        fetchTrees();
    }
  };

  // Replaces delete-tree.php
  const handleDeleteTree = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tree?')) return;
    const { error } = await supabase.from('trees').delete().eq('id', id);
    if (!error) fetchTrees();
  };
  
  // --- RENDERING HELPERS (From your original PHP code) ---

  const getBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (['critically endangered', 'endangered'].includes(s)) return 'bg-danger';
    if (['vulnerable', 'near threatened', 'at risk'].includes(s)) return 'bg-warning text-dark';
    if (['least concern', 'not threatened'].includes(s)) return 'bg-success';
    return 'bg-secondary';
  };
  
  // Helper to ensure correct storage URL and encoding
  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg'; // Placeholder in public folder
    const url = `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${encodeURIComponent(path)}`;
    return url;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EFE6' }}>
      {/* Header (Same as previous step) */}
      <div className="bg-white p-4 shadow flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Image src="/EcoLocate Logo.png" alt="Logo" width={50} height={50} />
            <h1 className="text-xl font-bold text-green-800">EcoLocate Admin</h1>
        </div>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-red-600 font-bold">Logout</button>
      </div>

      {/* Filter Bar */}
      <div className="p-5 flex flex-wrap gap-3 justify-center">
        <input 
            placeholder="Search tree..." 
            className="p-2 border rounded w-64 text-black"
            onChange={(e) => setSearch(e.target.value)}
        />
        <select 
            className="p-2 border rounded text-black"
            onChange={(e) => setStatusFilter(e.target.value)}
        >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
                <option key={status} value={status}>{status}</option>
            ))}
        </select>
        <button onClick={fetchTrees} className="bg-blue-600 text-white px-4 py-2 rounded">Filter</button>
        {/* Placeholder for Add Tree Modal Trigger */}
        <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={() => {/* Open Modal Here */ alert("Add Tree Modal coming soon!")}}>+ Add Tree</button>
      </div>

      {/* Tree Cards Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {trees.length === 0 ? (
            <p className="col-span-3 text-center text-gray-600">No trees found.</p>
        ) : (
            trees.map((tree) => (
                <div key={tree.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                    <div className="relative w-full h-48">
                        <Image 
                            src={getImageUrl(tree.image_path)} 
                            alt={tree.common_name}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <h5 className="font-bold text-lg text-black">{tree.common_name}</h5>
                        <p className="text-sm text-gray-600 italic">{tree.scientific_name}</p>
                        <span className={`inline-block text-white text-xs px-2 py-1 rounded mt-2 w-fit ${getBadgeClass(tree.conservation_status)}`}>
                            {tree.conservation_status}
                        </span>
                        <div className="mt-auto pt-4 flex gap-2">
                            {/* Edit and Delete logic would be implemented here */}
                            <button className="flex-1 border border-blue-500 text-blue-500 py-1 rounded hover:bg-blue-50" onClick={() => alert(`Editing Tree ${tree.id}`)}>Edit</button>
                            <button onClick={() => handleDeleteTree(tree.id)} className="flex-1 bg-red-500 text-white py-1 rounded hover:bg-red-600">Delete</button>
                        </div>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
}