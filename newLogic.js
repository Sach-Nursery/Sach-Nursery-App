<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="theme-color" content="#059669" />
  <meta name="description" content="Sach Nursery ERP — Offline-First Nursery Management & Botanical Care Suite" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="apple-mobile-web-app-title" content="Sach Nursery ERP" />

  <title>Sach Nursery ERP</title>

  <!-- Favicon & Device Icons -->
  <link
    id="favicon-link"
    rel="icon"
    type="image/svg+xml"
    href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'%3E%3Cellipse cx='60' cy='70' rx='54' ry='64' fill='%23fefce8' stroke='%23ca8a04' stroke-width='5'/%3E%3Ccircle cx='60' cy='22' r='8' fill='%23f97316'/%3E%3Cpath d='M60 44c-16 0-26 11-26 23 0 10 9 17 20 17h12c11 0 20-7 20-17 0-12-10-23-26-23z' fill='%2315803d'/%3E%3Crect x='56' y='75' width='8' height='15' fill='%2378350f'/%3E%3Ctext x='60' y='106' font-family='sans-serif' font-weight='800' font-size='13.5' fill='%23065f46' text-anchor='middle'%3ESach Nursery%3C/text%3E%3C/svg%3E"
  />
  <link
    rel="apple-touch-icon"
    href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'%3E%3Cellipse cx='60' cy='70' rx='54' ry='64' fill='%23fefce8' stroke='%23ca8a04' stroke-width='5'/%3E%3Ccircle cx='60' cy='22' r='8' fill='%23f97316'/%3E%3Cpath d='M60 44c-16 0-26 11-26 23 0 10 9 17 20 17h12c11 0 20-7 20-17 0-12-10-23-26-23z' fill='%2315803d'/%3E%3Crect x='56' y='75' width='8' height='15' fill='%2378350f'/%3E%3C/svg%3E"
  />
  <link
    id="manifest-link"
    rel="manifest"
    href="data:application/manifest+json,%7B%22name%22%3A%22Sach%20Nursery%20ERP%22%2C%22short_name%22%3A%22SachNursery%22%2C%22start_url%22%3A%22.%22%2C%22display%22%3A%22standalone%22%2C%22background_color%22%3A%22%23fefce8%22%2C%22theme_color%22%3A%22%23059669%22%7D"
  />

  <!-- Global Font Links -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />

  <!-- Global Dynamic Theme Variables & Base Typography -->
  <style>
    :root {
      --accent-primary: #059669;
      --accent-secondary: #0f766e;
    }
    html, body {
      min-height: 100%;
      font-family: 'Plus Jakarta Sans', 'Noto Sans Devanagari', system-ui, -apple-system, sans-serif;
    }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.35); border-radius: 9999px; }
    @keyframes auroraShift {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    .bg-aurora { background-size: 220% 220%; animation: auroraShift 12s ease infinite; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body class="bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 antialiased selection:bg-emerald-500/20">
  <noscript>Please enable JavaScript to run Sach Nursery ERP.</noscript>

  <!-- Framework Mount Root -->
  <div id="root"></div>

  <!-- Modular ES Module Entry Point -->
  <script type="module" src="/src/ui/main.jsx"></script>
</body>
</html>
