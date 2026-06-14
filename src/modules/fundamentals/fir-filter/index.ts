import { registerModule } from '@/registry';
import { FirFilterModule } from './FirFilterModule';
import { FirFilterExplanation } from './FirFilterExplanation';

registerModule({
  id: 'fir-filter',
  title: 'FIR Filtering',
  track: 'fundamentals',
  layer: 1,
  order: 3,
  oneLineIntuition:
    'A filter is a sliding dot product of tap weights — the taps are the impulse response, their transform the frequency response.',
  component: FirFilterModule,
  explanation: FirFilterExplanation,
  status: 'stable',
});
