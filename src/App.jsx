import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import brandLogo from './assets/Logo_AC-removebg-preview.png';

const DEFAULT_BRANDING = {
  primaryColor: '#f97316',
  accentColor: '#ea580c',
  themePreference: 'light',
  heroImageUrl: 'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?auto=format&fit=crop&w=900&q=80',
  navbarLogoUrl: brandLogo,
  footerLogoUrl: brandLogo,
  locationAddress: 'El Chaco 106, Córdoba Capital',
  businessHours: '',
  whatsappPhone: '',
  instagramUrl: '',
  transferAlias: '',
  transferAccountHolder: '',
  transferDestination: '',
  workGallery: [],
};

const SERVICE_CATEGORIES = {
  peluqueria: {
    label: 'Peluquería',
    services: [
      {
        name: 'Corte & Styling',
        description: 'Cortes personalizados, brushing y peinados para cada ocasión.',
        duration: '45 min',
        price: '$6.500',
        imageUrl:
          'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=1000&q=80',
      },
      {
        name: 'Color Experto',
        description: 'Balayage, iluminaciones y color global con diagnóstico previo.',
        duration: '120 min',
        price: 'Desde $18.000',
        imageUrl:
          'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=1000&q=80',
      },
      {
        name: 'Tratamientos Capilares',
        description: 'Shock de keratina, nutrición profunda y terapias hidratantes.',
        duration: '60 min',
        price: '$10.500',
        imageUrl:
          'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1000&q=80',
      },
    ],
  },
  manicuria: {
    label: 'Manicura',
    services: [
      {
        name: 'Manos Spa',
        description: 'Limpieza profunda, exfoliación, masaje y esmaltado tradicional.',
        duration: '60 min',
        price: '$7.200',
      },
      {
        name: 'Semipermanente Luxe',
        description: 'Esmaltado semipermanente con selección premium de colores.',
        duration: '70 min',
        price: '$9.800',
      },
      {
        name: 'Nail Art',
        description: 'Diseños personalizados, encapsulados y tendencias del momento.',
        duration: '90 min',
        price: 'Desde $11.500',
      },
    ],
  },
};

const TESTIMONIALS = [
  {
    name: 'Sol Ferraro',
    initials: 'SF',
    comment:
      'Reservar turno por WhatsApp ahora es facilísimo. El flujo es claro y las clientas llegan puntuales.',
    service: 'Color & Styling',
  },
  {
    name: 'Bruno Ledesma',
    initials: 'BL',
    comment:
      'Mis clientas de manicura aman poder elegir su horario. Además, la sección de servicios queda súper prolija.',
    service: 'Semipermanente',
  },
  {
    name: 'Maru Quiroga',
    initials: 'MQ',
    comment:
      'Desde que uso el turnero, ahorré más de una hora diaria contestando mensajes. ¡Es clave!',
    service: 'Tratamientos',
  },
];

const STEPS = [
  {
    title: 'Compartí tu link automático',
    copy:
      'Automatizá tu respuesta de WhatsApp y guiá a las clientas para que elijan su servicio y horario disponibles.',
  },
  {
    title: 'Gestioná tu agenda visual',
    copy:
      'Visualizá turnos confirmados, pendientes y cancelados en un panel diseñado para la vida en salón.',
  },
  {
    title: 'Confirmá y cobrá desde el mismo lugar',
    copy:
      'Recibí alertas y confirmaciones en tiempo real. Configurá seña previa para los servicios de alta demanda.',
  },
];

const METRICS = [
  {
    value: '+120',
    description: 'Turnos confirmados por mes en promedio.',
  },
  {
    value: '75%',
    description: 'Menos tiempo respondiendo mensajes manualmente.',
  },
  {
    value: '24/7',
    description: 'Reservas disponibles en cualquier horario.',
  },
  {
    value: '+4.8',
    description: 'Promedio de reseñas que muestran tus clientas.',
  },
];

const DEFAULT_STAFF_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="%23f1f5f9"/><circle cx="64" cy="52" r="26" fill="%2394a3b8"/><path d="M24 112c0-22 18-40 40-40s40 18 40 40" fill="%23cbd5f5"/></svg>';

const DEFAULT_BARBERS = [
  {
    id: 'ana',
    name: 'Ana López',
    avatar:
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'martin',
    name: 'Martín Pérez',
    avatar:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'sofia',
    name: 'Sofía Herrera',
    avatar:
      'https://images.unsplash.com/photo-1504595403659-9088ce801e29?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'lucas',
    name: 'Lucas Fernández',
    avatar:
      'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=400&q=80',
  },
];

const DAILY_SLOTS = {
  weekday: ['09:00', '10:30', '12:00', '15:00', '16:30', '18:00'],
  saturday: ['09:00', '10:00', '11:30', '13:00', '15:30'],
  sunday: ['10:00', '11:30', '13:00'],
};

const SALON_LOCATION = {
  label: 'Aaron Córdoba Barbería y Peluquería',
  latitude: -31.417339,
  longitude: -64.183319,
  address: 'El Chaco 106, Córdoba Capital',
  schedule: 'Lun a Vie · 8:00 a 13:00 y 16:00 a 21:00',
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const PUBLIC_THEME_STORAGE_KEY = 'turnapp_public_theme';

const formatCurrency = (value) => {
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return value ? String(value) : '';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(amount);
};

const parseHexColor = (value) => {
  if (!value || typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(normalized)) return null;
  const numeric = Number.parseInt(normalized.slice(1), 16);
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  };
};

const toRgbString = (rgb) => `${rgb.r}, ${rgb.g}, ${rgb.b}`;

const darkenHex = (value, amount = 0.18) => {
  const rgb = parseHexColor(value);
  if (!rgb) return value;
  const scale = (channel) => Math.max(0, Math.min(255, Math.round(channel * (1 - amount))));
  return `#${[scale(rgb.r), scale(rgb.g), scale(rgb.b)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const rgbToHex = (rgb) =>
  `#${[rgb.r, rgb.g, rgb.b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

const toLinearChannel = (channel) => {
  const normalized = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : Math.pow((normalized + 0.055) / 1.055, 2.4);
};

const relativeLuminance = (rgb) =>
  0.2126 * toLinearChannel(rgb.r) +
  0.7152 * toLinearChannel(rgb.g) +
  0.0722 * toLinearChannel(rgb.b);

const contrastRatio = (a, b) => {
  const lumA = relativeLuminance(a);
  const lumB = relativeLuminance(b);
  const [lighter, darker] = lumA >= lumB ? [lumA, lumB] : [lumB, lumA];
  return (lighter + 0.05) / (darker + 0.05);
};

const rgbToHsl = (rgb) => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      default:
        h = (r - g) / delta + 4;
    }
    h *= 60;
  }

  return { h, s, l };
};

const hslToRgb = (h, s, l) => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
};

const rgbaString = (rgb, alpha) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

const DARK_THEME_VARIABLES = [
  '--surface-100',
  '--surface-200',
  '--surface-contrast',
  '--surface-muted',
  '--surface-subtle',
  '--navbar-bg',
  '--footer-bg',
  '--input-bg',
];

const buildContrastOptimizedDarkPalette = (primaryColor) => {
  const primaryRgb = parseHexColor(primaryColor);
  if (!primaryRgb) return null;

  const primaryHsl = rgbToHsl(primaryRgb);
  const hue = primaryHsl.h;
  const saturation = clamp(primaryHsl.s * 0.35, 0.08, 0.28);
  let bestCandidate = null;

  for (let lightness = 0.04; lightness <= 0.18; lightness += 0.004) {
    const candidateRgb = hslToRgb(hue, saturation, lightness);
    const ratio = contrastRatio(primaryRgb, candidateRgb);
    if (
      !bestCandidate ||
      ratio > bestCandidate.ratio ||
      (ratio === bestCandidate.ratio && lightness < bestCandidate.lightness)
    ) {
      bestCandidate = {
        rgb: candidateRgb,
        lightness,
        ratio,
      };
    }
  }

  if (!bestCandidate) return null;
  const baseHsl = rgbToHsl(bestCandidate.rgb);
  const surface100 = bestCandidate.rgb;
  const surface200 = hslToRgb(baseHsl.h, baseHsl.s, clamp(baseHsl.l + 0.06, 0, 0.22));
  const surfaceContrast = hslToRgb(baseHsl.h, baseHsl.s, clamp(baseHsl.l + 0.03, 0, 0.22));
  const surfaceSubtle = hslToRgb(baseHsl.h, baseHsl.s, clamp(baseHsl.l + 0.12, 0, 0.3));

  return {
    '--surface-100': rgbToHex(surface100),
    '--surface-200': rgbToHex(surface200),
    '--surface-contrast': rgbToHex(surfaceContrast),
    '--surface-muted': rgbaString(surface200, 0.85),
    '--surface-subtle': rgbaString(surfaceSubtle, 0.55),
    '--navbar-bg': rgbaString(surface100, 0.85),
    '--footer-bg': rgbToHex(surfaceContrast),
    '--input-bg': rgbaString(surfaceContrast, 0.65),
  };
};

