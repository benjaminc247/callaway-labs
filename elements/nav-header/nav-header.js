import * as Utils from '/common/utils.js'
import * as Fonts from '/common/fonts.js'

class NavHeaderElement extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.#rebuild();
  }

  async #rebuild() {
    // import html
    const htmlTemplate = await Utils.fetchHtml('/elements/nav-header/nav-header.html');
    const htmlFrag = document.importNode(htmlTemplate.content, true);

    // query sidenav root
    const sideNav = htmlFrag.querySelector('#sidenav');

    // set up open button
    const openBtn = htmlFrag.querySelector('#open-sidenav');
    openBtn.addEventListener('click', () => {
      sideNav.classList.add('active');
    });

    // set up close button
    const closeBtn = htmlFrag.querySelector('#close-sidenav');
    closeBtn.addEventListener('click', () => {
      sideNav.classList.remove('active');
    });

    // set up close on click outside content
    const content = htmlFrag.querySelector('#sidenav-content');
    sideNav.addEventListener('click', (/** @type {PointerEvent} */ event) => {
      if (!(event.target instanceof Element && content.contains(event.target)))
        sideNav.classList.remove('active');
    });

    // import style sheet
    this.shadowRoot.adoptedStyleSheets.push(
      await Utils.fetchCss('/elements/nav-header/nav-header.css')
    );

    // wait for fonts
    await Fonts.loadExisting(
      'Roboto Flex',
      { style: 'normal', weight: '100 1000', stretch: '25% 151%' }
    );
    await Fonts.loadExisting(
      'Font Awesome',
      { style: 'normal', weight: '900' }
    );

    // append html
    this.shadowRoot.appendChild(htmlFrag);
  }
}
customElements.define('nav-header', NavHeaderElement);