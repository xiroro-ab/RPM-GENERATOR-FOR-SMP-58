import twemoji from '@twemoji/api';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {}
    }

    const { html, filename, footerText } = body;
    if (!html) return res.status(400).json({ error: 'HTML is required' });

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600;700&family=Space+Grotesk:wght@400;500;600;700&family=Noto+Color+Emoji&display=swap" rel="stylesheet">
          
          <style>
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; font-family: 'Space Grotesk', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; text-align: justify; }
            h1, h2, h3, h4, h5, h6 { font-family: 'IBM Plex Sans', sans-serif !important; }
            img.emoji { height: 1em; width: 1em; margin: 0 .05em 0 .1em; vertical-align: -0.1em; }
            div[style*="background-color: #1a4185"] { font-family: 'IBM Plex Sans', sans-serif !important; }
            .kop-surat h3 { font-family: 'IBM Plex Sans', sans-serif !important; }
            .rpm-table th, .rpm-table td { text-align: left; } /* Reset table alignment to left if needed */
            table { page-break-inside: avoid; }
            tr, td, th { page-break-inside: avoid; }
            h1, h2, h3, h4, h5 { page-break-after: avoid; page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
          </style>
        </head>
        <body>${twemoji.parse(html)}</body>
      </html>`;

    // Important for Vercel: set the graphics mode and headless mode
    // sparticuz/chromium handles the path for AWS Lambda / Vercel Serverless automatically.
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: (chromium as any).defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: (chromium as any).headless,
      // ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0' as any });
    await page.evaluateHandle('document.fonts.ready');
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '20mm', left: '15mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `<div style="font-size: 8px; width: 100%; display: flex; justify-content: space-between; padding-left: 15mm; padding-right: 15mm; color: #666; font-family: sans-serif;"><span>${footerText || ''}</span><span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span></div>`
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename || 'document.pdf'}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    res.status(500).json({ error: 'Failed to generate PDF: ' + error.message });
  }
}
