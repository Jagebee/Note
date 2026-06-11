'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

interface BackgroundContextValue {
  backgroundImage: string | null;
  setBackgroundImage: (value: string | null) => Promise<void>;
  accentColor: string | null;
  setAccentColor: (value: string | null) => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);
  const [accentColor, setAccentColorState] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  function applyAccentColor(hex: string | null) {
    const root = document.documentElement;
    if (!hex) {
      root.style.setProperty('--accent-r', '249');
      root.style.setProperty('--accent-g', '115');
      root.style.setProperty('--accent-b', '22');
      return;
    }
    root.style.setProperty('--accent-r', String(parseInt(hex.slice(1, 3), 16)));
    root.style.setProperty('--accent-g', String(parseInt(hex.slice(3, 5), 16)));
    root.style.setProperty('--accent-b', String(parseInt(hex.slice(5, 7), 16)));
  }

  useEffect(() => {
    async function loadBackground() {
      const response = await fetch('/api/settings', { cache: 'no-store' });
      if (!response.ok) {
        setReady(true);
        return;
      }

      const data = (await response.json()) as { backgroundImage: string | null; accentColor: string | null };
      setBackgroundImageState(data.backgroundImage ?? null);
      if (data.accentColor) {
        setAccentColorState(data.accentColor);
        applyAccentColor(data.accentColor);
      }
      setReady(true);
    }

    void loadBackground();
  }, []);

  useEffect(() => {
    if (backgroundImage) {
      document.documentElement.style.setProperty('--custom-bg-image', `url("${backgroundImage}")`);
      document.body.dataset.bgMode = 'image';
      return;
    }

    document.documentElement.style.removeProperty('--custom-bg-image');
    document.body.dataset.bgMode = 'gradient';
  }, [backgroundImage]);

  async function setBackgroundImage(value: string | null) {
    const response = await fetch('/api/background', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backgroundImage: value })
    });

    if (!response.ok) {
      const fallback = await response.json().catch(() => null);
      throw new Error(fallback?.error?.message ?? '背景保存失败');
    }

    setBackgroundImageState(value);
  }

  async function setAccentColor(value: string | null) {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accentColor: value })
    });

    if (!response.ok) {
      const fallback = await response.json().catch(() => null);
      throw new Error(fallback?.error?.message ?? '配色保存失败');
    }

    applyAccentColor(value);
    setAccentColorState(value);
  }

  const value = useMemo(
    () => ({
      backgroundImage,
      setBackgroundImage,
      accentColor,
      setAccentColor
    }),
    [backgroundImage, accentColor]
  );

  return (
    <BackgroundContext.Provider value={value}>
      <div className="app-background">
        <div className="app-background__image" />
        <div className="app-background__overlay" />
        <div className="app-background__mesh" />
      </div>
      <div className={`relative z-10 transition-opacity duration-300 ${ready ? 'opacity-100' : 'opacity-0'}`}>
        {children}
      </div>
    </BackgroundContext.Provider>
  );
}

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (!context) {
    throw new Error('useBackground must be used inside BackgroundProvider');
  }

  return context;
}
