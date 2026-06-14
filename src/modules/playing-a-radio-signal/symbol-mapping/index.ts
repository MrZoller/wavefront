import { registerModule } from '@/registry';
import { SymbolMappingModule } from './SymbolMappingModule';
import { SymbolMappingExplanation } from './SymbolMappingExplanation';

registerModule({
  id: 'symbol-mapping',
  title: 'Symbol Mapping',
  track: 'playing-a-radio-signal',
  layer: 0,
  order: 0,
  oneLineIntuition:
    'Bits ride on I/Q symbols: group the bits, look them up in the constellation, get a point on the plane.',
  component: SymbolMappingModule,
  explanation: SymbolMappingExplanation,
  status: 'stable',
});
