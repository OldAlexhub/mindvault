/**
 * Bundled word puzzle data for MindVault.
 * Used as a fallback when network data is unavailable.
 */

export interface WordAnalogyItem {
  prompt: string;
  choices: string[];
  correctIndex: number;
}

export interface WordAssociationItem {
  word: string;
  related: string[];
  oddOne: string;
}

export interface SynonymItem {
  word: string;
  choices: string[];
  correctIndex: number;
}

export interface AntonymItem {
  word: string;
  choices: string[];
  correctIndex: number;
}

// ---------------------------------------------------------------------------
// ANALOGIES
// Format: "X is to Y as A is to ___"
// ---------------------------------------------------------------------------
export const BUNDLED_WORD_ANALOGIES: WordAnalogyItem[] = [
  {
    prompt: 'Hot is to Cold as Fast is to ___',
    choices: ['Slow', 'Warm', 'Quick', 'Speed'],
    correctIndex: 0,
  },
  {
    prompt: 'Dog is to Puppy as Cat is to ___',
    choices: ['Kitten', 'Cub', 'Foal', 'Calf'],
    correctIndex: 0,
  },
  {
    prompt: 'Doctor is to Hospital as Teacher is to ___',
    choices: ['School', 'Library', 'Office', 'Clinic'],
    correctIndex: 0,
  },
  {
    prompt: 'Fish is to Water as Bird is to ___',
    choices: ['Sky', 'Tree', 'Nest', 'Wing'],
    correctIndex: 0,
  },
  {
    prompt: 'Book is to Library as Painting is to ___',
    choices: ['Museum', 'Gallery', 'Studio', 'Auction'],
    correctIndex: 1,
  },
  {
    prompt: 'Glove is to Hand as Sock is to ___',
    choices: ['Foot', 'Leg', 'Ankle', 'Shoe'],
    correctIndex: 0,
  },
  {
    prompt: 'Pen is to Write as Knife is to ___',
    choices: ['Cut', 'Stab', 'Slice', 'Cook'],
    correctIndex: 0,
  },
  {
    prompt: 'Sun is to Day as Moon is to ___',
    choices: ['Night', 'Star', 'Sky', 'Dusk'],
    correctIndex: 0,
  },
  {
    prompt: 'Hammer is to Nail as Saw is to ___',
    choices: ['Wood', 'Blade', 'Cut', 'Carpenter'],
    correctIndex: 0,
  },
  {
    prompt: 'France is to Paris as Japan is to ___',
    choices: ['Tokyo', 'Osaka', 'Kyoto', 'Hiroshima'],
    correctIndex: 0,
  },
  {
    prompt: 'Eye is to See as Ear is to ___',
    choices: ['Hear', 'Listen', 'Sound', 'Noise'],
    correctIndex: 0,
  },
  {
    prompt: 'Horse is to Gallop as Snake is to ___',
    choices: ['Slither', 'Crawl', 'Slide', 'Creep'],
    correctIndex: 0,
  },
  {
    prompt: 'Ice is to Cold as Fire is to ___',
    choices: ['Hot', 'Warm', 'Burn', 'Flame'],
    correctIndex: 0,
  },
  {
    prompt: 'Begin is to End as Open is to ___',
    choices: ['Close', 'Shut', 'Lock', 'Seal'],
    correctIndex: 0,
  },
  {
    prompt: 'Bread is to Baker as Shoe is to ___',
    choices: ['Cobbler', 'Tailor', 'Weaver', 'Carpenter'],
    correctIndex: 0,
  },
  {
    prompt: 'Cub is to Bear as Lamb is to ___',
    choices: ['Sheep', 'Goat', 'Pig', 'Cow'],
    correctIndex: 0,
  },
  {
    prompt: 'Painter is to Canvas as Sculptor is to ___',
    choices: ['Clay', 'Brush', 'Gallery', 'Easel'],
    correctIndex: 0,
  },
  {
    prompt: 'Laugh is to Joy as Cry is to ___',
    choices: ['Sadness', 'Pain', 'Fear', 'Grief'],
    correctIndex: 0,
  },
  {
    prompt: 'Water is to Thirst as Food is to ___',
    choices: ['Hunger', 'Taste', 'Appetite', 'Energy'],
    correctIndex: 0,
  },
  {
    prompt: 'Cup is to Tea as Bowl is to ___',
    choices: ['Soup', 'Spoon', 'Food', 'Plate'],
    correctIndex: 0,
  },
  {
    prompt: 'Astronomer is to Stars as Geologist is to ___',
    choices: ['Rocks', 'Earth', 'Mountains', 'Caves'],
    correctIndex: 0,
  },
  {
    prompt: 'Seed is to Plant as Egg is to ___',
    choices: ['Bird', 'Chicken', 'Animal', 'Shell'],
    correctIndex: 0,
  },
  {
    prompt: 'Words are to Author as Notes are to ___',
    choices: ['Composer', 'Singer', 'Musician', 'Pianist'],
    correctIndex: 0,
  },
  {
    prompt: 'Brave is to Cowardly as Honest is to ___',
    choices: ['Deceitful', 'Shy', 'Bold', 'Quiet'],
    correctIndex: 0,
  },
];

