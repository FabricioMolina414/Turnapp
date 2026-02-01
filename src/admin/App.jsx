import { useCallback, useEffect, useMemo, useState } from 'react';
import brandLogo from '../assets/Logo_AC-removebg-preview.png';
import { useAuth } from './context/AuthContext.jsx';
import LoginView from './components/LoginView.jsx';
import { fetchWeeklySchedule, fetchMonthSummary, cancelAppointment } from './api/appointments.js';
import { fetchMonthlyMetrics } from './api/metrics.js';
import { fetchServices, createService, updateService, deleteService } from './api/services.js';
import { fetchBranding, saveBranding } from './api/branding.js';
import {
  fetchStaff,
  createStaffMember,
  deleteStaffMember,
  updateStaffSchedule,
  updateStaffMember,
} from './api/staff.js';
import { fetchAdmins, createAdmin, updateAdminRole } from './api/superadmin.js';

const DEFAULT_STAFF_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="%23f1f5f9"/><circle cx="64" cy="52" r="26" fill="%2394a3b8"/><path d="M24 112c0-22 18-40 40-40s40 18 40 40" fill="%23cbd5f5"/></svg>';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Panel general', roles: ['admin', 'staff', 'superadmin'] },
  { id: 'turnos', label: 'Turnos', roles: ['admin', 'staff', 'superadmin'] },
  { id: 'services', label: 'Mis servicios', roles: ['admin', 'superadmin'] },
  { id: 'branding', label: 'Mi comercio', roles: ['admin', 'superadmin'] },
  { id: 'admins', label: 'Administradores', roles: ['superadmin'] },
];

const currencyFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
  maximumFractionDigits: 0,
});

const weekdayFormatter = new Intl.DateTimeFormat('es-AR', { weekday: 'long' });
const shortDayFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' });
const longDateFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long' });
const weekRangeFormatter = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

const DEFAULT_BRANDING = {
  primaryColor: '#f97316',
  accentColor: '#ea580c',
  themePreference: 'light',
  heroImageUrl: '',
  navbarLogoUrl: '',
  footerLogoUrl: '',
  locationAddress: '',
  highlightMessage: 'Agendá tu turno en línea y recibí la confirmación al instante.',
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
  root.style.setProperty('--brand-500-rgb', toRgbString(primaryRgb));
  root.style.setProperty('--brand-600-rgb', toRgbString(accentRgb));
  root.style.setProperty('--focus-outline', `2px solid rgba(${toRgbString(primaryRgb)}, 0.4)`);
  root.style.setProperty('--surface-highlight', `rgba(${toRgbString(primaryRgb)}, 0.12)`);
  root.style.setProperty('--surface-highlight-strong', `rgba(${toRgbString(primaryRgb)}, 0.28)`);
  root.style.setProperty('--shadow-xl', `0 30px 60px rgba(${toRgbString(accentRgb)}, 0.25)`);
  root.style.setProperty('--shadow-hero', `0 25px 50px rgba(${toRgbString(accentRgb)}, 0.3)`);
  root.style.setProperty('--cta-hover-text', isAccentWhite ? 'var(--surface-100)' : '#ffffff');
};

const EMPTY_STAFF_FORM = {
  name: '',
  role: '',
  availabilityDays: [1, 2, 3, 4, 5, 6, 0],
  specialties: '',
  avatar: '',
  scheduleMode: 'continuous',
  defaultStart: '09:00',
  defaultEnd: '17:00',
  shift1Start: '09:00',
  shift1End: '13:00',
  shift2Start: '15:00',
  shift2End: '19:00',
  slotDurationMinutes: 45,
};

const WEEK_DAYS = [
  { value: 1, label: 'Lun', full: 'Lunes' },
  { value: 2, label: 'Mar', full: 'Martes' },
  { value: 3, label: 'Mie', full: 'Miércoles' },
  { value: 4, label: 'Jue', full: 'Jueves' },
  { value: 5, label: 'Vie', full: 'Viernes' },
  { value: 6, label: 'Sab', full: 'Sábado' },
  { value: 0, label: 'Dom', full: 'Domingo' },
];

function parseAvailabilityDays(text) {
  if (!text || typeof text !== 'string') return null;
  const normalized = text.toLowerCase();
  const matches = WEEK_DAYS.filter((day) => normalized.includes(day.full.toLowerCase()));
  if (matches.length) {
    return matches.map((day) => day.value);
  }
  return null;
}

