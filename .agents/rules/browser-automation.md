# Browser Automation Rules

- **Dilarang keras menggunakan tool `browser_subagent` bawaan.**
- Semua kebutuhan otomasi peramban web (navigasi web, tangkapan layar/screenshot, testing web UI, scraping data, download file, verifikasi tampilan) **WAJIB** dikerjakan menggunakan script **Playwright** via terminal/Node.js (`run_command`).
- Script otomasi sementara dapat diletakkan di direktori `scratch/` (misalnya `scratch/test-browser.mjs`) atau memanfaatkan helper di `.agents/skills/playwright-browser/scripts/`.
- Selalu tangani penutupan browser secara bersih di blok `finally { await browser.close(); }`.
