import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getAssociatedGalleryPhotos } from '../src/utils/gallery.ts';

const photo = { id: 'group', url: 'group-photo.jpg', caption: 'Foto bersama', taggedMemberIds: ['koko', 'nenis', 'zidan'] };
const members = Object.fromEntries(['danti', 'koko', 'nenis', 'zidan', 'other'].map(id => [id, { id, fullName: id, gallery: id === 'danti' ? [photo] : [] }]));

for (const id of ['danti', 'koko', 'nenis', 'zidan']) {
  test(`gallery viewed from ${id} shows everyone else, including the owner`, () => {
    const saved = JSON.stringify(members);
    const result = getAssociatedGalleryPhotos(members[id], members);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0].taggedMemberIds, ['danti', 'koko', 'nenis', 'zidan'].filter(person => person !== id));
    assert.equal(JSON.stringify(members), saved);
  });
}

test('unrelated profiles do not receive the shared photo', () => {
  assert.deepEqual(getAssociatedGalleryPhotos(members.other, members), []);
});

test('duplicate photos and tags are merged without repeating people or keeping deleted members', () => {
  const data = structuredClone(members);
  data.zidan.gallery = [{ ...photo, taggedMemberIds: ['koko', 'koko', 'zidan', 'missing'] }];
  const result = getAssociatedGalleryPhotos(data.zidan, data);
  assert.equal(result.length, 1);
  assert.deepEqual(result[0].taggedMemberIds, ['koko', 'danti', 'nenis']);
});

test('an untagged personal photo has no self tag', () => {
  const data = { danti: { id: 'danti', fullName: 'Danti', gallery: [{ id: 'solo', url: 'solo.jpg' }] } };
  assert.deepEqual(getAssociatedGalleryPhotos(data.danti, data)[0].taggedMemberIds, []);
});
