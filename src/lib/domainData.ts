// Domain-specific suggestion datasets for SunoSign AI context-aware system

export type AppContext = 'user' | 'retailer';
export type DomainType = 'general' | 'medical' | 'grocery' | 'banking' | 'transport';

export interface DomainConfig {
  id: DomainType;
  label: string;
  emoji: string;
  description: string;
}

export const DOMAINS: DomainConfig[] = [
  { id: 'general', label: 'General', emoji: '💬', description: 'Everyday communication' },
  { id: 'medical', label: 'Medical Store', emoji: '💊', description: 'Pharmacy & medicines' },
  { id: 'grocery', label: 'Grocery Store', emoji: '🛒', description: 'Food & supplies' },
  { id: 'banking', label: 'Bank', emoji: '🏦', description: 'Banking & finance' },
  { id: 'transport', label: 'Transport', emoji: '🚌', description: 'Public transport' },
];

// ==================== GENERAL (default user mode) ====================
const GENERAL_WORDS: Record<string, string[]> = {
  A: ['Apple', 'Ask', 'Amazing', 'Alive', 'Always', 'About'],
  B: ['Book', 'Bring', 'Best', 'Better', 'Back', 'Buy'],
  C: ['Cat', 'Call', 'Create', 'Cool', 'Come', 'Can'],
  D: ['Dog', 'Do', 'Drive', 'Dream', 'Done', 'Day'],
  E: ['Eat', 'Enjoy', 'Energy', 'Easy', 'Every', 'End'],
  F: ['Food', 'Find', 'Fast', 'Fun', 'Family', 'Feel'],
  G: ['Go', 'Good', 'Great', 'Give', 'Get', 'Green'],
  H: ['Help', 'House', 'How', 'Happy', 'Hello', 'Home'],
  I: ['I', 'Idea', 'Important', 'Improve', 'In', 'Is'],
  J: ['Just', 'Join', 'Jump', 'Job', 'Joy', 'Juice'],
  K: ['Keep', 'Kind', 'Know', 'Key', 'Kid', 'King'],
  L: ['Love', 'Learn', 'Look', 'Live', 'Let', 'Light'],
  M: ['Make', 'More', 'Move', 'Money', 'My', 'Many'],
  N: ['New', 'Need', 'Nice', 'Now', 'Name', 'Next'],
  O: ['Open', 'Only', 'Order', 'Other', 'Out', 'Okay'],
  P: ['Play', 'Please', 'Put', 'Power', 'People', 'Place'],
  Q: ['Quick', 'Question', 'Quiet', 'Quite', 'Quality'],
  R: ['Run', 'Read', 'Right', 'Real', 'Rest', 'Room'],
  S: ['See', 'Say', 'Stop', 'Start', 'Stay', 'Safe'],
  T: ['Take', 'Tell', 'Try', 'Think', 'Thank', 'Time'],
  U: ['Use', 'Under', 'Up', 'Understand', 'Until', 'Us'],
  V: ['Very', 'View', 'Voice', 'Visit', 'Value'],
  W: ['Want', 'Work', 'Where', 'Why', 'Water', 'Wait'],
  X: ['X-ray', 'Xenon'],
  Y: ['You', 'Yes', 'Your', 'Young', 'Year'],
  Z: ['Zero', 'Zoom', 'Zone', 'Zen'],
};

