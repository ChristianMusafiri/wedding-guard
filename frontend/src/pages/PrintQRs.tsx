import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

interface Guest {
  id: string;
  lastName: string;
  firstName: string;
  qrCodeToken: string;
  tableNumber: string | null;
  isVip: boolean;
}

const PrintQRs: React.FC = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGuests = async () => {
      try {
        const response = await api.get('/guests');
        setGuests(response.data);
      } catch (err) {
        setError("Impossible de charger les invités. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };
    fetchGuests();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-red-400 font-semibold">{error}</p>
          <button
            onClick={() => navigate('/guests-admin')}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8 print:p-0 print:bg-white print:text-black">

      {/* BARRE D'ACTIONS — cachée à l'impression */}
      <div className="flex justify-between items-center mb-8 border-b border-neutral-800 pb-4 print:hidden">
        <div>
          <h1 className="text-3xl font-serif text-rose-300">Planche d'Impression des QR Codes</h1>
          <p className="text-neutral-400 text-sm mt-1">
            Format A4 — 4 colonnes × 8 lignes = <span className="text-rose-300 font-semibold">32 étiquettes sur une seule page</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/guests-admin')}
            className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-colors"
          >
            Retour
          </button>
          <button
            onClick={() => window.print()}
            className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2.5 px-6 rounded-lg text-xs uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20"
          >
            Lancer l'impression (Ctrl + P)
          </button>
        </div>
      </div>

      {/*
        RÈGLES D'IMPRESSION A4 EXACTES
        A4 = 210mm x 297mm | Marges 5mm → zone utile = 200mm x 287mm
        4 colonnes → 200mm / 4 = 50mm par étiquette
        8 lignes   → 287mm / 8 = 35.875mm par étiquette
      */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
          }
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(4, 50mm) !important;
            grid-template-rows: repeat(8, 35.875mm) !important;
            width: 200mm !important;
            height: 287mm !important;
            gap: 0 !important;
            background: white !important;
          }
          .print-label {
            width: 50mm !important;
            height: 35.875mm !important;
            border: 0.3mm solid #ccc !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 1mm !important;
            box-sizing: border-box !important;
            page-break-inside: avoid !important;
            background: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* ZONE D'IMPRESSION */}
      <div className="print-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {guests.map((guest) => (
          <div
            key={guest.id}
            className="print-label bg-neutral-950 border border-neutral-800 p-3 rounded-lg flex flex-col items-center justify-center text-center"
          >
            {/* QR Code */}
            <div className="p-1.5 bg-white rounded-lg border border-neutral-700 print:border-0 print:p-0">
              <QRCodeSVG
                value={guest.qrCodeToken}
                size={65}
                level="M"
              />
            </div>

            {/* Informations invité */}
            <div className="mt-1.5 w-full text-center">
              <p className="text-[10px] font-bold uppercase tracking-wider truncate text-white print:text-black">
                {guest.firstName} {guest.lastName}
              </p>
              <p className="text-[9px] text-rose-300 print:text-neutral-600 mt-0.5">
                {guest.tableNumber ? `Table : ${guest.tableNumber}` : 'Sans table'}
                {guest.isVip && ' • VIP'}
              </p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default PrintQRs;
