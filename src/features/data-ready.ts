/**
 * Controls whose data the data branch owes (part 2 spec §4). A control stays hidden until its contract is on the
 * integration branch — never a box that saves nothing. Flip one flag when its contract lands.
 */
export const DATA_READY = {
  timeSlot: true, rememberLogin: true,
  // Part 3 (customer zone): the data branch delivered all five on 21/10; each flips to true with the screen that uses it.
  petWeight: true, petCondition: true, reschedule: true, updates: false, diaryDate: true,
} as const;
