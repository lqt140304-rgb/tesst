import { useState } from 'react';
import { PRESET_LABEL, effectiveCaps, type Cap, type PresetId } from '@/data/rules/capabilities';
import { staff, type StaffAdminRow } from '@/data/staff';
import { Button, Checkbox, Dialog, Field, Icon, Input, PasswordInput } from '@/ui';
import { FormError } from '../ui';
import { PermissionPicker } from './PermissionPicker';
import { extraOf, inheritedCaps } from './settingsView';
import { useSave } from './useSave';
import ss from '../Staff.module.css';
import s from './Settings.module.css';

const PRESET_ORDER: PresetId[] = ['quan_ly', 'bac_si', 'spa'];

/**
 * One form to add or edit a person. Editing sends the version it opened with, so a second tab that saved first wins and this one is
 * told so. The username and first password are set only when adding: the password changes later through the profile or a reset.
 */
export function TeamDialog({ open, onClose, row }: { open: boolean; onClose: () => void; row?: StaffAdminRow }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(row?.name ?? '');
  const [title, setTitle] = useState(row?.title ?? '');
  const [presets, setPresets] = useState<PresetId[]>(row?.presets ?? []);
  const [extras, setExtras] = useState<ReadonlySet<Cap>>(new Set(row?.extraCaps));
  const [version] = useState(row?.version);
  // What the person holds today: it decides whether the old umbrella stock right is shown, so it can be taken away.
  const [held] = useState(() => effectiveCaps({ preset_ids: row?.presets ?? [], extra_capabilities: row?.extraCaps ?? [] }));
  const { errors, busy, save, clear } = useSave(onClose);

  const selected = new Set<Cap>([...inheritedCaps(presets), ...extras]);
  const togglePreset = (p: PresetId) => { setPresets((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p])); clear('preset_ids', 'form'); };

  async function submit() {
    const input = { display_name: name, title, preset_ids: presets, extra_capabilities: extraOf(selected, presets) };
    const ok = await save(async () => {
      if (row && version !== undefined) {
        await staff.team.update(row.id, version, input);
        return `Đã lưu tài khoản ${row.username}.`;
      }
      await staff.team.create({ ...input, username, password });
      return `Đã thêm tài khoản ${username.trim()}.`;
    });
    if (ok) onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} wide title={row ? 'Sửa tài khoản nhân viên' : 'Thêm nhân viên'}
      footer={<><Button variant="ghost" onClick={onClose}>Để sau</Button><Button icon="check" loading={busy} loadingText="Đang lưu…" onClick={() => void submit()}>Lưu tài khoản</Button></>}>
      <div className={ss.form}>
        <FormError>{errors.form}</FormError>
        {row ? (
          <p className={s.fixedRow}><span className={ss.meta}>Tên đăng nhập</span><strong className="num">{row.username}</strong></p>
        ) : (
          <>
            <Field label="Tên đăng nhập" error={errors.username} hint="Chữ thường không dấu, số, dấu _ hoặc -.">
              <Input value={username} autoComplete="off" onChange={(e) => { setUsername(e.target.value); clear('username', 'form'); }} />
            </Field>
            <Field label="Mật khẩu" error={errors.password} hint="Ít nhất 8 ký tự. Hãy báo cho người đó; họ đổi lại ở Hồ sơ của họ.">
              <PasswordInput value={password} autoComplete="new-password" onChange={(e) => { setPassword(e.target.value); clear('password', 'form'); }} />
            </Field>
          </>
        )}
        <Field label="Tên hiển thị" error={errors.display_name}>
          <Input value={name} autoComplete="off" onChange={(e) => { setName(e.target.value); clear('display_name', 'form'); }} />
        </Field>
        <Field label="Chức danh" error={errors.title}>
          <Input value={title} autoComplete="off" onChange={(e) => { setTitle(e.target.value); clear('title', 'form'); }} />
        </Field>
        <fieldset className={s.pickGroup}>
          <legend className={s.pickLegend}>Vai</legend>
          <div className={s.pickList}>
            {PRESET_ORDER.map((p) => <Checkbox key={p} label={PRESET_LABEL[p]} checked={presets.includes(p)} onChange={() => togglePreset(p)} />)}
          </div>
          <FormError>{errors.preset_ids}</FormError>
        </fieldset>
        <div className={s.pickBlock}>
          <h3 className={s.h3}>Quyền thêm</h3>
          <p className={s.sub}>Quyền của vai đã được tích sẵn. Tích thêm nếu người này cần nhiều hơn vai của họ.</p>
          <PermissionPicker presets={presets} selected={selected} held={held}
            onChange={(next) => { setExtras(new Set(extraOf(next, presets))); clear('extra_capabilities', 'form'); }} />
          <FormError>{errors.extra_capabilities}</FormError>
        </div>
        {row?.isSelf && (
          <ul className={s.selfNotes}>
            <li><Icon name="info" size={16} />Bạn đổi mật khẩu của mình ở Hồ sơ của tôi.</li>
            <li><Icon name="info" size={16} />Bạn không tắt được tài khoản của chính mình.</li>
          </ul>
        )}
      </div>
    </Dialog>
  );
}
