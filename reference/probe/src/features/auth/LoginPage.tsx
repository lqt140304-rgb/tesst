import { useEffect, useState } from 'react';
import { listDemoPets } from '../../data/demo-repo';
import styles from './LoginPage.module.css';
export default function LoginPage() {
  const [pets, setPets] = useState<string[] | null>(null);
  useEffect(() => { let live = true; listDemoPets().then((p) => { if (live) setPets(p); }); return () => { live = false; }; }, []);
  return (
    <section className={styles.card}>
      <h1 className={styles.title}>Đăng nhập tài khoản Lê Sơn</h1>
      <p>Chào bạn, rất vui được gặp lại bạn và bé.</p>
      <p data-testid="pets">{pets ? pets.join(', ') : 'Đang tải…'}</p>
    </section>
  );
}
