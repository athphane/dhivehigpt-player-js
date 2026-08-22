/**
 * jsdom's `HTMLMediaElement.duration` is a getter with no setter (it's
 * meant to come from the decoded resource). These helpers let tests
 * simulate a loaded audio file with a known duration/currentTime.
 */
export function mockDuration(audio: HTMLAudioElement, duration: number): void {
  Object.defineProperty(audio, 'duration', { value: duration, configurable: true });
}

export function fireLoadedMetadata(audio: HTMLAudioElement, duration: number): void {
  mockDuration(audio, duration);
  audio.dispatchEvent(new Event('loadedmetadata'));
}

export function fireTimeUpdate(audio: HTMLAudioElement, currentTime: number): void {
  // writable: true — otherwise this permanently shadows jsdom's real
  // currentTime setter with a frozen value, breaking any later real
  // assignment to `audio.currentTime` (e.g. from `player.seek()`/`stop()`).
  Object.defineProperty(audio, 'currentTime', { value: currentTime, configurable: true, writable: true });
  audio.dispatchEvent(new Event('timeupdate'));
}

export function createHostAudio(attrs: Record<string, string> = {}): HTMLAudioElement {
  const audio = document.createElement('audio');
  for (const [key, value] of Object.entries(attrs)) {
    audio.setAttribute(key, value);
  }
  document.body.appendChild(audio);
  return audio;
}
