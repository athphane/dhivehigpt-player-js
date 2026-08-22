---
title: Angular
sidebar_position: 12
---

There's no separate `@javaabu/dhivehigpt-player/angular` package. A full installable Angular library needs Angular's own build tooling (`ng-packagr`, the Angular compiler) to produce a proper Angular Package Format bundle — a much heavier toolchain than the rest of this library, and not something this project takes on just for one framework.

Instead, here's a small standalone component (Angular 14+) that wraps `AudioPlayer` — copy it into your project as-is:

```typescript title="dhivehigpt-player.component.ts"
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { AudioPlayer, type PlayerOptions } from '@javaabu/dhivehigpt-player';

@Component({
  selector: 'dhivehigpt-player',
  standalone: true,
  template: `
    <div>
      <audio #audioEl></audio>
      <div #containerEl></div>
    </div>
  `,
})
export class DhivehiGPTPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) src!: string;
  @Input() dark?: PlayerOptions['dark'];
  @Input() accent?: boolean;
  @Input() shadow?: PlayerOptions['shadow'];
  @Input() flush?: boolean;
  @Input() showTime?: boolean;
  @Input() showSpeed?: boolean;
  @Input() showVolume?: boolean;
  @Input() speeds?: number[];
  @Input() sticky?: boolean;
  @Input() loadFont?: boolean;
  @Output() ready = new EventEmitter<AudioPlayer>();

  @ViewChild('audioEl', { static: true }) audioEl!: ElementRef<HTMLAudioElement>;
  @ViewChild('containerEl', { static: true }) containerEl!: ElementRef<HTMLDivElement>;

  private player?: AudioPlayer;

  ngAfterViewInit(): void {
    this.create();
  }

  ngOnChanges(): void {
    if (!this.player) return; // not yet created — ngAfterViewInit handles the first mount
    this.destroy();
    this.create();
  }

  ngOnDestroy(): void {
    this.destroy();
  }

  private create(): void {
    this.player = new AudioPlayer(this.audioEl.nativeElement, {
      src: this.src,
      dark: this.dark,
      accent: this.accent,
      shadow: this.shadow,
      flush: this.flush,
      showTime: this.showTime,
      showSpeed: this.showSpeed,
      showVolume: this.showVolume,
      speeds: this.speeds,
      sticky: this.sticky,
      loadFont: this.loadFont,
    });
    this.containerEl.nativeElement.appendChild(this.player.element);
    this.ready.emit(this.player);
  }

  private destroy(): void {
    this.player?.destroy();
    this.player = undefined;
  }
}
```

Usage:

```html
<dhivehigpt-player
  src="https://example.com/article.mp3"
  [accent]="true"
  [sticky]="true"
  (ready)="onReady($event)"
></dhivehigpt-player>
```

```typescript
import { DhivehiGPTPlayerComponent } from './dhivehigpt-player.component';

@Component({
  standalone: true,
  imports: [DhivehiGPTPlayerComponent],
  // ...
})
export class ArticleComponent {
  onReady(player: import('@javaabu/dhivehigpt-player').AudioPlayer) {
    player.on('ended', () => console.log('done'));
  }
}
```

See the [programmatic API](./programmatic-api) for the full list of options, methods, and events available on the `AudioPlayer` instance.