const applyDarkThemeOverrides = (primaryColor, theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme !== 'dark') {
    DARK_THEME_VARIABLES.forEach((name) => root.style.removeProperty(name));
    return;
  }
  const palette = buildContrastOptimizedDarkPalette(primaryColor);
  if (!palette) return;
  Object.entries(palette).forEach(([name, value]) => root.style.setProperty(name, value));
};

const applyBrandingVariables = (branding) => {
  const primaryColor = branding?.primaryColor || DEFAULT_BRANDING.primaryColor;
  const accentColor = branding?.accentColor || DEFAULT_BRANDING.accentColor;
  const primaryRgb = parseHexColor(primaryColor) || parseHexColor(DEFAULT_BRANDING.primaryColor);
  const accentRgb = parseHexColor(accentColor) || parseHexColor(DEFAULT_BRANDING.accentColor);

  if (!primaryRgb || !accentRgb) return;

  const normalizedAccent = accentColor.trim().toLowerCase();
  const isAccentWhite = normalizedAccent === '#ffffff';
  const root = document.documentElement;
  root.style.setProperty('--brand-500', primaryColor);
  root.style.setProperty('--brand-600', accentColor);
  root.style.setProperty('--brand-700', darkenHex(accentColor, 0.2));
  root.style.setProperty('--focus-outline', `2px solid rgba(${toRgbString(primaryRgb)}, 0.4)`);
  root.style.setProperty('--surface-highlight', `rgba(${toRgbString(primaryRgb)}, 0.12)`);
  root.style.setProperty('--surface-highlight-strong', `rgba(${toRgbString(primaryRgb)}, 0.28)`);
  root.style.setProperty('--shadow-xl', `0 30px 60px rgba(${toRgbString(accentRgb)}, 0.25)`);
  root.style.setProperty('--shadow-hero', `0 25px 50px rgba(${toRgbString(accentRgb)}, 0.3)`);
  root.style.setProperty('--cta-hover-text', isAccentWhite ? 'var(--surface-100)' : '#ffffff');
};

const getSlotsForDate = (date) => {
  const day = date.getDay();
  if (day === 0) return DAILY_SLOTS.sunday;
  if (day === 6) return DAILY_SLOTS.saturday;
  return DAILY_SLOTS.weekday;
};

const buildTransferDetails = (branding) => {
  const details = [];
  if (branding?.transferAlias) details.push({ label: 'Alias', value: branding.transferAlias });
  if (branding?.transferAccountHolder)
    details.push({ label: 'Titular', value: branding.transferAccountHolder });
  if (branding?.transferDestination)
    details.push({ label: 'Cuenta destino', value: branding.transferDestination });
  return details;
};

const normalizeWorkGallery = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      const cardNumber = Number.parseInt(item?.cardNumber, 10) || index + 1;
      return {
        cardNumber,
        imageUrl: typeof item?.imageUrl === 'string' ? item.imageUrl : '',
        title: typeof item?.title === 'string' ? item.title : '',
        description: typeof item?.description === 'string' ? item.description : '',
      };
    })
    .sort((a, b) => a.cardNumber - b.cardNumber)
    .filter((item) => Boolean(item.imageUrl));
};

function SunIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79Z" />
    </svg>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : ''}`}
      onClick={onToggle}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <span className="theme-toggle-icon" aria-hidden>
        <SunIcon />
      </span>
      <span className="theme-toggle-track" aria-hidden>
        <span className="theme-toggle-thumb" />
      </span>
      <span className="theme-toggle-icon" aria-hidden>
        <MoonIcon />
      </span>
    </button>
  );
}

function Navbar({ onReserveClick, onNavigateHome, isBooking, logoUrl, theme, onToggleTheme }) {
  return (
    <header className="navbar">
      <button type="button" className="brand-button" onClick={onNavigateHome}>
        <img src={logoUrl} alt="Aaron Cordoba Barbería y Peluquería" />
      </button>
      {!isBooking && (
        <nav className="nav-links">
          <a href="#servicios">Servicios</a>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#reseñas">Reseñas</a>
          <a href="#contacto">Contacto</a>
        </nav>
      )}
      <div className="navbar-actions">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button className="button" type="button" onClick={onReserveClick}>
          Reservar turno
        </button>
      </div>
    </header>
  );
}

function Hero({ onReserveClick, reserveButtonRef, heroImageUrl }) {
  const slides = useMemo(() => [...METRICS, METRICS[0]], []);
  const [activeMetric, setActiveMetric] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const trackRef = useRef(null);
  const TRANSITION_DURATION_MS = 500;

  useEffect(() => {
    const intervalId = setInterval(() => {
      setActiveMetric((prev) => prev + 1);
    }, 3000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (activeMetric === slides.length - 1) {
      const timeoutId = setTimeout(() => {
        setIsAnimating(false);
        setActiveMetric(0);
      }, TRANSITION_DURATION_MS);

      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [activeMetric, slides.length]);

  useEffect(() => {
    if (!isAnimating) {
      const frameId = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(frameId);
    }
    return undefined;
  }, [isAnimating]);

  useEffect(() => {
    const updateLayout = () => {
      const isDesktop = window.matchMedia('(min-width: 720px)').matches;
      setIsMobileCarousel(!isDesktop);

      if (!trackRef.current) {
        setSlideWidth(0);
        return;
      }

      const firstSlide = trackRef.current.querySelector('.metric');
      if (!firstSlide) {
        setSlideWidth(0);
        return;
      }

      if (isDesktop) {
        setSlideWidth(0);
        return;
      }

      const rect = firstSlide.getBoundingClientRect();
      const styles = window.getComputedStyle(firstSlide);
      const marginLeft = parseFloat(styles.marginLeft) || 0;
      const marginRight = parseFloat(styles.marginRight) || 0;
      setSlideWidth(rect.width + marginLeft + marginRight);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const translateValue =
    isMobileCarousel && slideWidth ? -activeMetric * slideWidth : 0;

  return (
    <section className="section is-accent landing-section" id="inicio">
      <div className="container hero-grid stack-lg">
        <div className="stack-lg hero">
          <div className="stack-sm">
            <h1 className="headline">Recibí tus turnos sin contestar mensajes</h1>
            <p className="subheadline">
              Automatizá tu WhatsApp con una experiencia pensada para peluquerías y servicios de
              manicura. Mostrá tus servicios, reseñas y gestioná pagos desde un mismo lugar.
            </p>
          </div>
          <div className="hero-actions">
            <button
              className="button"
              type="button"
              onClick={onReserveClick}
              ref={reserveButtonRef}
            >
              Reservar turno
            </button>
          </div>
        </div>
        <div className="stack hero-media">
          <img src={heroImageUrl} alt="Estilista trabajando con una clienta" loading="lazy" />
        </div>
        <div className="metrics-carousel" aria-live="polite">
          <div
            className="metrics-track"
            ref={trackRef}
            style={{
              transform:
                isMobileCarousel && slideWidth
                  ? `translateX(${translateValue}px)`
                  : undefined,
              transition:
                isMobileCarousel && isAnimating ? 'transform 500ms ease' : 'none',
            }}
          >
            {slides.map((metric, index) => {
              const isClone = index === slides.length - 1;
              return (
                <article
                  key={`${metric.value}-${index}`}
                  className={`metric${isClone ? ' metric-clone' : ''}`}
                  aria-hidden={isClone ? true : undefined}
                >
                  <h3>{metric.value}</h3>
                  <p>{metric.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Services({ branding }) {
  const activeTab = 'peluqueria';
  const services = useMemo(() => SERVICE_CATEGORIES[activeTab].services, [activeTab]);
  const workGallery = useMemo(() => normalizeWorkGallery(branding?.workGallery), [branding]);
  const displayedServices = useMemo(() => {
    if (!workGallery.length) return services;

    return workGallery.map((item, index) => {
      const fallback = services[index] ?? {};
      return {
        name: item.title || fallback.name || `Trabajo ${item.cardNumber}`,
        description: item.description || fallback.description || 'Trabajo realizado en nuestro salón.',
        imageUrl: item.imageUrl || fallback.imageUrl,
      };
    });
  }, [workGallery, services]);
  const useDesktopCarousel = displayedServices.length >= 4;
  const serviceListRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const [canScrollServiceLeft, setCanScrollServiceLeft] = useState(false);
  const [canScrollServiceRight, setCanScrollServiceRight] = useState(false);
  const totalPages = useDesktopCarousel
    ? Math.ceil(displayedServices.length / 3)
    : displayedServices.length;

  const updateServiceScrollState = useCallback(() => {
    const listEl = serviceListRef.current;
    if (!listEl) return;

    const isDesktop = window.matchMedia('(min-width: 720px)').matches;
    if (!(isDesktop && useDesktopCarousel)) {
      setCanScrollServiceLeft(false);
      setCanScrollServiceRight(false);
      return;
    }

    const maxScrollLeft = Math.max(0, listEl.scrollWidth - listEl.clientWidth);
    const tolerance = 4;
    setCanScrollServiceLeft(listEl.scrollLeft > tolerance);
    setCanScrollServiceRight(listEl.scrollLeft < maxScrollLeft - tolerance);
  }, [useDesktopCarousel]);

  useEffect(() => {
    setActiveSlide(0);
    if (serviceListRef.current) {
      serviceListRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
    updateServiceScrollState();
  }, [activeTab, displayedServices.length, updateServiceScrollState, useDesktopCarousel]);

  useEffect(() => {
    const listEl = serviceListRef.current;
    if (!listEl) return () => {};

    const handleScroll = () => {
      const isDesktop = window.matchMedia('(min-width: 720px)').matches;
      if (isDesktop && !useDesktopCarousel) {
        setActiveSlide(0);
        return;
      }

      if (isDesktop && useDesktopCarousel) {
        const pageWidth = listEl.clientWidth;
        if (!pageWidth) {
          setActiveSlide(0);
          return;
        }
        const rawPage = Math.round(listEl.scrollLeft / pageWidth);
        const clampedPage = Math.min(totalPages - 1, Math.max(0, rawPage));
        setActiveSlide((prev) => (prev === clampedPage ? prev : clampedPage));
        updateServiceScrollState();
        return;
      }

      const cards = Array.from(listEl.querySelectorAll('.service-card'));
      if (!cards.length) {
        setActiveSlide(0);
        return;
      }

      const baseOffset = cards[0].offsetLeft;
      let step =
        cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : cards[0].offsetWidth;
      if (step <= 0) {
        step = cards[0].offsetWidth;
      }
      if (!step) return;

      const rawIndex = Math.round((listEl.scrollLeft - baseOffset) / step);
      const clampedIndex = Math.min(cards.length - 1, Math.max(0, rawIndex));
      const indicatorIndex = useDesktopCarousel
        ? Math.min(totalPages - 1, Math.max(0, Math.floor(clampedIndex / 3)))
        : clampedIndex;
      setActiveSlide((prev) => (prev === indicatorIndex ? prev : indicatorIndex));
      updateServiceScrollState();
    };

    handleScroll();
    listEl.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      listEl.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [displayedServices, totalPages, updateServiceScrollState, useDesktopCarousel]);

  const handleScrollServices = (direction) => {
    const listEl = serviceListRef.current;
    if (!listEl) return;
    listEl.scrollBy({ left: direction * listEl.clientWidth, behavior: 'smooth' });
  };

  return (
    <section className="section is-contrast landing-section" id="servicios">
      <div className="container stack-lg">
        <div className="stack-sm">
          <div className="stack-sm">
            <h2 className="headline" style={{ fontSize: '2rem' }}>
              Diseñado para peluquerías y manicuras
            </h2>
            <p className="subheadline">
              Cargá tus servicios con duración, precios y etiquetas. Ayudá a que elijan justo lo que necesitan
              sin perder tiempo en la conversación.
            </p>
          </div>
        </div>
        <div className={`services-carousel${useDesktopCarousel ? ' is-desktop-carousel' : ''}`}>
          <button
            type="button"
            className={`services-nav services-nav-left${canScrollServiceLeft ? '' : ' is-hidden'}`}
            onClick={() => handleScrollServices(-1)}
            aria-label="Ver servicios anteriores"
            disabled={!canScrollServiceLeft}
          >
            <span aria-hidden>‹</span>
          </button>
          <div
            className={`services-grid${useDesktopCarousel ? ' is-desktop-carousel' : ''}`}
            role="tabpanel"
            ref={serviceListRef}
          >
            {displayedServices.map((service, index) => (
              <article key={`service-card-${index + 1}`} className="service-card">
                <div className="service-card-media">
                  <img src={service.imageUrl} alt={service.name} loading="lazy" />
                </div>
                <div className="service-tag">
                  <span aria-hidden>●</span>
                  {SERVICE_CATEGORIES[activeTab].label}
                </div>
                <div className="stack-sm">
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            ))}
          </div>
          <button
            type="button"
            className={`services-nav services-nav-right${canScrollServiceRight ? '' : ' is-hidden'}`}
            onClick={() => handleScrollServices(1)}
            aria-label="Ver más servicios"
            disabled={!canScrollServiceRight}
          >
            <span aria-hidden>›</span>
          </button>
        </div>
        {totalPages > 1 && (
          <div className="services-indicators" aria-hidden="true">
            {Array.from({ length: totalPages }).map((_, index) => (
              <span
                key={`services-page-${index + 1}`}
                className={`services-indicator${index === activeSlide ? ' is-active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const timelineRef = useRef(null);
  const [activeStepSlide, setActiveStepSlide] = useState(0);

  useEffect(() => {
    const timelineEl = timelineRef.current;
    if (!timelineEl) return () => {};

    const updateActiveSlide = () => {
      const isDesktop = window.matchMedia('(min-width: 720px)').matches;
      if (isDesktop) {
        setActiveStepSlide(0);
        return;
      }

      const cards = Array.from(timelineEl.querySelectorAll('.step'));
      if (!cards.length) {
        setActiveStepSlide(0);
        return;
      }

      const firstCard = cards[0];
      const baseOffset = firstCard.offsetLeft;
      let step =
        cards.length > 1 ? cards[1].offsetLeft - firstCard.offsetLeft : firstCard.offsetWidth;
      if (step <= 0) {
        step = firstCard.offsetWidth;
      }
      if (!step) {
        return;
      }

      const rawIndex = Math.round((timelineEl.scrollLeft - baseOffset) / step);
      const clampedIndex = Math.min(cards.length - 1, Math.max(0, rawIndex));
      setActiveStepSlide((prev) => (prev === clampedIndex ? prev : clampedIndex));
    };

    updateActiveSlide();
    timelineEl.addEventListener('scroll', updateActiveSlide, { passive: true });
    window.addEventListener('resize', updateActiveSlide);

    return () => {
      timelineEl.removeEventListener('scroll', updateActiveSlide);
      window.removeEventListener('resize', updateActiveSlide);
    };
  }, []);

  return (
    <section className="section is-accent landing-section" id="como-funciona">
      <div className="container stack-lg">
        <h2 className="headline" style={{ fontSize: '2rem' }}>
          Pasos claros para vos y tus clientas
        </h2>
        <div className="timeline" ref={timelineRef}>
          {STEPS.map((step, index) => (
            <article key={step.title} className="step">
              <div className="step-number">{index + 1}</div>
              <div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </article>
          ))}
        </div>
        {STEPS.length > 1 && (
          <div className="timeline-indicators" aria-hidden="true">
            {STEPS.map((step, index) => (
              <span
                key={step.title}
                className={`timeline-indicator${index === activeStepSlide ? ' is-active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Testimonials() {
  const slides = useMemo(() => [...TESTIMONIALS, TESTIMONIALS[0]], []);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isMobileCarousel, setIsMobileCarousel] = useState(false);
  const [slideWidth, setSlideWidth] = useState(0);
  const trackRef = useRef(null);
  const AUTOPLAY_INTERVAL_MS = 4000;
  const TRANSITION_DURATION_MS = 500;

  useEffect(() => {
    if (!isMobileCarousel) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setActiveSlide((prev) => prev + 1);
    }, AUTOPLAY_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isMobileCarousel]);

  useEffect(() => {
    if (!isMobileCarousel) {
      return undefined;
    }

    if (activeSlide === slides.length - 1) {
      const timeoutId = setTimeout(() => {
        setIsAnimating(false);
        setActiveSlide(0);
      }, TRANSITION_DURATION_MS);

      return () => clearTimeout(timeoutId);
    }

    return undefined;
  }, [activeSlide, slides.length, isMobileCarousel]);

  useEffect(() => {
    if (!isAnimating) {
      const frameId = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(frameId);
    }

    return undefined;
  }, [isAnimating]);

  useEffect(() => {
    const updateLayout = () => {
      const isDesktop = window.matchMedia('(min-width: 720px)').matches;
      setIsMobileCarousel(!isDesktop);

      const trackEl = trackRef.current;
      if (!trackEl) {
        setSlideWidth(0);
        return;
      }

      if (isDesktop) {
        setSlideWidth(0);
        setActiveSlide(0);
        setIsAnimating(true);
        return;
      }

      const firstSlide = trackEl.querySelector('.testimonial');
      if (!firstSlide) {
        setSlideWidth(0);
        return;
      }

      const rect = firstSlide.getBoundingClientRect();
      const styles = window.getComputedStyle(firstSlide);
      const marginLeft = parseFloat(styles.marginLeft) || 0;
      const marginRight = parseFloat(styles.marginRight) || 0;
      setSlideWidth(rect.width + marginLeft + marginRight);
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);

    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const translateValue =
    isMobileCarousel && slideWidth ? -activeSlide * slideWidth : 0;

  return (
    <section className="section is-contrast landing-section" id="reseñas">
      <div className="container stack-lg">
        <h2 className="headline" style={{ fontSize: '2rem' }}>
          Reseñas que suman confianza
        </h2>
        <div className="testimonials-carousel" aria-live="polite">
          <div
            className="testimonials-track"
            ref={trackRef}
            style={{
              transform:
                isMobileCarousel && slideWidth
                  ? `translateX(${translateValue}px)`
                  : undefined,
              transition:
                isMobileCarousel && isAnimating ? 'transform 500ms ease' : 'none',
            }}
          >
            {slides.map((testimonial, index) => {
              const isClone = index === slides.length - 1;
              return (
                <article
                  key={`${testimonial.name}-${index}`}
                  className={`testimonial${isClone ? ' testimonial-clone' : ''}`}
                  aria-hidden={isClone ? true : undefined}
                >
                  <header>
                    <div className="avatar" aria-hidden>
                      {testimonial.initials}
                    </div>
                    <div className="testimonial-header-text">
                      <strong>{testimonial.name}</strong>
                      <span className="rating" aria-label="5 estrellas">
                        ★★★★★
                      </span>
                    </div>
                  </header>
                  <p style={{ margin: 0, color: 'var(--neutral-600)', lineHeight: 1.6 }}>
                    {testimonial.comment}
                  </p>
                  <footer
                    style={{ marginTop: '1.2rem', fontSize: '0.85rem', color: 'var(--brand-600)' }}
                  >
                    Servicio: {testimonial.service}
                  </footer>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function CallToAction({ onReserveClick, locationAddress, businessHours, whatsappPhone }) {
  const mapQuery = locationAddress || `${SALON_LOCATION.latitude},${SALON_LOCATION.longitude}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;
  const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;
  const whatsappDigits = String(whatsappPhone || '').replace(/\D/g, '');
  const whatsappPrefill = 'Hola. Quería realizar la siguiente consulta: ';
  const whatsappLink = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(whatsappPrefill)}`
    : null;

  return (
    <section className="section landing-section" id="contacto">
      <div className="container">
        <div className="cta-card map-card">
          <div className="cta-map-info">
            <h2 className="headline cta-map-heading">Conocé nuestra ubicación y horarios</h2>
            <p className="cta-map-description">{locationAddress || SALON_LOCATION.address}</p>
            <p className="cta-map-schedule">{businessHours || SALON_LOCATION.schedule}</p>
          </div>
          <div className="cta-map-container">
            <iframe
              title={`Ubicación de ${SALON_LOCATION.label}`}
              src={mapEmbedUrl}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="cta-map-frame"
            />
            <a className="cta-map-link" href={mapsLink} target="_blank" rel="noopener noreferrer">
              Abrir en Google Maps
            </a>
          </div>
          <div className="cta-map-actions">
            <button type="button" className="button cta-map-button" onClick={onReserveClick}>
              Reservar turno
            </button>
            {whatsappLink && (
              <a
                className="button cta-map-button cta-map-button-whatsapp"
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                  <path
                    fill="currentColor"
                    d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .14 5.35.14 11.92c0 2.1.55 4.16 1.6 5.98L0 24l6.27-1.64a11.86 11.86 0 0 0 5.78 1.48h.01c6.57 0 11.92-5.35 11.92-11.92 0-3.18-1.24-6.17-3.46-8.44Zm-8.45 18.35h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.72.97 1-3.63-.24-.37a9.87 9.87 0 0 1-1.53-5.29c0-5.45 4.44-9.88 9.9-9.88a9.8 9.8 0 0 1 7 2.9 9.8 9.8 0 0 1 2.9 7 9.9 9.9 0 0 1-9.9 9.89Zm5.42-7.43c-.3-.15-1.77-.87-2.04-.97-.27-.1-.46-.15-.66.15-.2.3-.76.97-.93 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46a8.9 8.9 0 0 1-1.64-2.03c-.17-.3-.02-.47.13-.62.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.66-1.6-.9-2.18-.24-.58-.49-.5-.66-.5h-.56c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.88 1.22 3.08c.15.2 2.11 3.23 5.1 4.53.71.31 1.27.5 1.7.65.71.23 1.35.2 1.86.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"
                  />
                </svg>
                Contactar
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingReserveCTA({ onClick }) {
  return (
    <button
      type="button"
      className="button floating-reserve"
      onClick={onClick}
      aria-label="Reservar turno"
    >
      Reservar turno
    </button>
  );
}

function BookingFlow({
  onBack,
  onProceedToPayment,
  barbers = [],
  isLoadingBarbers = false,
  barbersError = null,
  onRetryBarbers,
  bookingServices = [],
  isLoadingServices = false,
  servicesError = null,
  onRetryServices,
}) {
  const [selectedBarber, setSelectedBarber] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const serviceSectionRef = useRef(null);
  const scheduleSectionRef = useRef(null);
  const customerSectionRef = useRef(null);
  const barberListRef = useRef(null);
  const serviceListRef = useRef(null);
  const weekListRef = useRef(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  });
  const [fieldErrors, setFieldErrors] = useState({ phone: '', email: '' });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [canScrollBarberLeft, setCanScrollBarberLeft] = useState(false);
  const [canScrollBarberRight, setCanScrollBarberRight] = useState(false);
  const [canScrollServiceLeft, setCanScrollServiceLeft] = useState(false);
  const [canScrollServiceRight, setCanScrollServiceRight] = useState(false);
  const [canScrollWeekLeft, setCanScrollWeekLeft] = useState(false);
  const [canScrollWeekRight, setCanScrollWeekRight] = useState(false);

  const selectedBarberInfo = useMemo(
    () => barbers.find((item) => item.id === selectedBarber) ?? null,
    [barbers, selectedBarber]
  );
  const visibleServices = useMemo(() => {
    if (!selectedBarberInfo) return [];
    return bookingServices.filter((service) => {
      const professionals = Array.isArray(service.professionals) ? service.professionals : [];
      if (!professionals.length) return true;
      return professionals.some(
        (professional) =>
          typeof professional === 'string' &&
          professional.trim().toLowerCase() === selectedBarberInfo.name.trim().toLowerCase()
      );
    });
  }, [bookingServices, selectedBarberInfo]);

  const updateBarberScrollState = useCallback(() => {
    const container = barberListRef.current;
    if (!container) {
      setCanScrollBarberLeft(false);
      setCanScrollBarberRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setCanScrollBarberLeft(scrollLeft > 6);
    setCanScrollBarberRight(scrollLeft < maxScrollLeft - 6);
  }, []);

  const updateServiceScrollState = useCallback(() => {
    const container = serviceListRef.current;
    if (!container) {
      setCanScrollServiceLeft(false);
      setCanScrollServiceRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setCanScrollServiceLeft(scrollLeft > 6);
    setCanScrollServiceRight(scrollLeft < maxScrollLeft - 6);
  }, []);

  const updateWeekScrollState = useCallback(() => {
    const container = weekListRef.current;
    if (!container) {
      setCanScrollWeekLeft(false);
      setCanScrollWeekRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setCanScrollWeekLeft(scrollLeft > 6);
    setCanScrollWeekRight(scrollLeft < maxScrollLeft - 6);
  }, []);

  const weekOptions = useMemo(() => {
    const formatterDay = new Intl.DateTimeFormat('es-AR', { weekday: 'short' });
    const formatterDate = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'numeric' });
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + index);
      return {
        id: date.toISOString().split('T')[0],
        date,
        weekday: formatterDay.format(date),
        label: formatterDate.format(date),
      };
    });
  }, []);

  useEffect(() => {
    if (activeStep === 2 && serviceSectionRef.current) {
      serviceSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 3 && scheduleSectionRef.current) {
      scheduleSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep === 4 && customerSectionRef.current) {
      customerSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeStep]);

  useEffect(() => {
    if (selectedDay) {
      setSelectedSlot(null);
    }
  }, [selectedDay]);

  useEffect(() => {
    if (selectedSlot && !availableSlots.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [availableSlots, selectedSlot]);

  useEffect(() => {
    if (!selectedBarber || !selectedDay || !selectedService) {
      setAvailableSlots([]);
      return;
    }

    const controller = new AbortController();
    setSlotsLoading(true);
    setSlotsError(null);
    setSelectedSlot(null);

    const service = visibleServices.find((item) => item.id === selectedService);
    const durationMinutes = service?.durationMinutes ?? '';
    const params = new URLSearchParams({
      date: selectedDay,
    });
    if (durationMinutes) {
      params.set('durationMinutes', String(durationMinutes));
    }

    fetch(`${API_BASE_URL}/public/staff/${selectedBarber}/slots?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload?.message || 'No pudimos obtener los horarios disponibles.');
        }
        return response.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) {
          const slots = Array.isArray(data?.slots) ? data.slots : [];
          setAvailableSlots(slots);
        }
      })
      .catch((error) => {
        if (error.name === 'AbortError') return;
        console.error('[Public] Error al cargar slots', error);
        if (!controller.signal.aborted) {
          setSlotsError(error.message || 'No pudimos obtener los horarios disponibles.');
          setAvailableSlots([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSlotsLoading(false);
        }
      });

    return () => controller.abort();
  }, [selectedBarber, selectedDay, selectedService, visibleServices]);

  useEffect(() => {
    const container = barberListRef.current;
    if (!container) {
      setCanScrollBarberLeft(false);
      setCanScrollBarberRight(false);
      return undefined;
    }

    updateBarberScrollState();

    const handleScroll = () => {
      updateBarberScrollState();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateBarberScrollState);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateBarberScrollState);
      }
    };
  }, [updateBarberScrollState]);

  useEffect(() => {
    if (activeStep < 2) {
      setCanScrollServiceLeft(false);
      setCanScrollServiceRight(false);
      return;
    }

    const container = serviceListRef.current;
    if (!container) {
      setCanScrollServiceLeft(false);
      setCanScrollServiceRight(false);
      return undefined;
    }

    updateServiceScrollState();

    const handleScroll = () => {
      updateServiceScrollState();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateServiceScrollState);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateServiceScrollState);
      }
    };
  }, [activeStep, updateServiceScrollState]);

  useEffect(() => {
    if (activeStep === 2) {
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => updateServiceScrollState());
      } else {
        updateServiceScrollState();
      }
    }
  }, [activeStep, updateServiceScrollState]);

  useEffect(() => {
    if (activeStep < 3) {
      setCanScrollWeekLeft(false);
      setCanScrollWeekRight(false);
      return;
    }

    const container = weekListRef.current;
    if (!container) {
      setCanScrollWeekLeft(false);
      setCanScrollWeekRight(false);
      return undefined;
    }

    updateWeekScrollState();

    const handleScroll = () => {
      updateWeekScrollState();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateWeekScrollState);
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateWeekScrollState);
      }
    };
  }, [activeStep, updateWeekScrollState]);

  useEffect(() => {
    if (activeStep === 3) {
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => updateWeekScrollState());
      } else {
        updateWeekScrollState();
      }
    }
  }, [activeStep, updateWeekScrollState]);

  const handleScrollBarberList = (direction) => {
    const container = barberListRef.current;
    if (!container) {
      return;
    }
    const firstCard = container.querySelector('.barber-card');
    const cardRect = firstCard?.getBoundingClientRect();

    let gapValue = 0;
    if (typeof window !== 'undefined') {
      const styles = window.getComputedStyle(container);
      const rawGap = styles.columnGap || styles.gap || '0';
      gapValue = parseFloat(rawGap) || 0;
    }

    const scrollAmount = (cardRect?.width ?? container.clientWidth * 0.8) + gapValue;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.setTimeout(updateBarberScrollState, 320);
      });
    } else {
      updateBarberScrollState();
    }
  };

  const handleScrollServiceList = (direction) => {
    const container = serviceListRef.current;
    if (!container) {
      return;
    }
    const firstCard = container.querySelector('.service-option');
    const cardRect = firstCard?.getBoundingClientRect();

    let gapValue = 0;
    if (typeof window !== 'undefined') {
      const styles = window.getComputedStyle(container);
      const rawGap = styles.columnGap || styles.gap || '0';
      gapValue = parseFloat(rawGap) || 0;
    }

    const scrollAmount = (cardRect?.width ?? container.clientWidth * 0.8) + gapValue;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.setTimeout(updateServiceScrollState, 320);
      });
    } else {
      updateServiceScrollState();
    }
  };

  const handleScrollWeekList = (direction) => {
    const container = weekListRef.current;
    if (!container) {
      return;
    }
    const firstCard = container.querySelector('.day-card');
    const cardRect = firstCard?.getBoundingClientRect();

    let gapValue = 0;
    if (typeof window !== 'undefined') {
      const styles = window.getComputedStyle(container);
      const rawGap = styles.columnGap || styles.gap || '0';
      gapValue = parseFloat(rawGap) || 0;
    }

    const scrollAmount = (cardRect?.width ?? container.clientWidth * 0.8) + gapValue;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.setTimeout(updateWeekScrollState, 320);
      });
    } else {
      updateWeekScrollState();
    }
  };

  const handleSelectBarber = (barberId) => {
    setSelectedBarber(barberId);
    if (activeStep === 1) {
      setActiveStep(2);
    }
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(updateBarberScrollState);
    } else {
      updateBarberScrollState();
    }
  };

  const handleSelectService = (serviceId) => {
    setSelectedService(serviceId);
    if (activeStep < 3) {
      setActiveStep(3);
    }
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(updateServiceScrollState);
    } else {
      updateServiceScrollState();
    }
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(updateWeekScrollState);
    } else {
      updateWeekScrollState();
    }
  };

  const handleSelectDay = (dayId) => {
    if (selectedDay === dayId && activeStep > 3) {
      return;
    }
    setSelectedDay(dayId);
    if (activeStep < 3) {
      setActiveStep(3);
    }
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingError(null);
    if (activeStep < 4) {
      setActiveStep(4);
    }
  };

  const validatePhone = (value) => {
    if (!value) {
      return '';
    }
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 10) {
      return 'Ingresá un celular válido de 10 dígitos.';
    }
    return '';
  };

  const validateEmail = (value) => {
    if (!value) {
      return '';
    }
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!pattern.test(value.trim())) {
      return 'Ingresá un correo electrónico válido.';
    }
    return '';
  };

  const handleChangeCustomerData = (key, value) => {
    setCustomerData((prev) => ({ ...prev, [key]: value }));
    if (key === 'phone') {
      setFieldErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }
    if (key === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  };

  const handleFieldBlur = (key) => {
    if (key === 'phone') {
      setFieldErrors((prev) => ({ ...prev, phone: validatePhone(customerData.phone) }));
    }
    if (key === 'email') {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(customerData.email) }));
    }
  };

  useEffect(() => {
    if (!barbers?.length) {
      setSelectedBarber(null);
      return;
    }
    setSelectedBarber((prev) => {
      if (!prev) {
        return prev;
      }
      if (barbers.some((item) => item.id === prev)) {
        return prev;
      }
      return barbers[0].id;
    });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(updateBarberScrollState);
    } else {
      updateBarberScrollState();
    }
  }, [barbers, updateBarberScrollState]);

  useEffect(() => {
    if (!visibleServices?.length) {
      setSelectedService(null);
      return;
    }
    setSelectedService((prev) => {
      if (!prev) {
        return prev;
      }
      if (visibleServices.some((item) => item.id === prev)) {
        return prev;
      }
      return visibleServices[0].id;
    });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(updateServiceScrollState);
    } else {
      updateServiceScrollState();
    }
  }, [visibleServices, updateServiceScrollState]);

  const handleProceedToPayment = async () => {
    if (!selectedBarber || !selectedService || !selectedDay || !selectedSlot) {
      setBookingError('Completá los pasos anteriores para confirmar el turno.');
      return;
    }
    const barber = selectedBarberInfo;
    const service = visibleServices.find((info) => info.id === selectedService) ?? null;
    const dayInfo = weekOptions.find((day) => day.id === selectedDay) ?? null;

    if (!service || !dayInfo) {
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/public/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            staffId: selectedBarber,
            date: dayInfo.id,
            slot: selectedSlot,
            durationMinutes: service.durationMinutes || barber?.slotDurationMinutes || 45,
            clientName: customerData.name,
            contact: customerData.phone || customerData.email,
            contactPhone: customerData.phone,
            contactEmail: customerData.email,
            serviceId: service.id,
            service: service.name,
            serviceCategory: service.category || service.id,
            notes: customerData.notes,
          }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message || 'No pudimos reservar el turno. Intentá de nuevo.');
      }

      onProceedToPayment({
        barber,
        service,
        schedule: {
          isoDate: dayInfo.date.toISOString(),
          weekday: dayInfo.weekday,
          label: dayInfo.label,
          slot: selectedSlot,
        },
        customer: customerData,
        booking: payload.booking,
        reservationWindowMinutes: payload.reservationWindowMinutes ?? 60,
      });
    } catch (error) {
      console.error('[Public] Error al crear turno', error);
      setBookingError(error.message || 'No pudimos reservar el turno. Intentá de nuevo.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const hasBarbers = Array.isArray(barbers) && barbers.length > 0;
  const hasServices = Array.isArray(visibleServices) && visibleServices.length > 0;
  const showCarousel = !isLoadingBarbers && hasBarbers;

  return (
    <div className="booking-page">
      <header className="booking-header">
        <div className="booking-header-content">
          <button type="button" className="secondary-link" onClick={onBack}>
            ← Volver al inicio
          </button>
          <h1>Reservá tu turno</h1>
          <p>
            Completá cada paso para confirmar tu turno. Empezá eligiendo con quién querés atenderte y vas a
            desbloquear las siguientes secciones.
          </p>
        </div>
      </header>
      <section className={`booking-section ${activeStep === 1 ? 'is-active' : 'is-completed'}`} aria-disabled={activeStep > 1}>
        <div className="booking-section-header">
          <span className="step-indicator">Paso 1</span>
          <div className="booking-section-heading">
            <h2>Elegí tu peluquero/a</h2>
            <p>Seleccioná a la persona con la que querés reservar tu turno.</p>
          </div>
        </div>
        <div className="barber-carousel">
          <button
            type="button"
            className={`barber-nav barber-nav-left${showCarousel && canScrollBarberLeft ? '' : ' is-hidden'}`}
            onClick={() => handleScrollBarberList(-1)}
            aria-label="Ver peluquero anterior"
            disabled={!showCarousel || !canScrollBarberLeft}
          >
            <span aria-hidden>‹</span>
          </button>
          <div className="barber-grid" ref={barberListRef}>
            {isLoadingBarbers ? (
              <div className="booking-status">Cargando peluqueros...</div>
            ) : hasBarbers ? (
              barbers.map((barber) => (
                <button
                  key={barber.id}
                  type="button"
                  className={`barber-card ${selectedBarber === barber.id ? 'is-selected' : ''}`}
                  onClick={() => handleSelectBarber(barber.id)}
                  data-barber-id={barber.id}
                >
                  <div className="barber-avatar">
                    <img
                      src={barber.avatar || DEFAULT_STAFF_AVATAR}
                      alt={barber.name}
                      loading="lazy"
                    />
                  </div>
                  <span>{barber.name}</span>
                </button>
              ))
            ) : (
              <div className="booking-status is-empty">
                <p>Por ahora no hay peluqueros disponibles.</p>
                {onRetryBarbers && (
                  <button type="button" className="secondary-link" onClick={onRetryBarbers}>
                    Reintentar
                  </button>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className={`barber-nav barber-nav-right${showCarousel && canScrollBarberRight ? '' : ' is-hidden'}`}
            onClick={() => handleScrollBarberList(1)}
            aria-label="Ver peluquero siguiente"
            disabled={!showCarousel || !canScrollBarberRight}
          >
            <span aria-hidden>›</span>
          </button>
        </div>
        {barbersError && (
          <div className="booking-alert">
            <p>{barbersError}</p>
            {onRetryBarbers && (
              <button type="button" className="secondary-link" onClick={onRetryBarbers}>
                Reintentar
              </button>
            )}
          </div>
        )}
      </section>
      {activeStep >= 2 && (
        <section
          className={`booking-section ${activeStep === 2 ? 'is-active' : activeStep > 2 ? 'is-completed' : ''}`}
          ref={serviceSectionRef}
        >
          <div className="booking-section-header">
            <span className="step-indicator">Paso 2</span>
            <div className="booking-section-heading">
              <h2>Seleccioná tu servicio</h2>
              <p>Elegí el tipo de turno que querés reservar antes de definir fecha y horario.</p>
            </div>
            <button type="button" className="secondary-link" onClick={() => setActiveStep(1)}>
              ← Cambiar peluquero/a
            </button>
          </div>
          <div className="service-carousel">
            <button
              type="button"
              className={`service-nav service-nav-left${canScrollServiceLeft ? '' : ' is-hidden'}`}
              onClick={() => handleScrollServiceList(-1)}
              aria-label="Ver servicio anterior"
              disabled={!canScrollServiceLeft}
            >
              <span aria-hidden>‹</span>
            </button>
            <div className="service-option-grid service-grid" ref={serviceListRef}>
              {isLoadingServices ? (
                <div className="booking-status">Cargando servicios...</div>
              ) : hasServices ? (
                visibleServices.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`service-option ${selectedService === service.id ? 'is-selected' : ''}`}
                    onClick={() => handleSelectService(service.id)}
                  >
                    <div className="service-option-header">
                      <h3>{service.name}</h3>
                      <span>{service.price}</span>
                    </div>
                    <p>{service.description}</p>
                  </button>
                ))
              ) : (
                <div className="booking-status is-empty">
                  <p>Este profesional no tiene servicios disponibles para reserva online.</p>
                  {onRetryServices && (
                    <button type="button" className="secondary-link" onClick={onRetryServices}>
                      Reintentar
                    </button>
                  )}
                </div>
              )}
            </div>
            <button
              type="button"
              className={`service-nav service-nav-right${canScrollServiceRight ? '' : ' is-hidden'}`}
              onClick={() => handleScrollServiceList(1)}
              aria-label="Ver servicio siguiente"
              disabled={!canScrollServiceRight}
            >
              <span aria-hidden>›</span>
            </button>
          </div>
          {servicesError && (
            <div className="booking-alert">
              <p>{servicesError}</p>
              <button type="button" className="secondary-link" onClick={onRetryServices}>
                Reintentar
              </button>
            </div>
          )}
        </section>
      )}
      {activeStep >= 3 && (
        <section
          className={`booking-section ${activeStep === 3 ? 'is-active' : activeStep > 3 ? 'is-completed' : ''}`}
          ref={scheduleSectionRef}
        >
          <div className="booking-section-header">
            <span className="step-indicator">Paso 3</span>
            <div className="booking-section-heading">
              <h2>Elegí el día y horario</h2>
              <p>Primero seleccioná el día disponible y luego elegí el horario que mejor te quede.</p>
            </div>
            <button type="button" className="secondary-link" onClick={() => setActiveStep(2)}>
              ← Cambiar servicio
            </button>
          </div>
          <div className="week-carousel">
            <button
              type="button"
              className={`week-nav week-nav-left${canScrollWeekLeft ? '' : ' is-hidden'}`}
              onClick={() => handleScrollWeekList(-1)}
              aria-label="Ver día anterior"
              disabled={!canScrollWeekLeft}
            >
              <span aria-hidden>‹</span>
            </button>
            <div className="week-grid week-grid-scroll" ref={weekListRef}>
              {weekOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`day-card ${selectedDay === option.id ? 'is-selected' : ''}`}
                  onClick={() => handleSelectDay(option.id)}
                >
                  <span className="day-title">{option.weekday}</span>
                  <span className="day-date">{option.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`week-nav week-nav-right${canScrollWeekRight ? '' : ' is-hidden'}`}
              onClick={() => handleScrollWeekList(1)}
              aria-label="Ver día siguiente"
              disabled={!canScrollWeekRight}
            >
              <span aria-hidden>›</span>
            </button>
          </div>
        {selectedDay && (
          <div className="slot-grid">
            {slotsLoading ? (
              <div className="booking-status">Cargando horarios...</div>
            ) : slotsError ? (
              <div className="booking-status is-empty">{slotsError}</div>
            ) : availableSlots.length ? (
              availableSlots.map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot-card ${selectedSlot === slot ? 'is-selected' : ''}`}
                  onClick={() => handleSelectSlot(slot)}
                >
                  {slot}
                </button>
              ))
            ) : (
              <div className="booking-status is-empty">Sin horarios disponibles para este día.</div>
            )}
          </div>
        )}
        </section>
      )}
      {activeStep >= 4 && (
        <section
          className={`booking-section ${activeStep === 4 ? 'is-active' : ''}`}
          ref={customerSectionRef}
        >
          <div className="booking-section-header">
            <span className="step-indicator">Paso 4</span>
            <div className="booking-section-heading">
              <h2>Ingresá tus datos</h2>
              <p>Necesitamos tus datos para confirmar el turno y enviarte la información de pago.</p>
            </div>
            <button type="button" className="secondary-link" onClick={() => setActiveStep(3)}>
              ← Cambiar horario
            </button>
          </div>
          <form className="customer-form">
            <label className="form-field">
              <span>Nombre y apellido</span>
              <input
                type="text"
                value={customerData.name}
                onChange={(event) => handleChangeCustomerData('name', event.target.value)}
                placeholder="Ej: Valentina García"
              />
            </label>
            <label className="form-field">
              <span>Celular</span>
              <input
                type="tel"
                value={customerData.phone}
                onChange={(event) => handleChangeCustomerData('phone', event.target.value)}
                onBlur={() => handleFieldBlur('phone')}
                placeholder="Ej: 3515551234"
                className={fieldErrors.phone ? 'input-error' : undefined}
              />
              <small>Ingresalo sin 0 en el código de área y sin el 15 inicial.</small>
              {fieldErrors.phone ? (
                <small className="field-error" role="alert">
                  {fieldErrors.phone}
                </small>
              ) : null}
            </label>
            <label className="form-field">
              <span>Correo electrónico</span>
              <input
                type="email"
                value={customerData.email}
                onChange={(event) => handleChangeCustomerData('email', event.target.value)}
                onBlur={() => handleFieldBlur('email')}
                placeholder="Ej: nombre@correo.com"
                className={fieldErrors.email ? 'input-error' : undefined}
              />
              {fieldErrors.email ? (
                <small className="field-error" role="alert">
                  {fieldErrors.email}
                </small>
              ) : null}
            </label>
            <label className="form-field">
              <span>Observaciones</span>
              <textarea
                rows={4}
                value={customerData.notes}
                onChange={(event) => handleChangeCustomerData('notes', event.target.value)}
                placeholder="En caso de que debamos saber algo antes de tu turno, escribilo acá"
              />
            </label>
            <button
              type="button"
              className="button form-submit"
              onClick={handleProceedToPayment}
              disabled={
                isSubmittingBooking ||
                !selectedSlot ||
                !customerData.name ||
                !customerData.phone ||
                !customerData.email ||
                Boolean(fieldErrors.phone) ||
                Boolean(fieldErrors.email)
              }
            >
              {isSubmittingBooking ? 'Reservando...' : 'Ir a pagar'}
            </button>
            {bookingError && <p className="form-error">{bookingError}</p>}
          </form>
        </section>
      )}
    </div>
  );
}

function Checkout({ data, onBack, onReturnHome, branding }) {
  const paymentMethods = useMemo(
    () => [
      {
        id: 'transferencia',
        label: 'Transferencia',
        detailsList: buildTransferDetails(branding),
        details: 'Una vez realizada la transferencia, enviar el comprobante por whatsapp.',
      },
    ],
    [branding]
  );
  const [method, setMethod] = useState(paymentMethods[0].id);
  const activeMethod = paymentMethods.find((item) => item.id === method) ?? paymentMethods[0];
  const paymentListRef = useRef(null);
  const [canScrollPaymentLeft, setCanScrollPaymentLeft] = useState(false);
  const [canScrollPaymentRight, setCanScrollPaymentRight] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const updatePaymentScrollState = useCallback(() => {
    const container = paymentListRef.current;
    if (!container) {
      setCanScrollPaymentLeft(false);
      setCanScrollPaymentRight(false);
      return;
    }
    const { scrollLeft, scrollWidth, clientWidth } = container;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);
    setCanScrollPaymentLeft(scrollLeft > 6);
    setCanScrollPaymentRight(scrollLeft < maxScrollLeft - 6);
  }, []);

  useEffect(() => {
    const container = paymentListRef.current;
    if (!container) {
      updatePaymentScrollState();
      return;
    }
    updatePaymentScrollState();
    container.addEventListener('scroll', updatePaymentScrollState, { passive: true });
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updatePaymentScrollState);
    }
    return () => {
      container.removeEventListener('scroll', updatePaymentScrollState);
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updatePaymentScrollState);
      }
    };
  }, [updatePaymentScrollState]);

  useEffect(() => {
    const container = paymentListRef.current;
    if (!container) {
      return;
    }
    const active = container.querySelector(`.payment-method[data-method-id="${method}"]`);
    if (active) {
      active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => updatePaymentScrollState());
    } else {
      updatePaymentScrollState();
    }
  }, [method, updatePaymentScrollState]);

  const handleScrollPaymentList = (direction) => {
    const container = paymentListRef.current;
    if (!container) {
      return;
    }
    const firstCard = container.querySelector('.payment-method');
    const cardRect = firstCard?.getBoundingClientRect();

    let gapValue = 0;
    if (typeof window !== 'undefined') {
      const styles = window.getComputedStyle(container);
      const rawGap = styles.columnGap || styles.gap || '0';
      gapValue = parseFloat(rawGap) || 0;
    }

    const scrollAmount = (cardRect?.width ?? container.clientWidth * 0.8) + gapValue;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });

    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.setTimeout(updatePaymentScrollState, 320);
      });
    } else {
      updatePaymentScrollState();
    }
  };

  const handlePay = async () => {
    if (!data?.service) return;
    setPaymentError(null);
    setIsPaying(true);

    try {
      const whatsappDigits = String(branding?.whatsappPhone || '').replace(/\D/g, '');
      if (!whatsappDigits) {
        throw new Error('Falta configurar el WhatsApp de contacto del comercio.');
      }

      const prefillMessage =
        `Hola. Te envío el comprobante de transferencia de mi turno.\n` +
        `Servicio: ${data?.service?.name || 'Turno'}\n` +
        `Fecha y hora: ${data?.schedule?.weekday || ''} ${data?.schedule?.label || ''} ${data?.schedule?.slot || ''}\n` +
        `Cliente: ${data?.customer?.name || ''}`;

      const whatsappLink = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(prefillMessage)}`;
      window.open(whatsappLink, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('[Public] Error al abrir WhatsApp', error);
      setPaymentError(error.message || 'No pudimos abrir WhatsApp.');
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="checkout-page">
      <header className="checkout-header">
        <div className="checkout-header-top">
          <button type="button" className="secondary-link" onClick={onBack}>
            ← Volver al turno
          </button>
          <button type="button" className="secondary-link" onClick={onReturnHome}>
            Ir al inicio
          </button>
        </div>
        <div className="checkout-header-body">
          <h1>Confirmá tu pago</h1>
          <p>Revisá el resumen y elegí cómo querés pagar tu turno.</p>
        </div>
      </header>
      <div className="checkout-grid">
        <section className="checkout-card">
          <h2>Resumen del turno</h2>
          <ul className="checkout-summary-list">
            {data?.service && (
              <li>
                <span>Servicio</span>
                <strong>{data.service.name}</strong>
                <small>{data.service.price}</small>
              </li>
            )}
            {data?.barber && (
              <li>
                <span>Peluquero/a</span>
                <strong>{data.barber.name}</strong>
              </li>
            )}
            {data?.schedule && (
              <li>
                <span>Horario</span>
                <strong>
                  {data.schedule.weekday.toUpperCase()} · {data.schedule.label} · {data.schedule.slot} hs
                </strong>
              </li>
            )}
            {data?.customer?.name && (
              <li>
                <span>Cliente</span>
                <strong>{data.customer.name}</strong>
                <small>{data.customer.email}</small>
              </li>
            )}
          </ul>
        </section>
        <section className="checkout-card">
          <h2>Método de pago</h2>
          <div className="booking-alert">
            <p>
              <strong>Estado del turno: Pendiente.</strong> Tu turno quedó solicitado. Para
              confirmarlo, realizá la transferencia y enviá el comprobante.
            </p>
            <p>
              A la brevedad vamos a revisar el comprobante y confirmarte el turno por WhatsApp o
              email. Hasta que recibas ese aviso, el turno figura como "Pendiente".
            </p>
          </div>
          <div className="payment-method-carousel">
            <button
              type="button"
              className={`payment-nav payment-nav-left${canScrollPaymentLeft ? '' : ' is-hidden'}`}
              onClick={() => handleScrollPaymentList(-1)}
              aria-label="Ver método anterior"
              disabled={!canScrollPaymentLeft}
            >
              <span aria-hidden>‹</span>
            </button>
            <div className="payment-method-list" role="tablist" ref={paymentListRef}>
              {paymentMethods.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`payment-method ${method === item.id ? 'is-selected' : ''}`}
                  data-method-id={item.id}
                  onClick={() => setMethod(item.id)}
                >
                  <div>
                    <h3>{item.label}</h3>
                    {item.detailsList?.length ? (
                      <p className="payment-method-transfer-lines">
                        {item.detailsList.map((line) => (
                          <span key={line.label}>
                            <strong>{line.label}:</strong> {line.value}
                          </span>
                        ))}
                      </p>
                    ) : (
                      <p>Completá los datos de transferencia desde el panel admin.</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`payment-nav payment-nav-right${canScrollPaymentRight ? '' : ' is-hidden'}`}
              onClick={() => handleScrollPaymentList(1)}
              aria-label="Ver método siguiente"
              disabled={!canScrollPaymentRight}
            >
              <span aria-hidden>›</span>
            </button>
          </div>
          <div className="payment-method-details">
            <h3>Pasos para pagar</h3>
            <p>{activeMethod.details}</p>
            <button
              type="button"
              className="button"
              style={{ marginTop: '1.5rem' }}
              onClick={handlePay}
              disabled={isPaying}
            >
              {isPaying ? 'Abriendo WhatsApp...' : 'Enviar comprobante'}
            </button>
            {paymentError ? <p className="form-error">{paymentError}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function Footer({ isBooking, footerLogoUrl }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-logo">
          <img src={footerLogoUrl} alt="Aaron Cordoba Barbería y Peluquería" />
        </div>
        {!isBooking && (
          <div className="footer-links">
            <a href="#servicios">Servicios</a>
            <a href="#como-funciona">Cómo funciona</a>
            <a href="#reseñas">Reseñas</a>
            <a href="#contacto">Contacto</a>
          </div>
        )}
        <div>© {currentYear} TurnApp. Todos los derechos reservados.</div>
      </div>
    </footer>
  );
}

function App() {
  const [view, setView] = useState('home');
  const [checkoutData, setCheckoutData] = useState(null);
  const [branding, setBranding] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_BRANDING.themePreference;
    }
    const storedTheme = window.localStorage.getItem(PUBLIC_THEME_STORAGE_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
    return DEFAULT_BRANDING.themePreference;
  });
  const isFlow = view === 'booking' || view === 'checkout';
  const isHomeView = view === 'home';
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const heroReserveButtonRef = useRef(null);
  const [barbers, setBarbers] = useState([]);
  const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
  const [barbersError, setBarbersError] = useState(null);
  const [bookingServices, setBookingServices] = useState([]);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState(null);
  const navbarLogoUrl = branding?.navbarLogoUrl || DEFAULT_BRANDING.navbarLogoUrl;
  const footerLogoUrl = branding?.footerLogoUrl || DEFAULT_BRANDING.footerLogoUrl;
  const heroImageUrl = branding?.heroImageUrl || DEFAULT_BRANDING.heroImageUrl;
  const locationAddress = branding?.locationAddress || DEFAULT_BRANDING.locationAddress || SALON_LOCATION.address;
  const businessHours = branding?.businessHours || DEFAULT_BRANDING.businessHours || SALON_LOCATION.schedule;
  const whatsappPhone = branding?.whatsappPhone || DEFAULT_BRANDING.whatsappPhone || '';

  useEffect(() => {
    applyBrandingVariables(branding || DEFAULT_BRANDING);
  }, [branding]);

  useEffect(() => {
    const controller = new AbortController();

    const loadBranding = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/public/branding`, { signal: controller.signal });
        if (!response.ok) return;
        const payload = await response.json();
        if (!controller.signal.aborted) {
          setBranding(payload?.branding ?? null);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('[Public] Error al cargar branding', error);
        }
      }
    };

    loadBranding();
    return () => controller.abort();
  }, []);
  const loadBarbers = useCallback(
    async (signal) => {
      const controllerSignal = signal;
      setIsLoadingBarbers(true);
      setBarbersError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/public/staff`, controllerSignal ? { signal: controllerSignal } : undefined);
        if (!response.ok) {
          throw new Error('No se pudo cargar la lista de peluqueros.');
        }
        const data = await response.json();
        if (!controllerSignal?.aborted) {
          const payload = Array.isArray(data?.staff) ? data.staff : [];
          setBarbers(payload.map((item) => ({ ...item, avatar: item.avatar || DEFAULT_STAFF_AVATAR })));
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          return;
        }
        console.error('[Public] Error al cargar peluqueros', error);
        if (!controllerSignal?.aborted) {
          setBarbers(
            DEFAULT_BARBERS.map((item) => ({
              ...item,
              avatar: item.avatar || DEFAULT_STAFF_AVATAR,
            }))
          );
          setBarbersError('No pudimos cargar el equipo desde el panel. Mostramos un listado demo.');
        }
      } finally {
        if (!controllerSignal?.aborted) {
          setIsLoadingBarbers(false);
        }
      }
    },
    []
  );

  const loadServices = useCallback(async (signal) => {
    const controllerSignal = signal;
    setIsLoadingServices(true);
    setServicesError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/public/services`,
        controllerSignal ? { signal: controllerSignal } : undefined
      );
      if (!response.ok) {
        throw new Error('No se pudo cargar la lista de servicios.');
      }
      const data = await response.json();
      if (!controllerSignal?.aborted) {
        const payload = Array.isArray(data?.services) ? data.services : [];
        const normalized = payload
          .filter((item) => item?.active !== false)
          .map((item) => ({
            ...item,
            priceValue: item.price,
            price: formatCurrency(item.price),
          }));
        setBookingServices(normalized);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      console.error('[Public] Error al cargar servicios', error);
      if (!controllerSignal?.aborted) {
        setBookingServices([]);
        setServicesError('No pudimos cargar los servicios desde el panel. Intentá de nuevo.');
      }
    } finally {
      if (!controllerSignal?.aborted) {
        setIsLoadingServices(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadBarbers(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadBarbers]);

  useEffect(() => {
    const controller = new AbortController();
    loadServices(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadServices]);

  const handleReloadBarbers = useCallback(() => {
    loadBarbers();
  }, [loadBarbers]);

  const handleReloadServices = useCallback(() => {
    loadServices();
  }, [loadServices]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('is-dark-mode', theme === 'dark');
    const primaryColor = branding?.primaryColor || DEFAULT_BRANDING.primaryColor;
    applyDarkThemeOverrides(primaryColor, theme);
  }, [theme, branding]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(PUBLIC_THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    if (view !== 'home') {
      setShowFloatingCTA(false);
      return;
    }

    const buttonEl = heroReserveButtonRef.current;
    const contactSection = document.querySelector('#contacto');
    if (!buttonEl || typeof IntersectionObserver === 'undefined') {
      setShowFloatingCTA(false);
      return;
    }

    let heroButtonVisible = true;
    let contactVisible = false;

    const updateVisibility = () => {
      setShowFloatingCTA(!heroButtonVisible && !contactVisible);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target === buttonEl) {
          heroButtonVisible = entry.isIntersecting;
        }
        if (entry.target === contactSection) {
          contactVisible = entry.isIntersecting;
        }
      });
      updateVisibility();
    }, { threshold: 0.4 });

    observer.observe(buttonEl);
    if (contactSection) {
      observer.observe(contactSection);
    }

    updateVisibility();

    return () => {
      observer.disconnect();
    };
  }, [view]);

  const handleReserveClick = () => {
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateHome = () => {
    setView('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToPayment = (data) => {
    setCheckoutData(data);
    setView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToBooking = () => {
    setView('booking');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="main-shell">
      <Navbar
        onReserveClick={handleReserveClick}
        onNavigateHome={handleNavigateHome}
        isBooking={isFlow}
        logoUrl={navbarLogoUrl}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />
      <main className={`main-content${isHomeView && showFloatingCTA ? ' has-floating-cta' : ''}`}>
        {view === 'booking' ? (
          <BookingFlow
            onBack={handleNavigateHome}
            onProceedToPayment={handleProceedToPayment}
            barbers={barbers}
            isLoadingBarbers={isLoadingBarbers}
            barbersError={barbersError}
            onRetryBarbers={handleReloadBarbers}
            bookingServices={bookingServices}
            isLoadingServices={isLoadingServices}
            servicesError={servicesError}
            onRetryServices={handleReloadServices}
          />
        ) : view === 'checkout' ? (
          <Checkout
            data={checkoutData}
            onBack={handleBackToBooking}
            onReturnHome={handleNavigateHome}
            branding={branding}
          />
        ) : (
          <>
            <Hero
              onReserveClick={handleReserveClick}
              reserveButtonRef={heroReserveButtonRef}
              heroImageUrl={heroImageUrl}
            />
            <Services branding={branding} />
            <HowItWorks />
            <Testimonials />
            <CallToAction
              onReserveClick={handleReserveClick}
              locationAddress={locationAddress}
              businessHours={businessHours}
              whatsappPhone={whatsappPhone}
            />
          </>
        )}
      </main>
      {isHomeView && showFloatingCTA && <FloatingReserveCTA onClick={handleReserveClick} />}
      <Footer isBooking={isFlow} footerLogoUrl={footerLogoUrl} />
    </div>
  );
}

export default App;
