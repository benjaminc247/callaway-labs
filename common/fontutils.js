/**
 * @typedef FontDescriptor
 * @property {string} [style]
 * @property {string} [weight]
 * @property {string} [stretch]
 */

/**
 * Font required error from failed query.
 */
export class FontRequiredError extends Error {
  /**
   * @param {string} family
   * @param {FontDescriptor} desc
   */
  constructor(family, desc) {
    const fontStr = `${family} ${Array.from(Object.values(desc)).join(' ')}`.trim();
    super(`missing required font '${fontStr}'`);
    this.name = 'FontRequiredError';
    this.family = family;
    this.desc = desc;
  }
}

/**
 * Query for existing font.
 * @param {string} family - font family name
 * @param {FontDescriptor} [desc] - font descriptors
 * @returns {FontFace|undefined} - font face or undefined if not found
 * @throws {SyntaxError} - invalid family or descriptor string
 */
export function query(family, desc = {}) {
  // normalize family string and parse descriptors
  const loadFamily = normalizeFontFamily(family);
  const loadDesc = {};
  if (desc.style)
    loadDesc.style = parseFontStyle(desc.style);
  if (desc.weight)
    loadDesc.weight = parseFontWeight(desc.weight);
  if (desc.stretch)
    loadDesc.stretch = parseFontStretch(desc.stretch);

  // search for existing font
  const entries = document.fonts.values();
  for (var iter = entries.next(); !iter.done; iter = entries.next()) {
    const /** @type {FontFace} */ entry = iter.value;
    if (normalizeFontFamily(entry.family) !== loadFamily)
      continue;
    if (entry.ascentOverride !== 'normal')
      continue;
    if (entry.descentOverride !== 'normal')
      continue;
    if (entry.featureSettings !== 'normal')
      continue;
    if (entry.lineGapOverride !== 'normal')
      continue;
    if (entry.unicodeRange !== 'U+0-10FFFF')
      continue;
    if (desc.style) {
      const entryStyle = parseFontStyle(entry.style);
      if (entryStyle.style !== loadDesc.style.style)
        continue;
      if (loadDesc.style.obliqueAngle
        && !rangeContains(entryStyle.obliqueAngle, loadDesc.style.obliqueAngle))
        continue;
    }
    if (desc.weight) {
      const entryWeight = parseFontWeight(entry.weight);
      if (!rangeContains(entryWeight, loadDesc.weight))
        continue;
    }
    if (desc.stretch) {
      const entryStretch = parseFontStretch(entry.stretch);
      if (!rangeContains(entryStretch, loadDesc.stretch))
        continue;
    }

    // font matches, return it
    return entry;
  }

  // font not found
  return undefined;
}

/**
 * Query for existing font, throw on failure.
 * @param {string} family - font family name
 * @param {FontDescriptor} [desc] - font descriptors
 * @returns {FontFace} - font face
 * @throws {SyntaxError} - invalid family or descriptor string
 * @throws {FontRequiredError} - font not found
 */
export function tryQuery(family, desc = {}) {
  const font = query(family, desc);
  if (!font)
    throw new Error(`required font '${font}' not found`);
  return font;
}

/**
 * Async find or load font and return load promise.
 * @param {string} family
 * @param {string} source
 * @param {FontDescriptor} [desc]
 * @returns {Promise<FontFace>} - promise to load font
 * @throws {SyntaxError} - descriptor mismatch, load failure, invalid family or descriptor string
 */
export async function load(family, source, desc = {}) {
  var font = query(family, desc);
  if (!font) {
    font = new FontFace(family, source, {
      style: desc.style,
      weight: desc.weight,
      stretch: desc.stretch
    });
    document.fonts.add(font);
  }
  return font.load();
}

/**
 * Normalize font family for comparison.
 * @param {string} str
 * @returns {string}
 */
function normalizeFontFamily(str) {
  var ret = str.trim().toLowerCase();
  if (ret.startsWith('"') && ret.endsWith('"'))
    ret = ret.substring(1, ret.length - 1).trim();
  return ret;
}

/**
 * Parse font style for comparison.
 * @param {string} str
 * @returns {{style: string, obliqueAngle?: [number, number]}}
 * @throws {SyntaxError} - invalid font style descriptor
 */
