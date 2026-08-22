import { DhivehiGPTPlayer } from '@javaabu/dhivehigpt-player/react';

const AUDIO_URL =
  'https://dvgpt.s3.ap-southeast-1.amazonaws.com/de2a034d-cf77-4f63-87f0-9849962bf0f5/c0346207-9382-4d54-8bb2-5b598ffe555d.wav';

export function App() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '40px auto', padding: '0 16px' }}>
      <h1>DhivehiGPT Player — React</h1>
      <DhivehiGPTPlayer
        src={AUDIO_URL}
        accent
        sticky
        onReady={(player) => console.log('player ready', player)}
      />
    </div>
  );
}
