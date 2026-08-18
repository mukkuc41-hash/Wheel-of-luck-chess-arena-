import React from 'react';

export interface PieceProps {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
  className?: string;
}

/**
 * Authentic Chess.com Neo vector chess piece renderer.
 * Matched precisely to the Chess.com official piece appearance:
 * - White pieces: crisp brilliant ivory/white (#ffffff) with bold charcoal contour outlines (#272522)
 * - Black pieces: matte slate charcoal (#454341) with dark contours (#1c1a18) and high-visibility white specular highlights (#ffffff)
 */
export const ChessPiece: React.FC<PieceProps> = React.memo(({ type, color, className = 'w-full h-full p-0.5' }) => {
  const isWhite = color === 'w';

  const renderPieceSvg = () => {
    if (isWhite) {
      switch (type) {
        // WHITE PAWN
        case 'p':
          return (
            <g
              fill="#ffffff"
              stroke="#272522"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Pedestal Base */}
              <path
                d="M 10 39.5 C 10 36.5 13.5 34.5 22.5 34.5 C 31.5 34.5 35 36.5 35 39.5 Z"
                fill="#ffffff"
              />
              <path d="M 12 36.5 C 15.5 35.5 29.5 35.5 33 36.5" stroke="#272522" strokeWidth="1.6" fill="none" />
              {/* Conical Stem */}
              <path
                d="M 16.8 22 C 16.8 27 14 31.5 13 34.5 L 32 34.5 C 31 31.5 28.2 27 28.2 22 Z"
                fill="#ffffff"
              />
              {/* Collar Ring */}
              <path
                d="M 16 22 C 16 20.8 18.5 19.8 22.5 19.8 C 26.5 19.8 29 20.8 29 22 C 29 23.2 26.5 24.2 22.5 24.2 C 18.5 24.2 16 23.2 16 22 Z"
                fill="#ffffff"
              />
              {/* Spherical Head */}
              <circle cx="22.5" cy="12.5" r="6" fill="#ffffff" />
              {/* Soft specular sheen */}
              <path
                d="M 19.5 9.5 C 20.5 8.8 22 8.5 23.5 8.5"
                stroke="#d1d5db"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
              />
            </g>
          );

        // WHITE KNIGHT
        case 'n':
          return (
            <g
              fill="#ffffff"
              stroke="#272522"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 10 39.5 C 10 37 13 35.5 22.5 35.5 C 32 35.5 35 37 35 39.5 Z"
                fill="#ffffff"
              />
              {/* Main Knight Body & Mane */}
              <path
                d="M 13.5 35.5 C 13.5 31.5 14 27.5 17 24.5 C 16.2 24.8 14.5 25.2 13 25 C 10.5 24.6 9 22.8 9.5 20.5 C 10 18.2 12.2 16.5 14.5 14.5 C 15.8 13.2 17 11.2 17.5 8.5 C 18 8 19 8.2 19.5 9.5 C 20 10.5 20.5 11.5 22.5 11 C 24 10.5 24.5 8.5 25.5 8.5 C 26.2 8.5 26.8 9.5 27 10.8 C 28.5 10.5 29.5 9.5 30.5 9.5 C 31.5 9.5 32 10.8 32 12.5 C 32.5 15.5 33.5 18 35.5 22 C 37 25 36.5 30 35 35.5 Z"
                fill="#ffffff"
              />
              {/* Snout, Jaw & Nostril Cut */}
              <path
                d="M 10 20.5 C 11.5 22 14 22 17 20"
                stroke="#272522"
                strokeWidth="1.6"
                fill="none"
              />
              <path
                d="M 19 16 C 18 19.5 16 22 14.5 23"
                stroke="#272522"
                strokeWidth="1.5"
                fill="none"
              />
              {/* Expressive Eye */}
              <circle cx="15.5" cy="14.5" r="1.5" fill="#272522" stroke="none" />
              {/* Mane Notch Accents */}
              <path
                d="M 23.5 14.5 C 25.5 17 27 20 27 24.5"
                stroke="#272522"
                strokeWidth="1.5"
                fill="none"
              />
            </g>
          );

        // WHITE BISHOP
        case 'b':
          return (
            <g
              fill="#ffffff"
              stroke="#272522"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 10 39.5 C 10 36.8 13.5 35 22.5 35 C 31.5 35 35 36.8 35 39.5 Z"
                fill="#ffffff"
              />
              <path d="M 12.5 37 C 16 36 29 36 32.5 37" stroke="#272522" strokeWidth="1.5" fill="none" />
              {/* Lower Body */}
              <path
                d="M 14 35 C 14 31 16.5 28 17.5 24.5 L 27.5 24.5 C 28.5 28 31 31 31 35 Z"
                fill="#ffffff"
              />
              {/* Collar Band */}
              <path
                d="M 16 24.5 C 16 23.2 18.5 22.2 22.5 22.2 C 26.5 22.2 29 23.2 29 24.5 C 29 25.8 26.5 26.8 22.5 26.8 C 18.5 26.8 16 25.8 16 24.5 Z"
                fill="#ffffff"
              />
              {/* Mitre Teardrop Dome */}
              <path
                d="M 15 23 C 14 18 17 12 22.5 9.5 C 28 12 31 18 30 23 C 28 24.5 17 24.5 15 23 Z"
                fill="#ffffff"
              />
              {/* Diagonal Cross Cut / Slit */}
              <path
                d="M 21.5 13 L 26.5 18"
                stroke="#272522"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Top Sphere Finial */}
              <circle cx="22.5" cy="7.5" r="2.2" fill="#ffffff" />
            </g>
          );

        // WHITE ROOK
        case 'r':
          return (
            <g
              fill="#ffffff"
              stroke="#272522"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 9.5 39.5 L 35.5 39.5 L 35.5 36 C 33.5 34.5 31.5 34 22.5 34 C 13.5 34 11.5 34.5 9.5 36 Z"
                fill="#ffffff"
              />
              <path d="M 11.5 36.5 L 33.5 36.5" stroke="#272522" strokeWidth="1.5" fill="none" />
              {/* Tower Body */}
              <path
                d="M 13.5 34 L 14.5 16.5 L 30.5 16.5 L 31.5 34 Z"
                fill="#ffffff"
              />
              {/* Cornice Shelf */}
              <path
                d="M 11 16.5 L 34 16.5 L 34 14 L 11 14 Z"
                fill="#ffffff"
              />
              {/* Battlements (3 Crenels) */}
              <path
                d="M 11 14 L 11 8.5 L 15.5 8.5 L 15.5 11.5 L 20 11.5 L 20 8.5 L 25 8.5 L 25 11.5 L 29.5 11.5 L 29.5 8.5 L 34 8.5 L 34 14 Z"
                fill="#ffffff"
              />
            </g>
          );

        // WHITE QUEEN
        case 'q':
          return (
            <g
              fill="#ffffff"
              stroke="#272522"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z"
                fill="#ffffff"
              />
              <path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#272522" strokeWidth="1.5" fill="none" />
              {/* Flared Lower Robe */}
              <path
                d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z"
                fill="#ffffff"
              />
              {/* Waist Band */}
              <path
                d="M 15.5 24 C 15.5 22.8 18 21.8 22.5 21.8 C 27 21.8 29.5 22.8 29.5 24 C 29.5 25.2 27 26.2 22.5 26.2 C 18 26.2 15.5 25.2 15.5 24 Z"
                fill="#ffffff"
              />
              {/* Coronet Crown with 5 Radiating Points */}
              <path
                d="M 12 22.5 L 7.5 13.5 L 14.5 19 L 14.5 10 L 20 18 L 22.5 8.5 L 25 18 L 30.5 10 L 30.5 19 L 37.5 13.5 L 33 22.5 Z"
                fill="#ffffff"
              />
              {/* 5 Pearl Spheres on Crown Spikes */}
              <circle cx="7.5" cy="13.5" r="1.8" fill="#ffffff" />
              <circle cx="14.5" cy="10" r="1.8" fill="#ffffff" />
              <circle cx="22.5" cy="8.5" r="2" fill="#ffffff" />
              <circle cx="30.5" cy="10" r="1.8" fill="#ffffff" />
              <circle cx="37.5" cy="13.5" r="1.8" fill="#ffffff" />
            </g>
          );

        // WHITE KING
        case 'k':
          return (
            <g
              fill="#ffffff"
              stroke="#272522"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z"
                fill="#ffffff"
              />
              <path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#272522" strokeWidth="1.5" fill="none" />
              {/* Lower Body */}
              <path
                d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z"
                fill="#ffffff"
              />
              {/* Waist Collar */}
              <path
                d="M 15 24 C 15 22.8 18 21.8 22.5 21.8 C 27 21.8 30 22.8 30 24 C 30 25.2 27 26.2 22.5 26.2 C 18 26.2 15 25.2 15 24 Z"
                fill="#ffffff"
              />
              {/* Imperial Crown Arches */}
              <path
                d="M 14 22 C 12 18 15 13 22.5 13 C 30 13 33 18 31 22 Z"
                fill="#ffffff"
              />
              <path
                d="M 22.5 13 L 22.5 22"
                stroke="#272522"
                strokeWidth="1.5"
              />
              {/* Finial Cross on Top */}
              <path
                d="M 22.5 5.5 L 22.5 13 M 19 8.5 L 26 8.5"
                stroke="#272522"
                strokeWidth="2.2"
                strokeLinecap="square"
              />
            </g>
          );
      }
    } else {
      // -------------------------------------------------------------
      // BLACK PIECES (Matte Slate Charcoal #454341 with Dark Contours)
      // -------------------------------------------------------------
      switch (type) {
        // BLACK PAWN
        case 'p':
          return (
            <g
              fill="#454341"
              stroke="#1c1a18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 10 39.5 C 10 36.5 13.5 34.5 22.5 34.5 C 31.5 34.5 35 36.5 35 39.5 Z"
                fill="#454341"
              />
              <path d="M 12 36.5 C 15.5 35.5 29.5 35.5 33 36.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" fill="none" />
              {/* Stem */}
              <path
                d="M 16.8 22 C 16.8 27 14 31.5 13 34.5 L 32 34.5 C 31 31.5 28.2 27 28.2 22 Z"
                fill="#454341"
              />
              {/* Collar */}
              <path
                d="M 16 22 C 16 20.8 18.5 19.8 22.5 19.8 C 26.5 19.8 29 20.8 29 22 C 29 23.2 26.5 24.2 22.5 24.2 C 18.5 24.2 16 23.2 16 22 Z"
                fill="#454341"
              />
              {/* Head */}
              <circle cx="22.5" cy="12.5" r="6" fill="#454341" />
              {/* Specular White Highlight Arc */}
              <path
                d="M 19.5 9.5 C 20.5 8.8 22 8.5 23.5 8.5"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeOpacity="0.55"
                fill="none"
              />
            </g>
          );

        // BLACK KNIGHT
        case 'n':
          return (
            <g
              fill="#454341"
              stroke="#1c1a18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 10 39.5 C 10 37 13 35.5 22.5 35.5 C 32 35.5 35 37 35 39.5 Z"
                fill="#454341"
              />
              {/* Main Knight Body */}
              <path
                d="M 13.5 35.5 C 13.5 31.5 14 27.5 17 24.5 C 16.2 24.8 14.5 25.2 13 25 C 10.5 24.6 9 22.8 9.5 20.5 C 10 18.2 12.2 16.5 14.5 14.5 C 15.8 13.2 17 11.2 17.5 8.5 C 18 8 19 8.2 19.5 9.5 C 20 10.5 20.5 11.5 22.5 11 C 24 10.5 24.5 8.5 25.5 8.5 C 26.2 8.5 26.8 9.5 27 10.8 C 28.5 10.5 29.5 9.5 30.5 9.5 C 31.5 9.5 32 10.8 32 12.5 C 32.5 15.5 33.5 18 35.5 22 C 37 25 36.5 30 35 35.5 Z"
                fill="#454341"
              />
              {/* Snout / Nostril Accent */}
              <path
                d="M 10 20.5 C 11.5 22 14 22 17 20"
                stroke="#1c1a18"
                strokeWidth="1.6"
                fill="none"
              />
              <path
                d="M 19 16 C 18 19.5 16 22 14.5 23"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeOpacity="0.45"
                fill="none"
              />
              {/* White Pupil / Eye Glow */}
              <circle cx="15.5" cy="14.5" r="1.5" fill="#ffffff" stroke="none" />
              {/* Mane Definition Arc */}
              <path
                d="M 23.5 14.5 C 25.5 17 27 20 27 24.5"
                stroke="#ffffff"
                strokeWidth="1.2"
                strokeOpacity="0.45"
                fill="none"
              />
            </g>
          );

        // BLACK BISHOP
        case 'b':
          return (
            <g
              fill="#454341"
              stroke="#1c1a18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 10 39.5 C 10 36.8 13.5 35 22.5 35 C 31.5 35 35 36.8 35 39.5 Z"
                fill="#454341"
              />
              <path d="M 12.5 37 C 16 36 29 36 32.5 37" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" fill="none" />
              {/* Lower Body */}
              <path
                d="M 14 35 C 14 31 16.5 28 17.5 24.5 L 27.5 24.5 C 28.5 28 31 31 31 35 Z"
                fill="#454341"
              />
              {/* Collar */}
              <path
                d="M 16 24.5 C 16 23.2 18.5 22.2 22.5 22.2 C 26.5 22.2 29 23.2 29 24.5 C 29 25.8 26.5 26.8 22.5 26.8 C 18.5 26.8 16 25.8 16 24.5 Z"
                fill="#454341"
              />
              {/* Mitre Teardrop Dome */}
              <path
                d="M 15 23 C 14 18 17 12 22.5 9.5 C 28 12 31 18 30 23 C 28 24.5 17 24.5 15 23 Z"
                fill="#454341"
              />
              {/* High Contrast White Cross Cut / Slit */}
              <path
                d="M 21.5 13 L 26.5 18"
                stroke="#ffffff"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.9"
              />
              {/* Top Sphere Finial */}
              <circle cx="22.5" cy="7.5" r="2.2" fill="#454341" />
            </g>
          );

        // BLACK ROOK
        case 'r':
          return (
            <g
              fill="#454341"
              stroke="#1c1a18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 9.5 39.5 L 35.5 39.5 L 35.5 36 C 33.5 34.5 31.5 34 22.5 34 C 13.5 34 11.5 34.5 9.5 36 Z"
                fill="#454341"
              />
              <path d="M 11.5 36.5 L 33.5 36.5" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" fill="none" />
              {/* Tower Body */}
              <path
                d="M 13.5 34 L 14.5 16.5 L 30.5 16.5 L 31.5 34 Z"
                fill="#454341"
              />
              {/* Cornice */}
              <path
                d="M 11 16.5 L 34 16.5 L 34 14 L 11 14 Z"
                fill="#454341"
              />
              {/* Battlements (3 Crenels) */}
              <path
                d="M 11 14 L 11 8.5 L 15.5 8.5 L 15.5 11.5 L 20 11.5 L 20 8.5 L 25 8.5 L 25 11.5 L 29.5 11.5 L 29.5 8.5 L 34 8.5 L 34 14 Z"
                fill="#454341"
              />
            </g>
          );

        // BLACK QUEEN
        case 'q':
          return (
            <g
              fill="#454341"
              stroke="#1c1a18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z"
                fill="#454341"
              />
              <path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" fill="none" />
              {/* Flared Lower Robe */}
              <path
                d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z"
                fill="#454341"
              />
              {/* Waist Band */}
              <path
                d="M 15.5 24 C 15.5 22.8 18 21.8 22.5 21.8 C 27 21.8 29.5 22.8 29.5 24 C 29.5 25.2 27 26.2 22.5 26.2 C 18 26.2 15.5 25.2 15.5 24 Z"
                fill="#454341"
              />
              {/* Coronet Crown with 5 Radiating Points */}
              <path
                d="M 12 22.5 L 7.5 13.5 L 14.5 19 L 14.5 10 L 20 18 L 22.5 8.5 L 25 18 L 30.5 10 L 30.5 19 L 37.5 13.5 L 33 22.5 Z"
                fill="#454341"
              />
              {/* 5 Pearl Spheres */}
              <circle cx="7.5" cy="13.5" r="1.8" fill="#454341" stroke="#1c1a18" strokeWidth="1.5" />
              <circle cx="14.5" cy="10" r="1.8" fill="#454341" stroke="#1c1a18" strokeWidth="1.5" />
              <circle cx="22.5" cy="8.5" r="2" fill="#454341" stroke="#1c1a18" strokeWidth="1.5" />
              <circle cx="30.5" cy="10" r="1.8" fill="#454341" stroke="#1c1a18" strokeWidth="1.5" />
              <circle cx="37.5" cy="13.5" r="1.8" fill="#454341" stroke="#1c1a18" strokeWidth="1.5" />
              {/* Specular Center Pearl Dots */}
              <circle cx="22.5" cy="8.5" r="0.8" fill="#ffffff" stroke="none" />
            </g>
          );

        // BLACK KING
        case 'k':
          return (
            <g
              fill="#454341"
              stroke="#1c1a18"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Base */}
              <path
                d="M 9 39.5 C 9 36.5 13 34.8 22.5 34.8 C 32 34.8 36 36.5 36 39.5 Z"
                fill="#454341"
              />
              <path d="M 11.5 37 C 15.5 36 29.5 36 33.5 37" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" fill="none" />
              {/* Lower Body */}
              <path
                d="M 13.5 34.8 C 13.5 30 16 26.5 17 24 L 28 24 C 29 26.5 31.5 30 31.5 34.8 Z"
                fill="#454341"
              />
              {/* Waist Collar */}
              <path
                d="M 15 24 C 15 22.8 18 21.8 22.5 21.8 C 27 21.8 30 22.8 30 24 C 30 25.2 27 26.2 22.5 26.2 C 18 26.2 15 25.2 15 24 Z"
                fill="#454341"
              />
              {/* Imperial Crown Arches */}
              <path
                d="M 14 22 C 12 18 15 13 22.5 13 C 30 13 33 18 31 22 Z"
                fill="#454341"
              />
              <path
                d="M 22.5 13 L 22.5 22"
                stroke="#1c1a18"
                strokeWidth="1.5"
              />
              {/* Finial Cross on Top with White High Contrast Accents */}
              <path
                d="M 22.5 5.5 L 22.5 13 M 19 8.5 L 26 8.5"
                stroke="#ffffff"
                strokeWidth="2.2"
                strokeLinecap="square"
              />
            </g>
          );
      }
    }
  };

  return (
    <svg
      viewBox="0 0 45 45"
      className={`${className} select-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-transform duration-150`}
      aria-label={`${isWhite ? 'White' : 'Black'} ${type}`}
    >
      {renderPieceSvg()}
    </svg>
  );
});
