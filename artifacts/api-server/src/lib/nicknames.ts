// All words satisfy the DB regex: ^[A-Z][a-z]+[A-Z][a-z]+$ (one uppercase start, lowercase body, uppercase start, lowercase body)
// Pool of 40 adjectives × 40 animals = 1600 unique combinations before any collision
const ADJECTIVES = [
  "Brave", "Calm", "Bright", "Bold", "Kind", "Swift", "Gentle", "Wise",
  "Happy", "Sunny", "Quiet", "Eager", "Proud", "Warm", "Clear", "Noble",
  "Vivid", "Loyal", "Merry", "Nimble", "Daring", "Jolly", "Lively", "Tender",
  "Caring", "Clever", "Steady", "Humble", "Radiant", "Serene", "Hearty",
  "Mighty", "Peppy", "Rosy", "Snappy", "Sprightly", "Trusting", "Valiant",
  "Witty", "Zesty",
];

const ANIMALS = [
  "Otter", "Falcon", "Panda", "Dolphin", "Robin", "Badger", "Lynx",
  "Heron", "Koala", "Ibis", "Crane", "Finch", "Marmot", "Newt", "Owl",
  "Quail", "Raven", "Stork", "Tiger", "Viper", "Wren", "Yak", "Zebra",
  "Bison", "Condor", "Dingo", "Elk", "Gazelle", "Hamster", "Iguana",
  "Jaguar", "Kiwi", "Lemur", "Moose", "Narwhal", "Ocelot", "Pelican",
  "Quokka", "Salamander", "Tamarin",
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj}${animal}`;
}

/**
 * Generate a nickname not already in the provided set.
 * Returns null when the pool is fully exhausted — the caller must handle this.
 */
export function generateUniqueNickname(existingNicknames: Set<string>): string | null {
  const poolSize = ADJECTIVES.length * ANIMALS.length;
  if (existingNicknames.size >= poolSize) {
    return null;
  }

  // Shuffle attempts up to 2× pool size before giving up
  const maxAttempts = Math.min(poolSize * 2, 200);
  for (let i = 0; i < maxAttempts; i++) {
    const nickname = generateNickname();
    if (!existingNicknames.has(nickname)) {
      return nickname;
    }
  }

  // Exhaustive fallback: iterate every combination to find a gap
  for (const adj of ADJECTIVES) {
    for (const animal of ANIMALS) {
      const nickname = `${adj}${animal}`;
      if (!existingNicknames.has(nickname)) {
        return nickname;
      }
    }
  }

  return null;
}
