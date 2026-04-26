import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. FORCE NEXT.JS TO NEVER CACHE THIS ROUTE
export const dynamic = 'force-dynamic'; 

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
    // 2. THE PULSE CHECK: This must show up in your terminal!
    console.log("🚨 DOWNLOAD API WAS SUCCESSFULLY HIT! 🚨");

    const gDriveUrl = "https://drive.google.com/uc?export=download&id=1ci6LEy3Ev-tynoFvRv9bmoCaYMlQOwV5";

    try {
        const { error } = await supabase.rpc('increment_download_count');
        
        if (error) {
            console.error("Supabase RPC Error Details:", error);
            throw error;
        }

        console.log("✅ Database incremented successfully!");
        return NextResponse.redirect(gDriveUrl, 302);
        
    } catch (error) {
        console.error("❌ API Execution Failed:", error);
        return NextResponse.redirect(gDriveUrl, 302);
    }
}