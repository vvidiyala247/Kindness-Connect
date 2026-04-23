const ADJECTIVES = [
  "Brave", "Calm", "Bright", "Bold", "Kind", "Swift", "Gentle", "Wise",
  "Happy", "Sunny", "Quiet", "Eager", "Proud", "Warm", "Clear", "Noble",
  "Vivid", "Loyal", "Merry", "Nimble", "Daring", "Jolly", "Lively", "Tender",
  "Caring", "Clever", "Steady", "Graceful", "Humble", "Radiant",
];

const ANIMALS = [
  "Otter", "Falcon", "Panda", "Dolphin", "Robin", "Badger", "Lynx",
  "Heron", "Koala", "Ibis", "Crane", "Finch", "Marmot", "Newt", "Owl",
  "Quail", "Raven", "Stork", "Tiger", "Viper", "Wren", "Yak", "Zebra",
  "Bison", "Condor", "Dingo", "Elk", "Gazelle", "Hamster", "Iguana",
];

export function generateNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${adj}${animal}`;
}

export async function generateUniqueNickname(
  existingNicknames: Set<string>,
  maxAttempts = 50,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const nickname = generateNickname();
    if (!existingNicknames.has(nickname)) {
      return nickname;
    }
  }
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const suffix = Math.floor(Math.random() * 999) + 1;
  const nickname = `${adj}${animal}${suffix}`;
  return nickname;
}
