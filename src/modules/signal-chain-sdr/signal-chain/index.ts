import { registerModule } from '@/registry';
import { SignalChainModule } from './SignalChainModule';
import { SignalChainExplanation } from './SignalChainExplanation';

registerModule({
  id: 'signal-chain',
  title: 'Receiver Signal Chain',
  track: 'signal-chain-sdr',
  layer: 1,
  order: 2,
  isCapstone: true,
  oneLineIntuition:
    'Every box in a real radio — mixer, filter, ADC, channelizer — maps to math you can poke at. Click a block to open it.',
  component: SignalChainModule,
  explanation: SignalChainExplanation,
  status: 'stable',
});
