import { registerModule } from '@/registry';
import { ModulationZooModule } from './ModulationZooModule';
import { ModulationZooExplanation } from './ModulationZooExplanation';

registerModule({
  id: 'modulation-zoo',
  title: 'Modulation Zoo',
  track: 'modulations-and-waveforms',
  oneLineIntuition:
    'Every modulation has a fingerprint — compare two schemes across time, constellation, spectrum, eye, and spectrogram.',
  component: ModulationZooModule,
  explanation: ModulationZooExplanation,
  status: 'stable',
});