const GENERAL_PHRASES: Record<string, string[]> = {
  A: ['Are you okay?', 'All good', 'Almost done'],
  B: ['Be right back', 'Be careful', 'Bye for now'],
  C: ['Can you help?', 'Come here please', 'Call me later'],
  D: ["Don't worry", 'Do you understand?', 'Done with that'],
  E: ['Excuse me', 'Everything is fine', 'Eat something'],
  F: ['Feel better', 'Follow me', 'Find it please'],
  G: ['Good morning', 'Go ahead', 'Great job'],
  H: ['Help me', 'How are you?', 'Hello there', 'Hold on'],
  I: ['I need help', "I'm fine", "I don't understand", "I'm hungry"],
  J: ['Just a moment', 'Just kidding', 'Join us'],
  K: ['Keep going', 'Keep it up', 'Kind regards'],
  L: ['Let me know', 'Look at this', 'Love you'],
  M: ['More please', 'My name is…', 'Move over'],
  N: ['Not now', 'Need water', 'Nice to meet you', 'No problem'],
  O: ['On my way', 'Open the door', 'One moment'],
  P: ['Please wait', 'Please help', 'Put it here'],
  Q: ['Quick question', 'Quiet please'],
  R: ['Right away', 'Repeat please', 'Rest now'],
  S: ['Stop please', 'Start now', 'See you later', 'Stay safe'],
  T: ['Thank you', 'Take care', 'Tell me more', 'Try again'],
  U: ['Understood', 'Use this', 'Up ahead'],
  V: ['Very good', 'Visit soon'],
  W: ['Wait for me', 'Where is it?', 'Want this', 'Why not?'],
  X: ['X marks the spot'],
  Y: ['Yes please', 'You are welcome', 'Your turn'],
  Z: ['Zoom in', 'Zero issues'],
};

// ==================== MEDICAL STORE ====================
const MEDICAL_WORDS: Record<string, string[]> = {
  A: ['Amoxicillin', 'Aspirin', 'Atorvastatin'],
  B: ['Baclofen', 'Benadryl', 'Bisoprolol'],
  C: ['Ciprofloxacin', 'Clopidogrel', 'Cetirizine'],
  D: ['Digoxin', 'Doxycycline', 'Diclofenac'],
  E: ['Enalapril', 'Erythromycin', 'Esomeprazole'],
  F: ['Fluoxetine', 'Furosemide', 'Famotidine'],
  G: ['Gabapentin', 'Gliclazide', 'Glimepiride'],
  H: ['Heparin', 'Hydrochlorothiazide', 'Humira'],
  I: ['Ibuprofen', 'Insulin', 'Ipratropium'],
  J: ['Januvia', 'Jardiance', 'Jantoven'],
  K: ['Keflex', 'Keytruda', 'Kenalog'],
  L: ['Lansoprazole', 'Levothyroxine', 'Lisinopril'],
  M: ['Metformin', 'Methotrexate', 'Metoprolol'],
  N: ['Naproxen', 'Nifedipine', 'Nitrofurantoin'],
  O: ['Omeprazole', 'Ondansetron', 'Ozempic'],
  P: ['Pantoprazole', 'Paracetamol', 'Prednisone'],
  Q: ['Quetiapine', 'Quinapril', 'Qulipta'],
  R: ['Ramipril', 'Ranitidine', 'Rosuvastatin'],
  S: ['Salbutamol', 'Sertraline', 'Simvastatin'],
  T: ['Tamoxifen', 'Tamsulosin', 'Trazodone'],
  U: ['Ursodeoxycholic acid', 'Utrogestan', 'Unasyn'],
  V: ['Valsartan', 'Venlafaxine', 'Vitamin D'],
  W: ['Warfarin', 'Wegovy', 'Wellbutrin'],
  X: ['Xarelto', 'Xylometazoline', 'Xyzal'],
  Y: ['Yervoy', 'Yasmin', 'Yonsa'],
  Z: ['Zolpidem', 'Zopiclone', 'Zyrtec'],
};

