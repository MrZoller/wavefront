import { registerModule } from '@/registry';
import { ClassifierModule } from './ClassifierModule';
import { ClassifierExplanation } from './ClassifierExplanation';

registerModule({
  id: 'modulation-classifier',
  title: 'Modulation Classifier',
  track: 'modulations-and-waveforms',
  oneLineIntuition:
    'Unknown signal — which scheme is it? A few features (envelope, flatness, I/Q balance) give it away.',
  component: ClassifierModule,
  explanation: ClassifierExplanation,
  status: 'advanced',
});
