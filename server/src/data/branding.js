const fs = require('fs');
const path = require('path');

const DATA_FILE_PATH = path.join(__dirname, 'branding.json');

const DEFAULT_BRANDING = {
  primaryColor: '#f97316',
  accentColor: '#ea580c',
  themePreference: 'light',
  heroImageUrl: null,
  navbarLogoUrl: null,
  footerLogoUrl: null,
  locationAddress: 'El Chaco 106, Córdoba Capital',
  highlightMessage: 'Agendá tu turno en línea y recibí la confirmación al instante.',
};

function saveBrandingToFile(data) {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('[Branding] Error al guardar branding.json', error);
  }
}

function loadBrandingFromFile() {
  if (!fs.existsSync(DATA_FILE_PATH)) {
    saveBrandingToFile(DEFAULT_BRANDING);
    return { ...DEFAULT_BRANDING };
  }

  try {
    const content = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    const parsed = JSON.parse(content);
    return { ...DEFAULT_BRANDING, ...(parsed || {}) };
  } catch (error) {
    console.error('[Branding] Error al leer branding.json, restaurando datos por defecto', error);
    saveBrandingToFile(DEFAULT_BRANDING);
    return { ...DEFAULT_BRANDING };
  }
}

function isValidHexColor(value) {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value.trim());
}

function isValidThemePreference(value) {
  return value === 'light' || value === 'dark';
}

function normalizeText(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

let brandingSettings = loadBrandingFromFile();

function getBranding() {
  return brandingSettings;
}

function updateBranding({
  primaryColor,
  accentColor,
  themePreference,
  heroImageUrl,
  navbarLogoUrl,
  footerLogoUrl,
  locationAddress,
  highlightMessage,
} = {}) {
  if (primaryColor !== undefined) {
    if (!isValidHexColor(primaryColor)) {
      throw new Error('INVALID_PRIMARY_COLOR');
    }
    brandingSettings.primaryColor = primaryColor.trim();
  }

  if (accentColor !== undefined) {
    if (!isValidHexColor(accentColor)) {
      throw new Error('INVALID_ACCENT_COLOR');
    }
    brandingSettings.accentColor = accentColor.trim();
  }

  if (themePreference !== undefined) {
    if (!isValidThemePreference(themePreference)) {
      throw new Error('INVALID_THEME');
    }
    brandingSettings.themePreference = themePreference;
  }

  if (heroImageUrl !== undefined) {
    brandingSettings.heroImageUrl = normalizeText(heroImageUrl);
  }
  if (navbarLogoUrl !== undefined) {
    brandingSettings.navbarLogoUrl = normalizeText(navbarLogoUrl);
  }
  if (footerLogoUrl !== undefined) {
    brandingSettings.footerLogoUrl = normalizeText(footerLogoUrl);
  }
  if (locationAddress !== undefined) {
    brandingSettings.locationAddress = normalizeText(locationAddress);
  }
  if (highlightMessage !== undefined) {
    brandingSettings.highlightMessage = normalizeText(highlightMessage);
  }

  saveBrandingToFile(brandingSettings);
  return brandingSettings;
}

module.exports = {
  DEFAULT_BRANDING,
  DATA_FILE_PATH,
  getBranding,
  updateBranding,
};
