import { useId } from "react";

/**
 * Ikon kepala robot chibi (SVG) — sesuai model 3D: armor putih mutiara,
 * mahkota & ear pods berwarna aksen, wajah gelap dengan mata amber menyala.
 */
export default function RobotIcon({
  accent,
  size = 32,
  className = "",
}: {
  accent: string;
  size?: number;
  className?: string;
}) {
  const clipId = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="8" y="12" width="48" height="44" rx="15" />
        </clipPath>
      </defs>

      {/* antena */}
      <rect x="30.4" y="1.6" width="3.2" height="8" rx="1.6" fill="#3a3f4b" />
      <circle cx="32" cy="4.2" r="3.6" fill={accent} />
      <circle cx="32" cy="4.2" r="1.6" fill="#fff" opacity="0.75" />

      {/* sirip mahkota */}
      <path d="M17 15.5 L23 6.5 L27.6 15.5 Z" fill={accent} strokeLinejoin="round" />
      <path d="M47 15.5 L41 6.5 L36.4 15.5 Z" fill={accent} strokeLinejoin="round" />

      {/* ear pods berwarna aksen */}
      <rect x="1.5" y="27" width="10" height="16" rx="5" fill={accent} />
      <rect x="52.5" y="27" width="10" height="16" rx="5" fill={accent} />
      <rect x="4.5" y="30.5" width="4.8" height="9" rx="2.4" fill="#23262e" opacity="0.6" />
      <rect x="54.7" y="30.5" width="4.8" height="9" rx="2.4" fill="#23262e" opacity="0.6" />

      {/* kepala putih mutiara */}
      <rect x="8" y="12" width="48" height="44" rx="15" fill="#f8f6f0" stroke="#cfcabc" strokeWidth="1.6" />

      {/* pita mahkota aksen (ter-clip bentuk kepala) */}
      <g clipPath={`url(#${clipId})`}>
        <rect x="8" y="15.5" width="48" height="8.5" fill={accent} />
        <rect x="8" y="23.2" width="48" height="1.3" fill="#000" opacity="0.16" />
      </g>

      {/* pelat wajah gelap */}
      <rect x="16" y="29.5" width="32" height="19.5" rx="8.5" fill="#23262e" />

      {/* mata amber menyala + kilau */}
      <circle cx="25" cy="38.8" r="4.2" fill="#ffa726" />
      <circle cx="39" cy="38.8" r="4.2" fill="#ffa726" />
      <circle cx="26.4" cy="37.4" r="1.5" fill="#ffe3ac" />
      <circle cx="40.4" cy="37.4" r="1.5" fill="#ffe3ac" />

      {/* mulut LED */}
      <rect x="28.3" y="44.8" width="7.4" height="2" rx="1" fill="#ffa726" opacity="0.85" />

      {/* lampu dagu aksen */}
      <circle cx="32" cy="52.4" r="1.7" fill={accent} opacity="0.95" />
    </svg>
  );
}
