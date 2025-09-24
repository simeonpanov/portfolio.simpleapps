/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./templates/**/*.html", // main template(s)
    "./apps/**/**/*.html", // all app-specific HTML
    "./apps/**/**/*.js", // all app-specific JS
    "./static/js/**/*.js", // any other JS files
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
