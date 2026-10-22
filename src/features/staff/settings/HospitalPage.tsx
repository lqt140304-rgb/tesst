import { paths } from '@/app/routes';
import { staff } from '@/data/staff';
import { useQuery } from '@/data/hooks/useQuery';
import { Icon } from '@/ui';
import { LoadingBlocks, PageHeader, PageProblem, Panel } from '../ui';
import s from './Settings.module.css';

/** Thông tin bệnh viện: word for word the facts the whole site uses; read only. */
export function HospitalPage() {
  const q = useQuery(() => staff.settings.hospital(), []);
  const info = q.data;
  return (
    <>
      <PageHeader title="Thông tin bệnh viện" sub="Những thông tin chung của Lê Sơn, giống như trên trang giới thiệu." parent={{ label: 'Cài đặt', to: paths.nv.settings }} />
      {q.error && !info ? <PageProblem error={q.error} onRetry={q.refetch} /> : !info ? <LoadingBlocks rows={2} /> : (
        <Panel>
          <dl className={s.facts}>
            <div className={s.fact}><dt>Tên</dt><dd>{info.name}</dd></div>
            <div className={s.fact}><dt>Địa chỉ</dt><dd>{info.address}</dd></div>
            <div className={s.fact}><dt>Điện thoại</dt><dd><a className={s.tel} href={info.hotlineTel}><Icon name="phone" size={14} /><span className="num">{info.hotline}</span></a></dd></div>
            <div className={s.fact}><dt>Giờ làm việc</dt><dd><span className="num">{info.openingHours}</span>, không nghỉ trưa, Chủ nhật như ngày thường.</dd></div>
            <div className={s.fact}><dt>Cấp cứu</dt><dd><span className="num">{info.emergencyHours}</span>. Ngoài giờ làm việc, khách gọi thẳng số điện thoại trên.</dd></div>
            <div className={s.fact}><dt>Bác sĩ trưởng</dt><dd>{info.headDoctor}</dd></div>
          </dl>
          <p className={s.readonlyNote}><Icon name="info" size={16} />Nội dung này chỉ để xem. Cần sửa, báo bên làm hệ thống.</p>
        </Panel>
      )}
    </>
  );
}
