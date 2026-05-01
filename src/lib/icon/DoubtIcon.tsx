export const DoubtIcon = ({ size = 13, color = "currentColor" }) => (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        {/* メインの思考吹き出し */}
        <path d="M17.5 19c.725 0 1.45-.11 2.128-.33a4.5 4.5 0 0 0 1.344-8.17 4.5 4.5 0 0 0-8.72-2.12 3 3 0 0 0-4.752 3.62 3.5 3.5 0 0 0 .5 6.992l9.5.008z" />

        {/* 三点リーダー（考え中を表現） */}
        <circle cx="9" cy="13" r="0.5" fill={color} stroke="none" />
        <circle cx="12" cy="13" r="0.5" fill={color} stroke="none" />
        <circle cx="15" cy="13" r="0.5" fill={color} stroke="none" />

        {/* 思考の飛び地（下側の小さな丸） */}
        <circle cx="7" cy="19" r="1" fill="none" />
        <circle cx="4" cy="21" r="0.5" fill="none" />
    </svg>
);