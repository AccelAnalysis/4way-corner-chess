import { ImageResponse } from 'next/og';
import React from 'react';

export const runtime = 'nodejs';

export async function GET(_request, { params }) {
  const size = Number(String(params.size || '').replace(/\.png$/, ''));
  if (![180, 192, 512].includes(size)) return new Response('Not found', { status: 404 });
  const outer = Math.round(size * 0.1);
  return new ImageResponse(
    React.createElement('div', {
      style: {
        display: 'flex', width: '100%', height: '100%', position: 'relative',
        alignItems: 'center', justifyContent: 'center',
        background: '#f5e1b7', borderRadius: Math.round(size * .19),
        color: '#4c2e1d',
      },
    },
      React.createElement('div', { style: {
        display: 'flex', position: 'absolute', inset: outer,
        border: Math.max(4, Math.round(size*.018)) + 'px solid #a46f3b',
        borderRadius: Math.round(size*.1),
        alignItems: 'center', justifyContent: 'center',
      } },
        React.createElement('div', { style: { display: 'flex', fontSize: Math.round(size * .59), fontWeight: 800, lineHeight: 1, color: '#51301e' } }, 'K')
      )
    ),
    { width: size, height: size }
  );
}
