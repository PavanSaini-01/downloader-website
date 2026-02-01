/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'accent-color': '#3b82f6', // Example blue, can be customized
            },
        },
    },
    plugins: [],
}
