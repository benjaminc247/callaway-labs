import * as Utils from '/common/utils.js'

export default class NavHeaderElement extends HTMLElement {
  constructor() {
    super();
    const shadowRoot = this.attachShadow({ mode: 'closed' });

    (async () => {
      try {
        // import html
        const htmlTemplate = await Utils.fetchHtml('/elements/nav-header/nav-header.html');
        const htmlFrag = document.importNode(htmlTemplate.content, true);

        // query sidenav root
        const sideNav = Utils.tryQuerySelector(htmlFrag, 'nav-header.html', '#sidenav');

        // set up open button
        const openBtn = Utils.tryQuerySelector(htmlFrag, 'nav-header.html', '#open-sidenav');
        openBtn.addEventListener('click', () => {
          sideNav.classList.add('active');
        });

        // set up close button
        const closeBtn = Utils.tryQuerySelector(htmlFrag, 'nav-header.html', '#close-sidenav');
        closeBtn.addEventListener('click', () => {
          sideNav.classList.remove('active');
        });

        // click on sidenav outside content to close
        const content = Utils.tryQuerySelector(htmlFrag, 'nav-header.html', '#sidenav-content');
        sideNav.addEventListener('click', (/** @type {PointerEvent} */ event) => {
          if (!(event.target instanceof Element && content.contains(event.target)))
            sideNav.classList.remove('active');
        });

        // import style sheet
        const styleSheet = await Utils.fetchCss('/elements/nav-header/nav-header.css');
        shadowRoot.adoptedStyleSheets.push(styleSheet);

        // append html
        shadowRoot.appendChild(htmlFrag);
      }
      catch (except) {
        // log exceptions
        console.log(`${except}`);
      }
    })();
  }
}
customElements.define('nav-header', NavHeaderElement);