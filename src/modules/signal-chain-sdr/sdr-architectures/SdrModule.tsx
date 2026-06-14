import { BlockDiagram, type DiagramEdge, type DiagramNode } from '@/components/BlockDiagram';
import { GlossedText } from '@/components/GlossedText';
import { PlotTitle } from '@/components/plots/PlotTitle';

const X0 = 12;
const PITCH = 138;
const BW = 120;
const VIEW_W = X0 + 5 * PITCH + BW + X0; // a 6-block row; shorter chains left-align
const VIEW_H = 80;
const xAt = (i: number) => X0 + i * PITCH;
const row = (defs: Omit<DiagramNode, 'x' | 'y' | 'w'>[]): DiagramNode[] =>
  defs.map((d, i) => ({ ...d, x: xAt(i), y: 13, w: BW }));
const chain = (nodes: DiagramNode[]): DiagramEdge[] =>
  nodes.slice(1).map((n, i) => ({ from: nodes[i].id, to: n.id }));

// The lit (linked) blocks are the digital ones — the software region. Across the three rows the ADC
// marches toward the antenna: that *is* SDR. Analog blocks stay quiet stubs.
const ARCHITECTURES = [
  {
    id: 'superhet',
    name: 'Superheterodyne',
    examples: 'classic radios · Ettus USRP',
    nodes: row([
      { id: 'ant', label: 'Antenna', sub: 'RF in' },
      { id: 'rf', label: 'RF filter', sub: 'select band' },
      { id: 'mix', label: 'Mixer', sub: 'down to IF' },
      { id: 'if', label: 'IF filter', sub: 'narrow' },
      { id: 'adc', label: 'ADC', sub: 'software ▶', moduleId: 'quantization' },
      { id: 'dsp', label: 'DSP', sub: 'in code', moduleId: 'channelizer' },
    ]),
  },
  {
    id: 'zero-if',
    name: 'Zero-IF (direct conversion)',
    examples: 'HackRF · LimeSDR · Airspy',
    nodes: row([
      { id: 'ant', label: 'Antenna', sub: 'RF in' },
      { id: 'lna', label: 'LNA', sub: 'amplify' },
      { id: 'mix', label: 'Mixer', sub: 'to baseband' },
      { id: 'adc', label: 'ADC', sub: 'software ▶', moduleId: 'quantization' },
      { id: 'dsp', label: 'DSP', sub: 'in code', moduleId: 'channelizer' },
    ]),
  },
  {
    id: 'direct',
    name: 'Direct sampling',
    examples: 'RTL-SDR (direct) · Airspy HF+',
    nodes: row([
      { id: 'ant', label: 'Antenna', sub: 'RF in' },
      { id: 'rf', label: 'RF filter', sub: 'select band' },
      { id: 'adc', label: 'ADC', sub: 'software ▶', moduleId: 'quantization' },
      { id: 'dsp', label: 'DSP', sub: 'in code', moduleId: 'channelizer' },
    ]),
  },
];

/**
 * SDR architectures (Track F). The same chain with the ADC in three different places: late
 * (superheterodyne), at baseband (zero-IF), or right behind the antenna (direct sampling). The lit
 * blocks are software; reading top to bottom, the ADC marches toward the antenna — which is the
 * whole idea of software-defined radio.
 */
export function SdrModule() {
  return (
    <div className="flex flex-col gap-6">
      {ARCHITECTURES.map((a) => (
        <div key={a.id}>
          <PlotTitle>
            {a.name} <span className="text-text-faint">— {a.examples}</span>
          </PlotTitle>
          <BlockDiagram
            nodes={a.nodes}
            edges={chain(a.nodes)}
            width={VIEW_W}
            height={VIEW_H}
            ariaLabel={`${a.name} architecture: ${a.nodes.map((n) => n.label).join(', ')}`}
          />
        </div>
      ))}

      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="readout text-xs text-text-faint">
          <GlossedText>
            the lit blocks are software — the math you can open · reading down, the ADC moves closer
            to the antenna, so more of the radio becomes code · that&rsquo;s all SDR is: digitize
            early, do the rest in software · a direct-sampling receiver is the most WSPR-relevant of
            the three
          </GlossedText>
        </p>
      </div>
    </div>
  );
}
