'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight, Leaf } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert("Login failed: " + error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      
      {/* LEFT SIDE - IMAGE & BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-green-900 relative justify-center items-center overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000')] bg-cover bg-center opacity-40"></div>
        
        <div className="relative z-10 text-center text-white p-10">
            <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-2xl">
                    <Leaf size={48} className="text-green-400" />
                </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 font-serif">EcoLocate</h1>
            <p className="text-xl text-green-100 max-w-md mx-auto leading-relaxed">
                Manage, track, and preserve the biodiversity of our campus heritage trees.
            </p>
        </div>
      </div>

      {/* RIGHT SIDE - LOGIN FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            
            {/* Mobile Logo (Visible only on small screens) */}
            <div className="lg:hidden flex justify-center mb-6">
                 {/* MAKE SURE your file is named logo.png in the public folder */}
                 <Image src="/logo.png" alt="Logo" width={80} height={80} className="object-contain" />
            </div>

            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-500">Please sign in to your admin account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                        <input 
                          className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900" 
                          type="email" 
                          placeholder="admin@ecolocate.com" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
                        <input 
                          className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-gray-900" 
                          type="password" 
                          placeholder="••••••••" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          required
                        />
                    </div>
                </div>

                <button 
                  disabled={loading}
                  className="w-full bg-green-700 text-white p-4 rounded-xl font-bold hover:bg-green-800 transition flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing In...' : 'Sign In to Dashboard'}
                  {!loading && <ArrowRight size={20} />}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-gray-400">
                &copy; 2025 EcoLocate Admin Panel
            </div>
        </div>
      </div>
    </div>
  );
}