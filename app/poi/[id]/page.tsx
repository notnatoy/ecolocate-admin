import Image from 'next/image';
import { Download, Leaf, MapPin } from 'lucide-react';

// This is a Server Component (Standard for Next.js App Router)
export default function TreeLandingPage({ params }: { params: { id: string } }) {
  // In a real app, you could fetch tree details here using the ID if you wanted
  // const { data } = await supabase.from('trees').select('*').eq('id', params.id).single();

  return (
    <div className="min-h-screen bg-[#F5F7F2] flex flex-col items-center justify-center p-6 font-sans text-center">
      
      {/* Logo Area */}
      <div className="mb-8 bg-white p-4 rounded-full shadow-xl">
        <Image src="/LOGO_120125.png" alt="EcoLocate Logo" width={80} height={80} />
      </div>

      {/* Main Card */}
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-t-8 border-[#2E5A38]">
        
        <h1 className="text-3xl font-bold text-[#2d3436] mb-2">EcoLocate</h1>
        <p className="text-green-700 font-semibold tracking-wide uppercase text-sm mb-6">
          Campus Biodiversity Project
        </p>

        <div className="bg-green-50 p-6 rounded-2xl border border-green-100 mb-8">
          <Leaf className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <p className="text-gray-600 text-sm">
            You have discovered a Point of Interest!
        </p>
        </div>

        <div className="space-y-4">
          <p className="text-gray-500 text-sm leading-relaxed">
            To view this tree's <b>Scientific Name</b>, <b>Uses</b>, and <b>Ecological Role</b>, please download the official app.
          </p>

          {/* DOWNLOAD BUTTON */}
          <a 
            href="https://drive.google.com/uc?export=download&id=1ci6LEy3Ev-tynoFvRv9bmoCaYMlQOwV5" // Ensure you put your .apk file in the 'public' folder!
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full bg-[#2E5A38] text-white py-4 rounded-xl font-bold shadow-lg hover:bg-green-800 transition transform hover:-translate-y-1"
          >
            <Download className="w-6 h-6" />
            Download App (.APK)
          </a>
          
          <p className="text-xs text-gray-400 mt-4">
            Works on Android Devices
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 flex items-center gap-2 text-gray-400 text-sm">
        <MapPin className="w-4 h-4" />
        <span>Cavite State University</span>
      </div>

    </div>
  );
}