function formatAvailabilityLabel(days, schedule) {
  const dayLabels = WEEK_DAYS.filter((day) => days.includes(day.value)).map((day) => day.full);
  const dayText = dayLabels.length ? dayLabels.join(', ') : 'Sin días';
  if (schedule?.mode === 'split') {
    const shift1 = schedule.shift1Start && schedule.shift1End ? `${schedule.shift1Start} a ${schedule.shift1End}` : '';
    const shift2 = schedule.shift2Start && schedule.shift2End ? `${schedule.shift2Start} a ${schedule.shift2End}` : '';
    const shiftText = [shift1, shift2].filter(Boolean).join(' y ');
    return `${dayText} · ${shiftText}`;
  }
  const start = schedule?.defaultStart || '09:00';
  const end = schedule?.defaultEnd || '17:00';
  return `${dayText} · ${start} a ${end}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('FILE_READ_ERROR'));
    reader.readAsDataURL(file);
  });
}

function formatAvailabilityDays(days) {
  const dayLabels = WEEK_DAYS.filter((day) => days.includes(day.value)).map((day) => day.full);
  return dayLabels.join(', ');
}

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

function ThemeToggle({ theme, onToggle, disabled = false }) {
  const isDark = theme === 'dark';
  return (
    <button
      type="button"
      className={`theme-toggle ${isDark ? 'is-dark' : ''}`}
      onClick={disabled ? undefined : onToggle}
      role="switch"
      aria-checked={isDark}
      aria-disabled={disabled}
      aria-busy={disabled}
      disabled={disabled}
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

const EMPTY_SERVICE_FORM = {
  id: null,
  name: '',
  category: '',
  durationMinutes: 45,
  price: 0,
  professionals: [],
  description: '',
  active: true,
};

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStartOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildWeeklySchedule(scheduleMap, referenceDate = new Date()) {
  const start = getStartOfDay(referenceDate);

  return Array.from({ length: 7 }, (_, index) => {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + index);
    const isoDate = currentDate.toISOString().split('T')[0];
    const appointments = scheduleMap?.[isoDate] ?? [];

    const metrics = appointments.reduce(
      (acc, appointment) => {
        const statusKey = appointment.status ?? 'otros';
        return {
          ...acc,
          total: acc.total + 1,
          revenue: acc.revenue + (appointment.price || 0),
          [statusKey]: (acc[statusKey] ?? 0) + 1,
        };
      },
      { total: 0, revenue: 0 }
    );

    return {
      isoDate,
      date: currentDate,
      dayLabel: capitalize(weekdayFormatter.format(currentDate)),
      shortLabel: shortDayFormatter.format(currentDate),
      longLabel: longDateFormatter.format(currentDate),
      appointments,
      metrics,
    };
  });
}

function Sidebar({ navItems, activeItem, onSelect, user, onLogout }) {
  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <img src={brandLogo} alt="Turnapp" />
        <div>
          <strong>Turnapp</strong>
          <span>Panel de administración</span>
        </div>
      </div>

      <nav className="admin-nav sidebar-nav">
        {navItems.map((item) => {
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? 'is-active' : ''}
              onClick={() => onSelect(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="user-chip sidebar-user">
        <div>
          <strong>{user?.name || user?.email}</strong>
          <span>{capitalize(user?.role)}</span>
        </div>
        <button type="button" className="secondary-button" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>

    </aside>
  );
}

function DashboardView({
  weeklySchedule,
  selectedDayId,
  onSelectDay,
  selectedDay,
  selectedAppointmentId,
  onSelectAppointment,
  monthlyMetrics,
  kpiCards,
  weekPaidRevenue,
  weekCancelledCount,
}) {
  const weekRangeLabel =
    weeklySchedule.length > 0
      ? `${weekRangeFormatter.format(weeklySchedule[0].date)} · ${weekRangeFormatter.format(
          weeklySchedule[weeklySchedule.length - 1].date
        )}`
      : '';

  return (
    <div className="dashboard-view">
      <section className="kpi-grid">
        {kpiCards.map((item) => (
          <article key={item.id} className={`kpi-card ${item.highlight ? 'is-accent' : ''}`}>
            <span className="kpi-label">{item.label}</span>
            <strong className="kpi-value">{item.value}</strong>
            {item.trend && <span className="kpi-trend">{item.trend}</span>}
            {item.helper && <small className="kpi-helper">{item.helper}</small>}
          </article>
        ))}
        <article className="kpi-card is-accent">
          <span className="kpi-label">Ingresos estimados semanal</span>
          <strong className="kpi-value">{currencyFormatter.format(weekPaidRevenue)}</strong>
          <small className="kpi-helper">Confirmados y pagos</small>
        </article>
        <article className="kpi-card is-accent">
          <span className="kpi-label">Turnos cancelados en la semana</span>
          <strong className="kpi-value">{weekCancelledCount}</strong>
          <small className="kpi-helper">Cancelados dentro de la semana visible</small>
        </article>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Agenda semanal</h2>
            <p>Visualizá rápidamente la disponibilidad y los turnos confirmados.</p>
          </div>
          <span className="badge-week">{weekRangeLabel}</span>
        </header>

        <div className="week-grid">
          {weeklySchedule.map((day) => (
            <button
              key={day.isoDate}
              type="button"
              className={`week-day ${selectedDayId === day.isoDate ? 'is-active' : ''}`}
              onClick={() => onSelectDay(day.isoDate)}
            >
              <span className="week-day-label">{day.dayLabel}</span>
              <span className="week-day-date">{day.shortLabel}</span>
              <div className="week-day-metrics">
                <span>{day.metrics.total || 0} turnos</span>
                <span>{day.metrics.pendiente || 0} pendientes</span>
              </div>
              <strong>{currencyFormatter.format(day.metrics.revenue || 0)}</strong>
            </button>
          ))}
        </div>

        <AgendaPanel
          selectedDay={selectedDay}
          selectedAppointmentId={selectedAppointmentId}
          onSelectAppointment={onSelectAppointment}
        />
      </section>

    </div>
  );
}

function AgendaPanel({
  selectedDay,
  selectedAppointmentId,
  onSelectAppointment,
  onCancelAppointment,
  cancellingAppointmentId,
}) {
  return (
    <div className="agenda-panel">
      <div className="agenda-list">
        <div className="agenda-heading">
          <h3>{selectedDay?.dayLabel ?? 'Seleccioná un día'}</h3>
          <span>{selectedDay?.appointments.length ?? 0} turnos</span>
        </div>

        <div className="agenda-items">
          {selectedDay?.appointments.length ? (
            selectedDay.appointments.map((appointment) => (
              <button
                type="button"
                key={appointment.id}
                className={`appointment-card ${
                  selectedAppointmentId === appointment.id ? 'is-active' : ''
                }`}
                onClick={() => onSelectAppointment(appointment.id)}
              >
                <div className="appointment-time">
                  <span>{appointment.startTime}</span>
                  <span>{appointment.endTime}</span>
                </div>
                <div className="appointment-main">
                  <strong>{appointment.service}</strong>
                  <span className="appointment-client">{appointment.clientName}</span>
                  <span className="appointment-meta">
                    {appointment.stylist} · {appointment.paymentMethod}
                  </span>
                </div>
                <span className={`status-pill status-${appointment.status ?? 'sin-estado'}`}>
                  {appointment.status ? capitalize(appointment.status) : 'Sin estado'}
                </span>
              </button>
            ))
          ) : (
            <p className="empty-state">No hay turnos cargados para este día.</p>
          )}
        </div>
      </div>

      {selectedDay && (
        <div className="agenda-details">
          <AppointmentDetails
            appointment={selectedDay.appointments.find((item) => item.id === selectedAppointmentId)}
            onCancel={onCancelAppointment}
            cancellingId={cancellingAppointmentId}
          />
        </div>
      )}
    </div>
  );
}

function AppointmentsView({
  weeklySchedule,
  selectedDayId,
  onSelectDay,
  selectedDay,
  selectedAppointmentId,
  onSelectAppointment,
  staff,
  staffFilter,
  onChangeStaffFilter,
  onCancelAppointment,
  cancellingAppointmentId,
}) {
  return (
    <div className="appointments-view">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Turnos de la semana</h2>
            <p>Explorá agenda, confirmá o reprogramá según disponibilidad.</p>
          </div>
          <div className="filters-inline">
            <label className="inline-select">
              <span>Filtrar por profesional</span>
              <select
                value={staffFilter}
                onChange={(event) => onChangeStaffFilter?.(event.target.value)}
              >
                <option value="">Todos</option>
                {staff?.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </header>

        <div className="week-grid compact">
          {weeklySchedule.map((day) => (
            <button
              key={day.isoDate}
              type="button"
              className={`week-day compact ${selectedDayId === day.isoDate ? 'is-active' : ''}`}
              onClick={() => onSelectDay(day.isoDate)}
            >
              <span className="week-day-label">{day.dayLabel}</span>
              <span className="week-day-date">{day.shortLabel}</span>
              <strong>{day.metrics.total || 0} turnos</strong>
            </button>
          ))}
        </div>

        <AgendaPanel
          selectedDay={selectedDay}
          selectedAppointmentId={selectedAppointmentId}
          onSelectAppointment={onSelectAppointment}
          onCancelAppointment={onCancelAppointment}
          cancellingAppointmentId={cancellingAppointmentId}
        />
      </section>
    </div>
  );
}

function AppointmentDetails({ appointment, onCancel, cancellingId }) {
  if (!appointment) {
    return (
      <div className="appointment-empty">
        <p>Seleccioná un turno para ver los detalles.</p>
      </div>
    );
  }

  const isCancelling = cancellingId === appointment.id;

  return (
    <div className="appointment-details">
      <header>
        <h3>{appointment.service}</h3>
        <span>
          {appointment.startTime} · {appointment.stylist}
        </span>
      </header>

      <dl>
        <div>
          <dt>Cliente</dt>
          <dd>{appointment.clientName}</dd>
        </div>
        <div>
          <dt>Contacto</dt>
          <dd>{appointment.contact}</dd>
        </div>
        <div>
          <dt>Servicio</dt>
          <dd>{appointment.serviceCategory}</dd>
        </div>
        <div>
          <dt>Duración</dt>
          <dd>{appointment.durationMinutes} minutos</dd>
        </div>
        <div>
          <dt>Método de pago</dt>
          <dd>{appointment.paymentMethod}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd className={`status-pill status-${appointment.status ?? 'sin-estado'}`}>
            {appointment.status ? capitalize(appointment.status) : 'Sin estado'}
          </dd>
        </div>
        <div>
          <dt>Importe</dt>
          <dd>{currencyFormatter.format(appointment.price || 0)}</dd>
        </div>
      </dl>

      <section>
        <h4>Notas</h4>
        <p>{appointment.notes || 'Sin notas adicionales.'}</p>
      </section>
      {onCancel && appointment.status !== 'cancelled' && (
        <button
          type="button"
          className="secondary-button"
          onClick={() => onCancel(appointment.id)}
          disabled={isCancelling}
        >
          {isCancelling ? 'Anulando...' : 'Anular turno'}
        </button>
      )}
    </div>
  );
}

function MonthlyOverview({ data }) {
  if (!data?.length) {
    return <p className="empty-state">Todavía no hay métricas cargadas.</p>;
  }

  const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

  return (
    <div className="monthly-overview">
      <div className="monthly-bars">
        {data.map((item) => {
          const revenueHeight = Math.round((item.revenue / maxRevenue) * 120);
          const confirmedHeight = Math.round((item.confirmed / 100) * 90);
          const cancelledHeight = Math.round((item.cancelled / 20) * 90);

          return (
            <div key={item.month} className="monthly-bar">
              <div className="bar-stack">
                <span className="bar bar-confirmed" style={{ height: `${confirmedHeight}px` }} />
                <span className="bar bar-cancelled" style={{ height: `${cancelledHeight}px` }} />
                <span className="bar bar-revenue" style={{ height: `${revenueHeight}px` }} />
              </div>
              <span className="bar-label">
                {new Date(`${item.month}-01`).toLocaleDateString('es-AR', {
                  month: 'short',
                })}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="legend">
        <li>
          <span className="dot dot-confirmed" />
          Turnos confirmados
        </li>
        <li>
          <span className="dot dot-cancelled" />
          Cancelaciones
        </li>
        <li>
          <span className="dot dot-revenue" />
          Facturación
        </li>
      </ul>
    </div>
  );
}

function ServicesView({
  services,
  staff,
  isStaffEditorActive,
  onToggleStaffEditor,
  onCreateStaff,
  onUpdateStaff,
  isCreatingStaff,
  isUpdatingStaff,
  onDeleteStaff,
  deletingStaffId,
  staffActionError,
  onDismissStaffError,
  onUpdateStaffSchedule,
  isUpdatingSchedule,
  scheduleActionError,
  onCreateService,
  onUpdateService,
  onDeleteService,
  serviceActionError,
  isSavingService,
  deletingServiceId,
}) {
  const [formState, setFormState] = useState(EMPTY_STAFF_FORM);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [isStaffManageMode, setIsStaffManageMode] = useState(false);
  const [overrideForm, setOverrideForm] = useState({
    staffId: '',
    date: '',
    start: '',
    end: '',
    closed: false,
    slotDurationMinutes: '',
  });
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [isServiceFormVisible, setIsServiceFormVisible] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [pendingDeleteStaff, setPendingDeleteStaff] = useState(null);
  const [pendingDeleteService, setPendingDeleteService] = useState(null);
  const selectedProfessionalsLabel = serviceForm.professionals.length
    ? serviceForm.professionals.join(', ')
    : 'Seleccionar profesionales';

  useEffect(() => {
    if (!isStaffEditorActive) {
      setFormState(EMPTY_STAFF_FORM);
      setFormError(null);
      setFormSuccess(null);
      setAvatarPreview('');
      setEditingStaffId(null);
    }
  }, [isStaffEditorActive]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setFormSuccess(null);
  };

  const handleToggleAvailabilityDay = (dayValue) => {
    setFormState((prev) => {
      const next = new Set(prev.availabilityDays);
      if (next.has(dayValue)) {
        next.delete(dayValue);
      } else {
        next.add(dayValue);
      }
      return {
        ...prev,
        availabilityDays: Array.from(next),
      };
    });
  };

  const handleScheduleModeChange = (mode) => {
    setFormState((prev) => ({
      ...prev,
      scheduleMode: mode,
    }));
  };

  const resizeImageFile = (file, maxSize = 256) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Imagen no válida.'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = maxSize;
          canvas.height = maxSize;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('No se pudo preparar el lienzo.'));
            return;
          }
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(0, 0, maxSize, maxSize);
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const drawWidth = img.width * scale;
          const drawHeight = img.height * scale;
          const offsetX = (maxSize - drawWidth) / 2;
          const offsetY = (maxSize - drawHeight) / 2;
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          resolve(canvas.toDataURL('image/png'));
        };
        img.src = typeof reader.result === 'string' ? reader.result : '';
      };
      reader.readAsDataURL(file);
    });

  const handleAvatarUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      setFormState((prev) => ({ ...prev, avatar: '' }));
      setAvatarPreview('');
      return;
    }

    setIsProcessingAvatar(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const resized = await resizeImageFile(file);
      setFormState((prev) => ({ ...prev, avatar: resized }));
      setAvatarPreview(resized);
    } catch (error) {
      setFormError(error.message || 'No se pudo procesar la imagen.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
      setIsProcessingAvatar(false);
    }
  };

  const handleResetAvatar = () => {
    setFormState((prev) => ({ ...prev, avatar: '' }));
    setAvatarPreview('');
    setFormError(null);
    setFormSuccess(null);
  };

  const handleOverrideFieldChange = (event) => {
    const { name, value, type, checked } = event.target;
    setOverrideForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmitOverride = async (event) => {
    event.preventDefault();
    if (!onUpdateStaffSchedule) return;
    if (!overrideForm.staffId || !overrideForm.date) {
      setFormError('Elegí un profesional y la fecha a editar.');
      return;
    }

    const target = staff.find((member) => member.id === overrideForm.staffId);
    const currentOverrides = target?.workSchedule?.overrides || {};
    const nextOverrides = { ...currentOverrides };

    if (overrideForm.closed) {
      nextOverrides[overrideForm.date] = { closed: true };
    } else if (overrideForm.start && overrideForm.end) {
      nextOverrides[overrideForm.date] = { start: overrideForm.start, end: overrideForm.end };
    } else {
      setFormError('Indicá horario de inicio y fin, o marcá como día cerrado.');
      return;
    }

    try {
      await onUpdateStaffSchedule({
        staffId: overrideForm.staffId,
        overrides: nextOverrides,
        slotDurationMinutes: Number(overrideForm.slotDurationMinutes) || undefined,
      });
      setOverrideForm({
        staffId: overrideForm.staffId,
        date: '',
        start: '',
        end: '',
        closed: false,
        slotDurationMinutes: '',
      });
      setFormError(null);
      setFormSuccess('Disponibilidad actualizada.');
    } catch (error) {
      setFormError(error.message || 'No se pudo actualizar la disponibilidad.');
    }
  };

  const handleEditStaffClick = (member) => {
    if (!member) return;
    if (!isStaffManageMode) {
      setIsStaffManageMode(true);
    }
    if (!isStaffEditorActive) {
      onToggleStaffEditor();
    }
    setEditingStaffId(member.id);
    const parsedDays = parseAvailabilityDays(member.availability);
    const availabilityDays = Array.isArray(member.workSchedule?.availabilityDays)
      ? member.workSchedule.availabilityDays
      : parsedDays || EMPTY_STAFF_FORM.availabilityDays;
    setFormState({
      name: member.name || '',
      role: member.role || '',
      availabilityDays,
      specialties: Array.isArray(member.specialties) ? member.specialties.join(', ') : '',
      avatar: member.avatar || '',
      scheduleMode: member.workSchedule?.mode === 'split' ? 'split' : 'continuous',
      defaultStart: member.workSchedule?.defaultStart || '09:00',
      defaultEnd: member.workSchedule?.defaultEnd || '17:00',
      shift1Start: member.workSchedule?.shift1Start || '09:00',
      shift1End: member.workSchedule?.shift1End || '13:00',
      shift2Start: member.workSchedule?.shift2Start || '15:00',
      shift2End: member.workSchedule?.shift2End || '19:00',
      slotDurationMinutes: member.slotDurationMinutes || 45,
    });
    setFormError(null);
    setFormSuccess(null);
    setAvatarPreview(member.avatar || '');
  };

  const handleServiceFieldChange = (event) => {
    const { name, value } = event.target;
    setServiceForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleServiceActive = () => {
    setServiceForm((prev) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  const handleToggleProfessional = (professionalName) => {
    setServiceForm((prev) => {
      const next = new Set(prev.professionals);
      if (next.has(professionalName)) {
        next.delete(professionalName);
      } else {
        next.add(professionalName);
      }
      return {
        ...prev,
        professionals: Array.from(next),
      };
    });
  };

  const handleSubmitService = async (event) => {
    event.preventDefault();
    if (!onCreateService || !onUpdateService) return;

    if (!serviceForm.name.trim()) {
      setFormError('Ingresá un nombre de servicio.');
      return;
    }

    const isEditing = Boolean(editingServiceId);
    const payload = {
      name: serviceForm.name.trim(),
      category: serviceForm.category.trim(),
      durationMinutes: Number(serviceForm.durationMinutes) || 30,
      price: Number(serviceForm.price) || 0,
      professionals: serviceForm.professionals,
      description: serviceForm.description.trim(),
      active: serviceForm.active,
    };

    try {
      if (editingServiceId) {
        await onUpdateService({ serviceId: editingServiceId, service: payload });
        setFormSuccess('Servicio actualizado.');
      } else {
        await onCreateService(payload);
        setFormSuccess('Servicio creado.');
      }
      setServiceForm(EMPTY_SERVICE_FORM);
      setEditingServiceId(null);
      if (!isEditing) {
        setIsServiceFormVisible(false);
      }
    } catch (error) {
      setFormError(error.message || 'No se pudo guardar el servicio.');
    }
  };

  const handleEditService = (service) => {
    setEditingServiceId(service.id);
    setIsServiceFormVisible(true);
    setServiceForm({
      id: service.id,
      name: service.name || '',
      category: service.category || '',
      durationMinutes: service.durationMinutes || 30,
      price: service.price || 0,
      professionals: Array.isArray(service.professionals) ? service.professionals : [],
      description: service.description || '',
      active: service.active !== false,
    });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleStartNewService = () => {
    setServiceForm(EMPTY_SERVICE_FORM);
    setEditingServiceId(null);
    setFormError(null);
    setFormSuccess(null);
    setIsServiceFormVisible(true);
  };

  const handleCancelServiceForm = () => {
    setEditingServiceId(null);
    setServiceForm(EMPTY_SERVICE_FORM);
    setFormError(null);
    setFormSuccess(null);
    setIsServiceFormVisible(false);
  };

  const handleDeleteService = async (id) => {
    if (!onDeleteService) return;
    try {
      await onDeleteService(id);
    } catch (error) {
      setFormError(error.message || 'No se pudo eliminar el servicio.');
    }
  };

  const handleConfirmDeleteService = async () => {
    if (!pendingDeleteService) return;
    await handleDeleteService(pendingDeleteService.id);
    setPendingDeleteService(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!formState.name.trim()) {
      setFormError('Ingresá un nombre.');
      return;
    }

    if (!formState.availabilityDays.length) {
      setFormError('Seleccioná al menos un día de disponibilidad.');
      return;
    }

    const parseMinutes = (value) => {
      const [hours = '0', minutes = '0'] = value.split(':');
      return (parseInt(hours, 10) || 0) * 60 + (parseInt(minutes, 10) || 0);
    };

    if (formState.scheduleMode === 'continuous') {
      const startMinutes = parseMinutes(formState.defaultStart || '09:00');
      const endMinutes = parseMinutes(formState.defaultEnd || '17:00');
      if (endMinutes <= startMinutes) {
        setFormError('El horario fin debe ser mayor al inicio.');
        return;
      }
    } else {
      const firstStart = parseMinutes(formState.shift1Start || '09:00');
      const firstEnd = parseMinutes(formState.shift1End || '13:00');
      const secondStart = parseMinutes(formState.shift2Start || '15:00');
      const secondEnd = parseMinutes(formState.shift2End || '19:00');
      if (firstEnd <= firstStart || secondEnd <= secondStart) {
        setFormError('El horario fin debe ser mayor al inicio en cada turno.');
        return;
      }
    }

    const availabilityText = formatAvailabilityLabel(formState.availabilityDays, {
      mode: formState.scheduleMode,
      defaultStart: formState.defaultStart,
      defaultEnd: formState.defaultEnd,
      shift1Start: formState.shift1Start,
      shift1End: formState.shift1End,
      shift2Start: formState.shift2Start,
      shift2End: formState.shift2End,
    });

    const payload = {
      name: formState.name.trim(),
      role: formState.role.trim(),
      availability: availabilityText,
      avatar: formState.avatar.trim(),
      specialties: formState.specialties
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      slotDurationMinutes: Number(formState.slotDurationMinutes) || 45,
      workSchedule: {
        mode: formState.scheduleMode,
        availabilityDays: formState.availabilityDays,
        defaultStart: formState.defaultStart || '09:00',
        defaultEnd: formState.defaultEnd || '17:00',
        shift1Start: formState.shift1Start || '09:00',
        shift1End: formState.shift1End || '13:00',
        shift2Start: formState.shift2Start || '15:00',
        shift2End: formState.shift2End || '19:00',
      },
    };

    try {
      if (editingStaffId) {
        await onUpdateStaff({ staffId: editingStaffId, staff: payload });
        setFormSuccess('Profesional actualizado correctamente.');
      } else {
        await onCreateStaff(payload);
        setFormSuccess('Profesional agregado correctamente.');
      }
      setFormState(EMPTY_STAFF_FORM);
      setAvatarPreview('');
      setEditingStaffId(null);
    } catch (error) {
      setFormError(error.message || 'No se pudo guardar el profesional.');
    }
  };

  const handleConfirmDeleteStaff = async () => {
    if (!pendingDeleteStaff) return;
    try {
      await onDeleteStaff?.(pendingDeleteStaff.id);
    } finally {
      setPendingDeleteStaff(null);
    }
  };

  const handleToggle = () => {
    onDismissStaffError?.();
    onToggleStaffEditor();
  };

  return (
    <div className="services-view">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Peluqueros y staff</h2>
            <p>Gestioná tu equipo, roles y disponibilidad.</p>
          </div>
          <div className="header-actions">
            <button type="button" className="secondary-button" onClick={handleToggle}>
              {isStaffEditorActive ? 'Finalizar edición' : 'Añadir profesional'}
            </button>
            <button
              type="button"
              className={`secondary-button${isStaffManageMode ? ' is-active' : ''}`}
              onClick={() => setIsStaffManageMode((prev) => !prev)}
            >
              {isStaffManageMode ? 'Salir de edición' : 'Editar personal'}
            </button>
          </div>
        </header>

        {isStaffEditorActive && (
          <form className="staff-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="staff-name">Nombre *</label>
                <input
                  id="staff-name"
                  name="name"
                  placeholder="Ej. Ana Rodríguez"
                  value={formState.name}
                  onChange={handleFieldChange}
                  disabled={isCreatingStaff}
                />
              </div>
              <div className="form-field">
                <label htmlFor="staff-role">Rol</label>
                <input
                  id="staff-role"
                  name="role"
                  placeholder="Colorista, barbero, etc."
                  value={formState.role}
                  onChange={handleFieldChange}
                  disabled={isCreatingStaff}
                />
              </div>
              <div className="form-field is-full">
                <label>Disponibilidad semanal</label>
                <div className="availability-grid">
                  {WEEK_DAYS.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      className={`availability-day${
                        formState.availabilityDays.includes(day.value) ? ' is-active' : ''
                      }`}
                      onClick={() => handleToggleAvailabilityDay(day.value)}
                      disabled={isCreatingStaff}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
                <p className="form-helper">Seleccioná los días que trabaja este profesional.</p>
              </div>
              <div className="form-field is-full">
                <label>Horario</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-button${formState.scheduleMode === 'continuous' ? ' is-active' : ''}`}
                    onClick={() => handleScheduleModeChange('continuous')}
                    disabled={isCreatingStaff}
                  >
                    Horario corrido
                  </button>
                  <button
                    type="button"
                    className={`toggle-button${formState.scheduleMode === 'split' ? ' is-active' : ''}`}
                    onClick={() => handleScheduleModeChange('split')}
                    disabled={isCreatingStaff}
                  >
                    Por turnos
                  </button>
                </div>
                {formState.scheduleMode === 'continuous' ? (
                  <div className="inline-fields">
                    <input
                      type="time"
                      name="defaultStart"
                      value={formState.defaultStart}
                      onChange={handleFieldChange}
                      disabled={isCreatingStaff}
                    />
                    <span className="inline-separator">a</span>
                    <input
                      type="time"
                      name="defaultEnd"
                      value={formState.defaultEnd}
                      onChange={handleFieldChange}
                      disabled={isCreatingStaff}
                    />
                  </div>
                ) : (
                  <div className="schedule-split">
                    <div className="inline-fields">
                      <span className="inline-label">Turno mañana</span>
                      <input
                        type="time"
                        name="shift1Start"
                        value={formState.shift1Start}
                        onChange={handleFieldChange}
                        disabled={isCreatingStaff}
                      />
                      <span className="inline-separator">a</span>
                      <input
                        type="time"
                        name="shift1End"
                        value={formState.shift1End}
                        onChange={handleFieldChange}
                        disabled={isCreatingStaff}
                      />
                    </div>
                    <div className="inline-fields">
                      <span className="inline-label">Turno tarde</span>
                      <input
                        type="time"
                        name="shift2Start"
                        value={formState.shift2Start}
                        onChange={handleFieldChange}
                        disabled={isCreatingStaff}
                      />
                      <span className="inline-separator">a</span>
                      <input
                        type="time"
                        name="shift2End"
                        value={formState.shift2End}
                        onChange={handleFieldChange}
                        disabled={isCreatingStaff}
                      />
                    </div>
                  </div>
                )}
                <p className="form-helper">Definí el horario de atención semanal.</p>
              </div>
              <div className="form-field is-wide">
                <label htmlFor="staff-slot-duration">Duración por turno (minutos)</label>
                <input
                  id="staff-slot-duration"
                  name="slotDurationMinutes"
                  type="number"
                  min="10"
                  step="5"
                  value={formState.slotDurationMinutes}
                  onChange={handleFieldChange}
                  disabled={isCreatingStaff}
                />
              </div>
              <div className="form-field is-wide">
                <label htmlFor="staff-specialties">Especialidades (separadas por coma)</label>
                <input
                  id="staff-specialties"
                  name="specialties"
                  placeholder="Balayage, Barbería, Spa de manos"
                  value={formState.specialties}
                  onChange={handleFieldChange}
                  disabled={isCreatingStaff}
                />
              </div>
              <div className="form-field is-wide">
                <label htmlFor="staff-avatar">Foto (opcional)</label>
                <div className="staff-avatar-upload">
                  <div className="staff-avatar-preview">
                    <img
                      src={avatarPreview || DEFAULT_STAFF_AVATAR}
                      alt="Vista previa del avatar"
                      loading="lazy"
                    />
                  </div>
                  <label className="secondary-button staff-upload-button">
                    {isProcessingAvatar ? 'Procesando...' : 'Seleccionar imagen'}
                    <input
                      id="staff-avatar"
                      name="avatarFile"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleAvatarUpload}
                      disabled={isProcessingAvatar || isCreatingStaff}
                    />
                  </label>
                  {(avatarPreview || formState.avatar) && (
                    <button
                      type="button"
                      className="secondary-link"
                      onClick={handleResetAvatar}
                      disabled={isProcessingAvatar || isCreatingStaff}
                    >
                      Quitar foto
                    </button>
                  )}
                </div>
                <p className="form-helper">
                  Redimensionamos automáticamente a 256×256 px. Sin foto se mostrará una silueta.
                </p>
              </div>
            </div>

            {(formError || formSuccess) && (
              <div className={formError ? 'alert-error' : 'alert-success'}>
                <p>{formError || formSuccess}</p>
                {formError && (
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setFormError(null);
                      onDismissStaffError?.();
                    }}
                  >
                    Intentar de nuevo
                  </button>
                )}
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="primary-button"
                disabled={isCreatingStaff || isProcessingAvatar}
              >
                {isCreatingStaff || isProcessingAvatar ? 'Guardando...' : 'Guardar profesional'}
              </button>
            </div>
          </form>
        )}

        {staffActionError && (!isStaffEditorActive || !formError) && (
          <div className="alert-error">
            <p>{staffActionError}</p>
            <button type="button" className="secondary-button" onClick={onDismissStaffError}>
              Entendido
            </button>
          </div>
        )}

        {staff.length ? (
          <div className="staff-grid">
            {staff.map((member) => {
              const schedule = member.workSchedule || {};
              const scheduleSummary =
                schedule.mode === 'split'
                  ? `${schedule.shift1Start || '09:00'} a ${schedule.shift1End || '13:00'} y ${schedule.shift2Start || '15:00'} a ${
                      schedule.shift2End || '19:00'
                    }`
                  : `${schedule.defaultStart || '09:00'} a ${schedule.defaultEnd || '17:00'}`;
              const availabilityDays = Array.isArray(schedule.availabilityDays)
                ? schedule.availabilityDays
                : parseAvailabilityDays(member.availability) || [];
              const availabilityDaysText = availabilityDays.length
                ? formatAvailabilityDays(availabilityDays)
                : member.availability || '';

              return (
                <article key={member.id} className="staff-card">
                <img
                  src={member.avatar || DEFAULT_STAFF_AVATAR}
                  alt={member.name}
                  className="staff-avatar"
                />
                <div className="staff-main">
                  <strong>{member.name}</strong>
                  <span className="staff-role">{member.role}</span>
                  <span className="staff-availability">Turnos de {member.slotDurationMinutes || 45} min</span>
                  <span className="staff-availability">{scheduleSummary}</span>
                  {member.specialties?.length ? (
                    <ul>
                      {member.specialties.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="staff-hint">Sumá especialidades para destacar sus servicios.</p>
                  )}
                  {availabilityDaysText ? (
                    <span className="staff-availability">{availabilityDaysText}</span>
                  ) : (
                    <span className="staff-availability is-muted">Horarios sin definir</span>
                  )}
                  {isStaffManageMode && (
                    <div className="staff-actions">
                      <button
                        type="button"
                        className="secondary-button small"
                        onClick={() => handleEditStaffClick(member)}
                        disabled={isCreatingStaff || isUpdatingStaff}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className={`staff-delete-button${deletingStaffId === member.id ? ' is-loading' : ''}`}
                        onClick={() => setPendingDeleteStaff(member)}
                        disabled={deletingStaffId === member.id}
                        aria-label={`Eliminar a ${member.name}`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                          <path
                            fill="currentColor"
                            d="M9 3h6l1 2h4v2H4V5h4l1-2zm2 8v7h2v-7h-2zm-4 0v7h2v-7H7zm8 0v7h2v-7h-2z"
                          />
                        </svg>
                        <span className="sr-only">Eliminar {member.name}</span>
                      </button>
                    </div>
                  )}
                </div>
              </article>
              );
            })}
          </div>
        ) : (
          <p className="empty-state">Aún no cargaste profesionales. Sumá uno desde el backend.</p>
        )}
      </section>

      {pendingDeleteStaff && (
        <div className="modal-overlay" role="presentation">
          <div className="modal-card modal-alert" role="dialog" aria-modal="true">
            <h3>Eliminar profesional</h3>
            <p>
              La eliminación de {pendingDeleteStaff.name} no puede deshacerse. ¿Seguro que querés
              eliminarlo?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setPendingDeleteStaff(null)}
                disabled={deletingStaffId === pendingDeleteStaff.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="danger-button"
                onClick={handleConfirmDeleteStaff}
                disabled={deletingStaffId === pendingDeleteStaff.id}
              >
                {deletingStaffId === pendingDeleteStaff.id ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Catálogo de servicios</h2>
            <p>Definí tiempos, precios y profesionales asignados.</p>
          </div>
        </header>

        {isServiceFormVisible ? (
          <form className="service-form" onSubmit={handleSubmitService}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="service-name">Nombre *</label>
                <input
                  id="service-name"
                  name="name"
                  value={serviceForm.name}
                  onChange={handleServiceFieldChange}
                  disabled={isSavingService}
                />
              </div>
              <div className="form-field">
                <label htmlFor="service-category">Categoría</label>
                <input
                  id="service-category"
                  name="category"
                  value={serviceForm.category}
                  onChange={handleServiceFieldChange}
                  disabled={isSavingService}
                />
              </div>
              <div className="form-field">
                <label htmlFor="service-duration">Duración (min)</label>
                <input
                  id="service-duration"
                  name="durationMinutes"
                  type="number"
                  min="5"
                  step="5"
                  value={serviceForm.durationMinutes}
                  onChange={handleServiceFieldChange}
                  disabled={isSavingService}
                />
              </div>
              <div className="form-field">
                <label htmlFor="service-price">Precio</label>
                <input
                  id="service-price"
                  name="price"
                  type="number"
                  min="0"
                  step="100"
                  value={serviceForm.price}
                  onChange={handleServiceFieldChange}
                  disabled={isSavingService}
                />
              </div>
              <div className="form-field">
                <label>Profesionales</label>
                <details className="multi-select">
                  <summary>{selectedProfessionalsLabel}</summary>
                  <div className="multi-select-list">
                    {staff.length ? (
                      staff.map((member) => (
                        <label key={member.id} className="multi-select-item">
                          <input
                            type="checkbox"
                            checked={serviceForm.professionals.includes(member.name)}
                            onChange={() => handleToggleProfessional(member.name)}
                            disabled={isSavingService}
                          />
                          <span>{member.name}</span>
                        </label>
                      ))
                    ) : (
                      <span className="multi-select-empty">No hay profesionales cargados.</span>
                    )}
                  </div>
                </details>
                <p className="form-helper">Seleccioná a quiénes pueden realizar este servicio.</p>
              </div>
              <div className="form-field">
                <label>Estado</label>
                <button
                  type="button"
                  className={`secondary-button${serviceForm.active ? ' is-active' : ''}`}
                  onClick={handleToggleServiceActive}
                  disabled={isSavingService}
                >
                  {serviceForm.active ? 'Inhabilitar servicio' : 'Activar servicio'}
                </button>
              </div>
              <div className="form-field is-full">
                <label htmlFor="service-description">Descripción</label>
                <textarea
                  id="service-description"
                  name="description"
                  rows={3}
                  value={serviceForm.description}
                  onChange={handleServiceFieldChange}
                  disabled={isSavingService}
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={isSavingService}>
                {isSavingService ? 'Guardando...' : editingServiceId ? 'Actualizar servicio' : 'Crear servicio'}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancelServiceForm}
                disabled={isSavingService}
              >
                Cancelar
              </button>
            </div>
            {serviceActionError && <p className="form-error">{serviceActionError}</p>}
          </form>
        ) : (
          <div className="form-actions is-left">
            <button type="button" className="primary-button" onClick={handleStartNewService}>
              <span className="plus-mark" aria-hidden="true">
                <svg width="16" height="16" viewBox="0 0 24 24" focusable="false">
                  <path fill="currentColor" d="M11 5h2v14h-2zM5 11h14v2H5z" />
                </svg>
              </span>
              Crear nuevo servicio
            </button>
          </div>
        )}

        {services.length ? (
          <div className="services-table">
            <div className="services-table-head">
              <span>Servicio</span>
              <span>Duración</span>
              <span>Precio</span>
              <span>Profesionales</span>
              <span>Acciones</span>
            </div>
            {services.map((service) => (
              <div key={service.id} className="services-table-row">
                <div className="service-main">
                  <strong>{service.name}</strong>
                  <span>{service.category}</span>
                  {service.description && <p>{service.description}</p>}
                </div>
                <span>{service.durationMinutes} min</span>
                <span>{currencyFormatter.format(service.price)}</span>
                <span>{service.professionals?.join(', ') || 'Sin asignar'}</span>
                <div className="service-actions">
                  <button
                    type="button"
                    className="secondary-button small"
                    onClick={() => handleEditService(service)}
                    disabled={isSavingService}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="danger-button"
                    onClick={() => setPendingDeleteService(service)}
                    disabled={deletingServiceId === service.id || isSavingService}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        fill="currentColor"
                        d="M9 3h6l1 2h4v2H4V5h4l1-2zm2 8v7h2v-7h-2zm-4 0v7h2v-7H7zm8 0v7h2v-7h-2z"
                      />
                    </svg>
                    {deletingServiceId === service.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Aún no cargaste servicios. Creá el primero para empezar.</p>
        )}

        {pendingDeleteService && (
          <div className="modal-overlay" role="presentation">
            <div className="modal-card modal-alert" role="dialog" aria-modal="true">
              <h3>Eliminar servicio</h3>
              <p>
                La eliminación de {pendingDeleteService.name} no puede deshacerse. ¿Seguro que querés
                eliminarlo?
              </p>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setPendingDeleteService(null)}
                  disabled={deletingServiceId === pendingDeleteService.id}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={handleConfirmDeleteService}
                  disabled={deletingServiceId === pendingDeleteService.id}
                >
                  {deletingServiceId === pendingDeleteService.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function BrandingView({ branding, isLoading, isSaving, error, onSave }) {
  const [formState, setFormState] = useState({ ...DEFAULT_BRANDING, ...(branding ?? {}) });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const locationAddress = formState.locationAddress?.trim();
  const mapEmbedUrl = locationAddress
    ? `https://maps.google.com/maps?q=${encodeURIComponent(locationAddress)}&z=16&output=embed`
    : null;

  useEffect(() => {
    setFormState({ ...DEFAULT_BRANDING, ...(branding ?? {}) });
    setFormError(null);
    setFormSuccess(null);
  }, [branding]);

  const handleColorChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleTextChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (field) => async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1200000) {
      setFormError('La imagen es muy pesada. Usá un archivo menor a 1.2MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormState((prev) => ({ ...prev, [field]: dataUrl }));
      setFormError(null);
    } catch (readError) {
      setFormError('No pudimos cargar la imagen seleccionada.');
    }
  };

  const handleReset = () => {
    setFormState({ ...DEFAULT_BRANDING, ...(branding ?? {}) });
    setFormError(null);
    setFormSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    try {
      await onSave(formState);
      setFormSuccess('Personalización guardada.');
    } catch (submitError) {
      setFormError(submitError.message || 'No se pudo guardar la personalización.');
    }
  };

  const logoNavbarSrc = formState.navbarLogoUrl || brandLogo;
  const logoFooterSrc = formState.footerLogoUrl || brandLogo;

  return (
    <div className="branding-view">
      <section className="card" style={{ marginBottom: '1.5rem' }}>
        <header className="card-header">
          <div>
            <h2>Ubicación de mi comercio</h2>
            <p>Definí la dirección que se verá en el sitio público.</p>
          </div>
        </header>

        {isLoading ? (
          <p className="empty-state">Cargando ubicación...</p>
        ) : (
          <div className="branding-form">
            <div className="form-field">
              <label htmlFor="location-address">Dirección</label>
              <input
                type="text"
                id="location-address"
                name="locationAddress"
                value={formState.locationAddress}
                onChange={handleTextChange}
                placeholder="Ej. El Chaco 106, Córdoba Capital"
              />
            </div>
            {mapEmbedUrl ? (
              <div style={{ marginTop: '1rem', borderRadius: '16px', overflow: 'hidden' }}>
                <iframe
                  title="Mapa de ubicación"
                  src={mapEmbedUrl}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ width: '100%', minHeight: '220px', border: '0' }}
                />
              </div>
            ) : (
              <p className="form-helper">Ingresá una dirección para ver la vista previa del mapa.</p>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Identidad visual</h2>
            <p>Actualizá colores, logos e imágenes visibles en tu sitio público.</p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={() => window.open('/', '_blank', 'noopener')}
          >
            Vista previa
          </button>
        </header>

        {isLoading ? (
          <p className="empty-state">Cargando personalización...</p>
        ) : (
          <form className="branding-form" onSubmit={handleSubmit}>
            {(error || formError) && <p className="form-helper">{error || formError}</p>}
            {formSuccess && <p className="form-helper">{formSuccess}</p>}

            <div className="form-field">
              <label htmlFor="primary-color">Color principal</label>
              <input
                type="color"
                id="primary-color"
                name="primaryColor"
                value={formState.primaryColor}
                onChange={handleColorChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="secondary-color">Color de acento</label>
              <input
                type="color"
                id="secondary-color"
                name="accentColor"
                value={formState.accentColor}
                onChange={handleColorChange}
              />
            </div>

            <div className="form-field">
              <label htmlFor="hero-image">Imagen del hero</label>
              <div className="logo-preview">
                {formState.heroImageUrl ? (
                  <img src={formState.heroImageUrl} alt="Hero actual" />
                ) : (
                  <img src={logoNavbarSrc} alt="Hero actual" />
                )}
                <input
                  type="file"
                  id="hero-image"
                  name="hero-image"
                  accept="image/png,image/jpeg"
                  onChange={handleImageChange('heroImageUrl')}
                />
              </div>
              <p className="form-helper">Formatos JPG o PNG · Recomendado 1440 × 900 px.</p>
            </div>

            <div className="form-field">
              <label htmlFor="navbar-logo">Logo navbar</label>
              <div className="logo-preview">
                <img src={logoNavbarSrc} alt="Logo actual" />
                <input
                  type="file"
                  id="navbar-logo"
                  name="navbar-logo"
                  accept="image/png,image/svg+xml"
                  onChange={handleImageChange('navbarLogoUrl')}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="footer-logo">Logo footer</label>
              <div className="logo-preview">
                <img src={logoFooterSrc} alt="Logo actual" />
                <input
                  type="file"
                  id="footer-logo"
                  name="footer-logo"
                  accept="image/png,image/svg+xml"
                  onChange={handleImageChange('footerLogoUrl')}
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="custom-copy">Mensaje destacado</label>
              <textarea
                id="custom-copy"
                name="highlightMessage"
                rows={3}
                value={formState.highlightMessage}
                onChange={handleTextChange}
              />
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={handleReset} disabled={isSaving}>
                Deshacer cambios
              </button>
              <button type="submit" className="primary-button" disabled={isSaving}>
                {isSaving ? 'Guardando...' : 'Guardar personalización'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

function SuperadminView({
  admins,
  isLoading,
  error,
  onReload,
  onCreateAdmin,
  onUpdateAdminRole,
  isSubmitting,
  updatingAdminId,
  roleUpdateError,
}) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'admin',
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const roleLabels = {
    admin: 'Admin',
    staff: 'Staff',
    superadmin: 'Superadmin',
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const trimmed = {
      name: formState.name.trim(),
      email: formState.email.trim(),
      username: formState.username.trim(),
      password: formState.password.trim(),
      role: formState.role,
    };

    if (!trimmed.name || !trimmed.email || !trimmed.password) {
      setFormError('Completá nombre, email y contraseña.');
      return;
    }

    try {
      await onCreateAdmin({
        ...trimmed,
        username: trimmed.username || undefined,
      });
      setFormSuccess('Usuario creado correctamente.');
      setFormState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'admin',
      });
    } catch (submitError) {
      setFormError(submitError.message || 'No se pudo crear el usuario.');
    }
  };

  return (
    <div className="admins-view">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Crear nuevo usuario</h2>
            <p>Invitá a tu equipo otorgándoles acceso al panel admin.</p>
          </div>
        </header>

        <form className="admins-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="admin-name">Nombre</label>
              <input
                id="admin-name"
                name="name"
                placeholder="Ej. Ana Rodríguez"
                value={formState.name}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                name="email"
                type="email"
                placeholder="ana@peluqueria.com"
                value={formState.email}
                onChange={handleChange}
                disabled={isSubmitting}
              />
            </div>
            <div className="form-field">
              <label htmlFor="admin-username">Usuario (opcional)</label>
              <input
                id="admin-username"
                name="username"
                placeholder="ana"
                value={formState.username}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <p className="form-helper">
                Si lo dejás vacío se tomará la parte previa al @ del email.
              </p>
            </div>
            <div className="form-field">
              <label htmlFor="admin-role">Rol</label>
              <select
                id="admin-role"
                name="role"
                value={formState.role}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option value="admin">Admin</option>
                <option value="staff">Staff</option>
              </select>
              <p className="form-helper">Definí el acceso con el rol correcto.</p>
            </div>
            <div className="form-field">
              <label htmlFor="admin-password">Contraseña temporal</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formState.password}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              <p className="form-helper">El usuario podrá cambiarla luego.</p>
            </div>
          </div>

          {(formError || formSuccess) && (
            <div className={formError ? 'alert-error' : 'alert-success'}>
              <p>{formError || formSuccess}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Usuarios activos</h2>
            <p>Controlá quién tiene acceso al panel y cuándo fue su alta.</p>
          </div>
          <button type="button" className="secondary-button" onClick={onReload} disabled={isLoading}>
            {isLoading ? 'Actualizando...' : 'Actualizar listado'}
          </button>
        </header>

        {error && (
          <div className="alert-error">
            <p>{error}</p>
            <button type="button" className="secondary-button" onClick={onReload} disabled={isLoading}>
              Reintentar
            </button>
          </div>
        )}
        {roleUpdateError && (
          <div className="alert-error">
            <p>{roleUpdateError}</p>
          </div>
        )}

        {isLoading && !admins.length ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Cargando usuarios...</p>
          </div>
        ) : (
          <div className="admins-table">
            <div className="admins-head">
              <span>Nombre</span>
              <span>Email</span>
              <span>Usuario</span>
              <span>Alta</span>
              <span>Acciones</span>
            </div>
            {admins.length ? (
              admins.map((admin) => (
                <div key={admin.id} className="admins-row">
                  <div className="admins-main">
                    <strong>{admin.name}</strong>
                    <span className="admins-role">
                      {roleLabels[admin.role] ?? 'Admin'}
                    </span>
                  </div>
                  <span>{admin.email}</span>
                  <span>{admin.username}</span>
                  <span>
                    {admin.createdAt
                      ? new Date(admin.createdAt).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </span>
                  <div>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        onUpdateAdminRole({
                          userId: admin.id,
                          role: admin.role === 'staff' ? 'admin' : 'staff',
                        })
                      }
                      disabled={updatingAdminId === admin.id}
                    >
                      {updatingAdminId === admin.id
                        ? 'Actualizando...'
                        : admin.role === 'staff'
                        ? 'Promover a admin'
                        : 'Pasar a staff'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">Todavía no invitaste a ningún usuario.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function DataState({ isLoading, error, onRetry }) {
  if (isLoading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error">
        <p>{error}</p>
        <button type="button" className="secondary-button" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    );
  }

  return null;
}

export default function App() {
  const { status, user, token, logout } = useAuth();
  const userRole = user?.role ?? 'guest';
  const canManageServices = userRole === 'admin' || userRole === 'superadmin';
  const canManageBranding = userRole === 'admin' || userRole === 'superadmin';
  const canCancelAppointments = userRole === 'admin' || userRole === 'superadmin';
  const canUpdateTheme = userRole === 'admin' || userRole === 'superadmin';
  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole)),
    [userRole]
  );
  const [activeSection, setActiveSection] = useState(navItems[0]?.id ?? 'dashboard');
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [appointmentStaffFilter, setAppointmentStaffFilter] = useState('');
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState([]);
  const [monthSummary, setMonthSummary] = useState({ confirmedRevenue: 0 });
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [branding, setBranding] = useState(null);
  const [brandingLoading, setBrandingLoading] = useState(false);
  const [brandingError, setBrandingError] = useState(null);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [theme, setTheme] = useState(DEFAULT_BRANDING.themePreference);
  const [isThemeSaving, setIsThemeSaving] = useState(false);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [updatingAdminId, setUpdatingAdminId] = useState(null);
  const [roleUpdateError, setRoleUpdateError] = useState(null);
  const [isStaffEditorActive, setIsStaffEditorActive] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [isUpdatingStaff, setIsUpdatingStaff] = useState(false);
  const [staffActionError, setStaffActionError] = useState(null);
  const [isUpdatingSchedule, setIsUpdatingSchedule] = useState(false);
  const [scheduleActionError, setScheduleActionError] = useState(null);
  const [deletingStaffId, setDeletingStaffId] = useState(null);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState(null);
  const [serviceActionError, setServiceActionError] = useState(null);
  const [isSavingService, setIsSavingService] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState(null);

  useEffect(() => {
    applyBrandingVariables(branding || DEFAULT_BRANDING);
  }, [branding]);

  useEffect(() => {
    const preferred = branding?.themePreference || DEFAULT_BRANDING.themePreference;
    setTheme((current) => (current === preferred ? current : preferred));
  }, [branding]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.toggle('is-dark-mode', theme === 'dark');
    const primaryColor = branding?.primaryColor || DEFAULT_BRANDING.primaryColor;
    applyDarkThemeOverrides(primaryColor, theme);
  }, [theme, branding]);

  const selectedDay = useMemo(
    () => weeklySchedule.find((day) => day.isoDate === selectedDayId) ?? weeklySchedule[0] ?? null,
    [weeklySchedule, selectedDayId]
  );

  const appointmentsSchedule = useMemo(
    () =>
      weeklySchedule.map((day) => {
        const appointments = appointmentStaffFilter
          ? day.appointments.filter(
              (item) =>
                item.stylistId === appointmentStaffFilter ||
                (item.stylist && item.stylist.toLowerCase().includes(appointmentStaffFilter.toLowerCase()))
            )
          : day.appointments;

        const metrics = appointments.reduce(
          (acc, appointment) => {
            const statusKey = appointment.status ?? 'otros';
            return {
              ...acc,
              total: acc.total + 1,
              revenue: acc.revenue + (appointment.price || 0),
              [statusKey]: (acc[statusKey] ?? 0) + 1,
            };
          },
          { total: 0, revenue: 0 }
        );

        return { ...day, appointments, metrics };
      }),
    [weeklySchedule, appointmentStaffFilter]
  );

  const filteredSelectedDay = useMemo(
    () =>
      appointmentsSchedule.find((day) => day.isoDate === selectedDayId) ??
      appointmentsSchedule[0] ??
      null,
    [appointmentsSchedule, selectedDayId]
  );

  useEffect(() => {
    if (selectedDay) {
      setSelectedAppointmentId(selectedDay.appointments[0]?.id ?? null);
    }
  }, [selectedDay]);

  useEffect(() => {
    if (!filteredSelectedDay) return;
    setSelectedAppointmentId((prev) => {
      if (filteredSelectedDay.appointments.some((item) => item.id === prev)) {
        return prev;
      }
      return filteredSelectedDay.appointments[0]?.id ?? null;
    });
  }, [filteredSelectedDay]);

  useEffect(() => {
    if (!navItems.length) return;
    if (!navItems.some((item) => item.id === activeSection)) {
      setActiveSection(navItems[0].id);
    }
  }, [navItems, activeSection]);

  useEffect(() => {
    if (activeSection !== 'services' && isStaffEditorActive) {
      setIsStaffEditorActive(false);
      setStaffActionError(null);
    }
  }, [activeSection, isStaffEditorActive]);

  const loadData = useCallback(async () => {
    if (!token) return;
    setIsLoadingData(true);
    setDataError(null);

    try {
      const [
        scheduleResponse,
        metricsResponse,
        staffResponse,
        monthSummaryResponse,
        servicesResponse,
      ] = await Promise.all([
        fetchWeeklySchedule({ token }),
        fetchMonthlyMetrics({ token }),
        fetchStaff({ token }),
        fetchMonthSummary({ token }),
        canManageServices ? fetchServices({ token }) : Promise.resolve({ services: [] }),
      ]);

      const schedule = buildWeeklySchedule(scheduleResponse?.schedule);
      setWeeklySchedule(schedule);
      setSelectedDayId((prev) => prev || schedule[0]?.isoDate || '');
      setMonthlyMetrics(metricsResponse?.metrics ?? []);
      setServices(servicesResponse?.services ?? []);
      setStaff(staffResponse?.staff ?? []);
      setMonthSummary(monthSummaryResponse?.summary ?? { confirmedRevenue: 0 });
    } catch (error) {
      console.error('[Admin] Error al cargar datos', error);
      setDataError(error.message || 'No se pudo cargar la información');
    } finally {
      setIsLoadingData(false);
    }
  }, [token, canManageServices]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  const loadBranding = useCallback(async () => {
    if (!token) return;
    setBrandingLoading(true);
    setBrandingError(null);

    try {
      const response = await fetchBranding({ token });
      setBranding(response?.branding ?? null);
    } catch (error) {
      console.error('[Admin] Error al cargar branding', error);
      setBrandingError(error.message || 'No se pudo cargar la personalización');
    } finally {
      setBrandingLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadBranding();
    }
  }, [token, loadBranding]);

  const handleSaveBranding = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      setBrandingSaving(true);
      setBrandingError(null);

      try {
        const response = await saveBranding({ token, branding: payload });
        const updated = response?.branding ?? payload;
        setBranding(updated);
        return updated;
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo guardar la personalización.';
        setBrandingError(message);
        throw new Error(message);
      } finally {
        setBrandingSaving(false);
      }
    },
    [token]
  );

  const handleToggleTheme = useCallback(async () => {
    if (!token || !canUpdateTheme) return;
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    const fallbackTheme = theme;
    setTheme(nextTheme);
    setIsThemeSaving(true);
    try {
      const response = await saveBranding({ token, branding: { themePreference: nextTheme } });
      const updated = response?.branding ?? {
        ...(branding ?? DEFAULT_BRANDING),
        themePreference: nextTheme,
      };
      setBranding(updated);
    } catch (error) {
      console.error('[Admin] Error al guardar tema', error);
      setTheme(fallbackTheme);
    } finally {
      setIsThemeSaving(false);
    }
  }, [token, theme, branding, canUpdateTheme]);

  const isSuperadmin = userRole === 'superadmin';

  const loadAdmins = useCallback(async () => {
    if (!token || !isSuperadmin) return;
    setAdminsLoading(true);
    setAdminsError(null);
    setRoleUpdateError(null);
    try {
      const response = await fetchAdmins({ token });
      setAdmins(response?.admins ?? []);
    } catch (error) {
      console.error('[Admin] Error al cargar admins', error);
      setAdminsError(error.message || 'No se pudo cargar el listado de usuarios');
    } finally {
      setAdminsLoading(false);
    }
  }, [token, isSuperadmin]);

  useEffect(() => {
    if (isSuperadmin) {
      loadAdmins();
    } else {
      setAdmins([]);
    }
  }, [isSuperadmin, loadAdmins]);

  const handleCreateAdmin = useCallback(
    async ({ name, email, password, username, role }) => {
      if (!token || !isSuperadmin) {
        throw new Error('No tenés permisos para crear usuarios');
      }

      setIsCreatingAdmin(true);
      setRoleUpdateError(null);
      try {
        const response = await createAdmin({
          token,
          admin: { name, email, password, username, role },
        });
        setAdmins((prev) => [...prev, response.admin]);
        return response.admin;
      } finally {
        setIsCreatingAdmin(false);
      }
    },
    [token, isSuperadmin]
  );

  const handleUpdateAdminRole = useCallback(
    async ({ userId, role }) => {
      if (!token || !isSuperadmin) {
        throw new Error('No tenés permisos para actualizar usuarios');
      }

      setUpdatingAdminId(userId);
      setRoleUpdateError(null);
      try {
        const response = await updateAdminRole({
          token,
          userId,
          role,
        });
        setAdmins((prev) =>
          prev.map((item) => (item.id === userId ? response.admin : item))
        );
        return response.admin;
      } catch (error) {
        const message = error.message || 'No se pudo actualizar el rol del usuario';
        setRoleUpdateError(message);
        throw new Error(message);
      } finally {
        setUpdatingAdminId(null);
      }
    },
    [token, isSuperadmin]
  );

  const handleToggleStaffEditor = useCallback(() => {
    setStaffActionError(null);
    setIsStaffEditorActive((prev) => !prev);
  }, []);

  const handleCreateStaffMember = useCallback(
    async (payload) => {
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      setIsCreatingStaff(true);
      setStaffActionError(null);

      try {
        const response = await createStaffMember({
          token,
          staff: payload,
        });

        setStaff((prev) => [...prev, response.member]);
        return response.member;
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo crear el profesional.';
        setStaffActionError(message);
        throw new Error(message);
      } finally {
        setIsCreatingStaff(false);
      }
    },
    [token]
  );

  const handleDeleteStaffMember = useCallback(
    async (staffId) => {
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      setDeletingStaffId(staffId);
      setStaffActionError(null);

      try {
        await deleteStaffMember({ token, staffId });
        setStaff((prev) => prev.filter((member) => member.id !== staffId));
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo eliminar el profesional.';
        setStaffActionError(message);
        throw new Error(message);
      } finally {
        setDeletingStaffId(null);
      }
    },
    [token]
  );

  const handleUpdateStaffMember = useCallback(
    async ({ staffId, staff }) => {
      if (!token) throw new Error('No hay sesión activa');
      setIsUpdatingStaff(true);
      setStaffActionError(null);
      try {
        const response = await updateStaffMember({ token, staffId, staff });
        setStaff((prev) => prev.map((member) => (member.id === staffId ? response.staff : member)));
        return response.staff;
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo actualizar el profesional.';
        setStaffActionError(message);
        throw new Error(message);
      } finally {
        setIsUpdatingStaff(false);
      }
    },
    [token]
  );

  const handleCreateService = useCallback(
    async (payload) => {
      if (!token) throw new Error('No hay sesión activa');
      setIsSavingService(true);
      setServiceActionError(null);
      try {
        const response = await createService({ token, service: payload });
        setServices((prev) => [...prev, response.service]);
        return response.service;
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo crear el servicio.';
        setServiceActionError(message);
        throw new Error(message);
      } finally {
        setIsSavingService(false);
      }
    },
    [token]
  );

  const handleUpdateService = useCallback(
    async ({ serviceId, service }) => {
      if (!token) throw new Error('No hay sesión activa');
      setIsSavingService(true);
      setServiceActionError(null);
      try {
        const response = await updateService({ token, serviceId, service });
        setServices((prev) => prev.map((item) => (item.id === serviceId ? response.service : item)));
        return response.service;
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo actualizar el servicio.';
        setServiceActionError(message);
        throw new Error(message);
      } finally {
        setIsSavingService(false);
      }
    },
    [token]
  );

  const handleDeleteService = useCallback(
    async (serviceId) => {
      if (!token) throw new Error('No hay sesión activa');
      setDeletingServiceId(serviceId);
      setServiceActionError(null);
      try {
        await deleteService({ token, serviceId });
        setServices((prev) => prev.filter((item) => item.id !== serviceId));
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo eliminar el servicio.';
        setServiceActionError(message);
        throw new Error(message);
      } finally {
        setDeletingServiceId(null);
      }
    },
    [token]
  );

  const handleUpdateStaffSchedule = useCallback(
    async ({ staffId, overrides, defaultStart, defaultEnd, slotDurationMinutes }) => {
      if (!token) {
        throw new Error('No hay sesión activa');
      }
      if (!staffId) {
        throw new Error('Profesional requerido');
      }

      setIsUpdatingSchedule(true);
      setScheduleActionError(null);

      try {
        const payload = {};
        if (overrides) payload.overrides = overrides;
        if (defaultStart) payload.defaultStart = defaultStart;
        if (defaultEnd) payload.defaultEnd = defaultEnd;
        if (typeof slotDurationMinutes === 'number') payload.slotDurationMinutes = slotDurationMinutes;

        const response = await updateStaffSchedule({
          token,
          staffId,
          schedule: payload,
        });

        setStaff((prev) => prev.map((member) => (member.id === staffId ? response.staff : member)));
        return response.staff;
      } catch (error) {
        const message = error.payload?.message || error.message || 'No se pudo actualizar la disponibilidad.';
        setScheduleActionError(message);
        throw new Error(message);
      } finally {
        setIsUpdatingSchedule(false);
      }
    },
    [token]
  );

  const handleCancelAppointment = useCallback(
    async (appointmentId) => {
      if (!token || !appointmentId) return;
      setCancellingAppointmentId(appointmentId);
      try {
        await cancelAppointment({ token, appointmentId });
        await loadData();
      } catch (error) {
        console.error('[Admin] Error al cancelar turno', error);
      } finally {
        setCancellingAppointmentId(null);
      }
    },
    [token, loadData]
  );

  const handleDismissStaffError = useCallback(() => {
    setStaffActionError(null);
    setScheduleActionError(null);
    setServiceActionError(null);
  }, []);

  const { weekConfirmedCount, weekCancelledCount, weekPaidRevenue } = useMemo(() => {
    const paidStatuses = new Set(['confirmado', 'seña', 'pagado', 'paid']);
    let confirmedCount = 0;
    let cancelledCount = 0;
    let paidRevenue = 0;

    weeklySchedule.forEach((day) => {
      day.appointments.forEach((appointment) => {
        const status = (appointment.status || '').toString().toLowerCase();
        if (status === 'confirmado') {
          confirmedCount += 1;
        }
        if (status === 'cancelado' || status === 'cancelada' || status === 'cancelled') {
          cancelledCount += 1;
        }
        if (paidStatuses.has(status)) {
          paidRevenue += appointment.price || 0;
        }
      });
    });

    return {
      weekConfirmedCount: confirmedCount,
      weekCancelledCount: cancelledCount,
      weekPaidRevenue: paidRevenue,
    };
  }, [weeklySchedule]);

  const weekTotal = weekConfirmedCount + weekCancelledCount;

  const monthRevenue = monthSummary.confirmedRevenue || 0;

  const kpiCards = useMemo(
    () => [
      {
        id: 'week-revenue',
        label: 'Ingresos del mes',
        value: currencyFormatter.format(monthRevenue),
        helper: 'Confirmados y pagos',
        highlight: true,
      },
      {
        id: 'week-confirmed',
        label: 'Turnos confirmados',
        value: weekConfirmedCount.toString(),
        helper: 'Semana visible',
      },
      {
        id: 'week-total',
        label: 'Turnos totales',
        value: weekTotal.toString(),
        helper: 'Confirmados + cancelados',
      },
      {
        id: 'avg-ticket',
        label: 'Ticket promedio',
        value: weekConfirmedCount
          ? currencyFormatter.format(Math.round(weekPaidRevenue / weekConfirmedCount))
          : '-',
        helper: 'Basado en confirmados',
      },
    ],
    [monthRevenue, weekConfirmedCount, weekTotal, weekPaidRevenue]
  );

  if (status !== 'authenticated') {
    return <LoginView />;
  }

  const activeNavItem = navItems.find((item) => item.id === activeSection) ?? navItems[0] ?? null;

  return (
    <div className="admin-shell">
      <Sidebar
        navItems={navItems}
        activeItem={activeSection}
        onSelect={setActiveSection}
        user={user}
        onLogout={logout}
      />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{activeNavItem?.label ?? 'Panel'}</h1>
            <p>Gestioná tu negocio, agenda y experiencia de cara al cliente desde un mismo lugar.</p>
          </div>
          <div className="user-chip header-user">
            {canUpdateTheme && (
              <ThemeToggle theme={theme} onToggle={handleToggleTheme} disabled={isThemeSaving} />
            )}
            <div>
              <strong>{user?.name || user?.email}</strong>
              <span>{capitalize(user?.role)}</span>
            </div>
            <button type="button" className="secondary-button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
          <nav className="admin-nav header-nav">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={isActive ? 'is-active' : ''}
                  onClick={() => setActiveSection(item.id)}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </header>

        <DataState isLoading={isLoadingData} error={dataError} onRetry={loadData} />

        {!isLoadingData && !dataError && (
          <>
            {activeSection === 'dashboard' && (
              <DashboardView
                weeklySchedule={weeklySchedule}
                selectedDayId={selectedDay?.isoDate ?? selectedDayId}
                onSelectDay={setSelectedDayId}
                selectedDay={selectedDay}
                selectedAppointmentId={selectedAppointmentId}
                onSelectAppointment={setSelectedAppointmentId}
                monthlyMetrics={monthlyMetrics}
                kpiCards={kpiCards}
                weekPaidRevenue={weekPaidRevenue}
                weekCancelledCount={weekCancelledCount}
              />
            )}

            {activeSection === 'turnos' && (
              <AppointmentsView
                weeklySchedule={appointmentsSchedule}
                selectedDayId={filteredSelectedDay?.isoDate ?? selectedDayId}
                onSelectDay={setSelectedDayId}
                selectedDay={filteredSelectedDay}
                selectedAppointmentId={selectedAppointmentId}
                onSelectAppointment={setSelectedAppointmentId}
                staff={staff}
                staffFilter={appointmentStaffFilter}
                onChangeStaffFilter={setAppointmentStaffFilter}
                onCancelAppointment={canCancelAppointments ? handleCancelAppointment : undefined}
                cancellingAppointmentId={cancellingAppointmentId}
              />
            )}

            {activeSection === 'services' && (
              <ServicesView
                services={services}
                staff={staff}
                isStaffEditorActive={isStaffEditorActive}
                onToggleStaffEditor={handleToggleStaffEditor}
                onCreateStaff={handleCreateStaffMember}
                onUpdateStaff={handleUpdateStaffMember}
                isCreatingStaff={isCreatingStaff}
                isUpdatingStaff={isUpdatingStaff}
                onDeleteStaff={handleDeleteStaffMember}
                deletingStaffId={deletingStaffId}
                staffActionError={staffActionError}
                onDismissStaffError={handleDismissStaffError}
                onUpdateStaffSchedule={handleUpdateStaffSchedule}
                isUpdatingSchedule={isUpdatingSchedule}
                scheduleActionError={scheduleActionError}
                onCreateService={handleCreateService}
                onUpdateService={handleUpdateService}
                onDeleteService={handleDeleteService}
                serviceActionError={serviceActionError}
                isSavingService={isSavingService}
                deletingServiceId={deletingServiceId}
              />
            )}

            {activeSection === 'branding' && (
              <BrandingView
                branding={branding}
                isLoading={brandingLoading}
                isSaving={brandingSaving}
                error={brandingError}
                onSave={handleSaveBranding}
              />
            )}

            {activeSection === 'admins' && isSuperadmin && (
              <SuperadminView
                admins={admins}
                isLoading={adminsLoading}
                error={adminsError}
                onReload={loadAdmins}
                onCreateAdmin={handleCreateAdmin}
                onUpdateAdminRole={handleUpdateAdminRole}
                isSubmitting={isCreatingAdmin}
                updatingAdminId={updatingAdminId}
                roleUpdateError={roleUpdateError}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
