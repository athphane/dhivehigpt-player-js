// Angular support is a copy-in recipe, not an installable package — see
// docs/modules/angular.md for why. Copy this file into your Angular project
// as-is.
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
