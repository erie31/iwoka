import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Plus, Trash2, Image as ImageIcon, Sparkles, Trophy, Shield, Layout } from 'lucide-react';

export default function AdminGamification() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('FRAME'); // FRAME, BANNER, EFFECT
  const [url, setUrl] = useState('');
  const [minLevel, setMinLevel] = useState(1);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'gamification_assets'), orderBy('minLevel', 'asc'));
      const snap = await getDocs(q);
      const results = [];
      snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      setAssets(results);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const addAsset = async (e) => {
    e.preventDefault();
    if (!name || !url) return;
    try {
      await addDoc(collection(db, 'gamification_assets'), {
        name,
        type,
        url,
        minLevel: parseInt(minLevel),
        createdAt: new Date().toISOString()
      });
      setName('');
      setUrl('');
      fetchAssets();
    } catch (err) { console.error(err); }
  };

  const deleteAsset = async (id) => {
    if (!confirm('¿Eliminar este cosmético?')) return;
    try {
      await deleteDoc(doc(db, 'gamification_assets', id));
      fetchAssets();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-fade-in space-y-8 pb-20">
      <header className="mb-8 pt-4">
        <h1 className="text-3xl font-black italic tracking-tight text-white uppercase flex items-center gap-2">
            <Sparkles className="text-iwoka-500" /> Gestor de Recompensas
        </h1>
        <p className="text-gray-400">Carga marcos, banners y efectos para los niveles 1-50</p>
      </header>

      {/* Upload Form */}
      <section className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-6 flex items-center gap-2">
              <Plus size={14} /> Nuevo Cosmético
          </h2>
          <form onSubmit={addAsset} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-black ml-1">Nombre del Item</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 text-sm font-bold placeholder:text-gray-700 outline-none focus:border-iwoka-500"
                    placeholder="Ej: Marco de Fuego"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-black ml-1">Tipo</label>
                  <select 
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 text-sm font-bold outline-none focus:border-iwoka-500"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                      <option value="FRAME">Marco de Avatar (PNG)</option>
                      <option value="BANNER">Banner de Perfil</option>
                      <option value="EFFECT">Efecto Visual</option>
                  </select>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-black ml-1">URL de Imagen</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl p-3 text-sm font-bold placeholder:text-gray-700 outline-none focus:border-iwoka-500"
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] uppercase text-gray-500 font-black ml-1">Nivel Necesario</label>
                  <div className="flex gap-2">
                    <input 
                        type="number" 
                        className="flex-1 bg-gray-950 border border-gray-800 text-white rounded-xl p-3 text-sm font-bold outline-none focus:border-iwoka-500"
                        min="1" max="50"
                        value={minLevel}
                        onChange={(e) => setMinLevel(e.target.value)}
                    />
                    <button type="submit" className="bg-iwoka-500 text-gray-950 p-3 rounded-xl hover:bg-iwoka-400 transition-colors shadow-lg shadow-iwoka-500/20">
                        <Plus size={24} />
                    </button>
                  </div>
              </div>
          </form>
      </section>

      {/* Asset List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
              <div className="col-span-full py-20 text-center animate-pulse text-gray-700 uppercase font-bold italic">Consultando inventario global...</div>
          ) : assets.length > 0 ? (
              assets.map(asset => (
                  <div key={asset.id} className="bg-gray-900 border border-gray-800 rounded-3xl p-6 group hover:border-gray-600 transition-all shadow-xl flex flex-col gap-4">
                      <div className="relative aspect-video bg-gray-950 rounded-2xl border border-gray-800 overflow-hidden flex items-center justify-center">
                          {asset.url ? (
                              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                              <ImageIcon className="text-gray-800" size={48} />
                          )}
                          <div className="absolute top-2 left-2 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-gray-800">
                             <p className="text-[9px] font-black text-iwoka-500 uppercase tracking-widest">{asset.type}</p>
                          </div>
                      </div>
                      <div className="flex justify-between items-center px-1">
                          <div>
                              <h3 className="text-white font-black uppercase text-sm italic">{asset.name}</h3>
                              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Nivel {asset.minLevel}+</p>
                          </div>
                          <button onClick={() => deleteAsset(asset.id)} className="p-3 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </div>
              ))
          ) : (
              <div className="col-span-full py-20 text-center text-gray-800 font-black uppercase italic">No has cargado recompensas todavía.</div>
          )}
      </div>
    </div>
  );
}
