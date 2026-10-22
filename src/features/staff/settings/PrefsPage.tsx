import { useState, type ReactNode } from 'react';
import { paths } from '@/app/routes';
import { useSession } from '@/app/session/SessionProvider';
import { landingChoices, nudgeChoices, usePrefs } from '@/app/prefs';
import {
  CALENDAR_VIEWS, CALENDAR_VIEW_LABEL, DENSITIES, DENSITY_LABEL, LANDING_PAGE_LABEL, MOTION_PREFS, MOTION_PREF_LABEL, NUDGE_LABEL, PAGE_SIZES,
  REPORT_RANGES, REPORT_RANGE_LABEL, TEXT_SIZES, TEXT_SIZE_LABEL, type PageSize,
} from '@/data/contracts/enums';
import type { StaffPrefsPatch } from '@/data/staff';
import { Button, Checkbox, ChipGroup, Dialog } from '@/ui';
import { FormError, LoadingBlocks, PageHeader, Panel, saveError } from '../ui';
import s from './Prefs.module.css';

/** Tùy chọn của tôi: how this person likes to work. A choice is saved the moment it is made; the screens read it from `usePrefs`. */
export function PrefsPage() {
  const { can } = useSession();
  const { prefs, ready, save, reset } = usePrefs();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<{ key: string; message: string }>();
  const [asking, setAsking] = useState(false);
  const [resetting, setResetting] = useState(false);

  async function change(key: string, patch: StaffPrefsPatch) {
    try {
      await save(patch);
      setError(undefined);
      setSaved(true);
    } catch (e) {
      setSaved(false);
      setError({ key, message: saveError(e) });
    }
  }
  async function back() {
    setResetting(true);
    try {
      await reset();
      setError(undefined);
      setSaved(true);
      setAsking(false);
    } catch (e) {
      setError({ key: 'reset', message: saveError(e) });
      setAsking(false);
    } finally {
      setResetting(false);
    }
  }

  const row = (key: string, label: string, hint: string, control: ReactNode) => (
    <div className={s.row}>
      <div className={s.rowText}><span className={s.label} aria-hidden="true">{label}</span><p className={s.hint}>{hint}</p></div>
      <div className={s.rowControl}>{control}<FormError>{error?.key === key ? error.message : undefined}</FormError></div>
    </div>
  );
  const nudges = nudgeChoices(can);

  return (
    <>
      <PageHeader title="Tùy chọn của tôi" sub="Cách bạn muốn làm việc. Chọn xong là lưu ngay." parent={{ label: 'Cài đặt', to: paths.nv.settings }}
        actions={<Button variant="secondary" icon="rotate-ccw" onClick={() => setAsking(true)}>Về mặc định</Button>} />
      <p className={s.status} role="status">{saved ? 'Đã lưu.' : ''}</p>
      {!ready ? <LoadingBlocks rows={3} /> : (
        <>
          <Panel title="Giao diện">
            {row('text_size', 'Cỡ chữ', 'Lớn làm chữ và khoảng cách to hơn một chút.',
              <ChipGroup label="Cỡ chữ" value={prefs.text_size} onChange={(v) => void change('text_size', { text_size: v })} options={TEXT_SIZES.map((v) => ({ value: v, label: TEXT_SIZE_LABEL[v] }))} />)}
            {row('density', 'Độ dày bảng', 'Gọn xếp được nhiều dòng hơn trên một màn hình.',
              <ChipGroup label="Độ dày bảng" value={prefs.density} onChange={(v) => void change('density', { density: v })} options={DENSITIES.map((v) => ({ value: v, label: DENSITY_LABEL[v] }))} />)}
            {row('motion', 'Chuyển động', 'Luôn giảm: bỏ hiệu ứng trượt và phóng, chỉ còn mờ nhẹ, dù máy không bật chế độ giảm chuyển động.',
              <ChipGroup label="Chuyển động" value={prefs.motion} onChange={(v) => void change('motion', { motion: v })} options={MOTION_PREFS.map((v) => ({ value: v, label: MOTION_PREF_LABEL[v] }))} />)}
          </Panel>
          <Panel title="Khi đăng nhập">
            {row('landing', 'Trang vào sau đăng nhập', 'Trang mở ra ngay sau khi bạn đăng nhập. Mở bằng đường dẫn riêng thì vào đúng trang đó.',
              <ChipGroup label="Trang vào sau đăng nhập" value={prefs.landing} onChange={(v) => void change('landing', { landing: v })} options={landingChoices(can).map((v) => ({ value: v, label: LANDING_PAGE_LABEL[v] }))} />)}
          </Panel>
          <Panel title="Màn hình làm việc">
            {row('appointments_view', 'Kiểu xem lịch', 'Cách Lịch hẹn mở ra khi bạn chưa chọn.',
              <ChipGroup label="Kiểu xem lịch" value={prefs.appointments_view} onChange={(v) => void change('appointments_view', { appointments_view: v })} options={CALENDAR_VIEWS.map((v) => ({ value: v, label: CALENDAR_VIEW_LABEL[v] }))} />)}
            {row('page_size', 'Số dòng mỗi trang', 'Số dòng trên mỗi trang của các danh sách.',
              <ChipGroup label="Số dòng mỗi trang" value={String(prefs.page_size)} onChange={(v) => void change('page_size', { page_size: Number(v) as PageSize })} options={PAGE_SIZES.map((v) => ({ value: String(v), label: String(v) }))} />)}
            {row('report_range', 'Khoảng ngày báo cáo', 'Kỳ mà Báo cáo và Doanh thu mở sẵn.',
              <ChipGroup label="Khoảng ngày báo cáo" value={prefs.report_range} onChange={(v) => void change('report_range', { report_range: v })} options={REPORT_RANGES.map((v) => ({ value: v, label: REPORT_RANGE_LABEL[v] }))} />)}
          </Panel>
          <Panel title="Việc đầu tiên">
            <Checkbox label="Hiện danh sách việc đầu tiên" checked={!prefs.onboarding_hidden} onChange={(e) => void change('onboarding_hidden', { onboarding_hidden: !e.target.checked })} />
            <FormError>{error?.key === 'onboarding_hidden' ? error.message : undefined}</FormError>
          </Panel>
          <Panel title="Nhắc việc">
            {nudges.length === 0 ? <p className={s.hint}>Vai của bạn chưa có loại nhắc việc nào.</p> : (
              <>
                <p className={s.hint}>Chọn việc bạn muốn được nhắc ở đầu trang Tổng quan.</p>
                <div className={s.switches}>
                  {nudges.map((k) => <Checkbox key={k} label={NUDGE_LABEL[k]} checked={prefs.nudges[k]} onChange={(e) => void change(`nudge.${k}`, { nudges: { [k]: e.target.checked } })} />)}
                </div>
                <FormError>{error?.key.startsWith('nudge.') ? error.message : undefined}</FormError>
              </>
            )}
          </Panel>
          <FormError>{error?.key === 'reset' ? error.message : undefined}</FormError>
        </>
      )}
      <Dialog open={asking} onClose={() => setAsking(false)} title="Đưa mọi tùy chọn về mặc định?"
        intro="Cỡ chữ, độ dày bảng, chuyển động, trang vào, kiểu xem lịch, số dòng, khoảng ngày báo cáo, nhắc việc và danh sách việc đầu tiên sẽ trở lại như lúc đầu."
        footer={<><Button variant="ghost" onClick={() => setAsking(false)}>Để sau</Button><Button icon="rotate-ccw" loading={resetting} loadingText="Đang đưa về…" onClick={() => void back()}>Về mặc định</Button></>} />
    </>
  );
}
