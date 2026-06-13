import { registerModule } from '@/registry';
import { TdoaModule } from './TdoaModule';
import { TdoaExplanation } from './TdoaExplanation';

registerModule({
  id: 'tdoa-multilateration',
  title: 'TDOA Multilateration',
  track: 'direction-finding',
  oneLineIntuition: 'Each receiver pair is a hyperbola of constant range difference; ≥3 fix it.',
  component: TdoaModule,
  explanation: TdoaExplanation,
  status: 'stable',
});
