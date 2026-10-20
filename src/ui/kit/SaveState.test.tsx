import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SaveState } from './SaveState';

describe('SaveState', () => {
  it('the live region is always present, so its first message is announced (final review)', () => {
    const clean = renderToStaticMarkup(<SaveState status="clean" />);
    expect(clean).toContain('role="status"');
    expect(clean).not.toContain('Bản nháp');
    expect(renderToStaticMarkup(<SaveState status="dirty" />)).toContain('Bản nháp · Chưa lưu thay đổi');
  });
});
