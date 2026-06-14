import { registerModule } from '@/registry';
import { WindowingModule } from './WindowingModule';
import { WindowingExplanation } from './WindowingExplanation';

registerModule({
  id: 'windowing-leakage',
  title: 'Windowing & Leakage',
  track: 'fundamentals',
  oneLineIntuition:
    'Tapering a block before the FFT trades mainlobe width for sidelobe level — the resolution-vs-leakage knob.',
  component: WindowingModule,
  explanation: WindowingExplanation,
  status: 'stable',
});
