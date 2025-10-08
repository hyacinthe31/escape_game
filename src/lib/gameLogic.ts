export const organs = ["brain", "heart", "lungs", "dna"] as const;
export type Organ = (typeof organs)[number];

export const getNextOrgan = (current: Organ): Organ | null => {
  const index = organs.indexOf(current);
  return index < organs.length - 1 ? organs[index + 1] : null;
};
