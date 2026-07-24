import React, { useState } from 'react';
import FormRPM from './components/FormRPM';
import ResultRPM from './components/ResultRPM';
import { RPMFormData } from './types';
import { GraduationCap, Settings, X } from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { LoadingOverlay } from './components/LoadingOverlay';

export default function App() {
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RPMFormData | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customApiKey, setCustomApiKey] = useState('');
  const [aiProvider, setAiProvider] = useState('gemini');

  const handleGenerate = async (data: RPMFormData) => {
    setIsLoading(true);
    setFormData(data);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data, customApiKey, aiProvider }),
      });
      
      if (!response.ok) {
        const text = await response.text();
        let errorMessage = 'Terjadi kesalahan.';
        try {
          const json = JSON.parse(text);
          errorMessage = json.error || errorMessage;
        } catch(e) {
          errorMessage = text.substring(0, 100);
        }
        if (typeof errorMessage === 'string' && errorMessage.includes('429')) {
          errorMessage = 'Batas limit penggunaan API harian telah habis. Silakan gunakan API Key Anda sendiri di menu Settings.';
        } else if (typeof errorMessage === 'string' && errorMessage.includes('quota')) {
          errorMessage = 'Batas limit penggunaan API harian telah habis. Silakan gunakan API Key Anda sendiri di menu Settings.';
        }
        throw new Error(errorMessage);
      }
      
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body is null');
      const decoder = new TextDecoder();
      let resultText = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        resultText += decoder.decode(value, { stream: true });
        setResult(resultText);
      }
      
      toast.success('RPM berhasil dibuat!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Gagal menghubungi server.', {
        duration: 6000,
        style: {
          maxWidth: '500px',
          wordBreak: 'break-word',
          fontSize: '14px'
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="flex flex-col h-screen print:h-auto w-full bg-slate-50 font-sans overflow-hidden print:overflow-visible">
      <Toaster position="top-center" />
      <LoadingOverlay isVisible={isLoading} message="Membuat RPM..." />
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">Pengaturan API</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider AI</label>
                <select 
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="gemini">Google Gemini (Default)</option>
                  <option value="groq">Groq (Llama 3, Mixtral)</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="deepseek">DeepSeek</option>
                  <option value="qwen">Qwen (DashScope)</option>
                  <option value="grok">Grok (xAI)</option>
                  <option value="odysseus">Odysseus AI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Custom API Key (Opsional)</label>
                <input 
                  type="password"
                  value={customApiKey}
                  onChange={(e) => setCustomApiKey(e.target.value)}
                  placeholder="Masukkan API Key Anda..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Jika dikosongkan, aplikasi akan menggunakan API Key bawaan dari Vercel. Gunakan API Key Anda sendiri jika batas harian telah habis.
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button 
                onClick={() => { setIsSettingsOpen(false); toast.success('Pengaturan disimpan!'); }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                Simpan & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="print:hidden flex flex-shrink-0 items-center justify-between px-4 lg:px-8 py-3 lg:py-4 bg-white border-b border-slate-200 shadow-sm flex-wrap gap-4 lg:gap-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 overflow-hidden bg-white rounded-lg border border-slate-200 shadow-sm">
            <img src="https://raw.githubusercontent.com/xiroro-ab/smp58dataguru/refs/heads/main/ico.png" alt="Logo SMP 58" className="object-contain w-full h-full p-1" />
          </div>
          <div>
            <h1 className="text-lg lg:text-xl font-bold text-slate-800">Generator RPM</h1>
            <p className="text-[10px] lg:text-xs text-slate-500 font-medium uppercase tracking-wider">Kurikulum Merdeka • Indonesia</p>
          </div>
        </div>
        <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">AI Provider</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              <span className="text-sm font-semibold text-slate-700 capitalize">{aiProvider}</span>
            </div>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
            title="Pengaturan API"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button onClick={handleReset} className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-md hover:bg-slate-900 transition-colors">
            Reset Form
          </button>
        </div>
      </header>
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden print:overflow-visible print:block">
        {/* Left Sidebar: Input Form */}
        <section className="print:hidden w-full lg:w-[400px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col z-10 shadow-[1px_0_10px_rgba(0,0,0,0.02)] lg:h-full lg:max-h-full max-h-[50vh] lg:max-h-none overflow-hidden shrink-0">
          <FormRPM onSubmit={handleGenerate} isLoading={isLoading} />
        </section>
        {/* Right: Result Preview */}
        <section className="flex-1 bg-slate-100 overflow-hidden print:overflow-visible flex flex-col relative print:block min-h-[50vh] lg:min-h-0">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <GraduationCap className="w-16 h-16 opacity-20 mb-4" />
              <p className="text-sm">Isi form di sebelah kiri untuk menghasilkan RPM</p>
            </div>
          ) : (
            <ResultRPM markdown={result} onReset={handleReset} formData={formData} />
          )}
        </section>
      </main>
      {/* Footer */}
      <footer className="print:hidden bg-white border-t border-slate-200 py-2 px-8 flex justify-between items-center text-[11px] text-slate-400">
        <p>© {new Date().getFullYear()} AI Education Labs • Build for Merdeka Belajar</p>
        <p className="font-mono">Coded by Aris Bermansyah | Powered by {aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} AI</p>
      </footer>
    </div>
  );
}
