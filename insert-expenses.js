// insert-expenses.js - Insert all expense data for אדיר ניסים סבן
const BASE_URL = 'https://finance-production-3ea8.up.railway.app';
const USERNAME = 'אדיר ניסים סבן';
const PASSWORD = 'Adirs5566';

// Day of week constants (JS: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)
const SUN=0,MON=1,TUE=2,WED=3,THU=4,FRI=5,SAT=6;

// All daily entries in chronological order: [dayOfWeek, amount]
const allEntries = [
  // === Section 1: December 2024 ===
  [WED,450],[THU,670],[SAT,15],[SUN,60],[MON,270],[TUE,100],[WED,15],[THU,130],
  [FRI,35],[SAT,100],[SUN,50],[MON,80],[TUE,20],[WED,60],[THU,120],[FRI,60],
  [SUN,70],[MON,60],[TUE,390],[WED,960],[THU,80],[SUN,215],[MON,20],[TUE,60],
  [WED,190],[THU,180],[FRI,340],[SAT,10],

  // === Section 2: Unnamed month (Jan 2025 cont.) ===
  [SUN,76],[MON,125],[TUE,90],[WED,45],[THU,150],[FRI,0],[SAT,30],[SUN,10],
  [MON,130],[TUE,100],[WED,0],[THU,2850],[FRI,20],[SAT,220],[SUN,0],[MON,0],
  [TUE,65],[WED,30],[THU,0],[FRI,140],[SAT,260],[SUN,6],[MON,0],[TUE,200],
  [WED,0],[THU,250],[FRI,60],[SAT,250],[SUN,200],[MON,5],[TUE,200],

  // === Section 3: "January" labeled ===
  [WED,200],[THU,230],[FRI,60],[SUN,90],[MON,30],[TUE,35],[WED,335],[THU,80],
  [FRI,50],[SAT,150],[SUN,60],[MON,15],[TUE,30],[WED,15],[THU,35],[FRI,150],
  [SAT,0],[SUN,210],[MON,110],[TUE,73],[WED,85],[THU,78],[FRI,100],[SAT,90],
  [SUN,0],[MON,30],[TUE,33],[WED,400],

  // === Section 4: "February" labeled ===
  [SAT,200],[SUN,9],[MON,50],[TUE,90],[WED,6],[THU,170],[FRI,234],[SAT,0],
  [SUN,278],[MON,0],[TUE,110],[WED,100],[THU,1080],[FRI,256],[SAT,0],[SUN,0],
  [MON,50],[TUE,36],[WED,100],[THU,0],[FRI,150],[SAT,200],[SUN,0],[MON,90],

  // === Section 5: "March" labeled ===
  [THU,830],[FRI,300],[SAT,0],[SUN,0],[MON,35],[TUE,290],[WED,70],[THU,300],
  [FRI,20],[SAT,100],[SUN,14],[MON,0],[TUE,530],[WED,1100],[THU,30],[FRI,480],
  [SAT,0],[SUN,275],[MON,0],

  // === Section 6: "April" labeled ===
  [TUE,20],[WED,27],[THU,630],[FRI,50],[SAT,40],[SUN,0],[MON,40],[TUE,460],
  [WED,320],[THU,180],[FRI,180],[SAT,50],[MON,200],[TUE,770],[WED,10],[THU,70],
  [SUN,40],[MON,0],[TUE,40],[WED,250],[THU,60],[FRI,140],[SAT,0],[SUN,50],
  [MON,70],[TUE,220],

  // === Section 7: "May" labeled ===
  [WED,250],[THU,150],[FRI,0],[SAT,0],[SUN,50],[MON,90],[TUE,0],[WED,200],
  [THU,0],[FRI,90],[SAT,0],[SUN,0],[MON,50],[TUE,80],[WED,25],[THU,150],
  [FRI,325],[SAT,0],[SUN,110],[MON,0],[TUE,70],[WED,150],[THU,350],[FRI,80],
  [SAT,163],[SUN,270],[MON,110],[TUE,40],[WED,0],[THU,200],[FRI,500],

  // === Section 8: "June" labeled ===
  [FRI,300],[SAT,0],[SUN,170],[MON,150],[TUE,35],[WED,180],[THU,210],[FRI,220],
  [SAT,200],[SUN,80],[MON,0],[TUE,545],[WED,0],[THU,105],[FRI,100],[SAT,0],
  [SUN,350],[MON,30],[TUE,18],[WED,250],[THU,30],[FRI,130],[SAT,0],[SUN,0],
  [MON,0],[TUE,40],[WED,830],[THU,120],[FRI,50],[SAT,270],[SUN,270],[MON,45],
  [TUE,110],

  // === Section 9: "July" labeled ===
  [TUE,110],[WED,80],[THU,0],[FRI,0],[SAT,0],[SUN,540],[MON,35],[TUE,300],
  [WED,350],[THU,27],[FRI,80],[SAT,0],[SUN,10],[MON,6],[TUE,36],[WED,225],
  [THU,30],[FRI,180],[SUN,520],[MON,0],[TUE,70],[WED,0],[THU,140],[FRI,520],
  [SAT,0],[SUN,22],[MON,0],[TUE,370],[WED,0],[THU,0],

  // === Section 10: "August" labeled ===
  [FRI,360],[SAT,0],[SUN,0],[MON,0],[TUE,130],[WED,65],[THU,100],[FRI,575],
  [SAT,115],[SUN,230],[MON,0],[TUE,65],[WED,445],[THU,150],[FRI,50],[SAT,0],
  [SUN,350],[MON,0],[TUE,40],[WED,300],[THU,530],[FRI,0],[SAT,0],[SUN,0],
  [MON,20],[TUE,80],[WED,770],[THU,0],[FRI,0],[SAT,180],

  // === Section 11: "September" labeled ===
  [MON,440],[TUE,110],[WED,110],[THU,55],[FRI,150],[SAT,0],[SUN,5],[MON,31],
  [TUE,300],[WED,110],[THU,0],[FRI,0],[SAT,0],[SUN,15],[MON,80],[TUE,0],
  [MON,100],[TUE,0],[WED,320],[THU,25],[FRI,100],[SAT,30],[SUN,20],[MON,45],
  [TUE,135],

  // === Section 12: "October" labeled ===
  [WED,200],[THU,20],[FRI,930],[SAT,880],[SUN,500],[MON,60],[TUE,40],[WED,100],
  [THU,0],[FRI,0],[SAT,0],[SUN,200],[MON,0],[TUE,0],[WED,125],[THU,245],
  [FRI,80],[SAT,290],[SUN,80],[MON,500],[TUE,6],[WED,570],[THU,40],[FRI,330],
  [SAT,0],[SUN,209],[MON,20],[TUE,5],[WED,30],

  // === Section 13: "November" labeled ===
  [THU,80],[FRI,320],[SAT,230],[SUN,0],[MON,0],[TUE,0],[WED,0],[THU,450],
  [FRI,150],[SAT,0],[SUN,20],[MON,15],[TUE,0],[WED,517],[THU,235],[FRI,80],
  [SAT,145],[SUN,210],[MON,1060],[TUE,80],[WED,23],[THU,100],[FRI,100],[SAT,0],
  [SUN,35],[MON,0],[TUE,70],[WED,40],[THU,210],[FRI,110],[SAT,0],[SUN,0],

  // === Section 14: "December 2025" labeled ===
  [MON,50],[TUE,15],[WED,0],[THU,680],[FRI,0],[SAT,165],[SUN,200],[MON,220],
  [TUE,130],[WED,210],[THU,280],[FRI,220],[SAT,0],[SUN,108],[MON,100],[TUE,0],
  [WED,160],[THU,70],[FRI,290],[SAT,10],[SUN,90],[MON,37],[TUE,70],[WED,0],
  [THU,40],[FRI,80],[SAT,65],[SUN,0],

  // === Section 15: "January 2026" labeled ===
  [TUE,250],[WED,0],[THU,120],[FRI,150],[SAT,100],[SUN,84],[MON,100],[TUE,250],
  [WED,0],[THU,150],[FRI,540],[SAT,0],[SUN,0],[MON,117],[TUE,216],[WED,0],
  [THU,182],[FRI,220],[SAT,0],[SUN,36],[MON,0],[TUE,0],[WED,0],[THU,315],
  [FRI,180],[SAT,350],[SUN,60],[MON,0],[TUE,40],[WED,550],

  // === Section 16: "February 2026" labeled ===
  [THU,200],[FRI,150],[SAT,0],[SUN,335],[MON,283],[TUE,100],[WED,1010],[THU,70],
  [FRI,0],[SAT,0],[SUN,0],[MON,0],[TUE,120],[WED,230],[THU,365],[FRI,12],
  [SAT,550],[SUN,0],[MON,40],[TUE,157],[WED,0],[THU,360],[FRI,216],[SAT,50],
  [SUN,35],[MON,0],[TUE,20],[WED,20],[THU,80],

  // === Section 17: "March 2026" labeled ===
  [FRI,945],[SAT,0],[SUN,310],[MON,985],[TUE,607],[WED,0],[THU,17],[FRI,0],
  [SAT,0],[SUN,7],[MON,0],[TUE,155],[WED,85],[THU,250],[FRI,0],[SAT,5],[SUN,25],
];

