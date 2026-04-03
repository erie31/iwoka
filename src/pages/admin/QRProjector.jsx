import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

export default function QRProjector() {
  const [token, setToken] = useState('');

  useEffect(() => {
    // Generar un token único y diario basado en la fecha hoy para evitar fraude
    // En el futuro, lo emparejaremos con un Cloud Function backend
    const updateToken = () => {
      const today = new Date().toISOString().split('T')[0]; // Ejemplo: '2026-04-02'
      setToken(`IWOKA-PRESENCE-${today}`);
    };
    
    updateToken();
  }, []);

  return (
    <div className="animate-fade-in min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-5xl font-black italic text-white uppercase mb-2 drop-shadow-lg">Asistencia</h1>
        <p className="text-iwoka-400 font-bold tracking-widest uppercase">Escanear para +300 XP</p>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-[0_0_80px_rgba(34,197,94,0.4)]">
        {token && <QRCodeSVG value={token} size={300} level="H" includeMargin={false} fgColor="#052e16" />}
      </div>
    </div>
  );
}
