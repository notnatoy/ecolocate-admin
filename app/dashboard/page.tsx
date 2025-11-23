'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Papa from 'papaparse';
import { QRCodeCanvas } from 'qrcode.react'; // <--- NEW IMPORT
import { 
  Search, Plus, Edit2, Trash2, MapPin, Leaf, Info, X, Sprout, UploadCloud, Loader2, Moon, Sun, Maximize2,
  ChevronDown, FileSpreadsheet, Download, QrCode // <--- NEW ICON
} from 'lucide-react';

const STATUS_OPTIONS = [
  "Not Threatened", "Least Concern", "Near Threatened", 
  "Vulnerable", "Endangered", "Critically Endangered"
];
const WEBSITE_URL = "https://ecolocate-admin.vercel.app";

const INITIAL_FORM = {
  common_name: '',
  scientific_name: '',
  conservation_status: 'Not Threatened',
  native_to_ph: false,
  image_path: '',
  flowering_season: '',
  ecological_role: '',
  local_uses: '',
  environmental_impact: '',
  propagation_tips: ''
};

export default function AdminDashboard() {
  const [trees, setTrees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();

  // UI States
  const [darkMode, setDarkMode] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // CRUD States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [uploading, setUploading] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  // --- NEW: QR MODAL STATE ---
  const [qrTree, setQrTree] = useState<any>(null); // The tree we are generating a QR for
  const qrRef = useRef<HTMLCanvasElement>(null); // Reference to the QR canvas

  const theme = {
    bg: darkMode ? 'bg-gray-900' : 'bg-[#F5F7F2]',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSub: darkMode ? 'text-gray-400' : 'text-gray-600',
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-green-100',
    header: darkMode ? 'bg-gray-900 border-gray-800' : 'bg-[#2E5A38]',
    input: darkMode 
      ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent' 
      : 'bg-white border border-gray-500 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-emerald-600 focus:border-transparent shadow-sm',
    mapBorder: darkMode ? 'border-white/20' : 'border-black/10',
    controlsBorder: darkMode ? 'border-gray-700' : 'border-gray-300',
  };

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push('/');
    };
    checkUser();
    fetchTrees();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchTrees(), 300);
    return () => clearTimeout(delayDebounce);
  }, [search, statusFilter]);

  const fetchTrees = async () => {
    setLoading(true);
    let query = supabase.from('trees').select('*').order('id', { ascending: false });
    if (search) query = query.ilike('common_name', `%${search}%`);
    if (statusFilter) query = query.eq('conservation_status', statusFilter);
    const { data, error } = await query;
    if (!error && data) setTrees(data);
    setLoading(false);
  };

  const downloadTemplate = () => {
    const headers = ["common_name", "scientific_name", "conservation_status", "native_to_ph", "image_path", "flowering_season", "ecological_role", "local_uses", "environmental_impact", "propagation_tips"];
    const exampleRow = ["Mango", "Mangifera indica", "Not Threatened", "TRUE", "mango.jpg", "April - May", "Provides shade", "Edible fruit", "None", "Grafting"];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + exampleRow.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ecolocate_template_example.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        if (!confirm(`Found ${rows.length} trees. Upload them now?`)) return;
        const { error } = await supabase.from('trees').insert(rows.map((row: any) => ({
            ...row,
            last_updated: new Date().toISOString(),
            native_to_ph: String(row.native_to_ph).toUpperCase() === 'TRUE'
        })));
        if (error) alert("Bulk upload failed: " + error.message);
        else {
            alert("Success! Trees uploaded.");
            fetchTrees();
            setIsAddMenuOpen(false);
        }
      }
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Select an image.');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('trees').upload(fileName, file);
      if (uploadError) throw uploadError;
      setFormData({ ...formData, image_path: fileName });
      alert("Image uploaded successfully!");
    } catch (error: any) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, last_updated: new Date().toISOString() };
    let error;
    if (isEditMode && currentId) {
      const res = await supabase.from('trees').update(payload).eq('id', currentId);
      error = res.error;
    } else {
      const res = await supabase.from('trees').insert([payload]);
      error = res.error;
    }
    if (error) alert(error.message);
    else {
      setIsModalOpen(false);
      fetchTrees();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this tree permanently?")) return;
    await supabase.from('trees').delete().eq('id', id);
    fetchTrees();
  };

  // --- UPDATED: GENERATE CUSTOM CARD (Name Top + Rounded QR) ---
  const downloadQRCode = () => {
    if (!qrRef.current || !qrTree) return;

    // 1. Setup a virtual canvas (High Resolution)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = 1000;
    const height = 1200;
    
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // 2. Draw Background (White)
    ctx.fillStyle = "#FFFFFF"; 
    ctx.fillRect(0, 0, width, height);
    
    // 3. Draw Common Name (Big & Bold at Top)
    ctx.fillStyle = "#2E5A38"; // Forest Green
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(qrTree.common_name, width / 2, 150);

    // 4. Draw Scientific Name (Italic below)
    ctx.fillStyle = "#636e72"; // Gray
    ctx.font = "italic 50px serif";
    ctx.fillText(qrTree.scientific_name, width / 2, 240);

    // 5. Draw the Rounded Border for QR
    const boxSize = 700;
    const boxX = (width - boxSize) / 2;
    const boxY = 350;
    const radius = 60; // Rounded corner amount

    ctx.lineWidth = 10;
    ctx.strokeStyle = "#97d5a6ff"; // Green Border
    
    // Manually draw rounded rectangle (compatible with all browsers)
    ctx.beginPath();
    ctx.moveTo(boxX + radius, boxY);
    ctx.lineTo(boxX + boxSize - radius, boxY);
    ctx.quadraticCurveTo(boxX + boxSize, boxY, boxX + boxSize, boxY + radius);
    ctx.lineTo(boxX + boxSize, boxY + boxSize - radius);
    ctx.quadraticCurveTo(boxX + boxSize, boxY + boxSize, boxX + boxSize - radius, boxY + boxSize);
    ctx.lineTo(boxX + radius, boxY + boxSize);
    ctx.quadraticCurveTo(boxX, boxY + boxSize, boxX, boxY + boxSize - radius);
    ctx.lineTo(boxX, boxY + radius);
    ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
    ctx.closePath();
    ctx.stroke();

    // 6. Draw the QR Code inside the box
    const qrImage = new window.Image();
    qrImage.src = qrRef.current.toDataURL("image/png");
    
    qrImage.onload = () => {
        // Draw QR centered inside the rounded box
        // We give it 50px padding so it doesn't touch the border
        const qrPadding = 50; 
        const qrDrawSize = boxSize - (qrPadding * 2);
        
        ctx.drawImage(
            qrImage, 
            boxX + qrPadding, 
            boxY + qrPadding, 
            qrDrawSize, 
            qrDrawSize
        );

        // 8. Save and Download
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `EcoLocate-${qrTree.common_name}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
  };

  // HELPERS 
  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    return `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${path}`;
  };

  const getBadgeColor = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('endangered') || s.includes('critical')) return 'bg-red-100 text-red-800 border-red-200';
    if (s.includes('vulnerable') || s.includes('near')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme.bg}`}>
      
      <nav className={`${theme.header} sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-lg transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
             <Leaf className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            EcoLocate <span className="font-light opacity-80">Admin</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-white/90 hover:text-white hover:underline font-semibold transition text-sm">
            Logout
            </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* MAP */}
        <div onClick={() => setIsMapOpen(true)} className={`w-full h-80 rounded-3xl overflow-hidden shadow-xl mb-10 relative group cursor-pointer border-4 ${theme.mapBorder} transition-all duration-300`}>
            <Image src="/Map.png" alt="Park Map" fill className="object-cover opacity-90 group-hover:scale-105 transition duration-700 ease-out" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 w-full">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-white text-3xl font-bold flex items-center gap-2 mb-1">
                            <MapPin className="text-emerald-400 fill-emerald-400" /> Park Overview
                        </h2>
                        <p className="text-emerald-100 text-lg">Agri-Eco Tourism Park • Click to expand</p>
                    </div>
                    <Maximize2 className="text-white/80 w-8 h-8 group-hover:scale-110 transition" />
                </div>
            </div>
        </div>

        {/* CONTROLS */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border ${theme.controlsBorder} flex flex-col md:flex-row gap-4 justify-between items-center mb-8 p-5 rounded-2xl shadow-md transition-colors duration-300`}>
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <input placeholder="Search species..." className={`pl-10 p-3 rounded-xl w-full outline-none transition ${theme.input}`} value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className={`p-3 rounded-xl outline-none cursor-pointer ${theme.input}`} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="relative">
            <button onClick={() => setIsAddMenuOpen(!isAddMenuOpen)} className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-800 shadow-lg transition transform hover:-translate-y-0.5">
                <Plus className="w-5 h-5" /> Add Tree <ChevronDown className="w-4 h-4" />
            </button>
            {isAddMenuOpen && (
                <div className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl border overflow-hidden z-50 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                    <button onClick={downloadTemplate} className={`w-full text-left px-5 py-3 flex items-center gap-3 transition border-b ${darkMode ? 'text-blue-300 hover:bg-gray-700 border-gray-700' : 'text-blue-600 hover:bg-blue-50 border-gray-100'}`}>
                        <Download className="w-4 h-4" /> <span className="font-medium text-sm">Download CSV Template</span>
                    </button>
                    <button onClick={() => { setFormData(INITIAL_FORM); setIsEditMode(false); setIsModalOpen(true); setIsAddMenuOpen(false); }} className={`w-full text-left px-5 py-4 flex items-center gap-3 transition ${darkMode ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-green-50'}`}>
                        <Plus className="w-4 h-4 text-emerald-600" /> <span className="font-semibold">Add Single Tree</span>
                    </button>
                    <label className={`w-full text-left px-5 py-4 flex items-center gap-3 cursor-pointer border-t transition ${darkMode ? 'border-gray-700 hover:bg-gray-700 text-gray-200' : 'border-gray-100 hover:bg-green-50 text-gray-700'}`}>
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> <span className="font-semibold">Upload Filled CSV</span>
                        <input type="file" accept=".csv" className="hidden" onChange={handleBulkUpload} />
                    </label>
                </div>
            )}
          </div>
        </div>

        {/* TREE GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
             [...Array(3)].map((_, i) => <div key={i} className={`${theme.card} rounded-3xl h-96 animate-pulse shadow-sm`} />)
          ) : trees.length === 0 ? (
             <div className={`col-span-full text-center py-24 rounded-3xl border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                <Leaf className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                <p className={`text-xl font-semibold ${theme.text}`}>No trees found.</p>
             </div>
          ) : (
            trees.map((tree) => (
              <div key={tree.id} className={`${theme.card} rounded-3xl shadow-sm hover:shadow-2xl border overflow-hidden transition duration-300 flex flex-col group h-full`}>
                <div className="relative w-full h-64 overflow-hidden">
                    <Image src={getImageUrl(tree.image_path)} alt={tree.common_name} fill className="object-cover group-hover:scale-105 transition duration-700" unoptimized />
                    {tree.native_to_ph && (
                        <div className="absolute top-4 right-4 bg-emerald-800/90 backdrop-blur-md text-white text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                            <Sprout className="w-3 h-3" /> Native
                        </div>
                    )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="mb-1">
                        <h3 className={`font-bold text-2xl ${theme.text}`}>{tree.common_name}</h3>
                        <p className={`text-sm italic font-serif opacity-80 ${theme.textSub}`}>{tree.scientific_name}</p>
                    </div>
                    <div className="mt-4 mb-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getBadgeColor(tree.conservation_status)}`}>
                        {tree.conservation_status}
                        </span>
                    </div>
                    <div className={`mt-auto pt-5 flex gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                      
                      {/* NEW: QR BUTTON */}
                      <button onClick={() => setQrTree(tree)} className={`p-2.5 rounded-xl transition border ${darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                        <QrCode className="w-5 h-5" />
                      </button>

                      <button onClick={() => { setFormData(tree); setCurrentId(tree.id); setIsEditMode(true); setIsModalOpen(true); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-sm font-bold border ${darkMode ? 'bg-blue-500/10 text-blue-200 border-blue-500/20 hover:bg-blue-500/20' : 'text-blue-600 bg-blue-50/50 border-blue-100 hover:bg-blue-50'}`}>
                        <Edit2 className="w-4 h-4" /> Edit
                      </button>
                      <button onClick={() => handleDelete(tree.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-sm font-bold border ${darkMode ? 'bg-red-500/10 text-red-200 border-red-500/20 hover:bg-red-500/20' : 'text-red-600 bg-red-50/50 border-red-100 hover:bg-red-50'}`}>
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* --- QR CODE MODAL --- */}
      {qrTree && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setQrTree(null)}>
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">{qrTree.common_name}</h3>
                <p className="text-gray-500 text-sm mb-6 italic">{qrTree.scientific_name}</p>
                
                {/* Styled QR Container */}
                  <div className="p-6 bg-white border-4 border-emerald-600/20 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex flex-col items-center">
                      
                      <QRCodeCanvas 
                          value={`${WEBSITE_URL}/tree/${qrTree.id}`}
                          size={250}
                          level={"H"} // High Error Correction (Needed for logo)
                          bgColor={"#ffffff"} // Background Color
                          fgColor={"#2E5A38"} // FOREGROUND: Deep Forest Green (Matches your header)
                          includeMargin={false} // We handle margin with the container padding
                          imageSettings={{
                              src: "/logo.png", 
                              x: undefined,
                              y: undefined,
                              height: 60, // Slightly larger logo
                              width: 60,
                              excavate: true, // Cuts a hole for the logo (looks cleaner)
                          }}
                          ref={qrRef}
                      />
                  </div>

                <p className="text-xs text-gray-400 mt-4 text-center max-w-xs">
                    Scan with the EcoLocate App to view details.
                </p>

                <button 
                    onClick={downloadQRCode}
                    className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2"
                >
                    <Download className="w-5 h-5" /> Download QR Sticker
                </button>
            </div>
        </div>
      )}

      {/* --- MODAL: ADD / EDIT TREE --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg my-8 flex flex-col animate-in fade-in zoom-in duration-200`}>
                {/* HEADER */}
                <div className={`p-3 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'bg-gray-50/50 border-gray-100'} rounded-t-2xl`}>
                    <h2 className={`text-xl font-bold ${theme.text}`}>{isEditMode ? "Edit Tree" : "Add New Tree"}</h2>
                    <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                {/* FORM */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSub}`}>Common Name</label>
                            <input required className={`w-full p-1 rounded-lg outline-none transition ${theme.input}`} value={formData.common_name} onChange={e => setFormData({...formData, common_name: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSub}`}>Scientific Name</label>
                            <input required className={`w-full p-1 rounded-lg outline-none italic transition ${theme.input}`} value={formData.scientific_name} onChange={e => setFormData({...formData, scientific_name: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSub}`}>Conservation Status</label>
                            <select className={`w-full p-1 rounded-lg outline-none transition ${theme.input}`} value={formData.conservation_status} onChange={e => setFormData({...formData, conservation_status: e.target.value})}>
                                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className={`flex items-center gap-3 cursor-pointer p-1 rounded-lg border transition ${darkMode ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-600' : 'bg-green-50 border-green-100 hover:bg-green-100'}`}>
                                <input type="checkbox" className="w-4 h-4 text-green-600 rounded" checked={formData.native_to_ph} onChange={e => setFormData({...formData, native_to_ph: e.target.checked})} />
                                <span className={`font-semibold text-sm ${theme.text}`}>Native to Philippines?</span>
                            </label>  
                        </div>

                        {/* IMAGE UPLOAD */}
                         <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSub}`}>Image</label>
                            <div className="flex gap-2 items-center">
                                <label className="flex-1 flex items-center justify-center gap-2 cursor-pointer bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition font-bold text-sm shadow-md">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
                                    {uploading ? "Uploading..." : "Choose File"}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* DETAILS SECTION*/}
                    <div className={`border-t pt-1 mt-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme.text}`}><Info className="w-4 h-4 text-emerald-500"/> Details</h3>
                        <div className="space-y-1 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
                             <input placeholder="Flowering Season" className={`w-full p-2 rounded-lg text-sm outline-none ${theme.input}`} value={formData.flowering_season} onChange={e => setFormData({...formData, flowering_season: e.target.value})} />
                             <textarea rows={2} placeholder="Local Uses" className={`w-full p-2 rounded-lg text-sm outline-none ${theme.input}`} value={formData.local_uses} onChange={e => setFormData({...formData, local_uses: e.target.value})} />
                             <input placeholder="Ecological Role" className={`w-full p-2 rounded-lg text-sm outline-none ${theme.input}`} value={formData.ecological_role} onChange={e => setFormData({...formData, ecological_role: e.target.value})} />
                             <textarea rows={2} placeholder="Propagation Tips" className={`w-full p-2 rounded-lg text-sm outline-none ${theme.input}`} value={formData.propagation_tips} onChange={e => setFormData({...formData, propagation_tips: e.target.value})} />
                             <textarea rows={2} placeholder="Environmental Impact" className={`w-full p-2 rounded-lg text-sm outline-none ${theme.input}`} value={formData.environmental_impact} onChange={e => setFormData({...formData, environmental_impact: e.target.value})} />
                        </div>
                    </div>

                    {/* FORM ACTIONS */}
                    <div className={`pt-2 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className={`px-5 py-2.5 font-bold rounded-lg text-sm transition ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>Cancel</button>
                        <button type="submit" disabled={uploading} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-md transition text-sm disabled:opacity-50">
                            {isEditMode ? "Save Changes" : "Add Tree"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODAL: MAP VIEW --- */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[60] p-4" onClick={() => setIsMapOpen(false)}>
             <div className="relative w-full h-full max-w-5xl max-h-[90vh]">
                <Image src="/Map.png" alt="Full Map" fill className="object-contain" />
                <button className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/40 transition">
                    <X className="w-8 h-8" />
                </button>
             </div>
        </div>
      )}
    </div>
  );
}