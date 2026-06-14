import { registerModule } from '@/registry';
import { CarrierOffsetModule } from './CarrierOffsetModule';
import { CarrierOffsetExplanation } from './CarrierOffsetExplanation';

registerModule({
  id: 'carrier-offset',
  title: 'Carrier Offset & Doppler',
  track: 'playing-a-radio-signal',
  layer: 1,
  order: 5,
  oneLineIntuition:
    'An unmatched receiver oscillator (or Doppler) rotates the constellation — a phase offset tilts it, a frequency offset spins it.',
  component: CarrierOffsetModule,
  explanation: CarrierOffsetExplanation,
  status: 'stable',
});
