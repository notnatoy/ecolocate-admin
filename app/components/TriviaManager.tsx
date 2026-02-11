'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Trash2, Plus, RefreshCw, Lightbulb, Edit2, Check, X, Loader2 } from 'lucide-react';

type Props = {
  darkMode: boolean;
};

export default function TriviaManager({ darkMode }: Props) {
  const [trivia, setTrivia] = useState<any[]>([]);
  const [newFact, setNewFact] = useState('');
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  // --- EDITING STATE ---
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [saving, setSaving] = useState(false);

  // Theme helper
  const theme = {
    card: darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    text: darkMode ? 'text-gray-100' : 'text-gray-800',
    textSub: darkMode ? 'text-gray-400' : 'text-gray-500',
    input: darkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400',
    itemBg: darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
    editBg: darkMode ? 'bg-gray-900/50 border-emerald-500/50' : 'bg-emerald-50/50 border-emerald-200',
  };

  useEffect(() => {
    fetchTrivia();
  }, []);

  const fetchTrivia = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('trivia')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTrivia(data);
    setLoading(false);
  };

  const addTrivia = async () => {
    if (!newFact.trim()) return;
    setAdding(true);

    const { error } = await supabase
      .from('trivia')
      .insert([{ content: newFact }]);

    if (!error) {
      setNewFact('');
      fetchTrivia(); 
    } else {
      alert('Error adding trivia');
    }
    setAdding(false);
  };

  const deleteTrivia = async (id: number) => {
    if (!confirm('Delete this fact?')) return;

    const { error } = await supabase.from('trivia').delete().eq('id', id);

    if (!error) {
      setTrivia(trivia.filter(t => t.id !== id));
    }
  };

  // --- EDIT FUNCTIONS ---
  const startEditing = (item: any) => {
    setEditingId(item.id);
    setEditText(item.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditText('');
  };

  const saveEdit = async (id: number) => {
    if (!editText.trim()) return;
    setSaving(true);

    const { error } = await supabase
      .from('trivia')
      .update({ content: editText })
      .eq('id', id);

    if (!error) {
      // Update local state directly to feel instant
      setTrivia(trivia.map(t => t.id === id ? { ...t, content: editText } : t));
      cancelEditing();
    } else {
      alert('Error updating trivia');
    }
    setSaving(false);
  };

  return (
    <div className={`w-full rounded-3xl shadow-sm border overflow-hidden ${theme.card}`}>
      {/* HEADER */}
      <div className={`p-6 border-b flex justify-between items-center ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
        <div>
           <h2 className={`text-xl font-bold flex items-center gap-2 ${theme.text}`}>
             <Lightbulb className="w-5 h-5 text-yellow-500" /> Trivia Library
           </h2>
           <p className={`text-xs mt-1 ${theme.textSub}`}>Manage the random facts displayed in the mobile app.</p>
        </div>
        <button 
          onClick={fetchTrivia} 
          className={`p-2 rounded-full transition ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="p-6">
        {/* ADD NEW INPUT */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newFact}
            onChange={(e) => setNewFact(e.target.value)}
            placeholder="Type a new nature fact here..."
            className={`flex-1 p-4 rounded-xl border outline-none focus:ring-2 focus:ring-emerald-500 transition ${theme.input}`}
            onKeyDown={(e) => e.key === 'Enter' && addTrivia()}
          />
          <button 
            onClick={addTrivia}
            disabled={!newFact.trim() || adding}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition shadow-lg hover:-translate-y-0.5"
          >
            {adding ? <RefreshCw className="animate-spin w-5 h-5"/> : <Plus className="w-5 h-5" />} 
            Add
          </button>
        </div>

        {/* LIST */}
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
          {trivia.length === 0 && !loading && (
            <div className={`text-center py-12 border-2 border-dashed rounded-xl ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-400'}`}>
              <Lightbulb className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No trivia facts found. Add your first one!</p>
            </div>
          )}

          {trivia.map((item) => (
            <div 
              key={item.id} 
              className={`group flex items-start justify-between p-4 rounded-xl transition-all border border-transparent ${editingId === item.id ? theme.editBg + ' border-emerald-500' : theme.itemBg + ' hover:border-emerald-500/30'}`}
            >
              {editingId === item.id ? (
                // --- EDIT MODE ---
                <div className="flex-1 flex gap-3 items-start animate-in fade-in duration-200">
                    <textarea 
                        autoFocus
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className={`flex-1 p-3 rounded-lg border outline-none resize-none text-sm ${theme.input}`}
                        rows={2}
                    />
                    <div className="flex flex-col gap-2">
                        <button 
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                            className="p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-sm"
                            title="Save"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin"/> : <Check className="w-4 h-4" />}
                        </button>
                        <button 
                            onClick={cancelEditing}
                            className={`p-2 rounded-lg transition border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                            title="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
              ) : (
                // --- VIEW MODE ---
                <>
                    <div className="flex gap-4">
                        <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-emerald-50 text-emerald-600'}`}>
                        {item.id}
                        </span>
                        <p className={`text-base leading-relaxed pt-1 ${theme.text}`}>
                        {item.content}
                        </p>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button 
                            onClick={() => startEditing(item)}
                            className={`p-2 rounded-lg transition ${darkMode ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button 
                            onClick={() => deleteTrivia(item.id)}
                            className={`p-2 rounded-lg transition ${darkMode ? 'text-gray-400 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className={`px-6 py-3 border-t text-xs text-center ${darkMode ? 'border-gray-700 text-gray-500' : 'border-gray-100 text-gray-400'}`}>
        Total Active Facts: {trivia.length}
      </div>
    </div>
  );
}