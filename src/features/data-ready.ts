/**
 * Controls whose data the data branch owes (part 2 spec §4). A control stays hidden until its contract is on the
 * integration branch — never a box that saves nothing. Flip one flag when its contract lands.
 */
export const DATA_READY = { timeSlot: true, rememberLogin: true } as const;