const MEDICAL_PHRASES: Record<string, string[]> = {
  A: ['I need Aspirin', 'Any allergy medicine?', 'Antibiotics please'],
  B: ['Blood pressure medicine', 'Bandage please', 'Body pain'],
  C: ['Cold medicine please', 'Cough syrup needed', 'Can I get Cetirizine?'],
  D: ['Do you have Diclofenac?', 'Diabetes medicine', 'Dosage information?'],
  E: ['Eye drops please', 'Ear infection medicine', 'Emergency medicine'],
  F: ['Fever medicine', 'First aid kit', 'For headache'],
  G: ['Generic medicine available?', 'Gastric medicine', 'Give me receipt'],
  H: ['Headache tablet', 'How to take this?', 'Have insulin?'],
  I: ['I need Ibuprofen', 'Inhaler please', 'Is this over-the-counter?'],
  J: ['Joint pain medicine', 'Just a painkiller'],
  K: ['Knee pain relief', 'Keep refrigerated?'],
  L: ['Laxative please', 'Lip balm needed', 'Low blood pressure medicine'],
  M: ['Medicine for cold', 'Monthly prescription', 'More tablets needed'],
  N: ['Need a prescription?', 'Nasal spray please', 'Night time medicine'],
  O: ['Ointment for rash', 'Over-the-counter?', 'Oral rehydration'],
  P: ['Paracetamol please', 'Prescription refill', 'Pain reliever'],
  Q: ['Quick relief medicine', 'Quantity available?'],
  R: ['Refill my prescription', 'Rash cream needed'],
  S: ['Stomach medicine', 'Sore throat remedy', 'Side effects?'],
  T: ['Throat lozenges', 'Take before or after food?', 'Thermometer please'],
  U: ['Upset stomach medicine', 'Urgent need'],
  V: ['Vitamin supplements', 'Vomiting medicine'],
  W: ['Wound care supplies', 'What dosage?', 'When to take?'],
  X: ['X-ray report needed'],
  Y: ['Yesterday I started this medicine'],
  Z: ['Zinc supplements'],
};

// ==================== GROCERY STORE ====================
const GROCERY_WORDS: Record<string, string[]> = {
  A: ['Apple', 'Almonds', 'Asparagus'],
  B: ['Banana', 'Bread', 'Butter'],
  C: ['Cheese', 'Chicken', 'Carrots'],
  D: ['Dates', 'Detergent', 'Dill'],
  E: ['Eggs', 'Eggplant', 'Espresso'],
  F: ['Flour', 'Fish', 'Figs'],
  G: ['Garlic', 'Grapes', 'Ginger'],
  H: ['Honey', 'Ham', 'Hazelnuts'],
  I: ['Ice cream', 'Instant coffee', 'Iodized salt'],
  J: ['Jam', 'Juice', 'Jaggery'],
  K: ['Ketchup', 'Kiwi', 'Kidney beans'],
  L: ['Lemon', 'Lettuce', 'Lentils'],
  M: ['Milk', 'Mushrooms', 'Mustard'],
  N: ['Noodles', 'Nutmeg', 'Nectarine'],
  O: ['Oats', 'Onions', 'Olive oil'],
  P: ['Pasta', 'Potatoes', 'Pepper'],
  Q: ['Quinoa', 'Quail eggs'],
  R: ['Rice', 'Raisins', 'Radish'],
  S: ['Sugar', 'Salt', 'Spinach'],
  T: ['Tea', 'Tomatoes', 'Turmeric'],
  U: ['Urad dal', 'Upma mix', 'Unsalted butter'],
  V: ['Vinegar', 'Vanilla extract', 'Vermicelli'],
  W: ['Water', 'Wheat flour', 'Walnuts'],
  X: ['Xanthan gum', 'Xylitol'],
  Y: ['Yogurt', 'Yeast', 'Yellow squash'],
  Z: ['Zucchini', 'Zest', 'Zeera'],
};

