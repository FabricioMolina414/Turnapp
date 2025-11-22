import { useCallback, useEffect, useMemo, useState } from 'react';
import brandLogo from '../assets/Logo_AC-removebg-preview.png';
import { useAuth } from './context/AuthContext.jsx';
import LoginView from './components/LoginView.jsx';
import { fetchWeeklySchedule } from './api/appointments.js';
import { fetchMonthlyMetrics } from './api/metrics.js';
import { fetchServices } from './api/services.js';
import { fetchStaff, createStaffMember, deleteStaffMember } from './api/staff.js';
import { fetchAdmins, createAdmin } from './api/superadmin.js';

const DEFAULT_STAFF_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="24" fill="%23f1f5f9"/><circle cx="64" cy="52" r="26" fill="%2394a3b8"/><path d="M24 112c0-22 18-40 40-40s40 18 40 40" fill="%23cbd5f5"/></svg>';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Mi comercio', roles: ['admin', 'superadmin'] },
  { id: 'turnos', label: 'Turnos', roles: ['admin', 'superadmin'] },
  { id: 'services', label: 'Mis servicios', roles: ['admin', 'superadmin'] },
  { id: 'branding', label: 'Personalización', roles: ['admin', 'superadmin'] },
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

const EMPTY_STAFF_FORM = {
  name: '',
  role: '',
  availability: '',
  specialties: '',
  avatar: '',
};

function capitalize(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getStartOfWeek(date = new Date()) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function buildWeeklySchedule(scheduleMap, referenceDate = new Date()) {
  const isoDates = Object.keys(scheduleMap ?? {});
  const baseDate = isoDates.length ? new Date(isoDates[0]) : referenceDate;
  const start = getStartOfWeek(baseDate);

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

function Sidebar({ navItems, activeItem, onSelect }) {
  if (!navItems.length) {
    return null;
  }

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <img src={brandLogo} alt="Turnapp" />
        <div>
          <strong>Turnapp</strong>
          <span>Panel de administración</span>
        </div>
      </div>

      <nav className="admin-nav">
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

      <div className="sidebar-footer">
        <span className="sidebar-title">Próximas acciones</span>
        <ul>
          <li>Configurar recordatorios automáticos</li>
          <li>Invitar a tu equipo a la app</li>
          <li>Activar integraciones de pago</li>
        </ul>
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
}) {
  const totalRevenue = weeklySchedule.reduce((acc, day) => acc + (day.metrics.revenue || 0), 0);
  const totalConfirmed = weeklySchedule.reduce(
    (acc, day) => acc + (day.metrics.confirmado || 0),
    0
  );

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
          <strong className="kpi-value">{currencyFormatter.format(totalRevenue)}</strong>
          <small className="kpi-helper">Confirmados + señas tomadas</small>
        </article>
        <article className="kpi-card is-accent">
          <span className="kpi-label">Turnos confirmados</span>
          <strong className="kpi-value">{totalConfirmed}</strong>
          <small className="kpi-helper">Distribuidos en toda la semana</small>
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

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Últimos 6 meses</h2>
            <p>Seguimiento de turnos confirmados, cancelaciones y facturación.</p>
          </div>
        </header>
        <MonthlyOverview data={monthlyMetrics} />
      </section>
    </div>
  );
}

function AgendaPanel({ selectedDay, selectedAppointmentId, onSelectAppointment }) {
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
}) {
  return (
    <div className="appointments-view">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Turnos de la semana</h2>
            <p>Explorá agenda, confirmá o reprogramá según disponibilidad.</p>
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
        />
      </section>
    </div>
  );
}

