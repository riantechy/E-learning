// src/config/theme.ts
export const colors = {
    primary: '#E31937',      // ICT Authority Red
    secondary: '#00853F',    // ICT Authority Green
    accent: '#000000',       // Black
    background: '#FFFFFF',   // White
    textDark: '#000000',     // Black text
    textLight: '#FFFFFF',    // White text
    success: '#00853F',      // Green
    warning: '#FFC107',      // Yellow
    danger: '#E31937',       // Red
  };
  
  export const theme = {
    colors,
    fonts: {
      primary: 'var(--font-inter)',
      secondary: 'var(--font-roboto)',
    },
    spacing: {
      sm: '0.5rem',
      md: '1rem',
      lg: '2rem',
    },
  };