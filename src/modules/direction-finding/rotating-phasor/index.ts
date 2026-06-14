import { registerModule } from '@/registry';
import { PhasorModule } from './PhasorModule';
import { PhasorExplanation } from './PhasorExplanation';

registerModule({
  id: 'rotating-phasor',
  title: 'The Rotating Phasor / IQ',
  track: 'direction-finding',
  layer: 0,
  order: 0,
  oneLineIntuition: 'A complex sample is just a 2D point — and a signal spins it.',
  component: PhasorModule,
  explanation: PhasorExplanation,
  status: 'stable',
});
