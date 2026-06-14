import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Wordmark } from './Wordmark';

afterEach(cleanup);

describe('Wordmark', () => {
  it('renders the product name', () => {
    render(<Wordmark />);
    expect(screen.getByText('Wavefront')).toBeInTheDocument();
  });

  it('pairs the name with the wave mark, kept decorative so the name is not announced twice', () => {
    const { container } = render(<Wordmark />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', '/wavefront-mark.svg');
    // Decorative: the adjacent text already names the product, so the mark must not duplicate it.
    expect(img).toHaveAttribute('alt', '');
    expect(img).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges extra classes for sizing/placement by callers', () => {
    const { container } = render(<Wordmark className="text-3xl" />);
    expect(container.firstElementChild).toHaveClass('text-3xl');
  });
});
