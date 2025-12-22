/**
 * Template type detection utility
 * Detects template category from template name by extracting keywords
 * Mirrors the Python template_detector.py logic
 */

// Template keywords to category mapping
const TEMPLATE_KEYWORDS = {
  // Image-based templates (all identical)
  "jewelry": "image_based",
  "artwork": "image_based",
  "art": "image_based",
  "auto": "image_based",
  "automobile": "image_based",
  "firearms": "image_based",
  "firearm": "image_based",
  "handbag": "image_based",
  "handbags": "image_based",
  "watch": "image_based",
  "watches": "image_based",
  "collectibles": "image_based",
  "collectible": "image_based",

  // Table-based templates (each different)
  "coin": "coin",
  "coins": "coin",
  "content": "content",
  "contents": "content",
  "inventory": "content",
  "wine": "wine",
  "wines": "wine",
};

/**
 * Detect template category from template name by extracting keywords
 * 
 * Examples:
 *   "Divorce Template Wine Appraisal MSTEMPLATE-Doc" → "wine"
 *   "Estate Template Coin Collection MSTEMPLATE" → "coin"
 *   "Divorce Template Jewelry Appraisal-FORM-FINAL" → "image_based"
 *   "jewelry" → "image_based"
 * 
 * @param {string} templateName - Name of the template (case-insensitive)
 * @returns {string} Template category ("image_based", "coin", "content", or "wine")
 */
export function detectTemplateCategory(templateName) {
  if (!templateName || typeof templateName !== 'string') {
    return "image_based";
  }

  // Normalize name (lowercase, trim)
  const normalized = templateName.toLowerCase().trim();

  // Remove common separators and split into words
  // This helps match "Wine" in "Divorce Template Wine Appraisal"
  const words = normalized.split(/[\s\-_]+/);

  // First pass: Check for exact keyword matches in words
  for (const word of words) {
    if (TEMPLATE_KEYWORDS[word]) {
      return TEMPLATE_KEYWORDS[word];
    }
  }

  // Second pass: Check if any keyword is contained in the full name
  for (const [keyword, category] of Object.entries(TEMPLATE_KEYWORDS)) {
    if (normalized.includes(keyword)) {
      return category;
    }
  }

  // Default to image-based (backward compatible)
  return "image_based";
}

// Mapping from template keywords to item type options (as they appear in dropdown)
const KEYWORD_TO_ITEM_TYPE = {
  "jewelry": "Jewelry",
  "artwork": "Artwork",
  "art": "Artwork",
  "auto": "Auto",
  "automobile": "Auto",
  "firearms": "Firearms",
  "firearm": "Firearms",
  "handbag": "Handbag",
  "handbags": "Handbag",
  "watch": "Watches",
  "watches": "Watches",
  "collectibles": "Collectibles",
  "collectible": "Collectibles",
  "coin": "Coins",
  "coins": "Coins",
  "content": "Contents",
  "contents": "Contents",
  "inventory": "Contents",
  "wine": "Wine",
  "wines": "Wine",
};

/**
 * Detect item type keyword from template name
 * Returns the actual item type (e.g., "Wine", "Coins", "Jewelry") matching dropdown options
 * 
 * Examples:
 *   "Divorce Template Wine Appraisal MSTEMPLATE-Doc" → "Wine"
 *   "Estate Template Coin Collection MSTEMPLATE" → "Coins"
 *   "Divorce Template Jewelry Appraisal-FORM-FINAL" → "Jewelry"
 *   "jewelry" → "Jewelry"
 * 
 * @param {string} templateName - Name of the template (case-insensitive)
 * @returns {string|null} Item type matching dropdown options or null if not found
 */
export function detectItemTypeFromTemplate(templateName) {
  if (!templateName || typeof templateName !== 'string') {
    return null;
  }

  // Normalize name (lowercase, trim)
  const normalized = templateName.toLowerCase().trim();

  // Remove common separators and split into words
  const words = normalized.split(/[\s\-_]+/);

  // First pass: Check for exact keyword matches in words
  for (const word of words) {
    if (KEYWORD_TO_ITEM_TYPE[word]) {
      return KEYWORD_TO_ITEM_TYPE[word];
    }
  }

  // Second pass: Check if any keyword is contained in the full name
  for (const [keyword, itemType] of Object.entries(KEYWORD_TO_ITEM_TYPE)) {
    if (normalized.includes(keyword)) {
      return itemType;
    }
  }

  // No keyword found
  return null;
}

