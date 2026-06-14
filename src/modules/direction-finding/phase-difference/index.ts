import { registerModule } from '@/registry';
import { PhaseDifferenceModule } from './PhaseDifferenceModule';
import { PhaseDifferenceExplanation } from './PhaseDifferenceExplanation';

registerModule({
  id: 'phase-difference',
  title: 'Phase Difference',
  track: 'direction-finding',
  layer: 0,
  order: 1,
  oneLineIntuition: 'Two sensors see the same wave with a phase offset that encodes its direction.',
  component: PhaseDifferenceModule,
  explanation: PhaseDifferenceExplanation,
  status: 'stable',
});
