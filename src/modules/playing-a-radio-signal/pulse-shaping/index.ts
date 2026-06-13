import { registerModule } from '@/registry';
import { PulseShapingModule } from './PulseShapingModule';
import { PulseShapingExplanation } from './PulseShapingExplanation';

registerModule({
  id: 'pulse-shaping',
  title: 'Pulse Shaping',
  track: 'playing-a-radio-signal',
  oneLineIntuition:
    'Each symbol launches a raised-cosine pulse that is zero at every other symbol time — overlapping yet ISI-free.',
  component: PulseShapingModule,
  explanation: PulseShapingExplanation,
  status: 'stable',
});
