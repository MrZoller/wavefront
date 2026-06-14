import { registerModule } from '@/registry';
import { InterferometerModule } from './InterferometerModule';
import { InterferometerExplanation } from './InterferometerExplanation';

registerModule({
  id: 'interferometer',
  title: 'Two-Element Interferometer',
  track: 'direction-finding',
  layer: 1,
  order: 3,
  oneLineIntuition: 'Invert the phase difference into a line of bearing — and meet ambiguity.',
  component: InterferometerModule,
  explanation: InterferometerExplanation,
  status: 'stable',
});
