export const getRandomTitle = () => {
  const adjectives = [
    'Fresh',
    'Nova',
    'Pixel',
    'Quantum',
    'Lunar',
    'Spark',
    'Prime',
    'Neon',
    'Atlas',
    'Echo',
    'Apex',
    'Orbit',
    'Cosmic',
    'Fusion',
    'Vertex'
  ];
  const nouns = [
    'Playground',
    'Workshop',
    'Pad',
    'Studio',
    'Container',
    'Project',
    'Sandbox',
    'Lab',
    'Deck',
    'Canvas',
    'Vault',
    'Hub',
    'Forge',
    'Nest',
    'Zone'
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
};
