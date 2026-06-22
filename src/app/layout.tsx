import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'DairyFlow — Dairy Farm Management System',
  description:
    'Comprehensive dairy farm management tool for tracking herd, milk production, sales, expenses, and profitability.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1B5E20',
              color: '#fff',
              borderRadius: '10px',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              style: {
                background: '#1B5E20',
              },
              iconTheme: {
                primary: '#A5D6A7',
                secondary: '#1B5E20',
              },
            },
            error: {
              style: {
                background: '#991B1B',
              },
              iconTheme: {
                primary: '#FCA5A5',
                secondary: '#991B1B',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
