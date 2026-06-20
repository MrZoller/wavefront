import { registerModule } from '@/registry';
import { FftBinsModule } from './FftBinsModule';
import { FftBinsExplanation } from './FftBinsExplanation';

registerModule({
  id: 'fft-bins',
  title: 'FFT Bins & Zero-Padding',
  track: 'fundamentals',
  // Sampling & the Frequency Domain, right after Windowing & Leakage: that module shows a tone
  // smeared across bins; this one grabs the bin-count knob to ask "can more bins fix it?" (no — only
  // a longer capture can).
  layer: 0,
  order: 3,
  oneLineIntuition:
    'Adding FFT bins (zero-padding) redraws the same spectrum with more dots — smoother, but no sharper; only a longer capture can split two close tones.',
  component: FftBinsModule,
  explanation: FftBinsExplanation,
  status: 'stable',
});
