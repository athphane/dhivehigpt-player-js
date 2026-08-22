import { afterEach, describe, expect, it } from 'vitest';
import { injectFontLink, injectStyles } from '../src/core/styles';

afterEach(() => {
  document.head.innerHTML = '';
});

describe('injectStyles', () => {
  it('injects a single <style> tag even when called multiple times', () => {
    injectStyles();
    injectStyles();
    injectStyles();
    expect(document.head.querySelectorAll('#dhivehigpt-player-styles')).toHaveLength(1);
  });

  it('includes both a @media and a @container(-support-gated) narrow-width block that reflow to the JS-computed grid vars', () => {
    // jsdom doesn't evaluate @media/@container rules against a real layout,
    // so this is a textual check that the responsive rules exist at all,
    // rather than an assertion on computed styles at a given width.
    injectStyles();
    const css = document.getElementById('dhivehigpt-player-styles')!.textContent!;

    expect(css).toContain('container-type:inline-size');

    const mediaBlock = css.match(/@media \(max-width:430px\)\{([\s\S]*?)\n\}/)?.[1];
    expect(mediaBlock).toBeTruthy();
    expect(mediaBlock).toContain('grid-template-columns:var(--narrow-columns)');
    expect(mediaBlock).toContain('grid-template-areas:var(--narrow-areas)');
    // The rows are pinned to the play button's own unchanged 38px height
    // (14 + 3 gap + 21), which is what makes row 1 land on the button's top
    // and row 2 on its bottom; 9px of vertical padding then centres that
    // 38px block in the same 56px bar height as desktop.
    expect(mediaBlock).toContain('grid-template-rows:14px 21px');
    expect(mediaBlock).toContain('row-gap:3px;height:56px;padding:9px 10px 9px 9px');
    // The flex margin-right has to be cancelled or it stacks on top of
    // column-gap and doubles the spacing between every control.
    expect(mediaBlock).toContain('.dhivehigpt-player > *:not(:last-child){margin-right:0}');
    // Play/stop span both rows and keep their desktop size — only the grid
    // placement is added, no width/height override.
    expect(mediaBlock).toContain('.dhivehigpt-player__btn{grid-area:btn}');
    expect(mediaBlock).toContain('.dhivehigpt-player__stop{grid-area:stop}');
    // Seek fills row 1 exactly (14px) so its top lands on the button's top
    // rather than sitting half a pixel low from being centred in the row.
    expect(mediaBlock).toContain('.dhivehigpt-player__seek{grid-area:seek;height:14px;min-width:0}');
    // Credit type steps down so two lines fit the 21px row.
    expect(mediaBlock).toContain('.dhivehigpt-player__credit-text{font-size:9px;line-height:1.1}');
    expect(mediaBlock).toContain('.dhivehigpt-player__logo{height:12px}');
    expect(mediaBlock).toContain('justify-self:end}'); // time, right-aligned to the bar's edge
    expect(mediaBlock).toContain(
      '.dhivehigpt-player__speed{grid-area:speed;align-self:end;justify-self:start;height:20px;min-width:34px;font-size:10px}',
    );
    expect(mediaBlock).toContain(
      '.dhivehigpt-player__volume{grid-area:volume;align-self:end;justify-self:start;min-width:0}',
    );
    // The volume slider stays visible down to 260px — row 2 has room for
    // it, so it only gets a little narrower rather than collapsing away.
    expect(mediaBlock).toContain('.dhivehigpt-player__volume-slider{width:44px}');
    // Credit is bottom/right-aligned and the divider (meant for the desktop
    // single-row layout) is dropped once it's no longer sharing a row with
    // a preceding item.
    expect(mediaBlock).toContain(
      '.dhivehigpt-player__credit{grid-area:credit;border-left:0;padding-left:0;align-self:end;justify-self:end;height:auto;min-width:0}',
    );

    // The @container version is gated behind @supports so browsers without
    // container-query support never see it — only the @media fallback above
    // applies for them.
    expect(css).toContain('@supports (container-type:inline-size){');
    expect(css).toContain('@container (max-width:430px)');
  });

  it('below 260px, drops to icon-only credit and volume — no more room for the credit text or the volume slider track', () => {
    injectStyles();
    const css = document.getElementById('dhivehigpt-player-styles')!.textContent!;

    expect(css).toContain(
      '@media (max-width:260px){\n.dhivehigpt-player__credit-text{display:none}\n.dhivehigpt-player__volume-slider{display:none}\n}',
    );
    expect(css).toContain(
      '@container (max-width:260px){\n.dhivehigpt-player__credit-text{display:none}\n.dhivehigpt-player__volume-slider{display:none}\n}',
    );
  });
});

describe('injectFontLink', () => {
  it('is opt-in: does nothing unless explicitly called', () => {
    expect(document.head.querySelector('link[rel="stylesheet"]')).toBeNull();
  });

  it('injects the Outfit font stylesheet + preconnect only once', () => {
    injectFontLink();
    injectFontLink();
    expect(document.head.querySelectorAll('#dhivehigpt-player-font')).toHaveLength(1);
    expect(document.head.querySelector('link[rel="preconnect"]')).toBeTruthy();
  });
});
