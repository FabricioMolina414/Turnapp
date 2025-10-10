import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import brandLogo from './assets/Logo_AC-removebg-preview.png';

const SERVICE_CATEGORIES = {
  peluqueria: {
    label: 'Peluquería',
    services: [
      {
        name: 'Corte & Styling',
        description: 'Cortes personalizados, brushing y peinados para cada ocasión.',
        duration: '45 min',
        price: '$6.500',
      },
      {
        name: 'Color Experto',
        description: 'Balayage, iluminaciones y color global con diagnóstico previo.',
        duration: '120 min',
        price: 'Desde $18.000',
      },
      {
        name: 'Tratamientos Capilares',
        description: 'Shock de keratina, nutrición profunda y terapias hidratantes.',
        duration: '60 min',
        price: '$10.500',
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

const BOOKING_SERVICES = [
  {
    id: 'corte',
    name: 'Corte clásico',
    description: 'Lavado, corte y styling personalizado para tu día a día.',
    price: '$6.500',
  },
  {
    id: 'corte-barba',
    name: 'Corte + barba',
    description: 'Perfeccionamos tu corte y definimos barba con navaja y vapor.',
    price: '$9.200',
  },
  {
    id: 'barba',
    name: 'Barba & perfilado',
    description: 'Diseño y mantenimiento de barba, contornos y humectación.',
    price: '$4.800',
  },
  {
    id: 'cejas',
    name: 'Cejas perfectas',
    description: 'Perfilado, pulido y fijación para cejas simétricas.',
    price: '$3.100',
  },
  {
    id: 'tratamiento',
    name: 'Tratamiento capilar',
    description: 'Shock de nutrición profunda para devolver brillo y suavidad.',
    price: '$11.000',
  },
];

const BARBERS = [
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

const THEME_STORAGE_KEY = 'turnapp-theme';

const getPreferredTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  const systemPrefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return systemPrefersDark ? 'dark' : 'light';
};

const getSlotsForDate = (date) => {
  const day = date.getDay();
  if (day === 0) return DAILY_SLOTS.sunday;
  if (day === 6) return DAILY_SLOTS.saturday;
  return DAILY_SLOTS.weekday;
};

const PAYMENT_METHODS = [
  {
    id: 'qr',
    label: 'QR',
    description: 'Te mostramos un código para que pagues con cualquier billetera compatible.',
    details: 'El QR expira en 10 minutos. Tené tu app lista antes de escanearlo.',
  },
  {
    id: 'mercado-pago',
    label: 'Mercado Pago',
    description: 'Iniciá sesión en tu cuenta de Mercado Pago y pagá en cuotas o con dinero en cuenta.',
    details: 'Se aplican promociones bancarias disponibles al momento del pago.',
  },
  {
    id: 'transferencia',
    label: 'Transferencia bancaria',
    description: 'Te damos los datos de la cuenta para que completes la transferencia.',
    details: 'Recordá subir el comprobante para confirmar tu turno.',
  },
];

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

function Navbar({ onReserveClick, onNavigateHome, isBooking, theme, onToggleTheme }) {
  return (
    <header className="navbar">
      <button type="button" className="brand-button" onClick={onNavigateHome}>
        <img src={brandLogo} alt="Aaron Cordoba Barbería y Peluquería" />
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

function Hero({ onReserveClick, reserveButtonRef }) {
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
    <section className="section is-accent" id="inicio">
      <div className="container hero-grid stack-lg">
        <div className="stack-lg hero">
          <span className="badge">Turnero inteligente para salones</span>
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
          <img
            src="https://images.unsplash.com/photo-1522336572468-97b06e8ef143?auto=format&fit=crop&w=900&q=80"
            alt="Estilista trabajando con una clienta"
            loading="lazy"
          />
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

function Services({ onReserveClick }) {
  const [activeTab, setActiveTab] = useState('peluqueria');
  const services = useMemo(() => SERVICE_CATEGORIES[activeTab].services, [activeTab]);
  const serviceListRef = useRef(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide(0);
    if (serviceListRef.current) {
      serviceListRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [activeTab]);

  useEffect(() => {
    const listEl = serviceListRef.current;
    if (!listEl) return () => {};

    const handleScroll = () => {
      const isDesktop = window.matchMedia('(min-width: 720px)').matches;
      if (isDesktop) {
        setActiveSlide(0);
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
      if (!step) {
        return;
      }

      const rawIndex = Math.round((listEl.scrollLeft - baseOffset) / step);
      const clampedIndex = Math.min(cards.length - 1, Math.max(0, rawIndex));
      setActiveSlide((prev) => (prev === clampedIndex ? prev : clampedIndex));
    };

    handleScroll();
    listEl.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      listEl.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [services]);

  return (
    <section className="section is-contrast" id="servicios">
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
        <div className="tablist" role="tablist">
          {Object.entries(SERVICE_CATEGORIES).map(([key, info]) => (
            <button
              key={key}
              type="button"
              className={`tab ${activeTab === key ? 'is-active' : ''}`}
              onClick={() => setActiveTab(key)}
              role="tab"
              aria-selected={activeTab === key}
            >
              {info.label}
            </button>
          ))}
        </div>
        <div className="services-grid" role="tabpanel" ref={serviceListRef}>
          {services.map((service) => (
            <article key={service.name} className="service-card">
              <div className="service-tag">
                <span aria-hidden>●</span>
                {SERVICE_CATEGORIES[activeTab].label}
              </div>
              <div className="stack-sm">
                <h3>{service.name}</h3>
                <p>{service.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{service.price}</span>
                <span style={{ color: 'var(--neutral-600)', fontSize: '0.85rem' }}>{service.duration}</span>
              </div>
              <button className="button" type="button" style={{ alignSelf: 'flex-start' }} onClick={onReserveClick}>
                Reservar turno
              </button>
            </article>
          ))}
        </div>
        {services.length > 1 && (
          <div className="services-indicators" aria-hidden="true">
            {services.map((service, index) => (
              <span
                key={service.name}
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
    <section className="section is-accent" id="como-funciona">
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
    <section className="section is-contrast" id="reseñas">
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

function CallToAction({ onReserveClick }) {
  const mapQuery = `${SALON_LOCATION.latitude},${SALON_LOCATION.longitude}`;
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`;
  const mapsLink = `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;

  return (
    <section className="section" id="contacto">
      <div className="container">
        <div className="cta-card map-card">
          <div className="cta-map-info">
            <h2 className="headline cta-map-heading">Conocé nuestra ubicación y horarios</h2>
            <p className="cta-map-description">{SALON_LOCATION.address}</p>
            <p className="cta-map-schedule">{SALON_LOCATION.schedule}</p>
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

function BookingFlow({ onBack, onProceedToPayment }) {
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
  const [canScrollBarberLeft, setCanScrollBarberLeft] = useState(false);
  const [canScrollBarberRight, setCanScrollBarberRight] = useState(false);
  const [canScrollServiceLeft, setCanScrollServiceLeft] = useState(false);
  const [canScrollServiceRight, setCanScrollServiceRight] = useState(false);
  const [canScrollWeekLeft, setCanScrollWeekLeft] = useState(false);
  const [canScrollWeekRight, setCanScrollWeekRight] = useState(false);

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

  const handleProceedToPayment = () => {
    if (!selectedBarber || !selectedService || !selectedDay || !selectedSlot) {
      return;
    }
    const barber = BARBERS.find((info) => info.id === selectedBarber) ?? null;
    const service = BOOKING_SERVICES.find((info) => info.id === selectedService) ?? null;
    const dayInfo = weekOptions.find((day) => day.id === selectedDay) ?? null;

    if (!service || !dayInfo) {
      return;
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
    });
  };

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
            className={`barber-nav barber-nav-left${canScrollBarberLeft ? '' : ' is-hidden'}`}
            onClick={() => handleScrollBarberList(-1)}
            aria-label="Ver peluquero anterior"
            disabled={!canScrollBarberLeft}
          >
            <span aria-hidden>‹</span>
          </button>
          <div className="barber-grid" ref={barberListRef}>
            {BARBERS.map((barber) => (
              <button
                key={barber.id}
                type="button"
                className={`barber-card ${selectedBarber === barber.id ? 'is-selected' : ''}`}
                onClick={() => handleSelectBarber(barber.id)}
                data-barber-id={barber.id}
              >
                <div className="barber-avatar">
                  <img src={barber.avatar} alt={barber.name} loading="lazy" />
                </div>
                <span>{barber.name}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`barber-nav barber-nav-right${canScrollBarberRight ? '' : ' is-hidden'}`}
            onClick={() => handleScrollBarberList(1)}
            aria-label="Ver peluquero siguiente"
            disabled={!canScrollBarberRight}
          >
            <span aria-hidden>›</span>
          </button>
        </div>
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
              {BOOKING_SERVICES.map((service) => (
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
              ))}
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
              {getSlotsForDate(weekOptions.find((day) => day.id === selectedDay)?.date ?? new Date()).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className={`slot-card ${selectedSlot === slot ? 'is-selected' : ''}`}
                  onClick={() => handleSelectSlot(slot)}
                >
                  {slot}
                </button>
              ))}
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
                !selectedSlot ||
                !customerData.name ||
                !customerData.phone ||
                !customerData.email ||
                Boolean(fieldErrors.phone) ||
                Boolean(fieldErrors.email)
              }
            >
              Ir a pagar
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function Checkout({ data, onBack, onReturnHome }) {
  const [method, setMethod] = useState(PAYMENT_METHODS[0].id);
  const activeMethod = PAYMENT_METHODS.find((item) => item.id === method) ?? PAYMENT_METHODS[0];
  const paymentListRef = useRef(null);
  const [canScrollPaymentLeft, setCanScrollPaymentLeft] = useState(false);
  const [canScrollPaymentRight, setCanScrollPaymentRight] = useState(false);

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
              {PAYMENT_METHODS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`payment-method ${method === item.id ? 'is-selected' : ''}`}
                  data-method-id={item.id}
                  onClick={() => setMethod(item.id)}
                >
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.description}</p>
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
            <button type="button" className="button" style={{ marginTop: '1.5rem' }}>
              Simular pago con {activeMethod.label}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Footer({ isBooking }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-content">
        <div className="footer-logo">
          <img src={brandLogo} alt="Aaron Cordoba Barbería y Peluquería" />
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
  const [theme, setTheme] = useState(() => {
    const preferred = getPreferredTheme();
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.theme = preferred;
      document.documentElement.classList.toggle('is-dark-mode', preferred === 'dark');
    }
    return preferred;
  });
  const isFlow = view === 'booking' || view === 'checkout';
  const isHomeView = view === 'home';
  const [showFloatingCTA, setShowFloatingCTA] = useState(false);
  const heroReserveButtonRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('is-dark-mode', theme === 'dark');
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
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

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="main-shell">
      <Navbar
        onReserveClick={handleReserveClick}
        onNavigateHome={handleNavigateHome}
        isBooking={isFlow}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <main className={`main-content${isHomeView && showFloatingCTA ? ' has-floating-cta' : ''}`}>
        {view === 'booking' ? (
          <BookingFlow onBack={handleNavigateHome} onProceedToPayment={handleProceedToPayment} />
        ) : view === 'checkout' ? (
          <Checkout data={checkoutData} onBack={handleBackToBooking} onReturnHome={handleNavigateHome} />
        ) : (
          <>
            <Hero onReserveClick={handleReserveClick} reserveButtonRef={heroReserveButtonRef} />
            <Services onReserveClick={handleReserveClick} />
            <HowItWorks />
            <Testimonials />
            <CallToAction onReserveClick={handleReserveClick} />
          </>
        )}
      </main>
      {isHomeView && showFloatingCTA && <FloatingReserveCTA onClick={handleReserveClick} />}
      <Footer isBooking={isFlow} />
    </div>
  );
}

export default App;
