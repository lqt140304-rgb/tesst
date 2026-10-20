import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PetAvatar } from './PetAvatar';

describe('PetAvatar', () => {
  it('shows the photo with the pet name as alt text and a fixed size', () => {
    const html = renderToStaticMarkup(<PetAvatar name="Miu" species="cat" photoKey="meo-tam-the" />);
    expect(html).toContain('data-pet-avatar="photo"');
    expect(html).toContain('alt="Miu"');
    expect(html).toContain('width="56"');
    expect(html).toContain('loading="lazy"');
  });

  it('falls back to the species icon, named for screen readers, when the key has no photo', () => {
    const html = renderToStaticMarkup(<PetAvatar name="Miu" species="cat" photoKey="khong-co" />);
    expect(html).toContain('data-pet-avatar="icon"');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Miu"');
    expect(html).not.toContain('<img');
  });

  it('decorative avatars are silent', () => {
    expect(renderToStaticMarkup(<PetAvatar name="Miu" species="cat" photoKey="meo-tam-the" decorative />)).toContain('alt=""');
    const icon = renderToStaticMarkup(<PetAvatar name="Bông" species="dog" decorative size={96} />);
    expect(icon).toContain('aria-hidden="true"');
    expect(icon).not.toContain('aria-label');
  });
});
