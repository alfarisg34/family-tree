import assert from 'node:assert/strict';
import { test } from 'node:test';
import { computeClusteredTree } from '../src/utils/clusterEngine.ts';

function fixture(relation = 'adopted', reverseOnly = false, generation = 2) {
  const member = (id, gen, parents = [], spouses = []) => ({ id, fullName: id, generation: gen, parentIds: parents, spouses, relationshipToParents: 'biological' });
  const members = [member('root', 1),
    member('yunus', generation, ['root'], reverseOnly ? [] : [{ spouseId: 'rita', status: 'divorced' }]),
    member('rita', generation, [], [{ spouseId: 'yunus', status: 'divorced' }]),
    member('zidan', generation + 1, ['yunus', 'rita']),
    { ...member('nela', generation + 1, ['rita']), relationshipToParents: relation },
    member('grandchild', generation + 2, ['nela']),
  ];
  return Object.fromEntries(members.map((m, index) => [m.id, { id: m.id, member: m, generation: m.generation, x: index * 250, y: m.generation * 280, width: 120, height: 120, totalDescendants: 0, spouses: [] }]));
}

function cluster(nodes, scale = .25) {
  return computeClusteredTree({ nodes, edges: [], viewport: { x: 0, y: 0, scale }, containerWidth: 10000, containerHeight: 10000 });
}

for (const relation of ['biological', 'adopted', 'foster', 'step']) {
  test(`${relation} children linked only to a spouse join the family with their descendants`, () => {
    const result = cluster(fixture(relation));
    const family = result.visibleClusters.find(group => group.leaderNode.id === 'yunus');
    assert.deepEqual(family.memberNodes.map(node => node.id), ['yunus', 'rita', 'zidan', 'nela', 'grandchild']);
    assert.equal(family.count, 5);
    assert.ok(!result.visibleNodes.some(node => node.id === 'nela'));
    const ids = [...result.visibleNodes.map(node => node.id), ...result.visibleClusters.flatMap(group => group.memberNodes.map(node => node.id))];
    assert.equal(new Set(ids).size, ids.length);
  });
}

test('one-sided spouse records still include the spouse-only child', () => {
  const result = cluster(fixture('adopted', true));
  assert.ok(result.visibleClusters.find(group => group.leaderNode.id === 'yunus').memberNodes.some(node => node.id === 'nela'));
});

test('medium zoom groups a family even when its children link only to its spouse', () => {
  const nodes = fixture('adopted', false, 3);
  nodes.zidan.member.parentIds = ['rita'];
  const result = cluster(nodes, .6);
  const family = result.visibleClusters.find(group => group.leaderNode.id === 'yunus');
  assert.equal(family.count, 5);
  assert.ok(family.memberNodes.some(node => node.id === 'nela'));
});

test('detail zoom reveals all family members individually', () => {
  const result = cluster(fixture(), 1);
  assert.equal(result.visibleClusters.length, 0);
  assert.equal(result.visibleNodes.length, 6);
  assert.ok(result.visibleNodes.some(node => node.id === 'nela'));
});
