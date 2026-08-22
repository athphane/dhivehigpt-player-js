const STYLE_ID = 'dhivehigpt-player-styles';
const FONT_LINK_ID = 'dhivehigpt-player-font';

const CSS = `
.dhivehigpt-player{display:flex;align-items:center;height:56px;padding:0 12px 0 9px;border:var(--border);border-radius:var(--radius);background:var(--bg);box-shadow:var(--shadow);box-sizing:border-box;font-family:Outfit,Helvetica Neue,Helvetica,Arial,sans-serif;color:var(--fg);-webkit-user-select:none;user-select:none}
.dhivehigpt-player *{box-sizing:border-box}
.dhivehigpt-player > *:not(:last-child){margin-right:12px}
.dhivehigpt-player--sticky{position:fixed;left:0;right:0;bottom:0;width:100%;z-index:2147483000;border-radius:0;border:0;transform:translateY(100%);transition:transform .38s cubic-bezier(.16,1,.3,1)}
.dhivehigpt-player--sticky.dhivehigpt-player--sticky-visible{transform:translateY(0)}
@media (prefers-reduced-motion:reduce){.dhivehigpt-player--sticky{transition:none}}
.dhivehigpt-player__btn,.dhivehigpt-player__stop{flex:0 0 auto;width:38px;height:38px;border:0;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .12s ease,filter .12s ease,color .12s ease,background-color .12s ease}
.dhivehigpt-player__btn{background:var(--btn);color:var(--btnFg)}
.dhivehigpt-player__btn:hover{filter:brightness(1.07)}
.dhivehigpt-player__btn:active{transform:scale(.96)}
.dhivehigpt-player__stop{background:transparent;color:var(--mute)}
.dhivehigpt-player__stop:hover{color:var(--chipHover);background-color:var(--track)}
.dhivehigpt-player__stop:active{transform:scale(.96)}
.dhivehigpt-player__seek{flex:1 1 auto;min-width:60px;height:20px;display:flex;align-items:center;cursor:pointer}
.dhivehigpt-player__seek-track{width:100%;height:4px;border-radius:2px;background:var(--track);position:relative;overflow:hidden}
.dhivehigpt-player__seek-fill{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--fill)}
.dhivehigpt-player__time{flex:0 0 auto;font-size:11.5px;letter-spacing:.03em;color:var(--mute);font-variant-numeric:tabular-nums;white-space:nowrap}
.dhivehigpt-player__speed{flex:0 0 auto;height:24px;min-width:38px;padding:0 7px;border:1px solid var(--line);border-radius:6px;background:transparent;color:var(--mute);font-family:inherit;font-size:11.5px;font-weight:500;font-variant-numeric:tabular-nums;cursor:pointer;transition:color .12s ease,border-color .12s ease}
.dhivehigpt-player__speed:hover{color:var(--chipHover);border-color:var(--chipHover)}
.dhivehigpt-player__volume{flex:0 0 auto;display:flex;align-items:center}
.dhivehigpt-player__volume > *:not(:last-child){margin-right:6px}
.dhivehigpt-player__volume-btn{width:18px;height:18px;border:0;padding:0;background:transparent;color:var(--mute);cursor:pointer;display:flex;align-items:center;justify-content:center}
.dhivehigpt-player__volume-slider{width:52px;height:18px;display:flex;align-items:center;cursor:pointer}
.dhivehigpt-player__volume-track{width:100%;height:3px;border-radius:2px;background:var(--track);position:relative}
.dhivehigpt-player__volume-fill{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--fg);opacity:.55}
.dhivehigpt-player__credit{flex:0 0 auto;display:flex;align-items:center;height:28px;padding-left:12px;border-left:1px solid var(--line);text-decoration:none;color:var(--credit);transition:color .14s ease}
.dhivehigpt-player__credit > *:not(:last-child){margin-right:8px}
.dhivehigpt-player__credit:hover{color:var(--creditHover)}
.dhivehigpt-player__credit:hover .dhivehigpt-player__logo{opacity:1}
.dhivehigpt-player__credit-text{display:flex;flex-direction:column;font-size:10px;font-weight:400;letter-spacing:.005em;line-height:1.25;white-space:nowrap;color:inherit}
.dhivehigpt-player__logo{display:block;height:13px;width:auto;opacity:.75;transition:opacity .14s ease;color:var(--logo)}
.dhivehigpt-player__logo svg{display:block}
`;

/** Injects the player's stylesheet once per document, no matter how many players are created. */
export function injectStyles(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.appendChild(style);
}

/** Opt-in loader for the "Outfit" font used by the design. Off by default so embedding the player never makes an unexpected third-party request. */
export function injectFontLink(doc: Document = document): void {
  if (doc.getElementById(FONT_LINK_ID)) return;
  const preconnect = doc.createElement('link');
  preconnect.rel = 'preconnect';
  preconnect.href = 'https://fonts.gstatic.com';
  preconnect.crossOrigin = 'anonymous';

  const stylesheet = doc.createElement('link');
  stylesheet.id = FONT_LINK_ID;
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap';

  doc.head.appendChild(preconnect);
  doc.head.appendChild(stylesheet);
}