const GROCERY_PHRASES: Record<string, string[]> = {
  A: ['I need apples', 'Any almonds?', 'Avocados available?'],
  B: ['Bag of bread please', 'Brown rice available?', 'Butter 500g'],
  C: ['Can of corn', 'Chicken breast pack', 'Coriander bunch'],
  D: ['Do you have dates?', 'Detergent big pack', 'Dozen eggs'],
  E: ['Extra virgin olive oil', 'Eggs fresh?', 'Express checkout'],
  F: ['Fresh fish available?', 'Flour 1kg pack', 'Frozen vegetables'],
  G: ['Give me garlic', 'Green grapes please', 'Ginger root'],
  H: ['How much for honey?', 'Half kg rice', 'Home delivery?'],
  I: ['I want ice cream', 'Is this organic?', 'I need a bag'],
  J: ['Juice pack please', 'Just this item'],
  K: ['Ketchup bottle', 'Kiwi pack available?'],
  L: ['Large milk pack', 'Lemon dozen', 'Low fat yogurt'],
  M: ['Milk 1 liter', 'Mushrooms fresh?', 'Mustard oil'],
  N: ['Noodles pack', 'Need a receipt', 'No plastic bag'],
  O: ['Onions 1kg', 'Olive oil bottle', 'Organic section?'],
  P: ['Potatoes bag', 'Price of this?', 'Pack of pasta'],
  Q: ['Quinoa available?', 'Queue number?'],
  R: ['Rice 5kg bag', 'Raisins pack', 'Refund please'],
  S: ['Sugar 1kg', 'Salt pack', 'Spinach bunch'],
  T: ['Tea box', 'Tomatoes 1kg', 'Total bill?'],
  U: ['UPI payment?', 'Unsalted butter', 'Urgent need'],
  V: ['Vinegar bottle', 'Vegetables fresh?'],
  W: ['Water bottle', 'Wheat flour 5kg', 'Where is aisle?'],
  X: ['Xtra large pack'],
  Y: ['Yogurt cup', 'Yellow dal 1kg'],
  Z: ['Zucchini available?'],
};

// ==================== BANKING ====================
const BANKING_WORDS: Record<string, string[]> = {
  A: ['Account Balance', 'ATM Pin', 'Annual Fee'],
  B: ['Beneficiary', 'Bank Statement', 'Bounce Check'],
  C: ['Cash Withdrawal', 'Credit Limit', 'Credit Score'],
  D: ['Direct Deposit', 'Debit Card', 'Dormant Account'],
  E: ['EMI', 'E-Statement', 'Equity'],
  F: ['Fixed Deposit', 'Fund Transfer', 'Foreclosure'],
  G: ['Gross Income', 'Guarantor', 'Grace Period'],
  H: ['Home Loan', 'Holding Period', 'High-Yield'],
  I: ['Interest Rate', 'Insufficient Funds', 'IMPS/NEFT'],
  J: ['Joint Account', 'Junior Account'],
  K: ['KYC', 'Kiosk Banking'],
  L: ['Loan Sanction', 'Line of Credit', 'Liquidity'],
  M: ['Minimum Balance', 'Mortgage', 'Mobile Banking'],
  N: ['Nominee', 'Net Banking', 'NSF'],
  O: ['Overdraft', 'Online Banking', 'OTP'],
  P: ['Passbook Update', 'Personal Loan', 'Processing Fee'],
  Q: ['Quarterly Interest', 'Quick Transfer'],
  R: ['Recurring Deposit', 'ROI', 'Remittance'],
  S: ['Savings Account', 'Swift Code', 'Stop Payment'],
  T: ['Term Deposit', 'Transaction History', 'Teller'],
  U: ['UPI ID', 'Unclaimed Deposit', 'Underwriter'],
  V: ['Virtual Card', 'Vault', 'Variable Rate'],
  W: ['Wire Transfer', 'Withdrawal Slip', 'Wealth Management'],
  X: ['Cross-border Payment'],
  Y: ['Yield', 'Year-to-Date'],
  Z: ['Zero Balance Account', 'Zone'],
};

