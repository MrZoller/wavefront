import { registerModule } from '@/registry';
import { GainModule } from './GainModule';
import { GainExplanation } from './GainExplanation';

registerModule({
  id: 'gain-agc',
  title: 'Gain, Clipping & AGC',
  track: 'signal-chain-sdr',
  layer: 0,
  order: 1,
  oneLineIntuition:
    'Too little gain and the signal hides in the noise floor; too much and it clips — AGC hunts for the zone between.',
  component: GainModule,
  explanation: GainExplanation,
  status: 'stable',
});
