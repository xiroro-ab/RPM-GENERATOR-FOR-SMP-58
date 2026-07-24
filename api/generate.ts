import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const parsed = await req.json();
    const data = parsed.data;
    const customApiKey = parsed.customApiKey;
    const aiProvider = parsed.aiProvider;

    if (!data) {
      return new Response(JSON.stringify({ error: 'Data form tidak ditemukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    const defaultGeminiKey = process.env.GEMINI_API_KEY;
    const provider = aiProvider || 'gemini';
    const cApiKey = customApiKey;

    if (!cApiKey && !defaultGeminiKey && provider === 'gemini') {
      return new Response(JSON.stringify({ error: 'API Key diperlukan.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (!cApiKey && provider !== 'gemini') {
      return new Response(JSON.stringify({ error: 'Custom API Key diperlukan untuk provider ' + provider + '.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const keyToUse = (provider === 'gemini' && !cApiKey) ? defaultGeminiKey : cApiKey;

    const prompt = `
Anda adalah seorang ahli pendidikan yang membuat Rencana Pelaksanaan Pembelajaran (RPP) atau Modul Ajar (RPM) Kurikulum Merdeka yang sangat terstruktur, profesional, dan akurat.
Buatlah RPM untuk data berikut:

- **Sekolah:** ${data.school}
- **Mata Pelajaran:** ${data.subject}
- **Fase/Kelas:** ${data.phase}
- **Semester:** ${data.semester}
- **Alokasi Waktu:** ${data.timeAllocation} (Jumlah Pertemuan: ${data.meetingCount})
- **Topik/Materi:** ${data.topic}
- **Model Pembelajaran:** ${data.learningModel}

INSTRUKSI FORMAT DAN ISI (SANGAT PENTING):
1. **STRUKTUR HARUS MENGIKUTI TEMPLATE DI BAWAH INI SECARA PERSIS**.
2. **JABARKAN SETIAP FASE MODEL PEMBELAJARAN**: Pada bagian "Kegiatan Inti", Anda WAJIB menjabarkan SETIAP fase dari model ${data.learningModel} secara terpisah dan detail. 
   - Gunakan format HTML \`<li style="margin-bottom: 12px;"><b>Fase X: [Nama Fase]</b><br/>[Penjelasan aktivitas guru dan siswa]</li>\`.
   - JANGAN menggabungkan fase. JANGAN ada fase yang terlewat.
3. **ASESMEN SUMATIF (SANGAT PENTING)**:
   - Buatlah TOTAL ${data.meetingCount * 10} SOAL PILIHAN GANDA (berarti 10 soal per pertemuan).
   - **PENOMORAN WAJIB MUNCUL**: Gunakan tag \`<ol>\` atau format "1. " dengan jelas.
   - **OPSI JAWABAN WAJIB MENURUN/VERTIKAL**: Opsi A, B, C, D WAJIB disusun ke bawah (1 baris 1 opsi). JANGAN dicampur menyamping.
   - **KUNCI JAWABAN WAJIB ADA**: Letakkan daftar kunci jawaban yang dicetak tebal di bagian paling akhir instrumen.
4. Jangan gunakan markdown code block (\`\`\`html) di awal atau akhir jawaban. Langsung berikan HTML-nya.

TEMPLATE HTML YANG WAJIB DIGUNAKAN (Isi bagian di dalam kurung siku [...] dengan konten yang relevan):

<div class="rpm-content-wrapper" style="font-family: 'Space Grotesk', sans-serif; line-height: 1.6; color: #000; font-size: 11pt;">

<div class="kop-surat" style="text-align: center; border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px; display: flex; align-items: center; justify-content: space-between;">
  <div style="width: 80px;">
    <!-- Logo Kiri -->
    <img src="${data.logoLeft || 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_Tut_Wuri_Handayani.png'}" alt="Logo 1" style="width: 70px; height: auto;" />
  </div>
  <div style="flex-1; text-align: center;">
    <h3 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">PEMERINTAH ${data.city || '[KOTA/KABUPATEN]'}</h3>
    <h3 style="margin: 0; font-size: 14pt; font-weight: bold; text-transform: uppercase;">DINAS PENDIDIKAN</h3>
    <h2 style="margin: 5px 0; font-size: 16pt; font-weight: bold; text-transform: uppercase;">${data.school}</h2>
    <p style="margin: 0; font-size: 8pt;">${data.schoolAddress || '[Alamat Sekolah, Kodepos, Telp, Website, Email]'}</p>
  </div>
  <div style="width: 80px;">
    <!-- Logo Kanan -->
    <img src="${data.logoRight || 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_Tut_Wuri_Handayani.png'}" alt="Logo 2" style="width: 70px; height: auto; ${!data.logoRight ? 'visibility: hidden;' : ''}" />
  </div>
</div>

<h3 style="text-align: center; margin-bottom: 20px; text-decoration: underline; font-family: 'IBM Plex Sans', sans-serif;">MODUL AJAR / RENCANA PELAKSANAAN PEMBELAJARAN</h3>

<table style="width: 100%; margin-bottom: 20px; border-collapse: collapse;">
  <tr><td style="width: 25%; font-weight: bold; vertical-align: top;">Nama Sekolah</td><td style="width: 2%; vertical-align: top;">:</td><td style="vertical-align: top;">${data.school}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Mata Pelajaran</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${data.subject}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Fase / Kelas</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${data.phase}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Semester</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${data.semester}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Alokasi Waktu</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${data.timeAllocation} (${data.meetingCount} Pertemuan)</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Topik / Materi</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${data.topic}</td></tr>
  <tr><td style="font-weight: bold; vertical-align: top;">Model Pembelajaran</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${data.learningModel}</td></tr>
</table>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  I. KOMPONEN INTI
</div>
<p><b>A. Tujuan Pembelajaran</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Tuliskan tujuan pembelajaran 1]</li>
  <li>[Tuliskan tujuan pembelajaran 2]</li>
</ol>

<p><b>B. Profil Pelajar Pancasila</b></p>
<ul style="margin-bottom: 8px;">
  <li>[Dimensi 1: Penjelasan singkat bagaimana ini dicapai]</li>
  <li>[Dimensi 2: Penjelasan singkat bagaimana ini dicapai]</li>
</ul>

<p><b>C. Pemahaman Bermakna</b></p>
<p style="margin-bottom: 8px;">[Tuliskan pemahaman bermakna yang akan didapat siswa]</p>

<p><b>D. Pertanyaan Pemantik</b></p>
<ul style="margin-bottom: 15px;">
  <li>[Pertanyaan pemantik 1]</li>
  <li>[Pertanyaan pemantik 2]</li>
</ul>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  II. KEGIATAN PEMBELAJARAN
</div>
[UNTUK SETIAP PERTEMUAN (Pertemuan 1 sampai ${data.meetingCount}), BUATKAN STRUKTUR BERIKUT:]
<div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
  <p style="font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 4px; margin-top: 0;">Pertemuan [X]: [Sub-Topik Spesifik untuk pertemuan ini]</p>
  
  <p><b>1. Kegiatan Pendahuluan (±15 Menit)</b></p>
  <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
    <li style="margin-bottom: 4px;">- [Aktivitas orientasi/apersepsi/motivasi 1]</li>
    <li style="margin-bottom: 4px;">- [Aktivitas orientasi/apersepsi/motivasi 2]</li>
  </ul>
  
  <p><b>2. Kegiatan Inti (±[X] Menit)</b> - <i>Model: ${data.learningModel}</i></p>
  <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
    [JABARKAN SETIAP FASE MODEL ${data.learningModel} DI SINI MENGGUNAKAN <li>. CONTOH: <li style="margin-bottom: 12px;"><b>Fase 1: ...</b><br/>...</li>]
  </ul>
  
  <p><b>3. Kegiatan Penutup (±15 Menit)</b></p>
  <ul style="list-style-type: none; margin: 8px 0; padding-left: 0;">
    <li style="margin-bottom: 4px;">- [Aktivitas kesimpulan/refleksi/tindak lanjut 1]</li>
    <li style="margin-bottom: 4px;">- [Aktivitas kesimpulan/refleksi/tindak lanjut 2]</li>
  </ul>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  III. ASESMEN (PENILAIAN)
</div>
<ol style="margin-bottom: 15px;">
  <li><b>Asesmen Diagnostik:</b> [Bentuk asesmen]</li>
  <li><b>Asesmen Formatif:</b> [Bentuk asesmen selama proses pembelajaran]</li>
  <li><b>Asesmen Sumatif:</b> [Bentuk asesmen akhir]</li>
</ol>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  IV. MEDIA DAN SUMBER BELAJAR
</div>
<ul style="margin-bottom: 15px;">
  <li><b>Media:</b> [Sebutkan media fisik/digital]</li>
  <li><b>Sumber Belajar:</b> [Buku cetak, tautan web, dll]</li>
</ul>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  V. REFLEKSI
</div>
<p><b>A. Refleksi Pendidik</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Pertanyaan refleksi kritis 1 untuk guru]</li>
  <li>[Pertanyaan refleksi kritis 2 untuk guru]</li>
</ol>
<p><b>B. Refleksi Peserta Didik</b></p>
<ol style="margin-bottom: 8px;">
  <li>[Pertanyaan refleksi 1 untuk siswa]</li>
  <li>[Pertanyaan refleksi 2 untuk siswa]</li>
</ol>

<div style="display: flex; justify-content: space-between; margin-top: 30px; margin-bottom: 20px; text-align: center; padding: 0 20px; page-break-inside: avoid;">
  <div>
    <p style="margin: 0;">Mengetahui,</p>
    <p style="margin: 0;"><b>Kepala ${data.school}</b></p>
    <div style="height: 120px;"></div>
    <p style="text-decoration: underline; font-weight: bold; margin: 0;">${data.headmaster || '_____________________'}</p>
    <p style="margin: 0;">NIP. ${data.headmasterNip || '__________________'}</p>
  </div>
  <div>
    <p style="margin: 0;">Palembang, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
    <p style="margin: 0;"><b>Guru Mata Pelajaran</b></p>
    <div style="height: 120px;"></div>
    <p style="text-decoration: underline; font-weight: bold; margin: 0;">${data.teacher}</p>
    <p style="margin: 0;">NIP. ${data.teacherNip || '__________________'}</p>
  </div>
</div>

<div style="page-break-before: always; margin-top: 40px;"></div>
<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 1: Lembar Kerja Peserta Didik (LKPD)
</div>
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 8px;">
  <p style="text-align: center; font-weight: bold; font-size: 1.1em; margin-bottom: 8px;">LEMBAR KERJA PESERTA DIDIK (LKPD)</p>
  <p><b>Topik:</b> ${data.topic}</p>
  <p><b>Tujuan:</b> [Tuliskan tujuan LKPD]</p>
  <p><b>Instruksi Kerja:</b></p>
  <ol style="margin-bottom: 8px;">
    <li>[Instruksi 1]</li>
    <li>[Instruksi 2]</li>
    <li>[Instruksi 3]</li>
  </ol>
  <p><b>Tugas:</b></p>
  <p>[Uraikan tugas/soal/aktivitas yang harus dikerjakan siswa secara mendetail]</p>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 2: Instrumen Asesmen dan Rubrik
</div>
[GANTI BAGIAN INI DENGAN INSTRUMEN ASESMEN YANG SANGAT LENGKAP SESUAI INSTRUKSI!
- Tuliskan soal Asesmen Diagnostik.
- Tuliskan Rubrik/Soal Asesmen Formatif untuk MASING-MASING pertemuan (Pertemuan 1, Pertemuan 2, dst).
- Tuliskan Asesmen Sumatif (TOTAL ${data.meetingCount * 10} SOAL, yaitu 10 Soal per Pertemuan). UNTUK SOAL PILIHAN GANDA: Pastikan penomoran soal menggunakan tag <ol> atau format "1. " yang jelas agar angkanya muncul. Opsi jawaban (A, B, C, D) WAJIB disusun menurun (vertikal) per baris (misal menggunakan <ol type="A">), JANGAN dicampur menyamping dari kiri ke kanan. Jika ingin menyamping, WAJIB dibungkus dalam tag <table> agar rapi. WAJIB sertakan KUNCI JAWABAN (dicetak tebal) dengan jelas di bagian akhir daftar soal pilihan ganda.
Gunakan tag HTML seperti <b>, <p>, <ul>, <ol>, <table> untuk menatanya agar rapi. PASTIKAN SEMUA <table> memiliki <div style="overflow-x: auto;"> di luarnya agar responsif!]

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 3: Bahan Bacaan / Materi Pengayaan
</div>
<div style="border: 1px solid #000; padding: 15px; margin-bottom: 8px;">
  <p>[Tuliskan ringkasan materi singkat atau tautan sumber belajar tambahan untuk guru/siswa]</p>
</div>

<div style="background-color: #1a4185; color: white; padding: 4px 8px; font-weight: bold; margin-top: 10px; margin-bottom: 6px; border-radius: 4px 4px 0 0; font-family: 'IBM Plex Sans', sans-serif;">
  Lampiran 4: Jurnal Refleksi Diri
</div>
<table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
  <tr>
    <td style="padding: 15px; text-align: center; font-style: italic;">
      [Buat kotak isian / skala emotikon / pertanyaan singkat agar siswa bisa menuliskan refleksinya]
    </td>
  </tr>
</table>

</div>
`;

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          if (provider === 'gemini') {
            const ai = new GoogleGenAI({ apiKey: keyToUse });
            const responseStream = await ai.models.generateContentStream({
              model: 'gemini-3.6-flash',
              contents: prompt,
            });
            for await (const chunk of responseStream) {
              if (chunk.text) {
                controller.enqueue(encoder.encode(chunk.text));
              }
            }
          } else if (provider === 'anthropic') {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': keyToUse,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
                'anthropic-dangerous-direct-browser-access': 'true'
              },
              body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4000,
                messages: [{ role: 'user', content: prompt }],
                stream: true
              })
            });
            
            if (!response.ok) {
              const text = await response.text();
              throw new Error(`Anthropic API error: ${text}`);
            }
            
            const reader = response.body?.getReader();
            if (reader) {
              const decoder = new TextDecoder();
              let buffer = '';
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                  if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                      const data = JSON.parse(line.slice(6));
                      if (data.type === 'content_block_delta' && data.delta?.text) {
                        controller.enqueue(encoder.encode(data.delta.text));
                      }
                    } catch (e) {}
                  }
                }
              }
            }
          } else {
            // OpenAI-compatible providers (Groq, OpenAI, Deepseek, Odysseus, Grok, Qwen)
            let baseURL = undefined;
            let modelName = '';
            
            if (provider === 'groq') {
              baseURL = 'https://api.groq.com/openai/v1';
              modelName = 'llama-3.3-70b-versatile';
            } else if (provider === 'openai') {
              modelName = 'gpt-4o-mini';
            } else if (provider === 'deepseek') {
              baseURL = 'https://api.deepseek.com/v1';
              modelName = 'deepseek-chat';
            } else if (provider === 'odysseus') {
              baseURL = 'https://api.odysseus.ai/v1';
              modelName = 'odysseus-model';
            } else if (provider === 'grok') {
              baseURL = 'https://api.x.ai/v1';
              modelName = 'grok-2-latest';
            } else if (provider === 'qwen') {
              baseURL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';
              modelName = 'qwen-plus';
            }
            
            const openai = new OpenAI({ apiKey: keyToUse, baseURL });
            const response = await openai.chat.completions.create({
              model: modelName,
              messages: [{ role: 'user', content: prompt }],
              stream: true
            });
            
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            }
          }
          
          controller.close();
        } catch (error: any) {
          console.error('Streaming error:', error);
          controller.enqueue(encoder.encode(`\n\n[ERROR] ${error.message || 'Unknown error'}`));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache, no-transform'
      }
    });
  } catch (error: any) {
    console.error('Error generating RPM:', error);
    const errorMessage = 'Gagal membuat RPM. Silakan coba lagi. Detail: ' + (error.message || 'Unknown error');
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
