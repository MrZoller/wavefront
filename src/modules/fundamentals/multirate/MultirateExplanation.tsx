/** "Go deeper" content for the Decimation & Interpolation module. */
export function MultirateExplanation() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="mb-1 font-medium text-text">Right-sizing the sample rate</h3>
        <p>
          If a signal only occupies a sliver of the band, carrying it at the full rate is wasteful.
          <em> Decimation</em> by N keeps every N-th sample, dropping the rate (and the cost) by N.
          <em> Interpolation</em> does the reverse, inserting zeros and smoothing.
        </p>
      </section>

      <section>
        <h3 className="mb-1 font-medium text-text">Filter first, then drop</h3>
        <p>
          Dropping samples shrinks the Nyquist limit, so anything above the new limit aliases into
          the band — irreversibly. The fix is to low-pass to the new Nyquist <em>before</em>{' '}
          decimating. Interpolation has the mirror problem: zero-stuffing creates spectral images
          that a low-pass must remove.
        </p>
      </section>

      <section className="rounded-md border border-border bg-surface-raised p-3 text-xs text-text-faint">
        This decimate = low-pass + downsample is exactly the back half of a digital downconverter —
        the channelizer's building block. All signals are synthetic.
      </section>
    </div>
  );
}
