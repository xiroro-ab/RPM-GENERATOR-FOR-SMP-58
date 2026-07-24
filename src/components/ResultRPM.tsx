import React, { useState } from 'react';
import { Download, Printer, X, FileText } from 'lucide-react';
import { RPMFormData } from '../types';
import { LoadingOverlay } from './LoadingOverlay';


interface ResultRPMProps {
  markdown: string;
  onReset: () => void;
  formData: RPMFormData | null;
}

export default function ResultRPM({ markdown, onReset, formData }: ResultRPMProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handlePrintPDF = async () => {
    setIsDownloading(true);
    try {
      // Create request to our new server-side Puppeteer endpoint
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: markdown,
          filename: `RPM_${formData?.subject || 'Kurikulum'}_Kelas_${formData?.phase || ''}.pdf`,
          footerText: `RPM ${formData?.subject || ''} ${
            formData?.phase 
              ? formData.phase.replace(/Fase (.*) \\((.*)\\)/, 'Kelas ($2) Fase $1')
              : ''
          } - ${formData?.school || ''} (Deep Learning ${formData?.learningMode || ''})`
        })
      });

      if (!response.ok) throw new Error('Gagal dari server');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RPM_${formData?.subject || 'Kurikulum'}_Kelas_${formData?.phase || ''}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      import('react-hot-toast').then(({ toast }) => {
        toast.error('Gagal membuat PDF via Server. Silakan coba lagi.');
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const element = document.createElement('a');
    const file = new Blob([markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = 'RPM_Kurikulum_Merdeka.md';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadWord = () => {
    const preHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset='utf-8'>
<title>Export HTML To Doc</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11pt; }
  table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
  th, td { border: 1px solid black; padding: 5px; }
  h2 { font-size: 14pt; margin-top: 12pt; margin-bottom: 6pt; }
  h3 { font-size: 12pt; margin-top: 10pt; margin-bottom: 5pt; }
  p, li { margin-bottom: 5pt; }
  .logo { max-width: 90px; height: auto; }
</style>
</head>
<body>`;
    const postHtml = "</body></html>";
    const htmlContent = document.getElementById('rpm-content')?.innerHTML || markdown;
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(preHtml + htmlContent + postHtml);
    
    const downloadLink = document.createElement('a');
    document.body.appendChild(downloadLink);
    downloadLink.href = url;
    downloadLink.download = 'RPM_Kurikulum_Merdeka.doc';
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  return (
    <>
      <LoadingOverlay isVisible={isDownloading} message="Menyiapkan PDF..." />
      <div className="flex flex-col h-full w-full overflow-hidden print:overflow-visible print:block print:h-auto">
      <div className="print:hidden flex-shrink-0 flex items-center justify-between p-4 sm:p-6 pb-4">
        <div className="flex items-center gap-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wide italic">Preview Dokumen</span>
        </div>
        <div className="flex items-center gap-2 relative group">
          <button
            onClick={handleDownloadMarkdown}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            MD
          </button>
          <button
            onClick={handleDownloadWord}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-md shadow-sm hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Word
          </button>
          <button
            onClick={handlePrintPDF}
            disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-md shadow-sm transition-colors ${isDownloading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            <Download className="w-4 h-4" />
            {isDownloading ? 'Menyiapkan PDF...' : 'Cetak / Simpan PDF'}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-6 pt-0 custom-scrollbar print:p-0 print:overflow-visible relative print:block print:h-auto">
        <div className="bg-white shadow-xl rounded-sm border border-slate-200 print:border-none print:shadow-none p-4 sm:p-8 md:p-12 print:p-0 min-h-[1056px] relative print:min-h-0 print:block">
          <div id="rpm-content" className="w-full text-black print:text-black rpm-content-wrapper"
            dangerouslySetInnerHTML={{ __html: markdown }}
          />
          
          {/* Print Footer */}
          <div className="hidden print:flex fixed bottom-0 left-0 right-0 w-full justify-between items-end text-[9px] text-gray-500 bg-white pt-2 border-t border-gray-200 z-50">
            <span>RPM {formData?.subject} {formData?.phase ? formData.phase.replace(/Fase (.*) \\((.*)\\)/, 'Kelas ($2) Fase $1') : ''} - {formData?.school} (Deep Learning {formData?.learningMode})</span>
            {/* The page numbers usually need to be handled by browser headers/footers, but we provide this fixed text as requested */}
          </div>
        </div>
      </div>
    </div>
      </>
  );
}
