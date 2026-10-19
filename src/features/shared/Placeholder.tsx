/** Temporary page body while a zone is being built (replaced task by task). */
export function Placeholder({ title }: { title: string }) {
  return (
    <main id="noi-dung" style={{ padding: '48px 24px', maxWidth: 960, margin: '0 auto' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--plum-900)' }}>{title}</h1>
    </main>
  );
}
