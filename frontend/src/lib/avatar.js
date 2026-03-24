function hashSeed(seed = '') {
  let hash = 0;
  const value = String(seed || 'soulsupport');

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function getDefaultAvatarPath(seed = '') {
  const avatarNumber = (hashSeed(seed) % 8) + 1;
  return `/images/avatars/avatar-${avatarNumber}.svg`;
}