// Special/one-time expenses: [date string YYYY-MM-DD, amount, category, description]
// These will be computed after date assignment
const specialExpenses = [];

// === DATE ASSIGNMENT ===
// Last entry = March 15, 2026 (Sunday)
// Algorithm: work backwards, each entry gets the most recent matching weekday before the next entry's date

function assignDates(entries) {
  const dates = new Array(entries.length);
  const lastDate = new Date(2026, 2, 15); // Mar 15, 2026
  dates[entries.length - 1] = new Date(lastDate);

  // Verify last entry is Sunday
  if (lastDate.getDay() !== entries[entries.length - 1][0]) {
    console.error('ERROR: Last entry day mismatch! Expected', entries[entries.length - 1][0], 'got', lastDate.getDay());
    process.exit(1);
  }

  // Work backwards
  for (let i = entries.length - 2; i >= 0; i--) {
    const targetDay = entries[i][0];
    const nextDate = new Date(dates[i + 1]);
    // Go back at least 1 day
    const d = new Date(nextDate);
    d.setDate(d.getDate() - 1);
    // Find the most recent matching weekday
    while (d.getDay() !== targetDay) {
      d.setDate(d.getDate() - 1);
    }
    dates[i] = new Date(d);
  }

  return dates;
}

function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login() {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  console.log(`Logged in as user ID: ${data.user.id}`);
  return data.token;
}

