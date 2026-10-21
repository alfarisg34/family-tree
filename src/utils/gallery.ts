import type { FamilyMember, GalleryPhoto } from '../types/family';

/** Build display-only tags relative to the profile being viewed, preserving saved galleries. */
export function getAssociatedGalleryPhotos(member: FamilyMember, members: Record<string, FamilyMember>): GalleryPhoto[] {
  const photos = new Map<string, GalleryPhoto>();
  const addPhoto = (photo: GalleryPhoto, owner: FamilyMember) => {
    if (!photo.url) return;
    const existing = photos.get(photo.url);
    const participants = new Set([
      ...(existing?.taggedMemberIds || []),
      owner.id,
      ...(photo.taggedMemberIds || []),
    ]);
    photos.set(photo.url, {
      ...(existing || photo),
      caption: existing?.caption || photo.caption || (owner.id !== member.id
        ? `Foto bersama ${owner.nickname || owner.fullName.split(' ')[0]}` : photo.caption),
      taggedMemberIds: [...participants].filter(id => id !== member.id && Boolean(members[id])),
    });
  };

  (member.gallery || []).forEach(photo => addPhoto(photo, member));
  Object.values(members).forEach(owner => {
    if (owner.id === member.id) return;
    (owner.gallery || []).forEach(photo => {
      if (photo.taggedMemberIds?.includes(member.id)) addPhoto(photo, owner);
    });
  });
  return [...photos.values()];
}
