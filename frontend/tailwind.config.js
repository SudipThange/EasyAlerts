/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                danger: '#B91C1C',
                warning: '#F59E0B',
                safe: '#059669',
                info: '#2563EB',
            },
            fontFamily: {
                alert: ['"Bebas Neue"', '"Barlow Condensed"', 'sans-serif'],
                body: ['"IBM Plex Sans"', 'sans-serif'],
                mono: ['"JetBrains Mono"', 'monospace'],
                sans: ['"IBM Plex Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
