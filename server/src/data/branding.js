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
  businessHours: '',
  whatsappPhone: '',
  instagramUrl: '',
  transferAlias: '',
  transferAccountHolder: '',
  transferDestination: '',
  highlightMessage: 'Agendá tu turno en línea y recibí la confirmación al instante.',
  workGallery: [],
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

function normalizeInstagramUrl(value) {
  const trimmed = normalizeText(value);
  if (!trimmed) return null;

  const withoutAt = trimmed.replace(/^@+/, '');
  if (/^https?:\/\//i.test(withoutAt)) {
    return withoutAt;
  }

  const username = withoutAt
    .replace(/^instagram\.com\//i, '')
    .replace(/^www\.instagram\.com\//i, '')
    .replace(/^\/+/, '')
    .replace(/\/+$/, '');

  if (!username) return null;
  return `https://instagram.com/${username}`;
}

function normalizeWorkGallery(value) {
  if (!Array.isArray(value)) return [];

  const normalized = value
    .map((item, index) => {
      const rawNumber = Number.parseInt(item?.cardNumber, 10);
      const cardNumber = Number.isFinite(rawNumber) && rawNumber > 0 ? rawNumber : index + 1;
      const imageUrl = normalizeText(item?.imageUrl);
      const title = normalizeText(item?.title);
      const description = normalizeText(item?.description);
      return { cardNumber, imageUrl, title, description };
    })
    .sort((a, b) => a.cardNumber - b.cardNumber)
    .map((item, index) => ({
      cardNumber: index + 1,
      imageUrl: item.imageUrl,
      title: item.title,
      description: item.description,
    }))
    .slice(0, 24);

  return normalized;
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
  businessHours,
  whatsappPhone,
  instagramUrl,
  transferAlias,
  transferAccountHolder,
  transferDestination,
  highlightMessage,
  workGallery,
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
  if (businessHours !== undefined) {
    brandingSettings.businessHours = normalizeText(businessHours);
  }
  if (whatsappPhone !== undefined) {
    brandingSettings.whatsappPhone = normalizeText(whatsappPhone);
  }
  if (instagramUrl !== undefined) {
    brandingSettings.instagramUrl = normalizeInstagramUrl(instagramUrl);
  }
  if (transferAlias !== undefined) {
    brandingSettings.transferAlias = normalizeText(transferAlias);
  }
  if (transferAccountHolder !== undefined) {
    brandingSettings.transferAccountHolder = normalizeText(transferAccountHolder);
  }
  if (transferDestination !== undefined) {
    brandingSettings.transferDestination = normalizeText(transferDestination);
  }
  if (highlightMessage !== undefined) {
    brandingSettings.highlightMessage = normalizeText(highlightMessage);
  }
  if (workGallery !== undefined) {
    brandingSettings.workGallery = normalizeWorkGallery(workGallery);
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
