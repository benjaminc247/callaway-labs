/**
 * Http error from network request.
 */
export class HttpError extends Error {
  /**
   * @param {number} statusCode
   * @param {string} statusText
   */
  constructor(statusCode, statusText) {
    super(`${statusCode} ${statusText}`);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.statusText = statusText;
  }
}

/**
 * Element required error from failed query.
 */
export class ElementRequiredError extends Error {
  /**
   * @param {string} parentId
   * @param {string} selector
   */
  constructor(parentId, selector) {
    super(`${parentId} selector '${selector}' failed`);
    this.name = 'ElementRequiredError';
    this.parentId = parentId;
    this.selector = selector;
  }
}

/**
 * Async fetch html from file as template.
 * @param {string} fileName - name of html file to fetch
 * @returns {Promise<HTMLTemplateElement>} - promise to fetch html from file
 * @throws {AbortError} - abort signalled
 * @throws {TypeError} - invalid request or network error
 * @throws {HttpError} - bad network response
 * @throws {SyntaxError} - body could not be parsed as html
 */
export async function fetchHtml(fileName) {
  const response = await fetch(fileName);
  if (!response.ok)
    throw new HttpError(response.status, response.statusText);
  const responseText = await response.text();
  const htmlTemplate = document.createElement('template');
  htmlTemplate.innerHTML = responseText;
  return htmlTemplate;
}

/**
 * Async fetch css from file.
 * @param {string} fileName
 * @returns {Promise<CSSStyleSheet>} - promise to fetch css from file
 * @throws {AbortError} - abort signalled
 * @throws {TypeError} - invalid request or network error
 * @throws {HttpError} - bad network response
 */
export async function fetchCss(fileName) {
  const response = await fetch(fileName);
  if (!response.ok)
    throw new HttpError(response.status, response.statusText);
  const responseText = await response.text();
  const styleSheet = new CSSStyleSheet();
  styleSheet.replaceSync(responseText);
  return styleSheet;
}

/**
 * Query selector, throw on failure.
 * @param {ParentNode} parent - parent element for query
 * @param {string} parentId - parent id for error message
 * @param {string} selector - selector string
 * @returns {Element} - selected element
 * @throws {ElementRequiredError} - selector returned no results
 */
export function tryQuerySelector(parent, parentId, selector) {
  const element = parent.querySelector(selector);
  if (!element)
    throw new ElementRequiredError(parentId, selector);
  return element;
}