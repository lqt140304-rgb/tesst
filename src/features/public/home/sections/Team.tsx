import { teamPhoto } from '@/assets/media';
import { DemoTag } from '@/ui';
import { PubSection } from '../PubSection';
import { Reveal } from './Decor';
import p from '../Pub.module.css';

/** "Đội ngũ" (part 6A §6.3): the head doctor only (real photo, approved words); the other places stay empty and labelled as sample. */
export function Team() {
  return (
    <PubSection id="doi-ngu" label="ĐỘI NGŨ" title={<>Những người <em>ở bên bé</em></>} ask="Ai sẽ chăm bé của bạn?">
      <div className={p.teamLead}>
        <Reveal className={p.teamPortrait}>
          <figure className={p.fig}>
            <img src={teamPhoto()} alt="Bác sĩ trưởng Lê Thái Sơn" width={720} height={1636} loading="lazy" decoding="async" style={{ objectPosition: '50% 30%' }} />
          </figure>
        </Reveal>
        <div className={p.teamWords}>
          <Reveal className={p.person}>
            <p className={p.role}>Bác sĩ trưởng</p>
            <p className={p.name}>Lê Thái Sơn</p>
            <p className={p.personLine}>Đồng hành cùng thú cưng mỗi ngày.</p>
          </Reveal>
          <div className={p.teamSlots}>
            {[0, 1, 2].map((i) => (
              <Reveal key={i} delay={0.05 * (i + 1)}>
                <div data-team-slot className={p.slot}><span>Sẽ bổ sung</span></div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
      <DemoTag>Nội dung mẫu · Lê Sơn sẽ bổ sung ảnh và tên đội ngũ</DemoTag>
    </PubSection>
  );
}
