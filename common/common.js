window.addEventListener('error', (ev) => {
  console.log(`Unhandled Exception: ${ev.message} at (${ev.filename}:${ev.lineno}:${ev.colno})`);
});
window.addEventListener('unhandledrejection', (ev) => {
  const msg = ev.reason.stack ? ev.reason.stack.replace(/\s+/g, ' ') : ev.reason;
  console.log(`Unhandled Rejection: ${msg}`);
});