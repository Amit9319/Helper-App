import { parseMessageJSONStyle, 
    parseMessageSlashStyle, 
    parseMessageCommaPriceStyle, 
    parseMessageStarPriceStyle, 
    parseMessageCommaParenPriceStyle, 
    parseMessageDotRsPriceStyle,
    parseMessageCommaRsPriceStyle,
    parseMessageSlashRsPriceStyle,
    parseMessageCommaRuPriceStyle,
    parseMessageNewStyle } from './converter.js';

const openPriceEl = document.getElementById("openPrice");
const finalTotalEl = document.getElementById("finalTotal");
const tBody = document.querySelector("#dataTable tbody");
const grandTotalEl = document.getElementById("grandTotal");
const numberInput = document.getElementById("numberInput");
const priceInput  = document.getElementById("priceInput");
const openInput   = document.getElementById("openNumber");
const headerDetails = document.getElementById("headerDetails");
const commissionEl = document.getElementById("commission");
const logList = document.getElementById("logList");




// Set default date = today
document.getElementById("date").valueAsDate = new Date();
document.getElementById("clearLogBtn").addEventListener("click", () => {
logList.innerHTML = "";
});

// Map number "00".."99" -> price TD element
const priceCellByNumber = new Map();

// History stack for Undo: items = {num, prev, next}
const historyStack = [];

// ====== Build 20 rows × 5 pairs (00–99) ======
function buildTable(section, numbers) {
for (let r = 0; r < Math.ceil(numbers.length / 5); r++) {
const row = document.createElement("tr");
for (let c = 0; c < 5; c++) {
const idx = r + c * Math.ceil(numbers.length / 5);
if (idx >= numbers.length) continue;

const nn = numbers[idx];

const numTd = document.createElement("td");
numTd.textContent = nn;
numTd.className = "num-cell";

const priceTd = document.createElement("td");
priceTd.textContent = "XX";
priceTd.className = "price-cell price-empty";
priceTd.dataset.num = nn;

priceCellByNumber.set(nn, priceTd);

row.appendChild(numTd);
row.appendChild(priceTd);
}
section.appendChild(row);
}
}

// Build sections
buildTable(tBody, Array.from({length:100}, (_,i)=>String(i).padStart(2,"0")));   // 00–99
buildTable(tBody, Array.from({length:10}, (_,i)=>(i*111).toString().padStart(3,"0"))); // 000–999 multiples of 111
buildTable(tBody, Array.from({length:10}, (_,i)=>(i*1111).toString().padStart(4,"0"))); // 0000–9999 multiples of 1111


// ====== Helpers ======
function updateHeaderLine(){
const name = document.getElementById("name").value || "N/A";
const date = document.getElementById("date").value || "—";
const type = document.getElementById("type").value || "—";
const open = openInput.value !== "" ? String(openInput.value).padStart(2,"0") : "None";
headerDetails.innerHTML = `<b>Name:</b> ${name} &nbsp; | &nbsp; 
                       <b>Date:</b> ${date} &nbsp; | &nbsp; 
                       <b>GHAR:</b> ${type} &nbsp; | &nbsp; 
                       <b>Open:</b> ${open}
                       <span style="
                       display:inline-block; 
                       width:15px; 
                       height:15px; 
                       border-radius:50%; 
                       margin-left:6px; 
                       vertical-align:middle; 
                       background:#7f1d1d;
                     "></span>`;
}

function recalcTotal() {
let sum = 0;
for (const td of priceCellByNumber.values()) {
 const v = td.textContent.trim();
 if (v !== "XX" && v !== "" && !isNaN(v)) sum += parseFloat(v);
}
grandTotalEl.textContent = sum.toFixed(2);

// Update commission
const commission = sum * 0.10;
commissionEl.textContent = commission.toFixed(2);

updateFinalTotal(openInput.value.padStart(2, "0")); // keep totals synced
generateTextRepresentation();
}

function generateTextRepresentation() {
 let parts = [];
 for (const [num, td] of priceCellByNumber.entries()) {
   const val = td.textContent.trim();
   if (val !== "XX" && val !== "" && !isNaN(val)) {
     parts.push(`"${num}":${val}`);
   }
 }
 document.getElementById("textRepresentation").textContent = parts.join("; ");
}


function clearHighlights(){
document.querySelectorAll("#dataTable tbody tr").forEach(tr => tr.classList.remove("highlight-row"));
}

function isValidNumber(numStr) {
// 2-digit 00–99
if (/^\d{2}$/.test(numStr) && Number(numStr) >= 0 && Number(numStr) <= 99) {
 return true;
}

// 3-digit multiples of 111
if (/^\d{3}$/.test(numStr) && Number(numStr) % 111 === 0 && Number(numStr) <= 999) {
 return true;
}

// 4-digit multiples of 1111
if (/^\d{4}$/.test(numStr) && Number(numStr) % 1111 === 0 && Number(numStr) <= 9999) {
 return true;
}

return false;
}

