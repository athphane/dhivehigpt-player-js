/** Inline SVG icon markup, ported from the Claude Design export. Colors are set via `currentColor` so callers set `color` on the wrapping element. */

export const ICON_PAUSE =
  '<svg width="12" height="13" viewBox="0 0 12 13" aria-hidden="true"><rect x="0" y="0" width="4" height="13" rx="1" fill="currentColor"></rect><rect x="8" y="0" width="4" height="13" rx="1" fill="currentColor"></rect></svg>';

export const ICON_PLAY =
  '<svg width="12" height="14" viewBox="0 0 12 14" aria-hidden="true" style="margin-left:2px"><polygon points="0,0 12,7 0,14" fill="currentColor"></polygon></svg>';

export const ICON_STOP =
  '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><rect x="0" y="0" width="14" height="14" rx="3" fill="currentColor"></rect></svg>';

export function iconVolume(volume: number): string {
  const tick1 = volume > 0.05;
  const tick2 = volume > 0.6;
  return (
    '<svg width="15" height="14" viewBox="0 0 15 14" aria-hidden="true">' +
    '<polygon points="0,4.5 3.5,4.5 8,0.5 8,13.5 3.5,9.5 0,9.5" fill="currentColor"></polygon>' +
    `<rect x="10.5" y="3.5" width="1.6" height="7" rx=".8" fill="currentColor" opacity="${tick1 ? 1 : 0}"></rect>` +
    `<rect x="13.2" y="1.5" width="1.6" height="11" rx=".8" fill="currentColor" opacity="${tick2 ? 1 : 0}"></rect>` +
    '</svg>'
  );
}
