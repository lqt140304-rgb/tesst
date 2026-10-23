import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Reveal } from './sections/Decor';
import p from './Pub.module.css';

/** One section of the intro page: a short capital label and a Lora heading. */
export function PubSection({ id, label, title, ask, children, className }: { id: string; label: string; title: ReactNode; ask?: string; children: ReactNode; className?: string }) {
  const titleId = `${id}-title`;
  return (
    <section id={id} data-pub className={cx(p.section, className)} aria-labelledby={titleId}>
      <div className={p.inner}>
        <header className={p.head}>
          <p className={p.eyebrow}><span data-chapter aria-hidden="true" className={p.chapter} />{label}</p>
          <Reveal><h2 id={titleId} className={p.h2}>{title}</h2></Reveal>
          {ask && <p data-ask className={p.ask}>{ask}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}
