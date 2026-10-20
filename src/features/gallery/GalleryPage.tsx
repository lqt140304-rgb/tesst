import { useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import type { Species } from '@/data/contracts/enums';
import { paths } from '@/app/routes';
import { preset } from '@/ui/motion';
import {
  Button, DataTable, DemoTag, DetailList, MasterDetail, PageHeader, PetAvatar, SaveState, SectionCard, StatCard, Tabs,
  useListState, useSaveStatus, type Column,
} from '@/ui';
import s from './Gallery.module.css';

type Pet = { name: string; species: Species; photoKey?: string };
type Customer = { id: string; name: string; phone: string; pets: Pet[]; last: string };

// Dữ liệu mẫu for the review page only (not the demo store).
const CUSTOMERS: Customer[] = [
  { id: 'g1', name: 'Nguyễn Lan', phone: '090 *** 1234', pets: [{ name: 'Miu', species: 'cat', photoKey: 'meo-tam-the' }, { name: 'Bông', species: 'dog', photoKey: 'cho-vang' }], last: '12/10/2026' },
  { id: 'g2', name: 'Trần Hoàng', phone: '093 *** 5678', pets: [{ name: 'Milo', species: 'dog' }], last: '05/10/2026' },
  { id: 'g3', name: 'Phạm Thảo', phone: '098 *** 2468', pets: [{ name: 'Simba', species: 'cat', photoKey: 'meo-muop' }], last: '28/09/2026' },
  { id: 'g4', name: 'Đỗ Tuấn', phone: '091 *** 6789', pets: [{ name: 'Coco', species: 'dog' }, { name: 'Mít', species: 'dog', photoKey: 'khong-co' }], last: '20/09/2026' },
  { id: 'g5', name: 'Vũ Hà', phone: '090 *** 8888', pets: [{ name: 'Lạc', species: 'other' }], last: '10/09/2026' },
  { id: 'g6', name: 'Lê Minh Anh', phone: '097 *** 1122', pets: [{ name: 'Su', species: 'cat' }], last: '02/09/2026' },
  { id: 'g7', name: 'Bùi Quang', phone: '094 *** 3344', pets: [{ name: 'Sói', species: 'dog' }], last: '28/08/2026' },
  { id: 'g8', name: 'Ngô Hương', phone: '096 *** 5566', pets: [{ name: 'Na', species: 'cat' }], last: '21/08/2026' },
  { id: 'g9', name: 'Đặng Tùng', phone: '035 *** 7788', pets: [{ name: 'Đậu', species: 'dog' }], last: '15/08/2026' },
  { id: 'g10', name: 'Phan Đức', phone: '086 *** 9900', pets: [{ name: 'Mướp', species: 'cat' }], last: '09/08/2026' },
  { id: 'g11', name: 'Lý Trang', phone: '088 *** 2211', pets: [{ name: 'Lucky', species: 'dog' }], last: '01/08/2026' },
  { id: 'g12', name: 'Hoàng Lan', phone: '039 *** 4433', pets: [{ name: 'Gạo', species: 'cat' }], last: '25/07/2026' },
];
const fold = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase();
const initials = (name: string) => name.split(/\s+/).slice(-2).map((w) => w.charAt(0)).join('').toUpperCase();

const COLUMNS: Column<Customer>[] = [
  { key: 'name', header: 'Tên khách hàng', primary: true, cell: (c) => <span className={s.who}><span className={s.initials} aria-hidden="true">{initials(c.name)}</span>{c.name}</span> },
  { key: 'phone', header: 'Số điện thoại', cell: (c) => c.phone },
  { key: 'pets', header: 'Thú cưng', cell: (c) => `${c.pets.length} bé (${c.pets.map((p) => p.name).join(', ')})` },
  { key: 'last', header: 'Lần ghé gần nhất', cell: (c) => c.last, hideOnPhone: true },
];

/** Review page for the redesign foundation (spec 2026-10-20 §5.5): every shared component on both surfaces. */
export function GalleryPage() {
  const [list, setList] = useListState('gallery', { page: 1, q: '', sel: '' });
  const [focusDetail, setFocusDetail] = useState(false);
  const [tab, setTab] = useState<'pets' | 'appts' | 'invoices'>('pets');
  const save = useSaveStatus();
  const [flash, setFlash] = useState(0);
  const reduced = useReducedMotion() ?? false;
  const rows = CUSTOMERS.filter((c) => !list.q.trim() || fold(c.name).includes(fold(list.q.trim())));
  const sel = CUSTOMERS.find((c) => c.id === list.sel) ?? null;
  const fake = (ok: boolean) => save.run(() => new Promise<void>((res, rej) => setTimeout(() => (ok ? res() : rej(new Error('demo'))), 600))).catch(() => undefined);
  const f = preset('flashOnce', { reduced });

  return (
    <div className={s.page}>
      <PageHeader size="lg" crumbs={[{ label: 'Trang chủ', to: paths.home }, { label: 'Bộ giao diện' }]} title="Bộ giao diện"
        sub={<>Các thành phần dùng chung của bản làm lại, trên nền khách hàng và nền nhân viên. <DemoTag>Dữ liệu mẫu</DemoTag></>} />

      <section className={s.block} aria-labelledby="g-cards">
        <h2 id="g-cards" className={s.h2}>Thẻ và số liệu</h2>
        <div className={s.surfaces}>
          {(['customer', 'staff'] as const).map((z) => (
            <div key={z} className={s.surface} data-surface={z}>
              <p className={s.surfaceName}>{z === 'customer' ? 'Nền khu khách hàng' : 'Nền khu nhân viên'}</p>
              <div className={s.stats}>
                <StatCard icon="banknote" label="Doanh thu đã thu" value="30.000.000 ₫" />
                <StatCard icon="receipt" label="Hóa đơn đã thanh toán" value="100" tone="teal" />
                <StatCard icon="chart-column" label="Giá trị trung bình" value="300.000 ₫" tone="orange" />
              </div>
              <SectionCard title="Lịch hẹn sắp tới" action={{ label: 'Xem tất cả', to: paths.uiGallery }}>
                <DetailList items={[{ label: 'Bé', value: 'Bông · Khám tổng quát' }, { label: 'Thời gian', value: '09:00 – 09:30, Thứ Bảy 24/10/2026' }, { label: 'Địa điểm', value: 'Bệnh viện Thú y Lê Sơn' }]} />
              </SectionCard>
            </div>
          ))}
        </div>
      </section>

      <section className={s.block} aria-labelledby="g-avatars">
        <h2 id="g-avatars" className={s.h2}>Ảnh đại diện bé <DemoTag>Ảnh minh họa</DemoTag></h2>
        <div className={s.avatars}>
          <PetAvatar name="Miu" species="cat" photoKey="meo-tam-the" size={160} />
          <PetAvatar name="Bông" species="dog" photoKey="cho-vang" size={96} />
          <PetAvatar name="Simba" species="cat" photoKey="meo-muop" size={56} />
          <PetAvatar name="Mít" species="dog" photoKey="khong-co" size={56} />
          <PetAvatar name="Na" species="cat" size={56} />
          <PetAvatar name="Lạc" species="other" size={40} />
        </div>
      </section>

      <section className={s.block} aria-labelledby="g-tabs">
        <h2 id="g-tabs" className={s.h2}>Tab và trạng thái lưu</h2>
        <Tabs label="Hồ sơ khách hàng mẫu" variant="underline" value={tab} onChange={setTab}
          items={[{ value: 'pets', label: 'Thú cưng' }, { value: 'appts', label: 'Lịch hẹn' }, { value: 'invoices', label: 'Hóa đơn' }]} />
        <div className={s.row} data-demo="save">
          <SaveState status={save.status} />
          <Button size="sm" variant="secondary" onClick={save.edit}>Sửa</Button>
          <Button size="sm" variant="secondary" onClick={() => void fake(true)}>Lưu (thành công)</Button>
          <Button size="sm" variant="secondary" onClick={() => void fake(false)}>Lưu (lỗi)</Button>
        </div>
        <div className={s.row}>
          <m.p key={flash} className={s.flash} initial={flash ? f.initial : false} animate={f.animate} transition={f.transition}>Tình trạng chung: Ổn định</m.p>
          <Button size="sm" variant="ghost" onClick={() => setFlash((n) => n + 1)}>Giả lập cập nhật</Button>
        </div>
      </section>

      <section className={s.block} aria-labelledby="g-table">
        <h2 id="g-table" className={s.h2}>Bảng và khung chi tiết</h2>
        <label className={s.search}>
          <input type="search" value={list.q} onChange={(e) => setList({ q: e.target.value })} placeholder="Tìm theo tên khách hàng…" aria-label="Tìm khách hàng mẫu" />
        </label>
        <MasterDetail label="Chi tiết khách hàng" backLabel="Danh sách khách hàng" detailKey={sel?.id} focusDetail={focusDetail}
          onBack={() => setList({ sel: '' })}
          list={<DataTable rows={rows} columns={COLUMNS} rowKey={(c) => c.id} caption="Danh sách khách hàng mẫu" noun="khách hàng" pageSize={5}
            page={list.page} onPageChange={(page) => setList({ page })} selectedKey={list.sel}
            onOpen={(c, via) => { setFocusDetail(via === 'keyboard'); setList({ sel: c.id }); }} />}
          detail={sel && (
            <div className={s.detail}>
              <h2 tabIndex={-1} className={s.detailName}>{sel.name}</h2>
              <div className={s.pets}>{sel.pets.map((p) => <PetAvatar key={p.name} name={p.name} species={p.species} photoKey={p.photoKey} size={56} />)}</div>
              <DetailList items={[{ label: 'Số điện thoại', value: sel.phone }, { label: 'Thú cưng', value: sel.pets.map((p) => p.name).join(', ') }, { label: 'Lần ghé gần nhất', value: sel.last }]} />
              <div><Button variant="secondary" size="sm" icon="pencil">Chỉnh sửa</Button></div>
            </div>
          )} />
      </section>
    </div>
  );
}
