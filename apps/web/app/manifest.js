export default function manifest() {
  return {
    id: '/',
    name: 'KANI — Four-Way Chess',
    short_name: 'KANI',
    description: 'Capture the king. Command the army.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#f7f0e5',
    theme_color: '#f7f0e5',
    orientation: 'any',
    lang: 'en',
    categories: ['games', 'entertainment'],
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
