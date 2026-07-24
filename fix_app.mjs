import fs from 'fs';
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  "      const json = await response.json();\n      if (!response.ok) {",
  `      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        if (!response.ok) {
          throw new Error(\`Server error (\${response.status}): \${text.substring(0, 100)}\`);
        } else {
          throw new Error('Respons dari server tidak valid (Kemungkinan Timeout dari Vercel). Silakan coba lagi.');
        }
      }
      if (!response.ok) {`
);

fs.writeFileSync('src/App.tsx', code);
console.log("Patched App.tsx");
