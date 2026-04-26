'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QRCodeCanvas } from 'qrcode.react';
import dynamic from 'next/dynamic';
import { 
  Search, Plus, Edit2, Trash2, MapPin, Leaf, Info, X, Sprout, UploadCloud, Loader2, Moon, Sun, Maximize2,
  Download, QrCode, ClipboardList, User, Map as MapIcon, CheckCircle, AlertTriangle, Calendar, Lightbulb,
  ChevronLeft, ChevronRight 
} from 'lucide-react';
import DownloadMetrics from '../components/DownloadMetrics';

const WEBSITE_URL = "https://ecolocate-admin.vercel.app";

// --- DYNAMIC IMPORTS ---
const LocationPicker = dynamic(() => import('@/app/components/LocationPicker'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

const GameMap = dynamic(() => import('@/app/components/GameMap'), { 
  ssr: false,
  loading: () => <div className="h-full bg-gray-200 animate-pulse flex items-center justify-center">Loading World...</div>
});

const TriviaManager = dynamic(() => import('@/app/components/TriviaManager'), {
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center text-gray-400">Loading Trivia Manager...</div>
});

// --- TYPES & INITIAL STATES ---
const INITIAL_FORM = {
  common_name: '',
  scientific_name: '',
  native_to_ph: false,
  image_path: '',
  flowering_season: '',
  harvest_season: '', 
  ecological_role: '',
  propagation_tips: '',
  description: '',
  latitude: 0,
  longitude: 0,
  locations: [] as { lat: number, lng: number }[]
};

const INITIAL_POI_FORM = {
    name: '',
    description: '',
    image: '',
    latitude: 0,
    longitude: 0,
    locations: [] as { lat: number, lng: number }[]
};

export default function AdminDashboard() {
  const router = useRouter();
  
  // --- GLOBAL STATE ---
  const [currentUser, setCurrentUser] = useState<string>("Admin");
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'TREES' | 'POI'>('TREES');

  // --- DATA STATE ---
  const [trees, setTrees] = useState<any[]>([]);
  const [pois, setPois] = useState<any[]>([]); 
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // --- PAGINATION STATE ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; 

  // --- MODAL STATES ---
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPoiModalOpen, setIsPoiModalOpen] = useState(false); 
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isTriviaOpen, setIsTriviaOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // --- FORM & UPLOAD STATE ---
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [poiFormData, setPoiFormData] = useState(INITIAL_POI_FORM); 
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displayFileName, setDisplayFileName] = useState<string | null>(null);
  
  // --- BANNER STATE ---
  const [bannerUrl, setBannerUrl] = useState("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2000");
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // --- QR STATE ---
  const [qrItem, setQrItem] = useState<{ type: 'TREE' | 'POI', data: any } | null>(null); 
  const qrRef = useRef<HTMLCanvasElement>(null); 

  // --- NOTIFICATION & DELETE ---
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null); 
  const [deleteType, setDeleteType] = useState<'TREE' | 'POI'>('TREE'); 

  // --- THEME CONFIG ---
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
    tabActive: darkMode ? 'bg-emerald-600 text-white' : 'bg-emerald-600 text-white',
    tabInactive: darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-500 hover:bg-gray-50',
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); 
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    const init = async () => {
       const { data: { session } } = await supabase.auth.getSession();
       if (session) setCurrentUser(session.user.email || "Admin");
       fetchTrees();
       fetchPOIs(); 
       fetchLogs();
    };
    init();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => fetchTrees(), 300);
    return () => clearTimeout(delayDebounce);
  }, [search]); 

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  // Load saved banner on startup
  useEffect(() => {
    const savedBanner = localStorage.getItem('admin_banner_url');
    if (savedBanner) setBannerUrl(savedBanner);
  }, []);

  // --- DATA FETCHING ---
  const fetchTrees = async () => {
    setLoading(true);
    let query = supabase.from('trees').select('*').order('id', { ascending: false });
    if (search) query = query.ilike('common_name', `%${search}%`);
    const { data, error } = await query;
    if (!error && data) setTrees(data);
    setLoading(false);
  };

  const fetchPOIs = async () => {
    let query = supabase.from('points_of_interest').select('*').order('id', { ascending: false });
    const { data, error } = await query;
    if (!error && data) setPois(data);
  };

  const fetchLogs = async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(50);
    if (data) setLogs(data);
  };

  const logActivity = async (action: string, details: string) => {
    try {
      await supabase.from('activity_logs').insert({ user_email: currentUser, action, details });
      fetchLogs();
    } catch (e) {
      console.error("Logging failed", e);
    }
  };

  const handleBannerUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploadingBanner(true);
      if (!event.target.files || event.target.files.length === 0) return;
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `admin_banner_${Date.now()}.${fileExt}`; 

      const { error: uploadError } = await supabase.storage.from('trees').upload(fileName, file);
      if (uploadError) throw uploadError;

      const publicUrl = `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${fileName}`;
      
      setBannerUrl(publicUrl);
      localStorage.setItem('admin_banner_url', publicUrl);
      logActivity("UPDATE", "Changed Dashboard Banner");
      showNotification("Banner updated successfully!");
      
    } catch (error: any) {
      showNotification("Failed to upload banner: " + error.message, 'error');
    } finally {
      setUploadingBanner(false);
    }
  };

  const totalTrees = trees.length;
  const totalPOIs = pois.length; 
  const nativeCount = trees.filter(t => t.native_to_ph).length;
  const nativePercent = totalTrees > 0 ? Math.round((nativeCount / totalTrees) * 100) : 0;

  const getImageUrl = (path: string) => {
    if (!path) return '/placeholder.jpg';
    return `https://ztnxzxiwywocesmgzkum.supabase.co/storage/v1/object/public/trees/${path}`;
  };

  // --- MODAL ACTIONS ---
  const openAddModal = () => {
    setFormData(INITIAL_FORM);
    setPreviewUrl(null);
    setDisplayFileName(null);
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (tree: any) => {
    const hasLocations = tree.locations && tree.locations.length > 0;
    const locationData = hasLocations 
        ? tree.locations 
        : (tree.latitude ? [{ lat: tree.latitude, lng: tree.longitude }] : []);

    setFormData({ ...tree, locations: locationData });
    setPreviewUrl(tree.image_path ? getImageUrl(tree.image_path) : null);
    setDisplayFileName(tree.image_path); 
    setCurrentId(tree.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const openAddPoiModal = () => {
    setPoiFormData(INITIAL_POI_FORM);
    setPreviewUrl(null);
    setDisplayFileName(null);
    setIsEditMode(false);
    setIsPoiModalOpen(true);
  };

  const openEditPoiModal = (poi: any) => {
    const hasLocations = poi.locations && poi.locations.length > 0;
    const locationData = hasLocations 
        ? poi.locations 
        : (poi.latitude ? [{ lat: poi.latitude, lng: poi.longitude }] : []);

    setPoiFormData({ ...poi, locations: locationData });
    setPreviewUrl(poi.image ? getImageUrl(poi.image) : null);
    setDisplayFileName(poi.image);
    setCurrentId(poi.id);
    setIsEditMode(true);
    setIsPoiModalOpen(true);
  };

  // --- CRUD ACTIONS ---
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, isPoi: boolean = false) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) throw new Error('Select an image.');
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('trees').upload(fileName, file);
      if (uploadError) throw uploadError;
      
      if (isPoi) {
          setPoiFormData({ ...poiFormData, image: fileName });
      } else {
          setFormData({ ...formData, image_path: fileName });
      }
      
      setPreviewUrl(getImageUrl(fileName));
      setDisplayFileName(file.name); 
      showNotification("Image uploaded successfully!");
    } catch (error: any) {
      showNotification("Upload failed: " + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (isPoi: boolean = false) => {
    if (isPoi) {
        setPoiFormData({ ...poiFormData, image: '' });
    } else {
        setFormData({ ...formData, image_path: '' });
    }
    setPreviewUrl(null);
    setDisplayFileName(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mainLat = formData.locations.length > 0 ? formData.locations[0].lat : 0;
    const mainLng = formData.locations.length > 0 ? formData.locations[0].lng : 0;
    const payload = { 
        ...formData, 
        locations: formData.locations,
        latitude: mainLat,
        longitude: mainLng,
        last_updated: new Date().toISOString() 
    };
    if (!isEditMode) {
       // @ts-ignore
       delete payload.id; 
    }
    let error;
    if (isEditMode && currentId) {
      const res = await supabase.from('trees').update(payload).eq('id', currentId);
      error = res.error;
      if (!error) logActivity("UPDATE", `Updated tree: ${formData.common_name}`);
    } else {
      const res = await supabase.from('trees').insert([payload]);
      error = res.error;
      if (!error) logActivity("CREATE", `Added new tree: ${formData.common_name}`);
    }
    if (error) {
        showNotification(error.message, 'error');
    } else {
      setIsModalOpen(false);
      fetchTrees();
      showNotification(isEditMode ? "Tree updated!" : "Tree added!");
    }
  };

  const handlePoiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mainLat = poiFormData.locations.length > 0 ? poiFormData.locations[0].lat : 0;
    const mainLng = poiFormData.locations.length > 0 ? poiFormData.locations[0].lng : 0;
    const cleanPayload = {
        name: poiFormData.name,
        description: poiFormData.description,
        image: poiFormData.image,
        locations: poiFormData.locations,
        latitude: mainLat,
        longitude: mainLng,
    };
    let error;
    if (isEditMode && currentId) {
        const res = await supabase.from('points_of_interest').update(cleanPayload).eq('id', currentId);
        error = res.error;
        if (!error) logActivity("UPDATE", `Updated POI: ${poiFormData.name}`);
    } else {
        const res = await supabase.from('points_of_interest').insert([cleanPayload]);
        error = res.error;
        if (!error) logActivity("CREATE", `Added new POI: ${poiFormData.name}`);
    }
    if (error) {
        showNotification(error.message, 'error');
    } else {
        setIsPoiModalOpen(false);
        fetchPOIs();
        showNotification(isEditMode ? "POI updated!" : "POI added!");
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    if (deleteType === 'TREE') {
        const treeName = trees.find(t => t.id === deleteId)?.common_name || "Unknown Tree";
        const { error } = await supabase.from('trees').delete().eq('id', deleteId);
        if (error) {
            showNotification("Error deleting tree", 'error');
        } else {
            logActivity("DELETE", `Deleted tree: ${treeName}`);
            fetchTrees();
            showNotification("Tree deleted permanently");
        }
    } else {
        const poiName = pois.find(p => p.id === deleteId)?.name || "Unknown POI";
        const { error } = await supabase.from('points_of_interest').delete().eq('id', deleteId);
        if (error) {
            showNotification("Error deleting POI", 'error');
        } else {
            logActivity("DELETE", `Deleted POI: ${poiName}`);
            fetchPOIs();
            showNotification("POI deleted permanently");
        }
    }
    setDeleteId(null); 
  };

  const downloadSticker = () => {
    if (!qrRef.current || !qrItem) return;
    const { type, data } = qrItem;
    const titleText = type === 'TREE' ? data.common_name : data.name;
    const subText = type === 'TREE' ? data.scientific_name : 'Point of Interest';
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const width = 1000;
    const height = 1200;
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    ctx.fillStyle = "#FFFFFF"; 
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = "#2E5A38"; 
    ctx.font = "bold 100px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(titleText, width / 2, 150); 
    ctx.fillStyle = "#636e72"; 
    ctx.font = "italic 50px serif";
    ctx.fillText(subText, width / 2, 240); 
    const boxSize = 650;
    const boxX = (width - boxSize) / 2;
    const boxY = 320;
    const radius = 50; 
    ctx.lineWidth = 25;
    ctx.strokeStyle = "rgba(46, 90, 56, 0.2)"; 
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxSize, boxSize, radius);
    ctx.stroke();
    const qrImage = new window.Image();
    qrImage.src = qrRef.current.toDataURL("image/png");
    qrImage.onload = () => {
        const padding = 50;
        ctx.drawImage(qrImage, boxX + padding, boxY + padding, boxSize - (padding * 2), boxSize - (padding * 2));
        ctx.fillStyle = "#aaaaaa";
        ctx.font = "bold 30px sans-serif";
        const url = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = url;
        link.download = `EcoLocate-Sticker-${titleText}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
  };

  // --- PAGINATION LOGIC ---
  const currentData = activeTab === 'TREES' ? trees : pois;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const displayedItems = currentData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 4) {
                for (let i = 1; i <= 5; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 3) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-10 mb-6">
            <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-400 disabled:opacity-30' : 'border-gray-200 text-gray-600 disabled:opacity-30'} hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
            >
                <ChevronLeft size={20} />
            </button>

            {getPageNumbers().map((page, index) => (
                typeof page === 'number' ? (
                    <button
                        key={index}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-bold transition flex items-center justify-center ${
                            currentPage === page 
                                ? 'bg-emerald-600 text-white shadow-lg scale-105' 
                                : darkMode ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                        }`}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className={`px-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>...</span>
                )
            ))}

            <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg border ${darkMode ? 'border-gray-700 text-gray-400 disabled:opacity-30' : 'border-gray-200 text-gray-600 disabled:opacity-30'} hover:bg-gray-100 dark:hover:bg-gray-700 transition`}
            >
                <ChevronRight size={20} />
            </button>
        </div>
    );
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${theme.bg}`}>
      
      {/* HEADER */}
<nav className={`sticky top-0 z-20 px-6 py-3 border-b backdrop-blur-md transition-colors duration-300 ${
    darkMode 
      ? 'bg-gray-900/80 border-gray-800' 
      : 'bg-white/80 border-gray-200'
  }`}>
  
  <div className="max-w-7xl mx-auto flex justify-between items-center">
    <div className="flex items-center gap-4 group cursor-default">
      <div className="relative w-13 h-13 transition-transform group-hover:scale-110 duration-300">
         <Image src="/LOGO_120125.png" alt="EcoLocate" fill className="object-contain" />
      </div>
      <div>
        <h1 className={`text-4xl font-bold tracking-tight leading-none ${darkMode ? 'text-white' : 'text-gray-900'}`}>EcoLocate</h1>
      </div>
    </div>

    <div className="flex items-center gap-4"> 
        <DownloadMetrics compact={true} />
        <div className={`flex items-center gap-2 p-1.5 rounded-full border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <button 
                onClick={() => setIsTriviaOpen(true)} 
                className={`p-2.5 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-yellow-400 hover:text-yellow-300' : 'hover:bg-white text-yellow-500 hover:text-yellow-600 hover:shadow-md'}`} 
                title="Manage Trivia"
            >
                <Lightbulb className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setIsLogsOpen(true)} 
                className={`p-2.5 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-white text-gray-500 hover:text-emerald-600 hover:shadow-md'}`} 
                title="Activity Log"
            >
                <ClipboardList className="w-5 h-5" />
            </button>
            <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`p-2.5 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-blue-400 hover:text-blue-300' : 'hover:bg-white text-gray-500 hover:text-emerald-600 hover:shadow-md'}`}
                title="Toggle Theme"
            >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
        <div className={`h-8 w-px ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center pl-4 pr-1.5 py-1.5 gap-3 rounded-full border transition-all duration-300 ${
            darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-600' : 'bg-white border-gray-200 hover:border-emerald-200 hover:shadow-md'
        }`}>
            <div className="hidden md:flex flex-col items-end mr-1">
                <span className={`text-sm font-bold leading-none ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Admin</span>
                <span className={`text-xs font-medium leading-none mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{currentUser.split('@')[0]}</span>
            </div>
            <button 
                onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
                className="group flex items-center justify-center w-9 h-9 rounded-full bg-red-50 hover:bg-red-500 transition-all duration-300"
                title="Logout"
            >
                <div className="relative w-5 h-5">
                     <User className="w-5 h-5 text-gray-600 absolute inset-0 transition-opacity duration-300 group-hover:opacity-0" />
                     <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                     </span>
                </div>
            </button>
        </div>
    </div>
  </div>
</nav>

      <main className="max-w-7xl mx-auto p-6">

        {/* DYNAMIC HEADER BANNER */}
        <div className={`w-full h-64 rounded-3xl overflow-hidden shadow-xl mb-10 relative border-4 group ${theme.mapBorder}`}>
            {/* The Image */}
            <img 
                src={bannerUrl} 
                alt="Park Banner" 
                className="w-full h-full object-cover opacity-80 transition duration-500 group-hover:scale-105" 
            />
            
            {/* Dark Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#1B3124] via-[#1B3124]/40 to-transparent pointer-events-none" />
            
            {/* Upload Button (Visible only on Hover) */}
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={bannerInputRef} 
                    onChange={handleBannerUpload} 
                    disabled={uploadingBanner} 
                />
                <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadingBanner}
                    className="flex items-center gap-2 bg-black/50 hover:bg-black/70 text-white px-5 py-2.5 rounded-full backdrop-blur-md transition shadow-lg border border-white/20 text-sm font-bold"
                >
                    {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit2 className="w-4 h-4" />}
                    {uploadingBanner ? "Uploading..." : "Change Cover"}
                </button>
            </div>

            {/* Text Content */}
            <div className="absolute bottom-0 left-0 p-8 w-full pointer-events-none">
                <h2 className="text-white text-4xl font-bold flex items-center gap-2 mb-1 drop-shadow-md">
                    <div className="relative w-15 h-15">
                        <Image 
                            src="/EcoParkLogo.png" 
                            alt="Logo" 
                            fill 
                            className="object-contain drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]" 
                        />
                    </div>
                    Agri-Eco Tourism Park
                </h2>
                <p className="text-emerald-100 text-xl drop-shadow-sm">Cavite State University • Admin Dashboard</p>
            </div>
        </div>

        {/* ANALYTICS (4-COLUMN GRID) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            <div onClick={() => setIsMapOpen(true)} className="bg-emerald-900 border border-emerald-800 p-6 rounded-2xl shadow-lg flex flex-col justify-center cursor-pointer group hover:bg-emerald-800 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-lg font-bold text-white">Park Map</h3>
                    <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg group-hover:scale-110 transition border border-white/10"><MapIcon className="w-6 h-6 text-emerald-300"/></div>
                </div>
                <div className="relative z-10">
                    <p className="text-4xl font-extrabold text-white mb-2 group-hover:text-emerald-300 transition">View</p>
                    <p className="text-sm text-emerald-200/80 flex items-center gap-1 font-medium">Open Interactive Map <Maximize2 className="w-3 h-3" /></p>
                </div>
                <MapIcon className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 group-hover:text-white/10 transition-colors z-0" />
            </div>
            <div className={`${theme.card} p-6 rounded-2xl shadow-sm border flex flex-col justify-center`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${theme.text}`}>Total Trees</h3>
                    <div className="p-2 bg-green-100 rounded-lg"><Leaf className="w-6 h-6 text-green-700"/></div>
                </div>
                <p className={`text-5xl font-extrabold ${theme.text} mb-2`}>{totalTrees}</p>
                <p className={`text-sm ${theme.textSub}`}>Registered in database</p>
            </div>
            <div className={`${theme.card} p-6 rounded-2xl shadow-sm border flex flex-col justify-center`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${theme.text}`}>Landmarks</h3>
                    <div className="p-2 bg-blue-100 rounded-lg"><MapPin className="w-6 h-6 text-blue-700"/></div>
                </div>
                <p className={`text-5xl font-extrabold ${theme.text} mb-2`}>{totalPOIs}</p>
                <p className={`text-sm ${theme.textSub}`}>Facilities & Areas</p>
            </div>
            <div className={`${theme.card} p-6 rounded-2xl shadow-sm border flex flex-col justify-center`}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-bold ${theme.text}`}>Native Species</h3>
                    <div className="p-2 bg-teal-100 rounded-lg"><Sprout className="w-6 h-6 text-teal-700"/></div>
                </div>
                <div className="flex items-end gap-2 mb-2">
                    <p className={`text-4xl font-bold ${theme.text}`}>{nativePercent}%</p>
                    <p className={`text-sm mb-1 ${theme.textSub}`}>of population</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-teal-500 h-3 rounded-full" style={{ width: `${nativePercent}%` }}></div>
                </div>
            </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            <button 
                onClick={() => setActiveTab('TREES')}
                className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'TREES' ? theme.tabActive : theme.tabInactive}`}
            >
                <Leaf className="w-5 h-5" /> Trees
            </button>
            <button 
                onClick={() => setActiveTab('POI')}
                className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${activeTab === 'POI' ? theme.tabActive : theme.tabInactive}`}
            >
                <MapIcon className="w-5 h-5" /> Landmarks
            </button>
        </div>

        {/* CONTROLS */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} border ${theme.controlsBorder} flex flex-col md:flex-row gap-4 justify-between items-center mb-8 p-5 rounded-2xl shadow-md transition-colors duration-300`}>
          {activeTab === 'TREES' ? (
            <>
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        <input placeholder="Search species..." className={`pl-10 p-3 rounded-xl w-full outline-none transition ${theme.input}`} value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                </div>
                <button onClick={openAddModal} className="flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-800 shadow-lg transition transform hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" /> Add New Tree
                </button>
            </>
          ) : (
            <>
                <div className="flex gap-3 w-full md:w-auto flex-wrap">
                    <div className="relative flex-1 md:w-80">
                         <p className={`text-sm font-bold p-3 ${theme.text}`}>Manage Park Landmarks</p>
                    </div>
                </div>
                <button onClick={openAddPoiModal} className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg transition transform hover:-translate-y-0.5">
                    <Plus className="w-5 h-5" /> Add New POI
                </button>
            </>
          )}
        </div>

        {/* CONTENT RENDERING WITH PAGINATION */}
        {activeTab === 'TREES' ? (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {loading ? (
                    [...Array(3)].map((_, i) => <div key={i} className={`${theme.card} rounded-3xl h-96 animate-pulse shadow-sm`} />)
                ) : trees.length === 0 ? (
                    <div className={`col-span-full text-center py-24 rounded-3xl border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                        <Leaf className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                        <p className={`text-xl font-semibold ${theme.text}`}>No trees found.</p>
                    </div>
                ) : (
                    displayedItems.map((tree) => (
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
                            <div className="mt-4 mb-6 flex flex-wrap gap-2">
                                {tree.flowering_season && (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-pink-100 text-pink-700 rounded-md border border-pink-200 font-bold uppercase">
                                        🌸 {tree.flowering_season}
                                    </span>
                                )}
                                {tree.harvest_season && (
                                    <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-orange-100 text-orange-700 rounded-md border border-orange-200 font-bold uppercase">
                                        <Calendar className="w-3 h-3" /> {tree.harvest_season}
                                    </span>
                                )}
                            </div>
                            <div className={`mt-auto pt-5 flex gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                            <button onClick={() => setQrItem({ type: 'TREE', data: tree })} className={`p-2.5 rounded-xl transition border ${darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                <QrCode className="w-5 h-5" />
                            </button>
                            <button onClick={() => openEditModal(tree)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-sm font-bold border ${darkMode ? 'bg-blue-500/10 text-blue-200 border-blue-500/20 hover:bg-blue-500/20' : 'text-blue-600 bg-blue-50/50 border-blue-100 hover:bg-blue-50'}`}>
                                <Edit2 className="w-4 h-4" /> Edit
                            </button>
                            <button onClick={() => { setDeleteId(tree.id); setDeleteType('TREE'); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-sm font-bold border ${darkMode ? 'bg-red-500/10 text-red-200 border-red-500/20 hover:bg-red-500/20' : 'text-red-600 bg-red-50/50 border-red-100 hover:bg-red-50'}`}>
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                            </div>
                        </div>
                    </div>
                    ))
                )}
                </div>
                {renderPagination()}
            </>
        ) : (
            // POI GRID
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pois.length === 0 ? (
                        <div className={`col-span-full text-center py-24 rounded-3xl border-2 border-dashed ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}>
                            <MapIcon className={`w-16 h-16 mx-auto mb-4 ${darkMode ? 'text-gray-700' : 'text-gray-300'}`} />
                            <p className={`text-xl font-semibold ${theme.text}`}>No points of interest found.</p>
                        </div>
                    ) : (
                        displayedItems.map((poi) => (
                            <div key={poi.id} className={`${theme.card} rounded-3xl shadow-sm hover:shadow-2xl border overflow-hidden transition duration-300 flex flex-col group h-full`}>
                                <div className="relative w-full h-64 overflow-hidden">
                                    <Image src={getImageUrl(poi.image)} alt={poi.name} fill className="object-cover group-hover:scale-105 transition duration-700" unoptimized />
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="mb-4">
                                        <h3 className={`font-bold text-2xl ${theme.text}`}>{poi.name}</h3>
                                        <p className={`text-sm mt-2 line-clamp-3 ${theme.textSub}`}>{poi.description}</p>
                                    </div>
                                    <div className={`mt-auto pt-5 flex gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                                        <button onClick={() => setQrItem({ type: 'POI', data: poi })} className={`p-2.5 rounded-xl transition border ${darkMode ? 'bg-gray-700 text-white border-gray-600 hover:bg-gray-600' : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'}`}>
                                            <QrCode className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => openEditPoiModal(poi)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-sm font-bold border ${darkMode ? 'bg-blue-500/10 text-blue-200 border-blue-500/20 hover:bg-blue-500/20' : 'text-blue-600 bg-blue-50/50 border-blue-100 hover:bg-blue-50'}`}>
                                            <Edit2 className="w-4 h-4" /> Edit
                                        </button>
                                        <button onClick={() => { setDeleteId(poi.id); setDeleteType('POI'); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl transition text-sm font-bold border ${darkMode ? 'bg-red-500/10 text-red-200 border-red-500/20 hover:bg-red-500/20' : 'text-red-600 bg-red-50/50 border-red-100 hover:bg-red-50'}`}>
                                            <Trash2 className="w-4 h-4" /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                {renderPagination()}
            </>
        )}
      </main>

      {/* NOTIFICATIONS */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-5 py-2.5 rounded-full shadow-xl flex items-center gap-2.5 z-[110] animate-in fade-in slide-in-from-top-2 duration-300 ${notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
            {notification.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span className="font-semibold text-sm tracking-wide">{notification.message}</span>
        </div>
      )}

      {/* MODAL 1: TRIVIA MANAGER */}
      {isTriviaOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4" onClick={() => setIsTriviaOpen(false)}>
            <div className="w-full max-w-4xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                 <div className="relative">
                     <button 
                        onClick={() => setIsTriviaOpen(false)} 
                        className="absolute -top-12 right-0 md:-right-12 z-50 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition backdrop-blur-md"
                     >
                        <X className="w-6 h-6" />
                     </button>
                     <TriviaManager darkMode={darkMode} />
                 </div>
            </div>
        </div>
      )}

      {/* MODAL 2: AUDIT LOGS */}
      {isLogsOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4" onClick={() => setIsLogsOpen(false)}>
            <div className={`${theme.card} rounded-2xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col animate-in zoom-in duration-200 border`} onClick={e => e.stopPropagation()}>
                <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'bg-gray-50/50 border-gray-100'} rounded-t-2xl`}>
                    <h2 className={`text-xl font-bold flex items-center gap-2 ${theme.text}`}>
                        <ClipboardList className="w-5 h-5 text-emerald-600"/> Activity Log
                    </h2>
                    <button onClick={() => setIsLogsOpen(false)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="overflow-y-auto p-0">
                    <table className="w-full text-left border-collapse">
                        <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-gray-900 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                            <tr>
                                <th className="p-4 text-xs font-bold uppercase tracking-wide">Action</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wide">User</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wide">Details</th>
                                <th className="p-4 text-xs font-bold uppercase tracking-wide">Date</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                            {logs.length === 0 ? (
                                <tr><td colSpan={4} className={`p-8 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No activity recorded yet.</td></tr>
                            ) : (
                                logs.map((log) => (
                                <tr key={log.id} className={`transition ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${log.action === 'DELETE' ? 'bg-red-100 text-red-800' : log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{log.action}</span>
                                    </td>
                                    <td className={`p-4 text-sm font-medium ${theme.text}`}>{log.user_email || 'Unknown'}</td>
                                    <td className={`p-4 text-sm ${theme.textSub}`}>{log.details}</td>
                                    <td className={`p-4 text-xs font-mono ${theme.textSub}`}>{new Date(log.created_at).toLocaleString()}</td>
                                </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {/* MODAL 3: DELETE CONFIRM */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
            <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} rounded-2xl shadow-2xl w-full max-w-sm p-6 border text-center`}>
                <h3 className={`text-lg font-bold mb-2 ${theme.text}`}>Delete {deleteType === 'TREE' ? 'Tree' : 'POI'}?</h3>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => setDeleteId(null)} className={`flex-1 py-2 rounded-lg font-bold ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                    <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold">Delete</button>
                </div>
            </div>
        </div>
      )}

      {/* MODAL 4: QR CODE */}
      {qrItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setQrItem(null)}>
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {qrItem.type === 'TREE' ? qrItem.data.common_name : qrItem.data.name}
                </h3>
                <p className="text-gray-500 text-sm mb-6 italic">
                    {qrItem.type === 'TREE' ? qrItem.data.scientific_name : 'Point of Interest'}
                </p>
                <div className="p-6 bg-white border-4 border-emerald-600/20 rounded-3xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] flex flex-col items-center relative">
                    <QRCodeCanvas 
                        value={`${WEBSITE_URL}/${qrItem.type === 'TREE' ? 'tree' : 'poi'}/${qrItem.data.id}`} 
                        size={250}
                        level={"H"} 
                        bgColor={"#ffffff"} 
                        fgColor={"#2E5A38"} 
                        includeMargin={false} 
                        imageSettings={{ src: "/LOGO_120125.png", x: undefined, y: undefined, height: 60, width: 60, excavate: true }}
                        ref={qrRef}
                    />
                </div>
                <button onClick={downloadSticker} className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700 transition flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" /> Download Sticker
                </button>
            </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT TREE */}
{isModalOpen && (
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border ${darkMode ? 'border-gray-700' : 'border-white'}`}>
        
        {/* HEADER */}
        <div className={`px-8 py-5 border-b flex-shrink-0 flex justify-between items-center ${darkMode ? 'border-gray-700' : 'bg-gray-50/50 border-gray-100'} rounded-t-3xl`}>
            <div>
                <h2 className={`text-2xl font-bold ${theme.text}`}>{isEditMode ? "Edit Tree Species" : "Add New Species"}</h2>
                <p className={`text-xs mt-1 ${theme.textSub}`}>Fill in the biological and geographical details below.</p>
            </div>
            <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                <X className="w-6 h-6" />
            </button>
        </div>
        
        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-8 custom-scrollbar">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* LEFT COLUMN: DATA ENTRY (Span 7) */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* SECTION: IDENTITY */}
                    <div className="space-y-4">
                        <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            <Leaf className="w-4 h-4" /> Identification
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textSub}`}>Common Name</label>
                                <input required placeholder="e.g. Narra" className={`w-full p-3.5 rounded-xl border-2 outline-none transition font-semibold ${theme.input} ${darkMode ? 'border-gray-700 focus:border-emerald-500' : 'border-gray-100 focus:border-emerald-500'}`} value={formData.common_name} onChange={e => setFormData({...formData, common_name: e.target.value})} />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textSub}`}>Scientific Name</label>
                                <input required placeholder="e.g. Pterocarpus indicus" className={`w-full p-3.5 rounded-xl border-2 outline-none transition italic ${theme.input} ${darkMode ? 'border-gray-700 focus:border-emerald-500' : 'border-gray-100 focus:border-emerald-500'}`} value={formData.scientific_name} onChange={e => setFormData({...formData, scientific_name: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className={`block text-xs font-bold mb-1.5 ${theme.textSub}`}>Description</label>
                            <textarea 
                                rows={4} 
                                placeholder="Describe the physical characteristics and habitat..." 
                                className={`w-full p-4 rounded-xl border-2 text-sm outline-none transition resize-none ${theme.input} ${darkMode ? 'border-gray-700 focus:border-emerald-500' : 'border-gray-100 focus:border-emerald-500'}`}
                                value={formData.description || ''}
                                onChange={e => setFormData({...formData, description: e.target.value})} 
                            />
                        </div>
                         {/* Native Toggle - Styled nicely */}
                         <div className={`flex items-center gap-4 p-4 rounded-xl border-2 transition cursor-pointer ${formData.native_to_ph 
                            ? (darkMode ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-emerald-50 border-emerald-200') 
                            : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100')
                         }`} onClick={() => setFormData({...formData, native_to_ph: !formData.native_to_ph})}>
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition ${formData.native_to_ph ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                {formData.native_to_ph && <CheckCircle className="w-4 h-4" />}
                            </div>
                            <div>
                                <span className={`block text-sm font-bold ${theme.text}`}>Native Species</span>
                                <span className={`text-xs ${theme.textSub}`}>Is this tree native to the Philippines?</span>
                            </div>
                        </div>
                    </div>

                    <div className={`h-px w-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div>

                    {/* SECTION: SEASONALITY & ECOLOGY */}
                    <div className="space-y-4">
                        <h3 className={`text-sm font-bold uppercase tracking-widest flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                            <Calendar className="w-4 h-4" /> Seasons & Ecology
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textSub}`}>Flowering Season</label>
                                <input placeholder="e.g. March - May" className={`w-full p-3 rounded-xl text-sm outline-none border ${theme.input} ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} value={formData.flowering_season} onChange={e => setFormData({...formData, flowering_season: e.target.value})} />
                            </div>
                            <div>
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textSub}`}>Harvest Season</label>
                                <input placeholder="e.g. June - August" className={`w-full p-3 rounded-xl text-sm outline-none border ${theme.input} ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} value={formData.harvest_season} onChange={e => setFormData({...formData, harvest_season: e.target.value})} />
                            </div>
                            <div className="col-span-2">
                                <label className={`block text-xs font-bold mb-1.5 ${theme.textSub}`}>Ecological Role</label>
                                <input placeholder="e.g. Nitrogen fixer, Soil stabilizer" className={`w-full p-3 rounded-xl text-sm outline-none border ${theme.input} ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} value={formData.ecological_role} onChange={e => setFormData({...formData, ecological_role: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: VISUALS (Span 5) */}
                <div className="lg:col-span-5 space-y-6 flex flex-col">
                    
                    {/* IMAGE UPLOAD - Made prominent */}
                    <div className="space-y-2">
                        <label className={`block text-xs font-bold uppercase tracking-wide ${theme.textSub}`}>Visual Reference</label>
                        <div className={`relative w-full aspect-video rounded-2xl overflow-hidden border-2 border-dashed transition group ${darkMode ? 'border-gray-600 hover:border-emerald-500 bg-gray-900' : 'border-gray-300 hover:border-emerald-500 bg-gray-50'}`}>
                            {displayFileName ? (
                                <>
                                    {previewUrl && <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                                        <button type="button" onClick={() => handleRemoveImage(false)} className="bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg transform translate-y-2 group-hover:translate-y-0 transition">Remove Image</button>
                                    </div>
                                </>
                            ) : (
                                <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer">
                                    <div className={`p-4 rounded-full mb-3 ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-400 shadow-sm'}`}>
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin"/> : <UploadCloud className="w-6 h-6"/>}
                                    </div>
                                    <span className={`text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{uploading ? "Uploading..." : "Click to Upload Photo"}</span>
                                    <span className="text-[10px] text-gray-500 mt-1">Supports JPG, PNG (Max 5MB)</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, false)} disabled={uploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* MAP - Now has room to breathe */}
                    <div className="flex-1 flex flex-col min-h-[300px]">
                         <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${theme.textSub}`}>
                            Geotag Location(s) <span className="text-emerald-500 normal-case ml-1 font-normal">(Click map to add pins)</span>
                        </label>
                        <div className="flex-1 rounded-2xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-inner relative">
                            <LocationPicker 
                                initialLocations={formData.locations || []}
                                onLocationsChange={(newLocations) => {
                                    setFormData({ 
                                        ...formData, 
                                        locations: newLocations,
                                        latitude: newLocations.length > 0 ? newLocations[0].lat : 0,
                                        longitude: newLocations.length > 0 ? newLocations[0].lng : 0
                                    });
                                }} 
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {formData.locations.map((loc, idx) => (
                                <div key={idx} className={`text-[10px] px-2 py-1 rounded border flex items-center gap-1 ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                                    <MapPin className="w-3 h-3" />
                                    {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className={`pt-6 mt-8 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-6 py-3 font-bold rounded-xl text-sm transition ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>Cancel</button>
                <button type="submit" disabled={uploading} className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition text-sm disabled:opacity-50 disabled:translate-y-0">
                    {isEditMode ? "Save Changes" : "Add Tree Species"}
                </button>
            </div>
        </form>
    </div>
</div>
)}

      {/* MODAL 6: ADD / EDIT POI */}
      {isPoiModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200`}>
                <div className={`p-5 border-b flex-shrink-0 flex justify-between items-center ${darkMode ? 'border-gray-700' : 'bg-gray-50/50 border-gray-100'} rounded-t-2xl`}>
                    <h2 className={`text-xl font-bold ${theme.text}`}>{isEditMode ? "Edit POI" : "Add POI"}</h2>
                    <button onClick={() => setIsPoiModalOpen(false)} className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form onSubmit={handlePoiSubmit} className="overflow-y-auto flex-1 p-6 space-y-4 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSub}`}>Name</label>
                            <input required className={`w-full p-3 rounded-lg outline-none transition ${theme.input}`} value={poiFormData.name} onChange={e => setPoiFormData({...poiFormData, name: e.target.value})} />
                        </div>
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${theme.textSub}`}>Description</label>
                            <textarea required rows={10} className={`w-full p-3 rounded-lg outline-none transition ${theme.input}`} value={poiFormData.description} onChange={e => setPoiFormData({...poiFormData, description: e.target.value})} />
                        </div>
                        
                        <div className="col-span-2">
                            <label className={`block text-xs font-bold mb-1 uppercase tracking-wide ${theme.textSub}`}>POI Image</label>
                            {displayFileName ? (
                                <div className={`flex items-center justify-between p-2 rounded-lg border transition ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <div className="relative w-8 h-8 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-300">
                                            {previewUrl && <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />}
                                        </div>
                                        <span className={`text-xs font-medium truncate ${theme.text}`}>{displayFileName}</span>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveImage(true)} className="p-1.5 rounded-full hover:bg-red-100 group transition" title="Remove Image">
                                        <X className="w-4 h-4 text-gray-400 group-hover:text-red-500" />
                                    </button>
                                </div>
                            ) : (
                                <label className={`flex-1 flex items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-lg border-2 border-dashed transition ${darkMode ? 'border-gray-600 hover:border-gray-500 hover:bg-gray-700' : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}`}>
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin text-blue-600"/> : <UploadCloud className="w-4 h-4 text-gray-400"/>}
                                    <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{uploading ? "Uploading..." : "Click to Upload Image"}</span>
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, true)} disabled={uploading} />
                                </label>
                            )}
                        </div>
                    </div>

                    {/* --- POI LOCATION PICKER --- */}
                    <div className="col-span-2 mt-4">
                        <label className={`block text-xs font-bold mb-2 uppercase tracking-wide ${theme.textSub}`}>POI Location</label>
                        <LocationPicker 
                            initialLocations={poiFormData.locations || []} 
                            onLocationsChange={(newLocations) => {
                                setPoiFormData({ 
                                    ...poiFormData, 
                                    locations: newLocations,
                                    latitude: newLocations.length > 0 ? newLocations[0].lat : 0,
                                    longitude: newLocations.length > 0 ? newLocations[0].lng : 0
                                });
                            }} 
                        />
                    </div>

                    <div className={`pt-4 flex justify-end gap-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                        <button type="button" onClick={() => setIsPoiModalOpen(false)} className={`px-5 py-2.5 font-bold rounded-lg text-sm transition ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>Cancel</button>
                        <button type="submit" disabled={uploading} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md transition text-sm disabled:opacity-50">
                            {isEditMode ? "Save Changes" : "Add POI"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* MAP MODAL */}
      {isMapOpen && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[60] p-4">
              <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20">
                  <button onClick={() => setIsMapOpen(false)} className="absolute top-6 right-6 z-[2000] bg-white text-black p-3 rounded-full shadow-lg hover:bg-gray-100">
                      <X className="w-6 h-6" />
                  </button>
                  <GameMap trees={trees} pois={pois} />
              </div>
          </div>
        )}
    </div>
  );
}