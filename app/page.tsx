'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Mail, Lock, CheckCircle2, ShieldAlert, Loader2, Leaf, UserPlus, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const router = useRouter();

  const ADMIN_SECRET = "ECO-2025-ADMIN"; 

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (orgCode !== ADMIN_SECRET) {
            alert("Invalid Organization Code. You are not authorized to create an admin account.");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options: { data: { role: 'admin' } }
        });
        if (error) throw error;
        alert("Admin registered successfully!");
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

 return (
    // 1. Added 'pb-24' (padding bottom) to visually lift the center point upwards
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-emerald-950 pb-24">
      
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000" alt="bg" className="w-full h-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-emerald-950/70 backdrop-blur-[4px]"></div>
      </div>

      {/* CONTENT WRAPPER */}
      {/* 2. Reduced gap from 'gap-8' to 'gap-6' to bring form closer to header */}
      <div className="relative z-10 w-full max-w-6xl px-4 flex flex-col items-center gap-6">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700 text-center">
            
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-2">
                 {/* LOGO */}
                 <div className="relative w-24 h-24 md:w-32 md:h-32 transition-transform hover:scale-105 duration-500">
                    <Image 
                        src="/LOGO_border.png" 
                        alt="EcoLocate Logo" 
                        fill
                        className="object-contain drop-shadow-[0_0_25px_rgba(52,150,105,0.8)]" 
                    />
                </div>

                {/* TITLE */}
                <h1 className="text-6xl md:text-8xl font-bold font-serif text-white tracking-wide drop-shadow-2xl">
                    EcoLocate
                </h1>
            </div>

            {/* QUOTE: Forced One Line on Desktop */}
            {/* Added 'whitespace-nowrap' to force single line on large screens */}
            <p className="text-emerald-50/90 italic font-serif text-lg md:text-2xl leading-relaxed drop-shadow-md md:whitespace-nowrap">
                Creating Lasting Memories Amidst Green: A Journey in CvSU Agri-Eco Tourism Park.
            </p>
        </div>

        {/* --- LANDSCAPE GLASS CARD --- */}
        {/* Max-width is set to keep it nice and wide */}
        <div className="w-full max-w-4xl bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] ring-1 ring-white/10">
            
            <div className="mb-6 border-b border-white/10 pb-4">
                <h2 className="text-xl font-medium text-white/90">
                    {isSignUp ? 'New Admin Registration' : 'Secure Login'}
                </h2>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-6">
                
                {/* INPUTS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Email */}
                    <div className="space-y-1 group">
                        <label className="text-xs font-bold text-emerald-100/70 uppercase ml-1">Email</label>
                        <div className="relative flex items-center">
                            <Mail className="absolute left-4 h-5 w-5 text-emerald-200/70 group-focus-within:text-emerald-400 transition-colors" />
                            <input 
                                className="w-full pl-11 pr-4 py-3.5 bg-emerald-950/40 border border-emerald-500/10 rounded-xl text-emerald-50 placeholder:text-emerald-200/20 focus:bg-emerald-950/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all" 
                                type="email" 
                                placeholder="admin@ecolocate.com" 
                                value={email} 
                                onChange={e => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1 group">
                        <label className="text-xs font-bold text-emerald-100/70 uppercase ml-1">Password</label>
                        <div className="relative flex items-center">
                            <Lock className="absolute left-4 h-5 w-5 text-emerald-200/70 group-focus-within:text-emerald-400 transition-colors" />
                            <input 
                                className="w-full pl-11 pr-4 py-3.5 bg-emerald-950/40 border border-emerald-500/10 rounded-xl text-emerald-50 placeholder:text-emerald-200/20 focus:bg-emerald-950/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all" 
                                type="password" 
                                placeholder="••••••••" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                    </div>

                    {/* SIGN UP EXTRAS */}
                    {isSignUp && (
                        <>
                            <div className="space-y-1 group animate-in fade-in zoom-in-95">
                                <label className="text-xs font-bold text-emerald-100/70 uppercase ml-1">Confirm Password</label>
                                <div className="relative flex items-center">
                                    <CheckCircle2 className="absolute left-4 h-5 w-5 text-emerald-200/70 group-focus-within:text-emerald-400 transition-colors" />
                                    <input 
                                        className="w-full pl-11 pr-4 py-3.5 bg-emerald-950/40 border border-emerald-500/10 rounded-xl text-emerald-50 placeholder:text-emerald-200/20 focus:bg-emerald-950/60 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 outline-none transition-all" 
                                        type="password" 
                                        placeholder="Verify password" 
                                        value={confirmPassword} 
                                        onChange={e => setConfirmPassword(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>

                            <div className="space-y-1 group animate-in fade-in zoom-in-95">
                                <label className="text-xs font-bold text-amber-200/80 uppercase ml-1">Org Code</label>
                                <div className="relative flex items-center">
                                    <ShieldAlert className="absolute left-4 h-5 w-5 text-amber-400/80" />
                                    <input 
                                        className="w-full pl-11 pr-4 py-3.5 bg-amber-900/20 border border-amber-500/20 rounded-xl text-amber-50 placeholder:text-amber-200/30 focus:bg-amber-900/30 focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 outline-none transition-all" 
                                        type="password" 
                                        placeholder="Secret Access Key" 
                                        value={orgCode} 
                                        onChange={e => setOrgCode(e.target.value)} 
                                        required 
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* ACTION BAR - ICONS FIXED */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10">
                    
                    {/* SECONDARY BUTTON (Ghost Style) */}
                    <button 
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)} 
                        className="group order-2 md:order-1 px-6 py-3.5 rounded-xl text-sm font-bold text-emerald-100 border border-emerald-500/20 hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-white transition-all flex items-center gap-2"
                    >
                        {isSignUp ? (
                           <>
                             {/* Back Arrow: Clearly shows returning */}
                             <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> 
                             Back to Login
                           </>
                        ) : (
                           <>
                             {/* User Plus: Clearly shows 'Adding User' instead of 'Next' */}
                             <UserPlus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                             Sign Up
                           </>
                        )}
                    </button>

                    {/* PRIMARY BUTTON (Submit) */}
                    <button 
                        disabled={loading} 
                        className="w-full md:w-auto order-1 md:order-2 px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-bold tracking-wide shadow-lg shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-white/10"
                    >
                      {loading ? <Loader2 className="animate-spin" /> : (isSignUp ? 'Complete Registration' : 'Access Portal')}
                    </button>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
}