const BANKING_PHRASES: Record<string, string[]> = {
  A: ['Check my account balance', 'ATM nearby?', 'Apply for loan'],
  B: ['Bank statement please', 'Beneficiary name change', 'Blocked card'],
  C: ['Cash withdrawal please', 'Credit card apply', 'Close my account'],
  D: ['Debit card issue', 'Deposit this check', 'Direct transfer'],
  E: ['EMI details please', 'E-statement download', 'Exchange rate?'],
  F: ['Fixed deposit open', 'Fund transfer help', 'Fee waiver request'],
  G: ['Grace period extension', 'Get new checkbook'],
  H: ['Home loan inquiry', 'How to update KYC?'],
  I: ['Interest rate details', 'I need NEFT form', 'IMPS transfer'],
  J: ['Joint account open', 'Junior savings account'],
  K: ['KYC update needed', 'Kiosk not working'],
  L: ['Loan application status', 'Lost my card', 'Locker facility'],
  M: ['Minimum balance required?', 'Mobile banking setup', 'My account number'],
  N: ['Nominee update', 'Net banking reset', 'New account open'],
  O: ['OTP not received', 'Online banking help', 'Overdraft limit'],
  P: ['Passbook update please', 'Personal loan apply', 'PIN change'],
  Q: ['Quick transfer to UPI'],
  R: ['Recurring deposit open', 'Refund status', 'Reset password'],
  S: ['Savings account open', 'Stop this payment', 'Swift code?'],
  T: ['Transaction failed', 'Transfer money', 'Token number?'],
  U: ['UPI ID issue', 'Update my address', 'Urgent help needed'],
  V: ['Virtual card generate', 'Verify my identity'],
  W: ['Wire transfer form', 'Withdrawal slip', 'Where is manager?'],
  X: ['Cross-border transfer help'],
  Y: ['Yearly statement', 'Yield on FD?'],
  Z: ['Zero balance account open'],
};

// ==================== TRANSPORT ====================
const TRANSPORT_WORDS: Record<string, string[]> = {
  A: ['Arrival Time', 'Auto-rickshaw', 'AC Bus'],
  B: ['Bus Stop', 'Bus Pass', 'Boarding Point'],
  C: ['Conductor', 'City Bus', 'Change'],
  D: ['Destination', 'Driver', 'Departure'],
  E: ['E-Rickshaw', 'ETA', 'Exit Gate'],
  F: ['Fare Chart', 'Fixed Route', 'Footboard'],
  G: ['Railway Station', 'GPS Tracking', 'Smart Bus'],
  H: ['Halt', 'Handrail', 'High-Speed Rail'],
  I: ['ISBT', 'Interchange', 'Information Desk'],
  J: ['Journey', 'Junction', 'Joyride'],
  K: ['Kiosk', 'Kilometer Stone', 'Speed'],
  L: ['Ladies Special', 'Last Mile', 'Luggage'],
  M: ['Metro', 'Monthly Pass', 'Main Road'],
  N: ['Night Service', 'No Entry', 'Fare'],
  O: ['One Way', 'Off Peak', 'On Board'],
  P: ['Passenger', 'Platform', 'Parking'],
  Q: ['Queue', 'Transit', 'Fare'],
  R: ['Route Number', 'Reservation', 'Rickshaw'],
  S: ['Shared Tempo', 'Shuttle', 'Seat'],
  T: ['Ticket', 'Terminal', 'Map'],
  U: ['Upcoming Stop', 'Underpass', 'U Turn'],
  V: ['Vehicle Number', 'Valid Ticket', 'VIP'],
  W: ['Waiting Room', 'Window Seat', 'Waypoint'],
  X: ['Baggage Scanner', 'Crossing'],
  Y: ['Yellow Line', 'Traffic Yield'],
  Z: ['Zebra Crossing', 'E Vehicles'],
};

const TRANSPORT_PHRASES: Record<string, string[]> = {
  A: ['What is arrival time?', 'AC bus available?', 'Auto to station'],
  B: ['Where is bus stop?', 'Buy bus pass', 'Boarding point?'],
  C: ['Call the conductor', 'City bus route?', 'Change please'],
  D: ['My destination is...', 'When is departure?', 'Driver stop here'],
  E: ['ETA for next bus?', 'Exit gate where?', 'E-rickshaw available?'],
  F: ['What is the fare?', 'Fare chart please', 'First bus timing?'],
  G: ['Go to railway station', 'GPS tracking on?'],
  H: ['Next halt please', 'How far is station?', 'High-speed rail?'],
  I: ['Information desk where?', 'ISBT direction?', 'Interchange stop?'],
  J: ['Journey time?', 'Which junction?'],
  K: ['Kiosk for tickets?', 'How many kilometers?'],
  L: ['Ladies compartment?', 'Luggage allowed?', 'Last bus timing?'],
  M: ['Metro station nearby?', 'Monthly pass price', 'Main road direction'],
  N: ['Night bus service?', 'Next stop please', 'No entry sign'],
  O: ['One way ticket', 'Off-peak discount?', 'On board assistance'],
  P: ['Platform number?', 'Parking available?', 'Passenger count?'],
  Q: ['Queue for tickets', 'Quick transit route'],
  R: ['Route number please', 'Reserve a seat', 'Rickshaw stand?'],
  S: ['Shuttle service?', 'Seat available?', 'Shared tempo?'],
  T: ['Buy a ticket', 'Which terminal?', 'Transit map?'],
  U: ['Upcoming stop?', 'Underpass direction', 'U-turn ahead?'],
  V: ['Valid ticket check', 'Vehicle number?', 'VIP lounge?'],
  W: ['Waiting room where?', 'Window seat please', 'Which way?'],
  X: ['Baggage scanner?', 'Crossing ahead?'],
  Y: ['Yellow line metro?', 'Yield to traffic'],
  Z: ['Zebra crossing near?', 'EV charging?'],
};

