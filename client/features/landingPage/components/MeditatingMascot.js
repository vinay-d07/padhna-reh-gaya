export default function MeditatingMascot({ className = "" }) {
  return (
    <svg
      viewBox="0 0 240 260"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <style>{`
          .float-book-1 {
            animation: floatBook1 3s ease-in-out infinite;
            transform-origin: center;
          }

          .float-book-2 {
            animation: floatBook2 3.5s ease-in-out infinite;
            transform-origin: center;
          }

          .sparkle {
            animation: sparkle 2s ease-in-out infinite;
            transform-origin: center;
          }

          @keyframes floatBook1 {
            0%,100% {
              transform: translateY(0px) rotate(-15deg);
            }
            50% {
              transform: translateY(-6px) rotate(-8deg);
            }
          }

          @keyframes floatBook2 {
            0%,100% {
              transform: translateY(0px) rotate(15deg);
            }
            50% {
              transform: translateY(-8px) rotate(22deg);
            }
          }

          @keyframes sparkle {
            0%,100% {
              opacity: .6;
              transform: scale(1);
            }
            50% {
              opacity: 1;
              transform: scale(1.25);
            }
          }
        `}</style>
      </defs>
      <g transform="translate(-18 -18) scale(1.15)">
        {/* levitation rings */}
        <ellipse
          cx="120"
          cy="232"
          rx="72"
          ry="9"
          stroke="#c6c6c6"
          strokeWidth="3"
          opacity="0.6"
        />
        <ellipse
          cx="120"
          cy="218"
          rx="52"
          ry="7"
          stroke="#d1ffca"
          strokeWidth="3"
          opacity="0.8"
        />

        {/* floating books */}
        <g className="float-book-1">
          <g transform="translate(28 90) rotate(-15)">
            <rect
              width="26"
              height="18"
              rx="2"
              fill="#ffffff"
              stroke="#000"
              strokeWidth="3"
            />
            <line
              x1="13"
              y1="2"
              x2="13"
              y2="16"
              stroke="#000"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="6"
              x2="11"
              y2="6"
              stroke="#000"
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="6"
              x2="21"
              y2="6"
              stroke="#000"
              strokeWidth="2"
            />
          </g>
        </g>

        <g className="float-book-2">
          <g transform="translate(186 80) rotate(15)">
            <rect
              width="26"
              height="18"
              rx="2"
              fill="#ffffff"
              stroke="#000"
              strokeWidth="3"
            />
            <line
              x1="13"
              y1="2"
              x2="13"
              y2="16"
              stroke="#000"
              strokeWidth="2"
            />
            <line
              x1="5"
              y1="6"
              x2="11"
              y2="6"
              stroke="#000"
              strokeWidth="2"
            />
            <line
              x1="15"
              y1="6"
              x2="21"
              y2="6"
              stroke="#000"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* sparkles */}
        <circle className="sparkle" cx="48" cy="70" r="4" fill="#fff100" />
        <circle className="sparkle" cx="196" cy="58" r="5" fill="#d1ffca" />
        <path
          className="sparkle"
          d="M36 118 L40 122 L36 126 L32 122 Z"
          fill="#fff100"
        />
        <circle className="sparkle" cx="210" cy="120" r="3" fill="#fff100" />
        <circle className="sparkle" cx="22" cy="145" r="3" fill="#d1ffca" />

        {/* crossed legs */}
        <path
          d="M55 188 Q120 160 185 188 Q160 204 120 204 Q80 204 55 188 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* arms */}
        <path
          d="M75 133 Q80 165 88 184"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M165 133 Q160 165 152 184"
          stroke="#000000"
          strokeWidth="3"
          strokeLinecap="round"
        />

        <circle
          cx="88"
          cy="185"
          r="7"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="3"
        />
        <circle
          cx="152"
          cy="185"
          r="7"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="3"
        />

        {/* torso */}
        <path
          d="M85 188 L70 130 Q120 105 170 130 L155 188 Z"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* head */}
        <circle
          cx="120"
          cy="95"
          r="42"
          fill="#ffffff"
          stroke="#000000"
          strokeWidth="4"
        />

        {/* third eye */}
        <circle cx="120" cy="74" r="4" fill="#d1ffca" />

        {/* eyes */}
        <path
          d="M98 92 Q104 98 110 92"
          stroke="#000000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M130 92 Q136 98 142 92"
          stroke="#000000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />

        {/* smile */}
        <path
          d="M105 112 Q120 120 135 112"
          stroke="#000000"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}