function parseFontStyle(str) {
  const keywords = Object.freeze(new Set([
    'normal',
    'italic',
    'oblique'
  ]));
  const defaultObliqueAngle = Object.freeze(14.0);

  const parts = str.trim().toLowerCase().split(/\s+/);

  const style = parts.shift();
  if (!keywords.has(style))
    throw new SyntaxError(`invalid font style '${str}'`);
  if (style !== 'oblique') {
    if (parts.length > 0)
      throw new SyntaxError(`invalid font style '${str}'`);
    return { style: style, obliqueAngle: undefined };
  }
  if (parts.length > 2)
    throw new SyntaxError(`invalid font style '${str}'`);
  if (parts.length < 1)
    return { style: style, obliqueAngle: [defaultObliqueAngle, defaultObliqueAngle] };

  const /** @type {[number, number]} */ range = [undefined, undefined];
  for (var i = 0; i < parts.length; ++i) {
    if (parts[i].match(/^-?[0-9]*(.[0-9]+)?deg$/))
      range[i] = parseFloat(parts[i]);
    if (range[i] === undefined || Number.isNaN(range[i]) || range[i] < -90 || range[i] > 90)
      throw new SyntaxError(`invalid font style '${str}'`);
  }
  if (parts.length < 2)
    range[1] = range[0];

  return { style: style, obliqueAngle: range };
}

/**
 * Parse font weight for comparison.
 * @param {string} str
 * @returns {[number, number]} - font weight range
 * @throws {SyntaxError} - invalid font weight descriptor
 */
function parseFontWeight(str) {
  const keywords = Object.freeze(new Map([
    ['normal', 400],
    ['bold', 700]
  ]));

  const parts = str.trim().toLowerCase().split(/\s+/);
  if (parts.length < 1 || parts.length > 2)
    throw new SyntaxError(`invalid font weight '${str}'`);

  const /** @type {[number, number]} */ range = [undefined, undefined];
  for (var i = 0; i < parts.length; ++i) {
    if (parts[i].match(/^[0-9]*(.[0-9]+)?$/))
      range[i] = parseFloat(parts[i]);
    else
      range[i] = keywords.get(parts[i]);
    if (range[i] === undefined || Number.isNaN(range[i]) || range[i] < 1 || range[i] > 1000)
      throw new SyntaxError(`invalid font weight '${str}'`);
  }
  if (parts.length < 2)
    range[1] = range[0];

  return range;
}

/**
 * Parse font stretch for comparison.
 * @param {string} str
 * @returns {[number, number]} - font stretch range
 * @throws {SyntaxError} - invalid font stretch descriptor
 */
function parseFontStretch(str) {
  const keywords = Object.freeze(new Map([
    ['ultra-condensed', 50],
    ['extra-condensed', 62.5],
    ['condensed', 75],
    ['semi-condensed', 87.5],
    ['normal', 100],
    ['semi-expanded', 112.5],
    ['expanded', 125],
    ['extra-expanded', 150],
    ['ultra-expanded', 200]
  ]));

  const parts = str.trim().toLowerCase().split(/\s+/);
  if (parts.length < 1 || parts.length > 2)
    throw new SyntaxError(`invalid font stretch '${str}'`);

  const /** @type {[number, number]} */ range = [undefined, undefined];
  for (var i = 0; i < parts.length; ++i) {
    if (parts[i].match(/^[0-9]*(.[0-9]+)?%$/))
      range[i] = parseFloat(parts[i]);
    else
      range[i] = keywords.get(parts[i]);
    if (range[i] === undefined || Number.isNaN(range[i]) || range[i] < 1 || range[i] > 200)
      throw new SyntaxError(`invalid font stretch '${str}'`);
  }
  if (parts.length < 2)
    range[1] = range[0];

  return range;
}

/**
 * Check whether the first number range contains the second
 * @param {[number, number]} lhs - range to test against
 * @param {[number, number]} rhs - range to be tested
 * @returns {boolean}
 */
function rangeContains(lhs, rhs) {
  return lhs[0] <= rhs[0] && lhs[1] >= rhs[1];
}