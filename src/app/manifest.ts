import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DairyFlow',
    short_name: 'DairyFlow',
    description: 'Comprehensive Dairy Farm Management System',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#1B5E20',
    theme_color: '#1B5E20',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
