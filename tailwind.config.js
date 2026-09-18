/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wa: {
          green: {
            DEFAULT: '#00a884',
            light: '#25d366',
            dark: '#008069',
            outgoing: '#d9fdd3',
            outgoingDark: '#005c4b',
            hover: '#008f6f',
          },
          dark: {
            bg: '#0c1317',
            chat: '#111b21',
            panel: '#202c33',
            hover: '#2a3942',
            incoming: '#202c33',
            border: '#222d34',
            input: '#2a3942',
            subtext: '#8696a0',
            text: '#e9edef',
          },
          light: {
            bg: '#f0f2f5',
            chat: '#efeae2',
            panel: '#ffffff',
            hover: '#f5f6f6',
            incoming: '#ffffff',
            border: '#e9edef',
            input: '#f0f2f5',
            subtext: '#667781',
            text: '#111b21',
          },
          tick: {
            blue: '#53bdeb',
            gray: '#8696a0',
          }
        }
      },
      backgroundImage: {
        'wa-pattern': "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"200\" height=\"200\" viewBox=\"0 0 200 200\" fill=\"none\" opacity=\"0.05\"><path d=\"M20 20h20v20H20zM60 40h10v10H60zM120 20h15v15h-15zM170 50h20v20h-20zM30 90h15v15H30zM90 100h25v25H90zM150 110h20v20h-20zM40 160h20v20H40zM110 150h15v15h-15zM170 160h20v20h-20z\" fill=\"%23000\"/></svg>')",
      }
    },
  },
  plugins: [],
}
