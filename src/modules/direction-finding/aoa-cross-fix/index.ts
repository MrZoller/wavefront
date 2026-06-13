import { registerModule } from '@/registry';
import { AoaCrossFixModule } from './AoaCrossFixModule';
import { AoaCrossFixExplanation } from './AoaCrossFixExplanation';

registerModule({
  id: 'aoa-cross-fix',
  title: 'AoA Cross-Fixing',
  track: 'direction-finding',
  oneLineIntuition: 'Two lines of bearing cross to fix an emitter — with an error region to match.',
  component: AoaCrossFixModule,
  explanation: AoaCrossFixExplanation,
  status: 'stable',
});
