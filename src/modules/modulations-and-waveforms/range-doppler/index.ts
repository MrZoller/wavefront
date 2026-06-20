import { registerModule } from '@/registry';
import { RangeDopplerModule } from './RangeDopplerModule';
import { RangeDopplerExplanation } from './RangeDopplerExplanation';

registerModule({
  id: 'range-doppler',
  title: 'Pulse Compression & Range-Doppler',
  track: 'modulations-and-waveforms',
  layer: 2,
  order: 6,
  oneLineIntuition:
    'Aim a chirp at a target: matched-filter the echo for range, FFT across pulses for velocity — radar is three tools you have already built, pointed outward.',
  component: RangeDopplerModule,
  explanation: RangeDopplerExplanation,
  status: 'advanced',
});
