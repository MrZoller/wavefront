import { registerModule } from '@/registry';
import { AnalogModule } from './AnalogModule';
import { AnalogExplanation } from './AnalogExplanation';

registerModule({
  id: 'analog-modulation',
  title: 'Analog: AM / FM / PM',
  track: 'modulations-and-waveforms',
  oneLineIntuition:
    'One message, three carriers: wiggle amplitude (AM), frequency (FM), or phase (PM) and watch the spectrum.',
  component: AnalogModule,
  explanation: AnalogExplanation,
  status: 'stable',
});
