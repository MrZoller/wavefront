import { registerModule } from '@/registry';
import { SdrModule } from './SdrModule';
import { SdrExplanation } from './SdrExplanation';

registerModule({
  id: 'sdr-architectures',
  title: 'SDR Architectures',
  track: 'signal-chain-sdr',
  layer: 1,
  order: 3,
  oneLineIntuition:
    'Direct-sampling, zero-IF, superheterodyne — three places to put the ADC. SDR just moves it closer to the antenna.',
  component: SdrModule,
  explanation: SdrExplanation,
  status: 'stable',
});
