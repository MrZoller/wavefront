import { registerModule } from '@/registry';
import { ChirpModule } from './ChirpModule';
import { ChirpExplanation } from './ChirpExplanation';

registerModule({
  id: 'chirp-lfm',
  title: 'Chirp / LFM',
  track: 'modulations-and-waveforms',
  layer: 0,
  order: 4,
  oneLineIntuition:
    'A linearly swept tone draws a diagonal on the spectrogram — the basis of pulse compression.',
  component: ChirpModule,
  explanation: ChirpExplanation,
  status: 'advanced',
});
