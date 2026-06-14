import { GlossedText } from '@/components/GlossedText';
/** "Go deeper" content for the Channelizer marquee. */
export function ChannelizerExplanation() {
  return (
    <GlossedText>
      <div className="flex flex-col gap-4">
        <section>
          <h3 className="mb-1 font-medium text-text">One band, many channels</h3>
          <p>
            A wideband receiver digitizes a fat chunk of spectrum, then splits it into many narrow
            channels to process each signal at its own low rate. One channel is a digital
            downconverter: mix it to zero, low-pass, decimate. A filter bank does all the channels
            at once.
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The FFT is already a filter bank</h3>
          <p>
            An N-point FFT splits the band into N bins — N crude channels, essentially for free. The
            catch: each bin's effective filter is the leaky <code>sinc</code> of an implicit
            rectangular window, so neighboring channels bleed into each other (the cyan shape's tall
            sidelobes).
          </p>
        </section>

        <section>
          <h3 className="mb-1 font-medium text-text">The polyphase fix</h3>
          <p>
            Replace that rectangular window with a <em>designed</em> low-pass prototype, decomposed
            into polyphase branches with the FFT acting as the bank of mixers. The channel responses
            become sharp and clean, and — the efficiency win — the filtering runs at the low output
            rate, not the high input rate.
          </p>
        </section>

        <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
          Here both banks share one `channelize`; only the prototype differs (rectangle vs windowed
          sinc) — the cleanest way to see why PFB wins. All signals are synthetic.
        </section>
      </div>
    </GlossedText>
  );
}
