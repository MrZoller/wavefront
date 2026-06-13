import { registerModule } from '@/registry';
import { MatchedFilterModule } from './MatchedFilterModule';
import { MatchedFilterExplanation } from './MatchedFilterExplanation';

registerModule({
  id: 'matched-filter',
  title: 'Matched Filter',
  track: 'playing-a-radio-signal',
  oneLineIntuition:
    'Correlate the noisy signal against the transmitted pulse to maximize SNR — then read the open eye.',
  component: MatchedFilterModule,
  explanation: MatchedFilterExplanation,
  status: 'stable',
});