async function createExpense(token, date, amount, category, description) {
  const res = await fetch(`${BASE_URL}/api/expenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ date, amount, category, description })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create expense failed (${res.status}): ${text}`);
  }
  return await res.json();
}

async function main() {
  console.log('Assigning dates to entries...');
  const dates = assignDates(allEntries);

  // Print first and last dates for verification
  console.log(`First entry: ${formatDate(dates[0])} (${dayNames[dates[0].getDay()]})`);
  console.log(`Last entry: ${formatDate(dates[dates.length - 1])} (${dayNames[dates[dates.length - 1].getDay()]})`);
  console.log(`Total entries: ${allEntries.length}`);

  // Verify all dates match their expected day of week
  let mismatches = 0;
  for (let i = 0; i < allEntries.length; i++) {
    if (dates[i].getDay() !== allEntries[i][0]) {
      console.error(`MISMATCH at index ${i}: expected day ${allEntries[i][0]}, got ${dates[i].getDay()} (${formatDate(dates[i])})`);
      mismatches++;
    }
  }
  if (mismatches > 0) {
    console.error(`${mismatches} date mismatches found! Aborting.`);
    process.exit(1);
  }
  console.log('All dates verified successfully!');

  // Filter out zero-amount entries
  const nonZeroEntries = [];
  for (let i = 0; i < allEntries.length; i++) {
    if (allEntries[i][1] > 0) {
      nonZeroEntries.push({ date: formatDate(dates[i]), amount: allEntries[i][1], day: dayNames[dates[i].getDay()] });
    }
  }
  console.log(`Non-zero entries to insert: ${nonZeroEntries.length}`);

  // Add special expenses
  // Find specific dates for special expenses based on nearby entries
  // September section special expenses (around Oct 2025)
  // Find the date for section 11, entry index for שישי 0 (the one with 900+960 note)
  // Section 11 starts at index: 28+31+28+24+19+26+31+33+30+30 = 280
  // The שישי 0 in section 11 is at offset 11 (index 291)
  const sepSpecialDate = formatDate(dates[280 + 11]); // שישי 0 with course note
  const sepEndDate = formatDate(dates[280 + 24]); // last entry of section 11

  // November section special (2000 לימודים) - near ראשון 20
  // Section 13 starts at index: 280+25+29 = 334
  // ראשון 20 is at offset 10 (index 344)
  const novStudyDate = formatDate(dates[334 + 10]);

  // December 2025 section special (950 לימודים) - near שלישי 0
  // Section 14 starts at index: 334+32 = 366
  // שלישי 0 is at offset 15 (index 381)
  const decStudyDate = formatDate(dates[366 + 15]);

  // February 2026 section special expenses
  // Section 16 starts at index: 366+28+30 = 424
  // Last entry at index 424+28 = 452
  const febSpecialDate = formatDate(dates[452]);

  const specials = [
    { date: sepSpecialDate, amount: 960, category: 'קורס', description: 'קורס - ספטמבר' },
    { date: sepSpecialDate, amount: 900, category: 'חופשה', description: 'חול - ספטמבר' },
    { date: sepEndDate, amount: 7050, category: 'חופשה', description: 'לימסול - ספטמבר' },
    { date: sepEndDate, amount: 2650, category: 'אירועים', description: 'יום הולדת - ספטמבר' },
    { date: novStudyDate, amount: 2000, category: 'לימודים', description: 'לימודים - נובמבר' },
    { date: decStudyDate, amount: 950, category: 'לימודים', description: 'לימודים - דצמבר' },
    { date: febSpecialDate, amount: 140, category: 'אחר', description: 'הרב - פברואר' },
    { date: febSpecialDate, amount: 200, category: 'משפחה', description: 'אבא - פברואר' },
    { date: febSpecialDate, amount: 1260, category: 'לימודים', description: 'לימודים (300+960) - פברואר' },
    { date: febSpecialDate, amount: 4250, category: 'טיסות', description: 'טיסות (3100+1150) - פברואר' },
  ];

  // Login
  console.log('\nLogging in...');
  let token;
  try {
    token = await login();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  // Insert daily expenses
  console.log('\nInserting daily expenses...');
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < nonZeroEntries.length; i++) {
    const entry = nonZeroEntries[i];
    try {
      await createExpense(token, entry.date, entry.amount, 'כללי', `הוצאה יומית - ${entry.day}`);
      inserted++;
      if (inserted % 50 === 0) {
        console.log(`  Inserted ${inserted}/${nonZeroEntries.length} daily expenses...`);
      }
      // Small delay to avoid overwhelming the server
      await sleep(100);
    } catch (e) {
      console.error(`  Failed to insert expense for ${entry.date} (${entry.amount}): ${e.message}`);
      failed++;
      await sleep(500);
    }
  }

  console.log(`\nDaily expenses done: ${inserted} inserted, ${failed} failed`);

  // Insert special expenses
  console.log('\nInserting special expenses...');
  for (const spec of specials) {
    try {
      await createExpense(token, spec.date, spec.amount, spec.category, spec.description);
      console.log(`  Inserted special: ${spec.description} (${spec.amount})`);
      await sleep(100);
    } catch (e) {
      console.error(`  Failed special: ${spec.description}: ${e.message}`);
    }
  }

  console.log('\nAll done!');
}

main().catch(console.error);
