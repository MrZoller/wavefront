import { registerModule } from '@/registry';
import { OfdmModule } from './OfdmModule';
import { OfdmExplanation } from './OfdmExplanation';

registerModule({
  id: 'ofdm',
  title: 'OFDM',
  track: 'modulations-and-waveforms',
  layer: 0,
  order: 2,
  oneLineIntuition:
    'Send many slow QPSK subcarriers in parallel via an IFFT, guarded by a cyclic prefix — multipath made easy.',
  component: OfdmModule,
  explanation: OfdmExplanation,
  status: 'stable',
});
