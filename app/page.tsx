'use client';
import { useState } from 'react';
import { supabase } from '../utils/supabase'; 
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    // Replaces PHP password_verify logic
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      alert("Login failed: Check email and password.");
    } else {
      router.push('/dashboard'); 
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: '#F5EFE6' }}>
      <form onSubmit={handleLogin} className="p-5 bg-white rounded shadow-md w-96 text-center">
        {/* Assumes logo is in the public folder */}
        <div className="flex justify-center mb-4">
            <Image src="/EcoLocate Logo.png" alt="Logo" width={80} height={80} />
        </div>
        <h2 className="text-2xl font-bold mb-4 text-black">Admin Login</h2>
        
        <input 
          className="w-full p-3 mb-3 border rounded text-black" 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)} 
          required
        />
        <input 
          className="w-full p-3 mb-3 border rounded text-black" 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)} 
          required
        />
        <button className="w-full bg-green-700 text-white p-3 rounded hover:bg-green-800">Sign In</button>
      </form>
    </div>
  );
}