// ---------------------------------------------------------------------------
// ASSOCIATIONS: find the odd one out
// ---------------------------------------------------------------------------
export const BUNDLED_WORD_ASSOCIATIONS: WordAssociationItem[] = [
  {
    word: 'Fruits',
    related: ['Apple', 'Banana', 'Cherry'],
    oddOne: 'Carrot',
  },
  {
    word: 'Ocean creatures',
    related: ['Shark', 'Whale', 'Dolphin'],
    oddOne: 'Eagle',
  },
  {
    word: 'Musical instruments',
    related: ['Guitar', 'Piano', 'Violin'],
    oddOne: 'Microphone',
  },
  {
    word: 'Planets',
    related: ['Mars', 'Venus', 'Jupiter'],
    oddOne: 'Moon',
  },
  {
    word: 'Colors',
    related: ['Red', 'Blue', 'Green'],
    oddOne: 'Circle',
  },
  {
    word: 'Writing tools',
    related: ['Pen', 'Pencil', 'Marker'],
    oddOne: 'Ruler',
  },
  {
    word: 'Sports',
    related: ['Soccer', 'Tennis', 'Basketball'],
    oddOne: 'Chess',
  },
  {
    word: 'Seasons',
    related: ['Spring', 'Summer', 'Autumn'],
    oddOne: 'Monday',
  },
  {
    word: 'Kitchen items',
    related: ['Knife', 'Fork', 'Spoon'],
    oddOne: 'Hammer',
  },
  {
    word: 'Vehicles',
    related: ['Car', 'Bus', 'Train'],
    oddOne: 'Bicycle',
  },
  {
    word: 'Big cats',
    related: ['Lion', 'Tiger', 'Cheetah'],
    oddOne: 'Wolf',
  },
  {
    word: 'Languages',
    related: ['Spanish', 'French', 'German'],
    oddOne: 'Mathematics',
  },
  {
    word: 'Trees',
    related: ['Oak', 'Maple', 'Pine'],
    oddOne: 'Rose',
  },
  {
    word: 'Emotions',
    related: ['Happy', 'Sad', 'Angry'],
    oddOne: 'Quickly',
  },
  {
    word: 'Geometry shapes',
    related: ['Triangle', 'Square', 'Circle'],
    oddOne: 'Volume',
  },
  {
    word: 'Currencies',
    related: ['Dollar', 'Euro', 'Yen'],
    oddOne: 'Gold',
  },
  {
    word: 'Beverages',
    related: ['Coffee', 'Tea', 'Juice'],
    oddOne: 'Bread',
  },
  {
    word: 'Body parts',
    related: ['Elbow', 'Knee', 'Wrist'],
    oddOne: 'Hunger',
  },
  {
    word: 'Clothing',
    related: ['Shirt', 'Jacket', 'Trousers'],
    oddOne: 'Wallet',
  },
  {
    word: 'Natural disasters',
    related: ['Earthquake', 'Tornado', 'Flood'],
    oddOne: 'Rainbow',
  },
  {
    word: 'Primates',
    related: ['Gorilla', 'Chimpanzee', 'Baboon'],
    oddOne: 'Panda',
  },
  {
    word: 'Programming concepts',
    related: ['Loop', 'Function', 'Variable'],
    oddOne: 'Sentence',
  },
];