// ====== Actions ======
function addEntry(){
const rawNum = numberInput.value.trim();
const rawPrice = priceInput.value;
const priceVal = parseFloat(rawPrice);

if (!isValidNumber(rawNum) || isNaN(priceVal)) {
alert("Please enter a valid Number (00–99, 000–999 multiples of 111, or 0000–9999 multiples of 1111) and Price.");
return;
}

const num = rawNum; // <-- keep exact format (00, 000, 0000)
const td = priceCellByNumber.get(num);

if (!td) {
alert("This number is not in the table.");
return;
}

const prev = td.textContent.trim();
const next = prev === "XX" ? priceVal : (parseFloat(prev) + priceVal);

td.textContent = Number(next).toFixed(2);
td.classList.remove("price-empty");
td.classList.add("highlit-row");
const numCell = td.previousElementSibling; 
if (numCell) numCell.classList.add("highlit-row");

// push to history for undo
historyStack.push({num, prev, next: td.textContent});

recalcTotal();
addLog(`Added ${num} = ${priceVal.toFixed(2)}`);

numberInput.value = "";
priceInput.value = "";
numberInput.focus();
setTimeout(()=>td.classList.remove("flash"), 900);
}

function undoLast(){
const last = historyStack.pop();
if (!last) return;
const td = priceCellByNumber.get(last.num);
td.textContent = last.prev;
if (last.prev === "XX") td.classList.add("price-empty");
else td.classList.remove("price-empty");
recalcTotal();
}

function addLog(message) {
const time = new Date().toLocaleTimeString();
const div = document.createElement("div");
div.textContent = `[${time}] ${message}`;
logList.prepend(div); // newest on top
}

function resetAll(){
if (!confirm("Reset all prices to XX? This cannot be undone.")) return;
for (const td of priceCellByNumber.values()){
td.textContent = "XX";
td.classList.add("price-empty");
}
historyStack.length = 0;
recalcTotal();
}

function highlightOpen() {
clearHighlights();
const val = openInput.value;
if (val === "" || isNaN(val)) {
 updateHeaderLine();
 updateFinalTotal(); // reset totals if nothing selected
 return;
}
const num = String(Math.floor(Number(val))).padStart(2, "0");

for (const tr of tBody.rows) {
 for (let i = 0; i < tr.cells.length; i += 2) {
   if (tr.cells[i].textContent === num) {
     tr.cells[i].classList.add("highlight-row");       // number cell
     tr.cells[i + 1].classList.add("highlight-row");

     updateHeaderLine();
     updateFinalTotal(num); // calculate with highlighted number
     return;
   }
 }
}
updateHeaderLine();
updateFinalTotal();
}

function updateFinalTotal(highlightedNum) {
 const grand = parseFloat(grandTotalEl.textContent) || 0;
 let openCalc = 0;

 // 1. Base calculation for highlighted number
 if (highlightedNum && priceCellByNumber.has(highlightedNum)) {
   const td = priceCellByNumber.get(highlightedNum);
   const priceVal = parseFloat(td.textContent);
   if (!isNaN(priceVal)) {
     openCalc = priceVal * 90;
   }
 }

 const hNumStr = String(highlightedNum).padStart(2, "0"); // ensure at least 2 digits
 const unitDigit = Number(hNumStr[hNumStr.length - 1]);   // last digit
 const tensDigit = Number(hNumStr[hNumStr.length - 2]);   // second last digit (tens place)

 // Extra calculation for multiples of 111 and 1111
 for (const num of priceCellByNumber.keys()) {
   if (/^\d{3}$/.test(num) && Number(num) % 111 === 0) {
     // 3-digit multiples: match unit digit
     const digit = Number(num[0]); // repeating digit
     if (digit === unitDigit) {
       const td = priceCellByNumber.get(num);
       const priceVal = parseFloat(td.textContent);
       if (!isNaN(priceVal)) {
         openCalc += priceVal * 9.090909;
       }
     }
   } else if (/^\d{4}$/.test(num) && Number(num) % 1111 === 0) {
     // 4-digit multiples: match tens digit
     const digit = Number(num[0]); // repeating digit
     if (digit === tensDigit) {
       const td = priceCellByNumber.get(num);
       const priceVal = parseFloat(td.textContent);
       if (!isNaN(priceVal)) {
         openCalc += priceVal * 9.090909;
       }
     }
   }
 }



 // 3. Update UI
 openPriceEl.textContent = openCalc.toFixed(2);

 const final = grand - openCalc;
 finalTotalEl.textContent = final.toFixed(2);

 // color coding
 finalTotalEl.style.color = final < 0 ? "red" : "green";
}

// ====== Bulk Message Update ======
let lastMessageSnapshot = null;

