import { useRef } from "react";

export default function DoodleBackground({ theme = "light" }) {
    const isDark = theme === "dark";
    const bubblesRef = useRef(
        Array.from({ length: 40 }).map((_, i) => {
            const startX = Math.random() * 1200;
            return {
                id: i,
                startX,
                endX: startX + 120 + Math.random() * 200,
                y: Math.random() * 800,
                r: Math.random() * 4 + 2,
                duration: 12 + Math.random() * 10,
                color: i % 2 === 0 ? "#6366F1" : "#22C55E",
            };
        })
    );

    return (
        <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1200 800"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
            style={{ opacity: isDark ? 0.3 : 0.25 }}
        >
            <defs>
                <linearGradient id="blueGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>

                <linearGradient id="greenGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#22C55E" />
                    <stop offset="100%" stopColor="#16A34A" />
                </linearGradient>
            </defs>

            <path
                d="M50 200 C200 100, 600 700, 1100 300"
                stroke="url(#blueGrad)"
                strokeWidth="5"
                strokeLinecap="round"
            />
            <path
                d="M200 200 C00 500, 600 00, 1150 700"
                stroke="url(#greenGrad)"
                strokeWidth="5"
                strokeLinecap="round"
            />

            <circle cx="208" cy="150" r="30" stroke="url(#blueGrad)" strokeWidth="4" />
            <text x="195" y="160" fill="#22C55E"> 💬 </text>

            <rect x="850" y="100" width="80" height="60" rx="10"
                stroke="url(#blueGrad)" strokeWidth="4" />
            <line x1="850" y1="130" x2="930" y2="130"
                stroke="url(#blueGrad)" strokeWidth="4" />

            <rect x="500" y="600" width="80" height="100" rx="12"
                stroke="url(#blueGrad)" strokeWidth="4" />
            <circle cx="540" cy="680" r="8" stroke="url(#greenGrad)" strokeWidth="4" />
            {/* <circle cx="600" cy="645" r="10" stroke="url(#greenGrad)" strokeWidth="4" /> */}

            {bubblesRef.current.map(b => (
                <circle
                    key={b.i}
                    cx={b.startX}
                    cy={b.y}
                    r={b.r}
                    fill={b.i % 2 === 0 ? "#6366F1" : "#22C55E"}
                >
                    <animate
                        attributeName="cx"
                        from={b.startX}
                        to={b.endX}
                        dur={`${b.duration}s`}
                        repeatCount="indefinite"
                        direction="alternate"
                    />
                    {/* <animate
                            attributeName="opacity"
                            values="0.4;0.8;0.4"
                            dur={`${duration + 4}s`}
                            repeatCount="indefinite"
                        /> */}

                </circle>
            ))}

        </svg>
    );
}