// ---------------------------------------------------------------------------
// SYNONYMS: find the closest synonym
// ---------------------------------------------------------------------------
export const BUNDLED_SYNONYMS: SynonymItem[] = [
  {
    word: 'Happy',
    choices: ['Joyful', 'Angry', 'Tired', 'Cold'],
    correctIndex: 0,
  },
  {
    word: 'Big',
    choices: ['Tiny', 'Large', 'Flat', 'Round'],
    correctIndex: 1,
  },
  {
    word: 'Fast',
    choices: ['Slow', 'Heavy', 'Swift', 'Loud'],
    correctIndex: 2,
  },
  {
    word: 'Brave',
    choices: ['Fearful', 'Tall', 'Courageous', 'Lazy'],
    correctIndex: 2,
  },
  {
    word: 'Angry',
    choices: ['Calm', 'Furious', 'Tired', 'Bright'],
    correctIndex: 1,
  },
  {
    word: 'Smart',
    choices: ['Dull', 'Intelligent', 'Slow', 'Loud'],
    correctIndex: 1,
  },
  {
    word: 'Start',
    choices: ['Finish', 'Stop', 'Begin', 'Pause'],
    correctIndex: 2,
  },
  {
    word: 'Tired',
    choices: ['Energetic', 'Exhausted', 'Cheerful', 'Active'],
    correctIndex: 1,
  },
  {
    word: 'Strange',
    choices: ['Normal', 'Bizarre', 'Familiar', 'Plain'],
    correctIndex: 1,
  },
  {
    word: 'Rich',
    choices: ['Poor', 'Wealthy', 'Simple', 'Dry'],
    correctIndex: 1,
  },
  {
    word: 'Silent',
    choices: ['Noisy', 'Quiet', 'Bright', 'Rough'],
    correctIndex: 1,
  },
  {
    word: 'Scared',
    choices: ['Brave', 'Joyful', 'Frightened', 'Relaxed'],
    correctIndex: 2,
  },
  {
    word: 'Close',
    choices: ['Distant', 'Near', 'Far', 'Wide'],
    correctIndex: 1,
  },
  {
    word: 'Choose',
    choices: ['Reject', 'Ignore', 'Select', 'Avoid'],
    correctIndex: 2,
  },
  {
    word: 'Difficult',
    choices: ['Easy', 'Simple', 'Challenging', 'Light'],
    correctIndex: 2,
  },
  {
    word: 'Build',
    choices: ['Destroy', 'Construct', 'Remove', 'Paint'],
    correctIndex: 1,
  },
  {
    word: 'Wet',
    choices: ['Dry', 'Damp', 'Hot', 'Crisp'],
    correctIndex: 1,
  },
  {
    word: 'Old',
    choices: ['New', 'Young', 'Ancient', 'Fresh'],
    correctIndex: 2,
  },
  {
    word: 'Thin',
    choices: ['Fat', 'Slender', 'Heavy', 'Tall'],
    correctIndex: 1,
  },
  {
    word: 'Error',
    choices: ['Truth', 'Mistake', 'Answer', 'Result'],
    correctIndex: 1,
  },
  {
    word: 'Fix',
    choices: ['Break', 'Repair', 'Ignore', 'Lose'],
    correctIndex: 1,
  },
  {
    word: 'Speak',
    choices: ['Listen', 'Write', 'Talk', 'Read'],
    correctIndex: 2,
  },
];

// ---------------------------------------------------------------------------
// ANTONYMS: find the antonym (opposite)
// ---------------------------------------------------------------------------
export const BUNDLED_ANTONYMS: AntonymItem[] = [
  {
    word: 'Hot',
    choices: ['Warm', 'Cold', 'Boiling', 'Heated'],
    correctIndex: 1,
  },
  {
    word: 'Happy',
    choices: ['Cheerful', 'Glad', 'Sad', 'Joyful'],
    correctIndex: 2,
  },
  {
    word: 'Fast',
    choices: ['Quick', 'Speedy', 'Slow', 'Rapid'],
    correctIndex: 2,
  },
  {
    word: 'Big',
    choices: ['Large', 'Huge', 'Tiny', 'Vast'],
    correctIndex: 2,
  },
  {
    word: 'Day',
    choices: ['Morning', 'Dusk', 'Night', 'Afternoon'],
    correctIndex: 2,
  },
  {
    word: 'Light',
    choices: ['Glow', 'Dim', 'Dark', 'Shine'],
    correctIndex: 2,
  },
  {
    word: 'Love',
    choices: ['Adore', 'Cherish', 'Hate', 'Care'],
    correctIndex: 2,
  },
  {
    word: 'Rich',
    choices: ['Wealthy', 'Affluent', 'Poor', 'Prosperous'],
    correctIndex: 2,
  },
  {
    word: 'Start',
    choices: ['Launch', 'Open', 'End', 'Begin'],
    correctIndex: 2,
  },
  {
    word: 'Hard',
    choices: ['Firm', 'Tough', 'Soft', 'Solid'],
    correctIndex: 2,
  },
  {
    word: 'Tall',
    choices: ['High', 'Giant', 'Short', 'Long'],
    correctIndex: 2,
  },
  {
    word: 'Young',
    choices: ['New', 'Fresh', 'Old', 'Recent'],
    correctIndex: 2,
  },
  {
    word: 'Win',
    choices: ['Succeed', 'Triumph', 'Lose', 'Score'],
    correctIndex: 2,
  },
  {
    word: 'Clean',
    choices: ['Tidy', 'Fresh', 'Dirty', 'Pure'],
    correctIndex: 2,
  },
  {
    word: 'Full',
    choices: ['Complete', 'Packed', 'Empty', 'Whole'],
    correctIndex: 2,
  },
  {
    word: 'Strong',
    choices: ['Powerful', 'Mighty', 'Weak', 'Bold'],
    correctIndex: 2,
  },
  {
    word: 'Open',
    choices: ['Ajar', 'Wide', 'Closed', 'Clear'],
    correctIndex: 2,
  },
  {
    word: 'Ancient',
    choices: ['Old', 'Historic', 'Modern', 'Aged'],
    correctIndex: 2,
  },
  {
    word: 'Brave',
    choices: ['Bold', 'Daring', 'Cowardly', 'Heroic'],
    correctIndex: 2,
  },
  {
    word: 'Loud',
    choices: ['Noisy', 'Booming', 'Quiet', 'Harsh'],
    correctIndex: 2,
  },
  {
    word: 'Smooth',
    choices: ['Sleek', 'Glossy', 'Rough', 'Polished'],
    correctIndex: 2,
  },
  {
    word: 'Dry',
    choices: ['Arid', 'Parched', 'Wet', 'Crisp'],
    correctIndex: 2,
  },
];