function applyUpdates(updates) {
// Save snapshot
lastMessageSnapshot = {};
for (const [num, td] of priceCellByNumber.entries()) {
lastMessageSnapshot[num] = td.textContent;
}

updates.forEach(({ num, newPrice }) => {
const td = priceCellByNumber.get(num);
if (td) {
let currentVal = td.textContent.trim();
let currentNum = (currentVal !== "XX" && !isNaN(currentVal)) ? parseFloat(currentVal) : 0;
let updatedVal = currentNum + newPrice;

td.textContent = updatedVal.toFixed(2);
td.classList.remove("price-empty");
td.classList.add("flash");
setTimeout(() => td.classList.remove("flash"), 900);
addLog(`Updated ${num} = ${newPrice.toFixed(2)} `);
}
});

recalcTotal();
// addLog(`Added ${num} = ${priceVal.toFixed(2)}`);

}

function updateTableFromMessage() {
const raw = document.getElementById("messageInput").value.trim();
if (!raw) {
alert("Paste a message first.");
return;
}

// Detect format
let updates = [];
if (raw.includes(":")) {
updates = parseMessageJSONStyle(raw, priceCellByNumber);
} else if(raw.includes("/") && raw.includes("rs")){
updates = parseMessageSlashRsPriceStyle(raw, priceCellByNumber);
} else if (raw.includes("/")) {
updates = parseMessageSlashStyle(raw, priceCellByNumber);
} else if (raw.includes("₹") && raw.includes(",,")) {
updates = parseMessageCommaPriceStyle(raw, priceCellByNumber);
} else if (raw.includes("ru") && raw.includes(",,")) {
updates = parseMessageCommaRuPriceStyle(raw, priceCellByNumber);
} else if (raw.includes("*")) {
updates = parseMessageStarPriceStyle(raw, priceCellByNumber);
} else if(raw.includes(",") && raw.includes("rs")){
updates = parseMessageCommaRsPriceStyle(raw, priceCellByNumber);
} else if (raw.includes(",")){
updates = parseMessageCommaParenPriceStyle(raw, priceCellByNumber);
} else if (raw.includes(".") && raw.includes("rs")) {
updates = parseMessageDotRsPriceStyle(raw, priceCellByNumber);
} else if (raw.includes(",rs")) {
updates = parseMessageNewStyle(raw, priceCellByNumber);
} else {
alert("❌ Invalid message format. Please check your input.");
return; // stop execution
}

applyUpdates(updates);
}

function undoMessageUpdate() {
if (!lastMessageSnapshot) {
alert("No message update to undo.");
return;
}
for (const [num, val] of Object.entries(lastMessageSnapshot)) {
const td = priceCellByNumber.get(num);
if (td) {
td.textContent = val;
if (val === "XX") td.classList.add("price-empty");
else td.classList.remove("price-empty");
}
}
recalcTotal();
lastMessageSnapshot = null;
}



// ====== Hook up buttons ======
document.getElementById("updateFromMessageBtn").addEventListener("click", updateTableFromMessage);
document.getElementById("undoMessageUpdateBtn").addEventListener("click", undoMessageUpdate);


function downloadPDF() {
updateHeaderLine();
const el = document.getElementById("pdfContent");

const opt = {
margin:       10,
filename:     'Number_Price_Table.pdf',
image:        { type: 'jpeg', quality: 0.98 },
html2canvas:  { scale: 2, useCORS: true, scrollY: 0 }, 
jsPDF:        { unit: 'pt', format: 'a4', orientation: 'landscape' },
pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
};

html2pdf()
.set(opt)
.from(el)
.toPdf()
.get('pdf')
.then(function (pdf) {
const pageWidth  = pdf.internal.pageSize.getWidth();
const pageHeight = pdf.internal.pageSize.getHeight();

// Get element width/height
const elWidth  = el.scrollWidth;
const elHeight = el.scrollHeight;

// Calculate scale factor so content fits in one page
const scaleX = pageWidth / elWidth;
const scaleY = pageHeight / elHeight;
const scale = Math.min(scaleX, scaleY);

pdf.internal.scaleFactor = 1 / scale; // force scaling
})
.save();
}


// ====== Events ======
document.getElementById("addBtn").addEventListener("click", addEntry);
document.getElementById("undoBtn").addEventListener("click", undoLast);
document.getElementById("resetBtn").addEventListener("click", resetAll);
document.getElementById("highlightBtn").addEventListener("click", highlightOpen);
document.getElementById("downloadBtn").addEventListener("click", downloadPDF);

// Enter key submits Add
function enterToAdd(e){
if (e.key === "Enter"){
e.preventDefault();
addEntry();
}
}
numberInput.addEventListener("keydown", enterToAdd);
priceInput.addEventListener("keydown", enterToAdd);

// Keep header line live
document.getElementById("name").addEventListener("input", updateHeaderLine);
document.getElementById("date").addEventListener("input", updateHeaderLine);
document.getElementById("type").addEventListener("change", updateHeaderLine);
openInput.addEventListener("input", updateHeaderLine);

// initial header
updateHeaderLine();