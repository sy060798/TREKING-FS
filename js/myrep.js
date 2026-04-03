let dataList = [], currentEditId = null, chart;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {

let upload = document.getElementById("upload");

if (upload) {

// FIX: reset value biar bisa upload file sama berulang
upload.addEventListener("click", () => {
upload.value = null;
});

// FIX: change pasti ke-trigger
upload.addEventListener("change", importExcel);

}

let checkAll = document.getElementById("checkAll");
if (checkAll) {
checkAll.addEventListener("change", e => {
document.querySelectorAll("#tableData tbody input[type=checkbox]")
.forEach(c => c.checked = e.target.checked);
});
}

});

// ================= TRIGGER UPLOAD =================
function triggerUpload(){
document.getElementById("upload").click();
}

// ================= IMPORT =================
function importExcel(e){

let file = e.target.files[0];

if (!file){
alert("file tidak ada");
return;
}

console.log("UPLOAD OK:", file.name); // DEBUG

let reader = new FileReader();

reader.onload = evt => {

try {

let wb = XLSX.read(evt.target.result, { type: 'binary' });

dataList = [];

wb.SheetNames.forEach(s => {

let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

console.log("Sheet:", s, json.length);

json.forEach(r => {

let stb = parseInt(r.STB) || 0;
let dpp = 200000 + stb * 50000;

dataList.push({
id: r.ID || Math.floor(Math.random() * 9999999),
wo: r.WO || "",
area: r.AREA || "",
wotype: r["WO TYPE"] || "",
stb: stb,
dpp: dpp,
amount: Math.round(dpp * 1.11),
remark: r.REMARK || "NOT PAID"
});

});

});

console.log("DATA MASUK:", dataList.length);

// FIX PENTING
renderTable();

} catch (err) {
console.error(err);
alert("gagal baca file");
}

};

// FIX penting → binary
reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderTable(){

let tbody = document.querySelector("#tableData tbody");
if (!tbody) return;

tbody.innerHTML = "";

if(dataList.length === 0){
tbody.innerHTML = `<tr><td colspan="11">Tidak ada data</td></tr>`;
return;
}

dataList.forEach((d,i)=>{
tbody.innerHTML += `
<tr>
<td>${i+1}</td>
<td><input type="checkbox" data-id="${d.id}"></td>
<td>${d.id}</td>
<td>${d.wo}</td>
<td>${d.area}</td>
<td>${d.wotype}</td>
<td>${d.stb}</td>
<td>${d.dpp}</td>
<td>${d.amount}</td>
<td>${d.remark}</td>
<td><button onclick="editData('${d.id}')">✏</button></td>
</tr>`;
});
}

// ================= SISANYA TIDAK DIUBAH =================
function showTab(tab){
document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
document.getElementById(tab).classList.add("active");
if(tab==="pivot") generatePivot();
}

function editData(id){
currentEditId=id;
let d=dataList.find(x=>String(x.id)==String(id));
if(!d) return;

edit_wo.value=d.wo;
edit_area.value=d.area;
edit_stb.value=d.stb;
edit_remark.value=d.remark;

modalEdit.style.display="flex";
}

function editMassal(){
let checked=[...document.querySelectorAll("#tableData tbody input:checked")];
if(checked.length===0) return alert("gunakan checkbox dulu");

currentEditId=checked.map(c=>String(c.dataset.id));
modalEdit.style.display="flex";
}

function saveEdit(){
if(Array.isArray(currentEditId)){
dataList.forEach(d=>{
if(currentEditId.includes(String(d.id))){
d.remark=edit_remark.value||d.remark;
}
});
}else{
let d=dataList.find(x=>String(x.id)==String(currentEditId));
if(!d) return;

d.wo=edit_wo.value;
d.area=edit_area.value;
d.stb=parseInt(edit_stb.value)||0;
d.dpp=200000+d.stb*50000;
d.amount=Math.round(d.dpp*1.11);
d.remark=edit_remark.value;
}
renderTable();
closeModal();
}

function hapusTerpilih(){
let ids=[...document.querySelectorAll("#tableData tbody input:checked")]
.map(c=>String(c.dataset.id));
dataList=dataList.filter(d=>!ids.includes(String(d.id)));
renderTable();
}

function exportExcel(){
if(dataList.length===0) return alert("data kosong");
let ws=XLSX.utils.json_to_sheet(dataList);
let wb=XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb,ws,"DATA");
XLSX.writeFile(wb,"data.xlsx");
}

function generatePivot(){
if(dataList.length===0) return alert("data kosong");
let g={};
dataList.forEach(d=>{
let key=d.area||"UNKNOWN";
g[key]=(g[key]||0)+d.amount;
});
if(chart) chart.destroy();
chart=new Chart(document.getElementById("chartPivot"),{
type:'bar',
data:{labels:Object.keys(g),datasets:[{label:"Total",data:Object.values(g)}]}
});
}

function cekUpdate(){alert("OK");}
function closeModal(){modalEdit.style.display="none";}
