// converter.js

// Function for format: "25":100.00; "49":50.00
export function parseMessageJSONStyle(raw, priceCellByNumber) {
    const updates = [];
    const pairs = raw.split(";").map(p => p.trim()).filter(p => p);
    pairs.forEach(p => {
      const match = p.match(/"(\d+)":\s*([\d.]+)/);
      if (match) {
        const num = match[1];
        const newPrice = parseFloat(match[2]);
        if (!isNaN(newPrice) && priceCellByNumber.has(num)) {
          updates.push({ num, newPrice });
        }
      }
    });
    return updates;
  }
  
  // Function for format: 20/100 15/100
  export function parseMessageSlashStyle(raw, priceCellByNumber) {
    const updates = [];
    const pairs = raw.split(/\s+/).map(p => p.trim()).filter(p => p);
    pairs.forEach(p => {
      const match = p.match(/^(\d{2,4})\/([\d.]+)$/); // supports 2–4 digit numbers
      if (match) {
        const num = match[1].padStart(match[1].length, "0"); 
        const newPrice = parseFloat(match[2]);
        if (!isNaN(newPrice) && priceCellByNumber.has(num)) {
          updates.push({ num, newPrice });
        }
      }
    });
    return updates;
  }
  

// Function for format: "67,,76,,08,,80,,07,,70,,,(125₹) 71,,32,,88,,,(50₹)"
export function parseMessageCommaPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split input by spaces → each message
  const messages = raw.split(/\s+/).filter(Boolean);

  messages.forEach(msg => {
    // Extract price (e.g., (125₹))
    const priceMatch = msg.match(/\((\d+(?:\.\d+)?)\s*₹?\)/);
    if (!priceMatch) return;
    const newPrice = parseFloat(priceMatch[1]);

    // Extract number part (before parentheses)
    const numberPart = msg.split("(")[0];
    const numbers = numberPart.split(",,").map(n => n.trim()).filter(n => n);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}

  

  // converter.js

// ... previous functions ...

// Function for format: "87*72*15*60*19*98*36 50_50_50_100_50_100_50"
export function parseMessageStarPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split into "numbers part" and "prices part"
  const match = raw.match(/^([\d*]+)\s+([\d_]+)$/);
  if (!match) return updates;

  const numberPart = match[1];
  const pricePart = match[2];

  // Extract arrays
  const numbers = numberPart.split("*").map(n => n.trim()).filter(n => n);
  const prices = pricePart.split("_").map(p => parseFloat(p.trim())).filter(p => !isNaN(p));

  // Ensure mapping is consistent
  if (numbers.length !== prices.length) {
    console.warn("Numbers and prices count mismatch:", numbers, prices);
    return updates;
  }

  numbers.forEach((num, idx) => {
    if (priceCellByNumber.has(num)) {
      updates.push({ num, newPrice: prices[idx] });
    }
  });

  return updates;
}

  
// Function for format: "32,22,99,78,68,59,95,77,46(40) 01,07,04(125) ..."
export function parseMessageCommaParenPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split into individual messages by space or newline
  const messages = raw.split(/\s+/).map(m => m.trim()).filter(m => m);

  messages.forEach(msg => {
    // Match: numbers inside first part, price inside ()
    const match = msg.match(/^([\d,]+)\((\d+(?:\.\d+)?)\)$/);
    if (!match) return;

    const numberPart = match[1];
    const newPrice = parseFloat(match[2]);

    const numbers = numberPart.split(",").map(n => n.trim()).filter(n => n);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}


  // Function for format: "28.82.rs200..15.51.rs50..888.8888.rs330"
export function parseMessageDotRsPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split into individual messages by `..`
  const messages = raw.split("..").map(m => m.trim()).filter(m => m);

  messages.forEach(msg => {
    // Match pattern: numbers.rsPRICE
    const match = msg.match(/^([\d.]+)\.?rs(\d+(?:\.\d+)?)$/i);
    if (!match) return;

    const numberPart = match[1];
    const newPrice = parseFloat(match[2]);

    // Extract numbers before "rs"
    const numbers = numberPart.split(".").map(n => n.trim()).filter(n => n);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}

// Function for format: "100,46,rs250 73,27,rs50 ..."
export function parseMessageCommaRsPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split messages by space
  const messages = raw.split(/\s+/).map(m => m.trim()).filter(m => m);

  messages.forEach(msg => {
    // Match "numbers,rsPRICE"
    const match = msg.match(/^([\d,]+),rs(\d+(?:\.\d+)?)$/i);
    if (!match) return;

    const numberPart = match[1];
    const newPrice = parseFloat(match[2]);

    // Extract numbers before "rs"
    const numbers = numberPart.split(",").map(n => n.trim()).filter(n => n);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}

// Function for format: "90/40/30/50/rs25 45/54/rs100"
export function parseMessageSlashRsPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split into messages by space
  const messages = raw.split(/\s+/).map(m => m.trim()).filter(m => m);

  messages.forEach(msg => {
    // Match "numbers/rsPRICE"
    const match = msg.match(/^([\d/]+)\/rs(\d+(?:\.\d+)?)$/i);
    if (!match) return;

    const numberPart = match[1];
    const newPrice = parseFloat(match[2]);

    // Extract numbers
    const numbers = numberPart.split("/").map(n => n.trim()).filter(n => n);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}

// Function for format: "15,51,77,ru,50,,59,75,79,ru,100,,..."
export function parseMessageCommaRuPriceStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split into groups by `,,`
  const groups = raw.split(",,").map(g => g.trim()).filter(g => g);

  groups.forEach(group => {
    // Match numbers + ru + price
    const match = group.match(/^([\d,]+),ru,(\d+(?:\.\d+)?)$/i);
    if (!match) return;

    const numberPart = match[1];
    const newPrice = parseFloat(match[2]);

    // Extract numbers before "ru"
    const numbers = numberPart.split(",").map(n => n.trim()).filter(n => n);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}

// 99,rs50 26,56,rs20 89,rs10 89,11,34,36,rs30
export function parseMessageNewStyle(raw, priceCellByNumber) {
  const updates = [];

  // Split by spaces to separate groups like "99,rs50"
  const groups = raw.split(/\s+/).filter(Boolean);

  groups.forEach(group => {
    // Match numbers and price (ending with rsXX)
    const match = group.match(/^([\d,]+),rs(\d+(?:\.\d+)?)/i);
    if (!match) return;

    const numbers = match[1].split(",").map(n => n.trim()).filter(Boolean);
    const newPrice = parseFloat(match[2]);

    numbers.forEach(num => {
      if (priceCellByNumber.has(num)) {
        updates.push({ num, newPrice });
      }
    });
  });

  return updates;
}
