import { registerModule } from '@/registry';
import { SpreadSpectrumModule } from './SpreadSpectrumModule';
import { SpreadSpectrumExplanation } from './SpreadSpectrumExplanation';

registerModule({
  id: 'spread-spectrum',
  title: 'Spread Spectrum',
  track: 'modulations-and-waveforms',
  layer: 0,
  order: 3,
  oneLineIntuition:
    'Multiply data by a fast PN code to smear it wide and low — then de-spread it back above the noise.',
  component: SpreadSpectrumModule,
  explanation: SpreadSpectrumExplanation,
  status: 'advanced',
});
