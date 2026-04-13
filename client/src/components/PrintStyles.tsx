export function PrintStyles() {
  return (
    <style>{`
      @media print {
        @page {
          size: A4;
          margin: 0.5in;
        }

        html, body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }

        body {
          background: white !important;
          color: black !important;
          font-size: 12pt !important;
          line-height: 1.4 !important;
        }

        * {
          box-shadow: none !important;
          text-shadow: none !important;
        }

        nav,
        header,
        footer,
        .sidebar,
        .mobile-nav,
        [data-testid="sidebar"],
        [data-testid="mobile-nav"],
        [data-testid="notification-bell"],
        [data-testid="button-sidebar-toggle"],
        .print\\:hidden {
          display: none !important;
          visibility: hidden !important;
        }

        main {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
        }

        .print\\:block {
          display: block !important;
        }

        .print\\:bg-white {
          background: white !important;
        }

        .print\\:text-black {
          color: black !important;
        }

        .print\\:border-gray-300 {
          border-color: #d1d5db !important;
        }

        .print\\:shadow-none {
          box-shadow: none !important;
        }

        .print\\:break-before-page {
          page-break-before: always !important;
          break-before: page !important;
        }

        .print\\:break-after-page {
          page-break-after: always !important;
          break-after: page !important;
        }

        .print\\:break-inside-avoid {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
        }

        [data-testid="report-card-container"] {
          position: absolute !important;
          left: 0 !important;
          top: 0 !important;
          width: 100% !important;
          background: white !important;
        }

        [data-testid="report-card-container"] * {
          visibility: visible !important;
        }

        .report-card-section {
          page-break-inside: avoid !important;
          break-inside: avoid !important;
          margin-bottom: 1rem !important;
          background: white !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 0.5rem !important;
          padding: 1rem !important;
        }

        .report-card-header {
          background: white !important;
          border-bottom: 2px solid #374151 !important;
          padding-bottom: 1rem !important;
          margin-bottom: 1rem !important;
        }

        .report-card-stat {
          background: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          padding: 0.75rem !important;
          text-align: center !important;
        }

        h1, h2, h3, h4, h5, h6 {
          color: black !important;
          page-break-after: avoid !important;
        }

        .text-primary {
          color: #ea580c !important;
        }

        .bg-primary {
          background: #ea580c !important;
          color: white !important;
        }

        .text-muted-foreground {
          color: #6b7280 !important;
        }

        img {
          max-width: 100% !important;
          page-break-inside: avoid !important;
        }

        a {
          color: black !important;
          text-decoration: none !important;
        }

        a[href]::after {
          content: none !important;
        }

        table {
          border-collapse: collapse !important;
          width: 100% !important;
        }

        th, td {
          border: 1px solid #d1d5db !important;
          padding: 0.5rem !important;
          text-align: left !important;
        }

        th {
          background: #f3f4f6 !important;
          font-weight: 600 !important;
        }

        .grade-badge {
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.25rem !important;
          font-weight: 600 !important;
        }

        .grade-a { background: #22c55e !important; color: white !important; }
        .grade-b { background: #3b82f6 !important; color: white !important; }
        .grade-c { background: #eab308 !important; color: black !important; }
        .grade-d { background: #ef4444 !important; color: white !important; }
        .grade-f { background: #ef4444 !important; color: white !important; }

        .progress-bar {
          background: #e5e7eb !important;
          border-radius: 0.25rem !important;
          overflow: hidden !important;
        }

        .progress-bar-fill {
          background: #ea580c !important;
          height: 0.5rem !important;
        }
      }
    `}</style>
  );
}
