import { registerModule } from '@/registry';
import { DftBasisModule } from './DftBasisModule';
import { DftBasisExplanation } from './DftBasisExplanation';

registerModule({
  id: 'dft-basis',
  title: 'The DFT as a Change of Basis',
  track: 'fundamentals',
  layer: 0,
  order: 1,
  oneLineIntuition:
    'Each spectrum bin is the signal dotted with one sinusoid — the FFT just re-expresses it in frequency coordinates.',
  component: DftBasisModule,
  explanation: DftBasisExplanation,
  status: 'stable',
});
