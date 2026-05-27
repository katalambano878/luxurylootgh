import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Luxury Loots GH — Premium Thrift · African Print · Accessories';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#0c0a09',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'flex-end',
          padding: '72px 80px',
          fontFamily: 'serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background ghost letter */}
        <div
          style={{
            position: 'absolute',
            right: '-40px',
            top: '-60px',
            fontSize: '520px',
            fontWeight: 900,
            color: 'rgba(255,255,255,0.03)',
            lineHeight: 1,
            fontStyle: 'italic',
            fontFamily: 'serif',
          }}
        >
          L
        </div>

        {/* Amber top accent line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(to right, transparent, #f59e0b, transparent)',
          }}
        />

        {/* Top label */}
        <div
          style={{
            position: 'absolute',
            top: '56px',
            left: '80px',
            fontSize: '13px',
            fontWeight: 900,
            letterSpacing: '0.5em',
            textTransform: 'uppercase',
            color: '#f59e0b',
            fontFamily: 'sans-serif',
          }}
        >
          Obuasi, Ghana
        </div>

        {/* Main heading */}
        <div
          style={{
            fontSize: '96px',
            fontWeight: 900,
            color: '#ffffff',
            lineHeight: 1,
            marginBottom: '24px',
            fontStyle: 'italic',
          }}
        >
          Luxury Loots GH
        </div>

        {/* Divider */}
        <div
          style={{
            width: '80px',
            height: '2px',
            background: '#f59e0b',
            marginBottom: '28px',
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: '28px',
            color: '#a8a29e',
            fontFamily: 'sans-serif',
            fontWeight: 400,
            letterSpacing: '0.05em',
            marginBottom: '48px',
          }}
        >
          Premium Thrift · African Print · Accessories
        </div>

        {/* URL pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '100px',
            padding: '10px 24px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#f59e0b',
            }}
          />
          <div
            style={{
              fontSize: '18px',
              color: '#78716c',
              fontFamily: 'sans-serif',
              letterSpacing: '0.05em',
            }}
          >
            luxurylootgh.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
