import { registerModule } from '@/registry';
import { MultirateModule } from './MultirateModule';
import { MultirateExplanation } from './MultirateExplanation';

registerModule({
  id: 'multirate',
  title: 'Decimation & Interpolation',
  track: 'fundamentals',
  layer: 1,
  order: 4,
  oneLineIntuition:
    'Change the sample rate by dropping or inserting samples — but low-pass first, or aliasing/images bite.',
  component: MultirateModule,
  explanation: MultirateExplanation,
  status: 'stable',
});