function AppointmentDetails({ appointment }) {
  if (!appointment) {
    return (
      <div className="appointment-empty">
        <p>Seleccioná un turno para ver los detalles.</p>
      </div>
    );
  }

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
  isCreatingStaff,
  onDeleteStaff,
  deletingStaffId,
  staffActionError,
  onDismissStaffError,
}) {
  const [formState, setFormState] = useState(EMPTY_STAFF_FORM);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [isProcessingAvatar, setIsProcessingAvatar] = useState(false);

  useEffect(() => {
    if (!isStaffEditorActive) {
      setFormState(EMPTY_STAFF_FORM);
      setFormError(null);
      setFormSuccess(null);
      setAvatarPreview('');
    }
  }, [isStaffEditorActive]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
    setFormSuccess(null);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const payload = {
      name: formState.name.trim(),
      role: formState.role.trim(),
      availability: formState.availability.trim(),
      avatar: formState.avatar.trim(),
      specialties: formState.specialties
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    };

    if (!payload.name) {
      setFormError('Ingresá un nombre.');
      return;
    }

    try {
      await onCreateStaff(payload);
      setFormSuccess('Profesional agregado correctamente.');
      setFormState(EMPTY_STAFF_FORM);
      setAvatarPreview('');
    } catch (error) {
      setFormError(error.message || 'No se pudo crear el profesional.');
    }
  };

  const handleDeleteStaff = (memberId) => {
    if (!onDeleteStaff) return;
    onDeleteStaff(memberId).catch(() => {
      /* Error manejado por el estado global */
    });
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
          <button type="button" className="secondary-button" onClick={handleToggle}>
            {isStaffEditorActive ? 'Finalizar edición' : 'Añadir profesional'}
          </button>
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
              <div className="form-field">
                <label htmlFor="staff-availability">Disponibilidad</label>
                <input
                  id="staff-availability"
                  name="availability"
                  placeholder="Lunes a viernes · 10:00 a 18:00"
                  value={formState.availability}
                  onChange={handleFieldChange}
                  disabled={isCreatingStaff}
                />
              </div>
              <div className="form-field">
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
              <div className="form-field">
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
            {staff.map((member) => (
              <article key={member.id} className="staff-card">
                {isStaffEditorActive && (
                  <button
                    type="button"
                    className={`staff-delete-button${deletingStaffId === member.id ? ' is-loading' : ''}`}
                    onClick={() => handleDeleteStaff(member.id)}
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
                )}
                <img
                  src={member.avatar || DEFAULT_STAFF_AVATAR}
                  alt={member.name}
                  className="staff-avatar"
                />
                <div className="staff-main">
                  <strong>{member.name}</strong>
                  <span className="staff-role">{member.role}</span>
                  {member.specialties?.length ? (
                    <ul>
                      {member.specialties.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="staff-hint">Sumá especialidades para destacar sus servicios.</p>
                  )}
                  {member.availability ? (
                    <span className="staff-availability">{member.availability}</span>
                  ) : (
                    <span className="staff-availability is-muted">Horarios sin definir</span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Aún no cargaste profesionales. Sumá uno desde el backend.</p>
        )}
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Catálogo de servicios</h2>
            <p>Definí tiempos, precios y profesionales asignados.</p>
          </div>
          <button type="button" className="secondary-button">
            Nuevo servicio
          </button>
        </header>

        {services.length ? (
          <div className="services-table">
            <div className="services-table-head">
              <span>Servicio</span>
              <span>Duración</span>
              <span>Precio</span>
              <span>Profesionales</span>
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
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-state">Aún no cargaste servicios. Creá el primero para empezar.</p>
        )}
      </section>
    </div>
  );
}

function BrandingView() {
  return (
    <div className="branding-view">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Identidad visual</h2>
            <p>Actualizá colores, logos e imágenes visibles en tu sitio público.</p>
          </div>
          <button type="button" className="secondary-button">
            Vista previa
          </button>
        </header>

        <form className="branding-form" onSubmit={(event) => event.preventDefault()}>
          <div className="form-field">
            <label htmlFor="primary-color">Color principal</label>
            <input type="color" id="primary-color" name="primary-color" defaultValue="#f97316" />
          </div>

          <div className="form-field">
            <label htmlFor="secondary-color">Color de acento</label>
            <input type="color" id="secondary-color" name="secondary-color" defaultValue="#ea580c" />
          </div>

          <div className="form-field">
            <label htmlFor="hero-image">Imágenes del hero</label>
            <input type="file" id="hero-image" name="hero-image" accept="image/png,image/jpeg" />
            <p className="form-helper">Formatos JPG o PNG · Recomendado 1440 × 900 px.</p>
          </div>

          <div className="form-field">
            <label htmlFor="navbar-logo">Logo navbar</label>
            <div className="logo-preview">
              <img src={brandLogo} alt="Logo actual" />
              <input type="file" id="navbar-logo" name="navbar-logo" accept="image/png,image/svg+xml" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="footer-logo">Logo footer</label>
            <div className="logo-preview">
              <img src={brandLogo} alt="Logo actual" />
              <input type="file" id="footer-logo" name="footer-logo" accept="image/png,image/svg+xml" />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="custom-copy">Mensaje destacado</label>
            <textarea
              id="custom-copy"
              name="custom-copy"
              rows={3}
              defaultValue="Agendá tu turno en línea y recibí la confirmación al instante."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button">
              Deshacer cambios
            </button>
            <button type="submit" className="primary-button">
              Guardar personalización
            </button>
          </div>
        </form>
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
  isSubmitting,
}) {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
  });
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);

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
      setFormSuccess('Administrador creado correctamente.');
      setFormState({
        name: '',
        email: '',
        username: '',
        password: '',
      });
    } catch (submitError) {
      setFormError(submitError.message || 'No se pudo crear el administrador.');
    }
  };

  return (
    <div className="admins-view">
      <section className="card">
        <header className="card-header">
          <div>
            <h2>Crear nuevo administrador</h2>
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
              <p className="form-helper">El admin podrá cambiarla luego.</p>
            </div>
          </div>

          {(formError || formSuccess) && (
            <div className={formError ? 'alert-error' : 'alert-success'}>
              <p>{formError || formSuccess}</p>
            </div>
          )}

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creando...' : 'Crear administrador'}
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <header className="card-header">
          <div>
            <h2>Administradores activos</h2>
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

        {isLoading && !admins.length ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Cargando administradores...</p>
          </div>
        ) : (
          <div className="admins-table">
            <div className="admins-head">
              <span>Nombre</span>
              <span>Email</span>
              <span>Usuario</span>
              <span>Alta</span>
            </div>
            {admins.length ? (
              admins.map((admin) => (
                <div key={admin.id} className="admins-row">
                  <div className="admins-main">
                    <strong>{admin.name}</strong>
                    <span className="admins-role">
                      {admin.role === 'superadmin' ? 'Superadmin' : 'Admin'}
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
                </div>
              ))
            ) : (
              <p className="empty-state">Todavía no invitaste a ningún administrador.</p>
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
  const navItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(userRole)),
    [userRole]
  );
  const [activeSection, setActiveSection] = useState(navItems[0]?.id ?? 'dashboard');
  const [weeklySchedule, setWeeklySchedule] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [monthlyMetrics, setMonthlyMetrics] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [adminsLoading, setAdminsLoading] = useState(false);
  const [adminsError, setAdminsError] = useState(null);
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  const [isStaffEditorActive, setIsStaffEditorActive] = useState(false);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [staffActionError, setStaffActionError] = useState(null);
  const [deletingStaffId, setDeletingStaffId] = useState(null);

  const selectedDay = useMemo(
    () => weeklySchedule.find((day) => day.isoDate === selectedDayId) ?? weeklySchedule[0] ?? null,
    [weeklySchedule, selectedDayId]
  );

  useEffect(() => {
    if (selectedDay) {
      setSelectedAppointmentId(selectedDay.appointments[0]?.id ?? null);
    }
  }, [selectedDay]);

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
      const [scheduleResponse, metricsResponse, servicesResponse, staffResponse] = await Promise.all([
        fetchWeeklySchedule({ token }),
        fetchMonthlyMetrics({ token }),
        fetchServices({ token }),
        fetchStaff({ token }),
      ]);

      const schedule = buildWeeklySchedule(scheduleResponse?.schedule);
      setWeeklySchedule(schedule);
      setSelectedDayId((prev) => prev || schedule[0]?.isoDate || '');
      setMonthlyMetrics(metricsResponse?.metrics ?? []);
      setServices(servicesResponse?.services ?? []);
      setStaff(staffResponse?.staff ?? []);
    } catch (error) {
      console.error('[Admin] Error al cargar datos', error);
      setDataError(error.message || 'No se pudo cargar la información');
    } finally {
      setIsLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token, loadData]);

  const isSuperadmin = userRole === 'superadmin';

  const loadAdmins = useCallback(async () => {
    if (!token || !isSuperadmin) return;
    setAdminsLoading(true);
    setAdminsError(null);
    try {
      const response = await fetchAdmins({ token });
      setAdmins(response?.admins ?? []);
    } catch (error) {
      console.error('[Admin] Error al cargar admins', error);
      setAdminsError(error.message || 'No se pudo cargar el listado de admins');
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
    async ({ name, email, password, username }) => {
      if (!token || !isSuperadmin) {
        throw new Error('No tenés permisos para crear administradores');
      }

      setIsCreatingAdmin(true);
      try {
        const response = await createAdmin({
          token,
          admin: { name, email, password, username },
        });
        setAdmins((prev) => [...prev, response.admin]);
        return response.admin;
      } finally {
        setIsCreatingAdmin(false);
      }
    },
    [token, isSuperadmin]
  );

  const handleToggleStaffEditor = useCallback(() => {
    setStaffActionError(null);
    setIsStaffEditorActive((prev) => !prev);
  }, []);

  const handleCreateStaffMember = useCallback(
    async ({ name, role, availability, specialties, avatar }) => {
      if (!token) {
        throw new Error('No hay sesión activa');
      }

      setIsCreatingStaff(true);
      setStaffActionError(null);

      try {
        const response = await createStaffMember({
          token,
          staff: { name, role, availability, specialties, avatar },
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

  const handleDismissStaffError = useCallback(() => {
    setStaffActionError(null);
  }, []);

  const weekRevenue = weeklySchedule.reduce((sum, day) => sum + (day.metrics.revenue || 0), 0);
  const weekConfirmed = weeklySchedule.reduce(
    (sum, day) => sum + (day.metrics.confirmado || 0),
    0
  );
  const weekTotal = weeklySchedule.reduce((sum, day) => sum + (day.metrics.total || 0), 0);

  const kpiCards = useMemo(
    () => [
      {
        id: 'week-revenue',
        label: 'Ingresos semana',
        value: currencyFormatter.format(weekRevenue),
        helper: 'Turnos confirmados + señas',
        highlight: true,
      },
      {
        id: 'week-confirmed',
        label: 'Turnos confirmados',
        value: weekConfirmed.toString(),
        helper: 'Semana en curso',
      },
      {
        id: 'week-total',
        label: 'Turnos totales',
        value: weekTotal.toString(),
        helper: 'Incluye pendientes y señas',
      },
      {
        id: 'avg-ticket',
        label: 'Ticket promedio',
        value: weekConfirmed ? currencyFormatter.format(Math.round(weekRevenue / weekConfirmed)) : '-',
        helper: 'Basado en confirmados',
      },
    ],
    [weekRevenue, weekConfirmed, weekTotal]
  );

  if (status !== 'authenticated') {
    return <LoginView />;
  }

  const activeNavItem = navItems.find((item) => item.id === activeSection) ?? navItems[0] ?? null;

  return (
    <div className="admin-shell">
      <Sidebar navItems={navItems} activeItem={activeSection} onSelect={setActiveSection} />

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{activeNavItem?.label ?? 'Panel'}</h1>
            <p>Gestioná tu negocio, agenda y experiencia de cara al cliente desde un mismo lugar.</p>
          </div>
          <div className="user-chip">
            <div>
              <strong>{user?.name || user?.email}</strong>
              <span>{capitalize(user?.role)}</span>
            </div>
            <button type="button" className="secondary-button" onClick={logout}>
              Cerrar sesión
            </button>
          </div>
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
              />
            )}

            {activeSection === 'turnos' && (
              <AppointmentsView
                weeklySchedule={weeklySchedule}
                selectedDayId={selectedDay?.isoDate ?? selectedDayId}
                onSelectDay={setSelectedDayId}
                selectedDay={selectedDay}
                selectedAppointmentId={selectedAppointmentId}
                onSelectAppointment={setSelectedAppointmentId}
              />
            )}

            {activeSection === 'services' && (
              <ServicesView
                services={services}
                staff={staff}
                isStaffEditorActive={isStaffEditorActive}
                onToggleStaffEditor={handleToggleStaffEditor}
                onCreateStaff={handleCreateStaffMember}
                isCreatingStaff={isCreatingStaff}
                onDeleteStaff={handleDeleteStaffMember}
                deletingStaffId={deletingStaffId}
                staffActionError={staffActionError}
                onDismissStaffError={handleDismissStaffError}
              />
            )}

            {activeSection === 'branding' && <BrandingView />}

            {activeSection === 'admins' && isSuperadmin && (
              <SuperadminView
                admins={admins}
                isLoading={adminsLoading}
                error={adminsError}
                onReload={loadAdmins}
                onCreateAdmin={handleCreateAdmin}
                isSubmitting={isCreatingAdmin}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
