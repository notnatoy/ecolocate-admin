'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase'; // Note path: ../../utils
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AdminDashboard() {
  const [trees, setTrees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/');
    };
    checkUser();
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    let query = supabase.from('trees').select('*').order('id');
    
    if (search) query = query.ilike('common_name', `%${search}%`);
    if (statusFilter) query = query.eq('conservation_status', statusFilter);

    const { data, error } = await query;
    if (!error && data) setTrees(data);
  };

  const addTree = async () => {
    const name = prompt("Enter Common Name:");
    if (!name) return;
    
    const { error } = await supabase.from('trees').insert([{
      common_name: name,
      last_updated: new Date().toISOString()
    }]);

    if (error) alert(error.message);
    else {
      alert("Tree Added!");
      fetchTrees();
    }
  };

  const deleteTree = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    const { error } = await supabase.from('trees').delete().eq('id', id);
    if (!error) fetchTrees();
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5EFE6' }}>
      {/* Header */}
      <div className="bg-white p-4 shadow flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Image src="/EcoLocate Logo.png" alt="Logo" width={50} height={50} />
            <h1 className="text-xl font-bold text-green-800">EcoLocate Admin</h1>
        </div>
        <button onClick={() => router.push('/')} className="text-red-600 font-bold">Logout</button>
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
            <option value="Least Concern">Least Concern</option>
            <option value="Endangered">Endangered</option>
        </select>
        <button onClick={fetchTrees} className="bg-blue-600 text-white px-4 rounded">Filter</button>
        <button onClick={addTree} className="bg-green-600 text-white px-4 rounded">+ Add Tree</button>
      </div>

      {/* Tree Cards Grid */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        {trees.map((tree) => (
            <div key={tree.id} className="bg-white rounded-lg shadow overflow-hidden flex flex-col">
                <div className="relative w-full h-48">
                     <Image 
                        src={tree.image_path ? `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${tree.image_path}` : '/placeholder.jpg'} 
                        alt={tree.common_name}
                        fill
                        style={{ objectFit: 'cover' }}
                    />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                    <h5 className="font-bold text-lg text-black">{tree.common_name}</h5>
                    <p className="text-sm text-gray-600 italic">{tree.scientific_name}</p>
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-2 w-fit">
                        {tree.conservation_status}
                    </span>
                    <div className="mt-auto pt-4 flex gap-2">
                        <button className="flex-1 border border-blue-500 text-blue-500 py-1 rounded hover:bg-blue-50">Edit</button>
                        <button onClick={() => deleteTree(tree.id)} className="flex-1 bg-red-500 text-white py-1 rounded hover:bg-red-600">Delete</button>
                    </div>
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}