// ==================== LOOKUP FUNCTIONS ====================

const DOMAIN_WORDS: Record<DomainType, Record<string, string[]>> = {
  general: GENERAL_WORDS,
  medical: MEDICAL_WORDS,
  grocery: GROCERY_WORDS,
  banking: BANKING_WORDS,
  transport: TRANSPORT_WORDS,
};

const DOMAIN_PHRASES: Record<DomainType, Record<string, string[]>> = {
  general: GENERAL_PHRASES,
  medical: MEDICAL_PHRASES,
  grocery: GROCERY_PHRASES,
  banking: BANKING_PHRASES,
  transport: TRANSPORT_PHRASES,
};

export function getDomainWords(letter: string, domain: DomainType): string[] {
  const upper = letter.toUpperCase();
  return DOMAIN_WORDS[domain]?.[upper] || GENERAL_WORDS[upper] || [];
}

export function getDomainPhrases(letter: string, domain: DomainType): string[] {
  const upper = letter.toUpperCase();
  return DOMAIN_PHRASES[domain]?.[upper] || GENERAL_PHRASES[upper] || [];
}

// Word-to-sentence dictionary for sentence building
const WORD_SENTENCES: Record<string, string> = {
  HELP: 'I need help',
  HELLO: 'Hello, how are you?',
  YES: 'Yes',
  NO: 'No',
  WATER: 'I need water',
  FOOD: 'I need food',
  DOCTOR: 'Please call a doctor',
  STOP: 'Please stop',
  THANK: 'Thank you very much',
  THANKS: 'Thank you very much',
  PLEASE: 'Please',
  SORRY: 'I am sorry',
  OK: 'Okay',
  GOOD: 'Good',
  BAD: 'Bad',
  PAIN: 'I am in pain',
  CALL: 'Please call someone',
  HOME: 'I want to go home',
  COME: 'Please come here',
  GO: 'I want to go',
  WAIT: 'Please wait',
  BYE: 'Goodbye',
  NAME: 'What is your name?',
  WHERE: 'Where is it?',
  WHEN: 'When?',
  HOW: 'How?',
  WHAT: 'What?',
  WHO: 'Who?',
  LOVE: 'I love you',
  NEED: 'I need something',
  WANT: 'I want something',
  MORE: 'I want more',
  DONE: 'I am done',
  HUNGRY: 'I am hungry',
  THIRSTY: 'I am thirsty',
  TIRED: 'I am tired',
  SICK: 'I feel sick',
  HAPPY: 'I am happy',
  SAD: 'I am sad',
  COLD: 'I am cold',
  HOT: 'I am hot',
  SLEEP: 'I want to sleep',
  REST: 'I need to rest',
  TOILET: 'I need to use the toilet',
  PHONE: 'Please give me my phone',
  FAMILY: 'Call my family',
  FRIEND: 'Call my friend',
};

export function wordToSentence(word: string): string {
  return WORD_SENTENCES[word.toUpperCase()] || word;
}

export function isEmergencyWord(word: string): boolean {
  const w = word.toUpperCase();
  return w === 'HELP' || w === 'SOS' || w === 'EMERGENCY';
}
