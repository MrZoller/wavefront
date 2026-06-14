import { registerModule } from '@/registry';
import { CrossCorrelationModule } from './CrossCorrelationModule';
import { CrossCorrelationExplanation } from './CrossCorrelationExplanation';

registerModule({
  id: 'cross-correlation',
  title: 'Cross-Correlation as a Lag Finder',
  track: 'direction-finding',
  layer: 0,
  order: 2,
  oneLineIntuition: 'A sliding dot product reveals when a signal arrived — the engine of TDOA.',
  component: CrossCorrelationModule,
  explanation: CrossCorrelationExplanation,
  status: 'stable',
});
