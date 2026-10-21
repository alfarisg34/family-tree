---
name: playwright-browser
description: >-
  Automate browser actions, web testing, page inspection, scraping, and screenshot capture using Playwright scripts via Node.js/terminal. Use this skill whenever browser automation is needed instead of the built-in browser_subagent tool.
---

# Playwright Browser Automation Skill

Skill ini memandu seluruh proses otomasi browser, scraping, verifikasi visual UI, dan pengujian berbasis web menggunakan **Playwright** via script **Node.js** yang dijalankan melalui terminal (`run_command`), sebagai pengganti penuh dari tool bawaan `browser_subagent`.

---

## 1. Aturan Wajib (Hard Constraint)

> ⛔ **DILARANG MENGGUNAKAN `browser_subagent`**:
> Jangan pernah memanggil tool `browser_subagent` bawaan. Setiap kali diperlukan interaksi dengan peramban web (buka URL, screenshot, klik tombol, isi form, inspeksi DOM, ekstraksi teks, testing), **WAJIB** membuat atau mengeksekusi script Playwright dengan Node.js via terminal (`run_command`).

---

## 2. Struktur & Lingkungan Playwright

Playwright telah terinstal di workspace root (`c:\Me\Code\rekaptukin\package.json`) beserta binary Chromium.

- **Lokasi script sementara/adhoc**: `scratch/playwright/<nama_script>.mjs` (atau langsung di `scratch/`)
- **Lokasi script reusable**: `.agents/skills/playwright-browser/scripts/`
- **Cara eksekusi**:
  ```powershell
  node scratch/playwright/<nama_script>.mjs
  ```
  atau
  ```powershell
  npx playwright test
  ```

---

## 3. Template Standar Script Playwright (ESM `.mjs`)

Gunakan ekstensi `.mjs` agar dapat menggunakan sintaks modern `import`:

### A. Pola Dasar: Navigasi & Ambil Konten / Evaluasi
```javascript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    headless: true, // Ubah false jika ingin debugging visual langsung
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  const page = await context.newPage();

  try {
    console.log('Navigating to target...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    const title = await page.title();
    console.log(`Page title: ${title}`);

    // Contoh interaksi / ekstraksi data
    const heading = await page.textContent('h1');
    console.log(`Main heading: ${heading}`);

  } catch (error) {
    console.error('Error during automation:', error);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
```

---

### B. Pola Tangkapan Layar (Screenshot Capture)
```javascript
import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Simpan screenshot ke path yang ditentukan
    const outputPath = path.resolve('./scratch/screenshot.png');
    await page.screenshot({ path: outputPath, fullPage: true });
    console.log(`Screenshot saved to: ${outputPath}`);
  } finally {
    await browser.close();
  }
})();
```

---

### C. Pola Interaksi Form & Klik Elemen
```javascript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000/login', { waitUntil: 'domcontentloaded' });

    // Mengisi form input
    await page.fill('input[type="text"]', 'admin');
    await page.fill('input[type="password"]', 'password123');

    // Klik tombol submit dan tunggu navigasi
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      page.click('button[type="submit"]')
    ]);

    console.log('Login form submitted. Current URL:', page.url());
  } finally {
    await browser.close();
  }
})();
```

---

### D. Pola Menunggu Elemen & Scraping Data
```javascript
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    
    // Tunggu selector tertentu muncul
    await page.waitForSelector('.data-table', { timeout: 10000 });

    // Ekstraksi data list
    const items = await page.$$eval('.data-table tr', rows => {
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
        return cells;
      });
    });

    console.log('Extracted items:', JSON.stringify(items, null, 2));
  } finally {
    await browser.close();
  }
})();
```

---

## 4. Prosedur Kerja Eksekusi Automasi

Ketika pengguna meminta untuk menjalankan browser atau melakukan otomasi:

1. **Buat Script Playwright**:
   Tulis file script di direktori `scratch/` (misal `scratch/run-browser-task.mjs`) menggunakan tool `write_to_file`.
2. **Jalankan via Terminal**:
   Panggil tool `run_command`:
   ```powershell
   node scratch/run-browser-task.mjs
   ```
3. **Periksa Output**:
   Baca hasil stdout / stderr / screenshot yang dihasilkan script.
4. **Bersihkan atau Dokumentasikan Hasil**:
   Laporkan hasil automasi secara ringkas dan informatif kepada pengguna.
