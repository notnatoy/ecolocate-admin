'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen flex bg-gray-200">
      
      {/* --------------------------------------------------------- */}
      {/* LEFT SIDE: IMMERSIVE BRANDING */}
      {/* --------------------------------------------------------- */}
      <div className="hidden lg:flex w-1/2 relative justify-center items-center overflow-hidden bg-emerald-900">
        
        {/* Background Layers */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000')] bg-cover bg-center mix-blend-overlay opacity-60"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-teal-900/90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        <div className="relative z-10 text-center p-12 max-w-lg">
            <div className="mb-8 flex justify-center">
                {/* LOGO CONTAINER: Removed BG, Added White Border */}
                <div className="flex items-center justify-center  transform rotate-3 hover:rotate-6 transition-transform duration-500">
                    <Image 
                        src="/LOGO_border.png" 
                        alt="EcoLocate Logo" 
                        width={120} 
                        height={120} 
                        className="w-24 h-24 object-contain " 
                        priority
                    />
                </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 font-serif tracking-tight text-white drop-shadow-sm">
                EcoLocate
            </h1>
            <div className="w-24 h-1.5 bg-emerald-400 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-emerald-50 leading-relaxed font-light">
                "Preserving our heritage, one tree at a time." <br/>
                <span className="text-emerald-200/60 text-sm mt-4 block font-sans uppercase tracking-widest font-bold">Admin Portal v1.0</span>
            </p>
        </div>
      </div>

      {/* --------------------------------------------------------- */}
      {/* RIGHT SIDE: THE LOGIN FORM */}
      {/* --------------------------------------------------------- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/50 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-100/50 rounded-full blur-[80px] -z-10"></div>

        <div className="w-full max-w-lg bg-white p-10 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white ring-1 ring-emerald-100/50 backdrop-blur-xl">
            
            {/* Mobile Logo (Updated to match style) */}
            <div className="lg:hidden flex justify-center mb-8">
                 <div className="bg-transparent border-2 border-emerald-100 p-4 rounded-3xl">
                    <Image src="/LOGO_120125.png" alt="Logo" width={60} height={60} className="object-contain" />
                 </div>
            </div>

            <div className="mb-10">
                <h2 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Welcome Back</h2>
                <p className="text-lg text-gray-500 font-medium">Enter your credentials to access the workspace.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Email Address</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Mail className="h-6 w-6 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-300" />
                        </div>
                        <input 
                          className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300" 
                          type="email" 
                          placeholder="admin@ecolocate.com" 
                          value={email} 
                          onChange={e => setEmail(e.target.value)} 
                          required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-wider ml-1">Password</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Lock className="h-6 w-6 text-gray-400 group-focus-within:text-emerald-600 transition-colors duration-300" />
                        </div>
                        <input 
                          className="w-full pl-14 pr-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-lg font-medium text-gray-900 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all duration-300" 
                          type="password" 
                          placeholder="••••••••" 
                          value={password} 
                          onChange={e => setPassword(e.target.value)} 
                          required
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:from-emerald-700 hover:to-teal-700 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Authenticating...' : 'Sign In'}
                      {!loading && <ArrowRight size={22} />}
                    </button>
                </div>
            </form>

            <div className="mt-10 text-center">
                <p className="text-sm text-gray-400 font-medium">
                    &copy; 2025 EcoLocate Admin Panel
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}