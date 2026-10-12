import React from 'react';
import { Student } from '../types';
import { SCHOOL_INFO } from '../data/schoolData';
import { X, Printer, ShieldCheck, UserCheck } from 'lucide-react';

interface StudentIDCardModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export const StudentIDCardModal: React.FC<StudentIDCardModalProps> = ({
  student,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !student) return null;

  // Generate deterministic details for student
  const charCodeSum = student.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const houses = [
    'Kwame Nkrumah House (Green)',
    'Aggrey House (Yellow)',
    'Yaa Asantewaa House (Red)',
    'Armah-Blay House (Blue)',
  ];
  const house = student.house || houses[charCodeSum % houses.length];
  const boardingStatus = student.boardingStatus || (charCodeSum % 3 === 0 ? 'Day Student' : 'Boarder');
  const ghanaCardNo = student.ghanaCard || `GHA-${String(100000000 + (charCodeSum * 1337) % 900000000)}-${charCodeSum % 9}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 no-print">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <span>Official Student Identification Card</span>
            </h2>
            <p className="text-xs text-slate-500">
              GES Standard Student Index & Biometric Identity Card · 2026/2027 Academic Year
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              type="button"
              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Card</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Card Area */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* Card Front */}
          <div className="w-[340px] h-[215px] bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-xl shadow-xl p-3.5 flex flex-col justify-between border-2 border-amber-400/80 relative overflow-hidden">
            {/* Watermark Crest */}
            <div className="absolute right-[-20px] bottom-[-20px] opacity-10 pointer-events-none w-48 h-48">
              <img src="/logo.jpg" alt="" className="w-full h-full object-contain" />
            </div>

            {/* Card Header */}
            <div className="flex items-center gap-2 border-b border-white/20 pb-2">
              <div className="w-9 h-9 rounded-lg bg-white p-0.5 shrink-0 shadow-xs">
                <img src="/logo.jpg" alt="Crest" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300 truncate">
                  Ghana Education Service
                </div>
                <div className="text-[10.5px] font-black tracking-tight leading-tight uppercase truncate">
                  {SCHOOL_INFO.name}
                </div>
                <div className="text-[8.5px] text-blue-200 italic font-mono truncate">
                  "{SCHOOL_INFO.motto}"
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="flex items-center gap-3 my-1">
              <div className="w-16 h-20 bg-slate-200 rounded-lg border-2 border-white/40 flex flex-col items-center justify-center text-slate-500 shrink-0 overflow-hidden shadow-inner bg-gradient-to-b from-slate-100 to-slate-300">
                <UserCheck className="w-8 h-8 text-slate-400 mb-1" />
                <span className="text-[8px] font-bold uppercase tracking-wider text-slate-600">PHOTO</span>
              </div>

              <div className="space-y-0.5 min-w-0 flex-1">
                <div className="text-[11.5px] font-extrabold text-white truncate tracking-wide">
                  {student.name}
                </div>
                <div className="text-[9.5px] text-amber-300 font-mono font-bold">
                  INDEX: {student.indexNumber}
                </div>
                <div className="text-[9px] text-blue-100 truncate">
                  <strong>Program:</strong> {student.program}
                </div>
                <div className="text-[9px] text-blue-100 truncate">
                  <strong>Class:</strong> {student.className}
                </div>
                <div className="text-[8.5px] text-emerald-300 truncate font-semibold">
                  {house}
                </div>
              </div>
            </div>

            {/* Card Footer Bar */}
            <div className="border-t border-white/20 pt-1.5 flex items-center justify-between text-[8.5px]">
              <span className="bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded text-[8px] uppercase">
                {boardingStatus}
              </span>
              <span className="text-slate-300 font-mono font-semibold">
                VALID THRU: JULY 2029
              </span>
            </div>
          </div>

          {/* Card Back */}
          <div className="w-[340px] h-[215px] bg-slate-50 text-slate-800 rounded-xl shadow-xl p-3.5 flex flex-col justify-between border-2 border-slate-300 relative text-[9px]">
            {/* Magnetic Stripe representation */}
            <div className="h-6 bg-slate-900 rounded -mx-3.5 -mt-3.5 mb-2"></div>

            <div className="space-y-1 text-slate-600">
              <div className="font-bold text-slate-900">TERMS & CONDITIONS:</div>
              <p className="leading-snug text-[8px]">
                1. This card is the property of Nkroful Agric SHS and must be produced upon demand.
              </p>
              <p className="leading-snug text-[8px]">
                2. If found, please return to P.O. Box 14, Nkroful, Western Region or any GES office.
              </p>
              <div className="text-[8.5px] font-mono text-slate-800 pt-0.5">
                <strong>Ghana Card PIN:</strong> {ghanaCardNo}
              </div>
            </div>

            {/* Barcode & Headmaster Signature */}
            <div className="border-t border-slate-200 pt-2 flex items-end justify-between">
              <div>
                <div className="font-mono text-slate-400 text-[7px] tracking-widest font-black uppercase">
                  |||||||||||||||||||||||||||||||||||||||||
                </div>
                <div className="font-mono text-slate-700 text-[8px] font-bold">
                  *NASS-{student.indexNumber}*
                </div>
              </div>

              <div className="text-right">
                <div className="font-serif italic font-bold text-blue-900 text-[10px]">
                  E. Armah-Blay
                </div>
                <div className="text-[7.5px] font-bold text-slate-500 uppercase">
                  Headmaster's Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
