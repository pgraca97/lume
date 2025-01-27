// src/theme/tokens.ts
export const tokens = {
    colors: {
      primary: {
        50: '#FFF0F0',
        100: '#FFE1E1',
        200: '#FFC4C4',
        300: '#FFA7A7',
        400: '#FF8989',
        500: '#FF6B6B', // brand color
        600: '#FF3D3D',
        700: '#FF0F0F',
        800: '#E00000',
        900: '#B20000',
      },
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      },
      error: {
        light: '#FF6B6B',
        default: '#FF4444',
        dark: '#CC0000',
      },
      success: {
        light: '#86EFAC',
        default: '#22C55E',
        dark: '#15803D',
      },
      background: {
        primary: '#FFFFFF',
        secondary: '#F9FAFB',
        tertiary: '#F3F4F6',
      },
      text: {
        primary: '#1F2937',
        secondary: '#4B5563',
        tertiary: '#6B7280',
        inverse: '#FFFFFF',
      },
    },
    
    spacing: {
      none: 0,
      xs: 4,
      sm: 8,
      md: 16,
      lg: 24,
      xl: 32,
      xxl: 48,
    },
    
    borderRadius: {
      none: 0,
      sm: 4,
      md: 8,
      lg: 12,
      xl: 16,
      full: 9999,
    },
    
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    
    shadows: {
      none: {
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
        elevation: 0,
      },
      sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
      md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
      lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
      },
    },
    
    timing: {
      quick: 150,
      normal: 250,
      relaxed: 350,
    },
  } as const;
