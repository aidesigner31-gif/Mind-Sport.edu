import React, { useState } from 'react';
import { Shield, FileText, Check, Copy, X } from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const licenseNotice = `/*
 * Copyright (c) 2026 [شركة رياضة العقل]. All rights reserved.
 * صُممت وبرمجت لصالح [شركة رياضة العقل ].
 * هذا العمل محمي بموجب أنظمة الملكية الفكرية، ولا يُسمح بنسخه، تعديله، 
 * أو استخدامه تجارياً إلا بموجب إذن خطي مسبق.
 */`;

  const handleCopy = () => {
    navigator.clipboard.writeText(licenseNotice);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#0d111e]/95 backdrop-blur-2xl border border-pink-500/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_70px_rgba(236,72,153,0.3)] text-right">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="text-right">
              <h3 className="text-lg font-black text-white flex items-center gap-2 justify-end">
                <span>ملف الترخيص والملكية الفكرية</span>
                <Shield className="w-5 h-5 text-pink-400" />
              </h3>
              <p className="text-[11px] text-pink-300/80 font-mono">License File • Mind Sport</p>
            </div>
          </div>
        </div>

        {/* Legal Text Notice Box */}
        <div className="relative bg-slate-950/80 border border-pink-500/20 rounded-2xl p-5 mb-5 font-mono text-sm leading-relaxed text-slate-200 shadow-inner">
          <pre className="whitespace-pre-wrap font-sans sm:font-mono text-xs sm:text-sm text-slate-300 text-right dir-rtl select-all">
            {licenseNotice}
          </pre>

          <button
            onClick={handleCopy}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold transition-all border border-pink-500/30 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">تم النسخ بنجاح</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ نص الترخيص</span>
              </>
            )}
          </button>
        </div>

        {/* Protection Explanatory Card */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-slate-300/90 leading-relaxed mb-6 space-y-2">
          <div className="flex items-center gap-2 font-bold text-pink-300">
            <FileText className="w-4 h-4" />
            <span>حقوق الطبع والنشر والتوزيع:</span>
          </div>
          <p>
            جميع الحقوق محفوظة لصالح <strong>شركة رياضة العقل</strong> (2026). يشمل ذلك الأكواد البرمجية، تصاميم الواجهات ثلاثية الأبعاد، خوارزميات الحساب الذهني، وتأثيرات المعداد التنازلي التفاعلية.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(236,72,153,0.3)] cursor-pointer"
        >
          إغلاق / CLOSE
        </button>
      </div>
    </div>
  );
};
