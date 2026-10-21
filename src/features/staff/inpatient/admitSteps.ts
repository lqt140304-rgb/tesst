import type { InternalStatus, Species } from '@/data/contracts/enums';
import type { AdmitOptions, AdmitPetOption } from '@/data/staff';

export type AdmitStep = 1 | 2 | 3;
export type AdmitDraft = {
  pet?: AdmitPetOption; appointment?: AdmitOptions['today'][number]; cageId?: string; doctorId?: string;
  reason: string; status: InternalStatus; expected: string; invoice: boolean; dayItemId?: string;
};

export const ADMIT_STEP_TITLES: Record<AdmitStep, string> = { 1: 'Chọn bé', 2: 'Chuồng và chăm sóc', 3: 'Hóa đơn và xác nhận' };

export function canAdvance(step: AdmitStep, d: AdmitDraft): boolean {
  if (step === 1) return !!d.pet && !d.pet.inpatient;
  if (step === 2) return !!d.cageId && d.reason.trim().length > 0;
  return true;
}

/** The step that owns a field the API complained about, so the person lands where the problem is. */
export function stepOfField(field: string): AdmitStep {
  if (field === 'pet_id') return 1;
  if (['cage_id', 'reason_internal', 'expected_discharge_at', 'doctor_id', 'initial_status'].includes(field)) return 2;
  return 3;
}

export function admitSummary(d: AdmitDraft, o: Pick<AdmitOptions, 'cages' | 'doctors' | 'dayItems'>): string {
  const cage = o.cages.find((c) => c.id === d.cageId)?.code;
  const doctor = o.doctors.find((x) => x.id === d.doctorId)?.name;
  const dayItem = o.dayItems.find((x) => x.id === d.dayItemId)?.name;
  const bill = !d.invoice ? 'không tạo hóa đơn' : dayItem ? `hóa đơn nháp có ${dayItem}` : 'hóa đơn nháp, chưa ghi tiền nội trú';
  return [d.pet?.name, cage && `chuồng ${cage}`, doctor, bill].filter(Boolean).join(' · ');
}

export function dayItemNote(d: AdmitDraft): string | undefined {
  if (d.appointment?.draftInvoice) return `Thêm vào hóa đơn nháp ${d.appointment.draftInvoice.code} của lịch hẹn`;
  if (d.pet && d.pet.weight_kg === undefined && !d.dayItemId) return 'Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú.';
  return undefined;
}

/** Empty cages grouped by zone; zones that suit the species come first. */
export function orderCages(cages: AdmitOptions['cages'], species: Species): { zone: string; fit: boolean; cages: AdmitOptions['cages'] }[] {
  const zones = [...new Set(cages.map((c) => c.zone))].map((zone) => {
    const inZone = cages.filter((c) => c.zone === zone).sort((a, b) => a.code.localeCompare(b.code, 'vi', { numeric: true }));
    return { zone, fit: inZone.some((c) => c.species_hint === species || c.species_hint === 'any'), cages: inZone };
  });
  return [...zones.filter((z) => z.fit), ...zones.filter((z) => !z.fit)];
}
