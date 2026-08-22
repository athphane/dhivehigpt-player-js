const STYLE_ID = 'dhivehigpt-player-styles';
const FONT_LINK_ID = 'dhivehigpt-player-font';

const CSS = `
.dhivehigpt-player-wrap{display:block;container-type:inline-size}
.dhivehigpt-player{display:flex;align-items:center;height:56px;padding:0 12px 0 9px;border:var(--border);border-radius:var(--radius);background:var(--bg);box-shadow:var(--shadow);box-sizing:border-box;font-family:Outfit,Helvetica Neue,Helvetica,Arial,sans-serif;color:var(--fg);-webkit-user-select:none;user-select:none}
.dhivehigpt-player *{box-sizing:border-box}
.dhivehigpt-player > *:not(:last-child){margin-right:12px}
.dhivehigpt-player--sticky{position:fixed;left:0;right:0;bottom:0;width:100%;z-index:2147483000;border-radius:0;border:0;box-shadow:var(--sticky-shadow);transform:translateY(100%) translateZ(0);-webkit-backface-visibility:hidden;backface-visibility:hidden;transition:transform .38s cubic-bezier(.16,1,.3,1)}
.dhivehigpt-player--sticky.dhivehigpt-player--sticky-visible{transform:translateY(0) translateZ(0)}
@media (prefers-reduced-motion:reduce){.dhivehigpt-player--sticky{transition:none}}
.dhivehigpt-player__btn,.dhivehigpt-player__stop{flex:0 0 auto;width:38px;height:38px;border:0;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .12s ease,filter .12s ease,color .12s ease,background-color .12s ease}
.dhivehigpt-player__btn{background:var(--btn);color:var(--btnFg)}
.dhivehigpt-player__btn:hover{filter:brightness(1.07)}
.dhivehigpt-player__btn:active{transform:scale(.96)}
.dhivehigpt-player__stop{background:transparent;color:var(--mute);border:1px solid var(--line)}
.dhivehigpt-player__stop:hover{color:var(--chipHover);border-color:var(--chipHover)}
.dhivehigpt-player__stop:active{transform:scale(.96)}
.dhivehigpt-player__seek{flex:1 1 auto;min-width:32px;height:20px;display:flex;align-items:center;cursor:pointer}
.dhivehigpt-player__seek-track{width:100%;height:4px;border-radius:2px;background:var(--track);position:relative;overflow:hidden}
.dhivehigpt-player__seek-fill{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--fill)}
.dhivehigpt-player__time{flex:0 0 auto;font-size:11.5px;letter-spacing:.03em;color:var(--mute);font-variant-numeric:tabular-nums;white-space:nowrap}
.dhivehigpt-player__speed{flex:0 0 auto;height:24px;min-width:38px;padding:0 7px;border:1px solid var(--line);border-radius:6px;background:transparent;color:var(--mute);font-family:inherit;font-size:11.5px;font-weight:500;font-variant-numeric:tabular-nums;cursor:pointer;transition:color .12s ease,border-color .12s ease}
.dhivehigpt-player__speed:hover{color:var(--chipHover);border-color:var(--chipHover)}
.dhivehigpt-player__volume{flex:0 0 auto;display:flex;align-items:center}
.dhivehigpt-player__volume > *:not(:last-child){margin-right:6px}
.dhivehigpt-player__volume-btn{flex:0 0 auto;width:18px;height:18px;border:0;padding:0;background:transparent;color:var(--mute);cursor:pointer;display:flex;align-items:center;justify-content:center}
.dhivehigpt-player__volume-slider{flex:0 0 auto;width:52px;height:18px;display:flex;align-items:center;cursor:pointer}
.dhivehigpt-player__volume-track{width:100%;height:3px;border-radius:2px;background:var(--track);position:relative}
.dhivehigpt-player__volume-fill{position:absolute;left:0;top:0;bottom:0;border-radius:2px;background:var(--fg);opacity:.55}
.dhivehigpt-player__credit{flex:0 0 auto;display:flex;align-items:center;height:28px;padding-left:12px;border-left:1px solid var(--line);text-decoration:none;color:var(--credit);transition:color .14s ease}
.dhivehigpt-player__credit > *:not(:last-child){margin-right:8px}
.dhivehigpt-player__credit:hover{color:var(--creditHover)}
.dhivehigpt-player__credit:hover .dhivehigpt-player__logo{opacity:1}
.dhivehigpt-player__credit-text{display:flex;flex-direction:column;font-size:10px;font-weight:400;letter-spacing:.005em;line-height:1.25;white-space:nowrap;color:inherit}
.dhivehigpt-player__logo{display:block;height:13px;width:auto;opacity:.75;transition:opacity .14s ease;color:var(--logo)}
.dhivehigpt-player__logo svg{display:block}

/* ---- narrow-width reflow --------------------------------------------------
   Switches from the flex row above to a 2-row CSS grid. Play (and stop, if
   present) span both rows, so they define the vertical extent everything
   else aligns to: row 1 (seek bar + time) sits at the play button's top,
   row 2 (speed, volume, credit) is bottom-aligned to the play button's
   bottom. Speed lines up with the seek bar's left edge (they share a column
   start); time and credit are both right-aligned to the bar's right padding
   edge. --narrow-areas/--narrow-columns are computed per instance in
   MediaPlayer.ts — see the comment there for the column scheme.

   The row heights are pinned (14px + 3px gap + 21px = 38px) to exactly the
   play button's own unchanged 38px height, which is what makes "row 1 at
   the button's top, row 2 at its bottom" hold: the button keeps its desktop
   size and the rows are built around it, rather than the button growing to
   span whatever the rows happen to need. 9px of vertical padding then
   centres that 38px block in the same 56px bar height as desktop.

   Pinning the rows rather than letting content size them also keeps the
   alignment stable across fonts — the credit block is the tallest row-2
   item and its height would otherwise shift with the font's metrics. Its
   type is stepped down (10px -> 9px, and the logo 13px -> 12px) so two
   lines of it fit the 21px row comfortably.

   The flex-layout margin-right above has to be zeroed here: it isn't
   flex-only, so it would stack on top of column-gap and double the spacing
   between every control.

   Applied both as a viewport @media (works everywhere) and as a @container
   query (works against the player's own box, not the viewport — a narrow
   sidebar embed on an otherwise-wide desktop page reflows correctly too).
   Where a browser supports container queries, that block comes later in
   the stylesheet and wins the tie; where it doesn't, @supports keeps the
   @container block from ever applying, leaving the @media fallback as the
   only one in effect. Same breakpoint, same declarations, deliberately —
   only the query type differs. */
@media (max-width:430px){
.dhivehigpt-player{display:grid;grid-template-columns:var(--narrow-columns);grid-template-rows:14px 21px;grid-template-areas:var(--narrow-areas);column-gap:10px;row-gap:3px;height:56px;padding:9px 10px 9px 9px;align-items:center}
.dhivehigpt-player > *:not(:last-child){margin-right:0}
.dhivehigpt-player__btn{grid-area:btn}
.dhivehigpt-player__stop{grid-area:stop}
.dhivehigpt-player__seek{grid-area:seek;height:14px;min-width:0}
.dhivehigpt-player__time{grid-area:time;font-size:10px;line-height:1;letter-spacing:.01em;justify-self:end}
.dhivehigpt-player__speed{grid-area:speed;align-self:end;justify-self:start;height:20px;min-width:34px;font-size:10px}
.dhivehigpt-player__volume{grid-area:volume;align-self:end;justify-self:start;min-width:0}
.dhivehigpt-player__volume-slider{width:44px}
.dhivehigpt-player__credit{grid-area:credit;border-left:0;padding-left:0;align-self:end;justify-self:end;height:auto;min-width:0}
.dhivehigpt-player__credit-text{font-size:9px;line-height:1.1}
.dhivehigpt-player__logo{height:12px}
}
/* Below 260px there's no room for the credit's two lines of text or the
   volume slider's track — both drop to their icon-only form (the logo
   mark alone, the speaker icon alone) rather than wrapping or overflowing.
   The controls stay fully functional either way: the volume icon still
   toggles mute, the logo is still the branding link. */
@media (max-width:260px){
.dhivehigpt-player__credit-text{display:none}
.dhivehigpt-player__volume-slider{display:none}
}
@supports (container-type:inline-size){
@container (max-width:430px){
.dhivehigpt-player{display:grid;grid-template-columns:var(--narrow-columns);grid-template-rows:14px 21px;grid-template-areas:var(--narrow-areas);column-gap:10px;row-gap:3px;height:56px;padding:9px 10px 9px 9px;align-items:center}
.dhivehigpt-player > *:not(:last-child){margin-right:0}
.dhivehigpt-player__btn{grid-area:btn}
.dhivehigpt-player__stop{grid-area:stop}
.dhivehigpt-player__seek{grid-area:seek;height:14px;min-width:0}
.dhivehigpt-player__time{grid-area:time;font-size:10px;line-height:1;letter-spacing:.01em;justify-self:end}
.dhivehigpt-player__speed{grid-area:speed;align-self:end;justify-self:start;height:20px;min-width:34px;font-size:10px}
.dhivehigpt-player__volume{grid-area:volume;align-self:end;justify-self:start;min-width:0}
.dhivehigpt-player__volume-slider{width:44px}
.dhivehigpt-player__credit{grid-area:credit;border-left:0;padding-left:0;align-self:end;justify-self:end;height:auto;min-width:0}
.dhivehigpt-player__credit-text{font-size:9px;line-height:1.1}
.dhivehigpt-player__logo{height:12px}
}
@container (max-width:260px){
.dhivehigpt-player__credit-text{display:none}
.dhivehigpt-player__volume-slider{display:none}
}
}
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
