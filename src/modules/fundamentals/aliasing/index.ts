import { registerModule } from '@/registry';
import { AliasingModule } from './AliasingModule';
import { AliasingExplanation } from './AliasingExplanation';

registerModule({
  id: 'sampling-aliasing',
  title: 'Sampling & Aliasing',
  track: 'fundamentals',
  oneLineIntuition:
    'Sampling only sees the tick marks — a tone above half the sample rate masquerades as a slower one.',
  component: AliasingModule,
  explanation: AliasingExplanation,
  status: 'stable',
});
