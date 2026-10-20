import type { FamilyData, FamilyMember } from '../types/family';

export function updateFamilyMembers(data: FamilyData, member: FamilyMember, reorderedChildren: FamilyMember[] = []): FamilyData {
  const members = { ...data.members, [member.id]: member };
  for (const [id, other] of Object.entries(members)) {
    if (id === member.id) continue;
    const relation = member.spouses.find((spouse) => spouse.spouseId === id);
    const spouses = other.spouses.filter((spouse) => spouse.spouseId !== member.id);
    if (relation) spouses.push({ ...relation, spouseId: member.id });
    members[id] = { ...other, spouses };
  }
  reorderedChildren.forEach((child, index) => {
    if (members[child.id]) members[child.id] = { ...members[child.id], order: index + 1 };
  });
  return { ...data, members, updatedAt: new Date().toISOString() };
}
