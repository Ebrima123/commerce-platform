import { useEffect, type CSSProperties, type ReactNode } from 'react';
import { FONTS, RADII, hexToHslTriplet, readableOn, type Brand } from '@cp/shared';

const SURFACE_VARS: Record<Brand['surface'], Record<string, string>> = {
  white: {
    '--background': '0 0% 100%', '--foreground': '240 10% 8%', '--card': '0 0% 100%',
    '--muted': '240 5% 96%', '--muted-foreground': '240 4% 42%', '--border': '240 6% 90%', '--input': '240 6% 86%',
  },
  warm: {
    '--background': '40 33% 97%', '--foreground': '24 10% 10%', '--card': '40 40% 99%',
    '--muted': '36 22% 92%', '--muted-foreground': '24 6% 40%', '--border': '36 16% 86%', '--input': '36 14% 80%',
  },
  dark: {
    '--background': '240 10% 6%', '--foreground': '0 0% 96%', '--card': '240 8% 9%',
    '--muted': '240 5% 14%', '--muted-foreground': '240 5% 64%', '--border': '240 5% 18%', '--input': '240 5% 22%',
  },
};

/** Loads the theme's Google fonts once per family. */
function useGoogleFonts(keys: (keyof typeof FONTS)[]) {
  const families = [...new Set(keys)].map(k => FONTS[k]?.google).filter(Boolean).join('&family=');
  useEffect(() => {
    if (!families) return;
    const id = `cp-fonts-${families}`;
    if (document.getElementById(id)) return;
    const link = Object.assign(document.createElement('link'), {
      id, rel: 'stylesheet', href: `https://fonts.googleapis.com/css2?family=${families}&display=swap`,
    });
    document.head.appendChild(link);
  }, [families]);
}

/** Applies a store's brand (colour, fonts, corner style, surface) to everything inside it. */
export function ThemeRoot({ brand, children }: { brand: Brand; children: ReactNode }) {
  useGoogleFonts([brand.font, brand.headingFont]);

  const style = {
    ...SURFACE_VARS[brand.surface] ?? SURFACE_VARS.white,
    '--brand': hexToHslTriplet(brand.primaryColor),
    '--brand-foreground': readableOn(brand.primaryColor),
    '--btn-radius': RADII[brand.radius]?.value ?? '0.5rem',
    '--card-radius': brand.radius === 'full' ? '1.25rem' : RADII[brand.radius]?.value ?? '0.5rem',
    '--font-heading': FONTS[brand.headingFont]?.family ?? FONTS.inter.family,
    fontFamily: FONTS[brand.font]?.family ?? FONTS.inter.family,
  } as CSSProperties;

  // Keep the page behind the store (overscroll, short pages) on-theme too.
  useEffect(() => {
    const vars = SURFACE_VARS[brand.surface] ?? SURFACE_VARS.white;
    document.body.style.background = `hsl(${vars['--background']})`;
  }, [brand.surface]);

  return <div style={style} className="min-h-screen bg-background text-foreground">{children}</div>;
}
