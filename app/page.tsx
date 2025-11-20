'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ 
      email, 
      password 
    });

    if (error) {
      alert("Login failed: " + error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5EFE6]">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-lg w-96 text-center">
        {/* Add your logo to the 'public' folder! */}
        <div className="flex justify-center mb-6">
           {/* <Image src="/EcoLocate Logo.png" alt="Logo" width={80} height={80} /> */}
           <h1 className="text-3xl font-bold text-green-800">EcoLocate</h1>
        </div>
        
        <h2 className="text-xl font-semibold mb-6 text-gray-700">Admin Login</h2>
        
        <input 
          className="w-full p-3 mb-4 border border-gray-300 rounded text-black" 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required
        />
        <input 
          className="w-full p-3 mb-6 border border-gray-300 rounded text-black" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required
        />
        
        <button 
          disabled={loading}
          className="w-full bg-green-700 text-white p-3 rounded font-bold hover:bg-green-800 transition disabled:opacity-50"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}