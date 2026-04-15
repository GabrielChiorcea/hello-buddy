import React from 'react';

interface AninnimatedHourglassProps {
  className?: string;
  durationSeconds?: number;
}

export const AninnimatedHourglass: React.FC<AninnimatedHourglassProps> = ({
  className,
  durationSeconds = 1.2,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
    style={{
      transformOrigin: '50% 50%',
      animation: `aninnimated-hourglass-flip ${durationSeconds}s ease-in-out infinite`,
    }}
  >
    <style>
      {`
        @keyframes aninnimated-hourglass-flip {
          0%, 32% { transform: rotate(0deg); }
          45%, 55% { transform: rotate(180deg); }
          68%, 100% { transform: rotate(180deg); }
        }
      `}
    </style>
    <path d="M7 3h10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M7 21h10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path
      d="M8 3v2.5c0 1.9 1.1 3.7 2.8 4.6L12 10.8l1.2-.7A5.3 5.3 0 0 0 16 5.5V3"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 21v-2.5c0-1.9-1.1-3.7-2.8-4.6L12 13.2l-1.2.7A5.3 5.3 0 0 0 8 18.5V21"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M10.5 8.7h3" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M10 15.3h4" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
  </svg>
);
