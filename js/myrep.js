// ================= GLOBAL =================
let dataList = [];
let currentEditId = null;

const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// ================= HARGA AREA =================
function getHarga(area){
  if(!area) return 200000;
  let a = area.toLowerCase();
  if(a.includes("purwakarta")) return 280000;
  if(a.includes("sidoarjo")) return 280000;
  if(a.includes("surabaya")) return 280000;
  if(a.includes("pamatang siantar")) return 245000;
  if(a.includes("deli serdang")) return 260000;
  if(a.includes("south fo")) return 300000;
  return 200000;
}

// ================= TAB =================
function showTab(tabId) {
  document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');

  if (tabId === "pivot") {
    loadFilter();
    setTimeout(generatePivot, 200);
  }
}

document.addEventListener("DOMContentLoaded", function(){
  showTab('data');
});

// ================= INIT =================
document.addEventListener("DOMContentLoaded", function(){
  window.edit_wo = document.getElementById("edit_wo");
  window.edit_area = document.getElementById("edit_area");
  window.edit_stb = document.getElementById("edit_stb");
  window.edit_remark = document.getElementById("edit_remark");
  window.modalEdit = document.getElementById("modalEdit");

  let upload = document.getElementById("upload");
  if(upload){
    upload.addEventListener("click", ()=>upload.value=null);
    upload.addEventListener("change", importExcel);
  }

  document.getElementById("checkAll")?.addEventListener("change", function(e){
    document.querySelectorAll("#tableData tbody input[type=checkbox]")
    .forEach(c => c.checked = e.target.checked);
  });
});

// ================= IMPORT =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file){ alert("File tidak ada"); return; }

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});
    let duplicateCount = 0;

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{
        let woBaru = (r.WO || "").trim();
        let areaBaru = (r.AREA || "").trim();
        let bulanBaru = (r.MONTH || "").trim();

        let sudahAda = dataList.some(d =>
          d.wo === woBaru && d.area === areaBaru && d.month === bulanBaru
        );

        if(sudahAda){ duplicateCount++; return; }

        let stb = parseInt(r.STB)||0;
        let harga = getHarga(areaBaru);
        let dpp = harga + (stb*50000);

        dataList.push({
          id: r.ID||Date.now()+Math.random(),
          wo: woBaru,
          area: areaBaru,
          wotype: r["WO TYPE"]||"",
          tahun: r.TAHUN||"",
          month: bulanBaru,
          tanggal: r.TANGGALPENGERJAAN||"",
          stb: stb,
          dpp: dpp,
          amount: Math.round(dpp*1.11),
          remark: "NOT PAID",
          note: "", // 🔥 TAMBAHAN NOTE
          server: "-"
        });

      });
    });

    if(duplicateCount>0) alert(duplicateCount+" data duplikat tidak dimasukkan");

    renderTable();
    loadFilter();
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderTable(){
  let tbody = document.querySelector("#tableData tbody");
  tbody.innerHTML = "";

  if(dataList.length===0){
    tbody.innerHTML=`<tr><td colspan="15">Tidak ada data</td></tr>`;
    return;
  }

  dataList.forEach((d,i)=>{
    let tr = document.createElement("tr");

    tr.innerHTML=`
      <td>${i+1}</td>
      <td><input type="checkbox" data-id="${d.id}"></td>
      <td>${d.id}</td>
      <td>${d.wo}</td>
      <td>${formatTanggalExcel(d.tanggal)}</td>
      <td>${d.month || "-"}</td>
      <td>${d.area}</td>
      <td>${d.wotype}</td>
      <td>${d.stb}</td>
      <td>${d.dpp}</td>
      <td>${d.amount}</td>
      <td>${d.remark}</td>

      <!-- 🔥 NOTE BISA DIKETIK -->
      <td>
        <input 
          value="${d.note || ""}" 
          oninput="updateNote('${d.id}', this.value)"
          style="width:140px;background:#111;color:white;border:1px solid #555;"
        >
      </td>

      <td>${d.server}</td>
      <td><button onclick="editData('${d.id}')">✏</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// ================= UPDATE NOTE =================
function updateNote(id, value){
  let d = dataList.find(x=>String(x.id)===String(id));
  if(d){
    d.note = value;
  }
}

// ================= EDIT =================
function editData(id){
  currentEditId=id;
  let d = dataList.find(x=>String(x.id)===String(id));
  if(!d) return;

  edit_wo.value=d.wo;
  edit_area.value=d.area;
  edit_stb.value=d.stb;
  edit_remark.value=d.remark;

  modalEdit.style.display="flex";
}

function saveEdit(){
  let d=dataList.find(x=>String(x.id)===String(currentEditId));
  if(!d) return;

  d.wo=edit_wo.value;
  d.area=edit_area.value;
  d.stb=parseInt(edit_stb.value)||0;

  let harga=getHarga(d.area);
  d.dpp=harga+(d.stb*50000);
  d.amount=Math.round(d.dpp*1.11);
  d.remark=edit_remark.value;

  renderTable();
  closeModal();
}

function closeModal(){
  modalEdit.style.display="none";
  currentEditId=null;
}

// ================= EDIT MASSAL =================
function editMassal(){
  let checked=[...document.querySelectorAll("#tableData tbody input:checked")];
  if(checked.length===0){ alert("Pilih data dulu"); return; }
  currentEditId=checked.map(c=>String(c.dataset.id));
  modalEdit.style.display="flex";
}


// ================= HAPUS =================
async function hapusTerpilih(){
  let ids=[...document.querySelectorAll("#tableData tbody input:checked")]
    .map(c=>String(c.dataset.id));

  dataList = dataList.filter(d=>!ids.includes(String(d.id)));

  try{
    await fetch(`${SERVER_URL}/api/delete`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(ids)
    });
  }catch(err){
    console.log("server delete error");
  }

  renderTable();
}


// ================= EXPORT =================
function formatTanggalExcel(serial){
  if(!serial) return "-";

  // kalau sudah format tanggal
  if(typeof serial === "string" && serial.includes("-")){
    return serial;
  }

  let utc_days  = Math.floor(serial - 25569);
  let utc_value = utc_days * 86400;
  let date_info = new Date(utc_value * 1000);

  let dd = String(date_info.getDate()).padStart(2, '0');
  let mm = String(date_info.getMonth() + 1).padStart(2, '0');
  let yyyy = date_info.getFullYear();

  return `${dd}-${mm}-${yyyy}`;
}
function exportExcel(){
  if(dataList.length===0){ alert("Data kosong"); return; }
  let ws=XLSX.utils.json_to_sheet(dataList);
  let wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,"DATA");
  XLSX.writeFile(wb,"data.xlsx");
}



// ================= SERVER =================
async function kirimKeServer(){
  if(dataList.length===0){ 
    alert("Data kosong"); 
    return; 
  }

  dataList = dataList.flat();

  try{
    let res = await fetch(`${SERVER_URL}/api/save`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify(dataList)
    });

    let text = await res.text(); // 🔥 penting
    console.log("RESPONSE SERVER:", text);

    if(!res.ok){
      throw new Error("Server error: " + text);
    }

    dataList.forEach(d=>d.server="✔ terkirim");
    renderTable();
    loadFilter();
    generatePivot();

    alert("Berhasil kirim ke server");

  }catch(err){
    console.error("DETAIL ERROR:", err);
    alert("Gagal kirim ke server\n" + err.message);
  }
}

// ================= AUTO LOAD =================
window.addEventListener("load",async function(){
  try{
    let res=await fetch(`${SERVER_URL}/api/get`);
    let json=await res.json();

    dataList = json.map(d=>({
      ...d,
      note: d.note || "" // 🔥 pastikan note ada
    }));

    dataList.forEach(d=>d.server="✔ dari server");

    renderTable();

  }catch(err){
    console.log("server kosong");
  }
});

// ================= LAIN =================
function formatTanggalExcel(serial){
  if(!serial) return "-";
  if(typeof serial==="string") return serial;

  let utc_days=Math.floor(serial-25569);
  let date=new Date(utc_days*86400*1000);

  return date.toLocaleDateString("id-ID");
}

function triggerUpload(){
  document.getElementById('upload').click();
}

// ================= GLOBAL CHART =================
let chartAmount = null;
let chartStatus = null;

// ================= FORMAT RUPIAH =================
function formatRupiah(angka){
  return 'Rp ' + Number(angka || 0).toLocaleString('id-ID');
}

// ================= FILTER =================
function loadFilter(){
  const areaSet = new Set();
  const bulanSet = new Set();
  const remarkSet = new Set();

  dataList.forEach(d => {
    if(!d) return;
    if(d.area) areaSet.add(d.area);
    if(d.month) bulanSet.add(d.month);
    if(d.remark) remarkSet.add(d.remark);
  });

  const filterArea = document.getElementById("filterArea");
  const filterBulan = document.getElementById("filterBulan");
  const filterRemark = document.getElementById("filterRemark");

  if(filterArea){
    filterArea.innerHTML = `<option value="">Semua Area</option>` +
      [...areaSet].map(a => `<option value="${a}">${a}</option>`).join("");
  }

  if(filterBulan){
    filterBulan.innerHTML = `<option value="">Semua Bulan</option>` +
      [...bulanSet].map(b => `<option value="${b}">${b}</option>`).join("");
  }

  if(filterRemark){
    filterRemark.innerHTML = `<option value="">Semua Status</option>` +
      [...remarkSet].map(r => `<option value="${r}">${r}</option>`).join("");
  }
}

// auto trigger pivot kalau filter berubah
document.addEventListener("change", function(e){
  if(
    e.target.id === "filterArea" ||
    e.target.id === "filterBulan" ||
    e.target.id === "filterRemark"
  ){
    generatePivot();
  }
});

// ================= PIVOT TABLE =================
function renderPivotTable(areaDetail){
  const tbody = document.getElementById("pivotBody");
  const totalRow = document.getElementById("pivotTotal");

  if(!tbody || !totalRow) return;

  tbody.innerHTML = "";
  totalRow.innerHTML = "";

  if(Object.keys(areaDetail).length === 0){
    tbody.innerHTML = `<tr><td colspan="6">Tidak ada data</td></tr>`;
    return;
  }

  let totalPaid = 0;
  let totalNotPaid = 0;
  let totalPaidAmt = 0;
  let totalNotPaidAmt = 0;

  Object.keys(areaDetail).forEach(area => {
    const d = areaDetail[area];
    const total = d.paidAmount + d.notPaidAmount;

    totalPaid += d.paidCount;
    totalNotPaid += d.notPaidCount;
    totalPaidAmt += d.paidAmount;
    totalNotPaidAmt += d.notPaidAmount;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${area}</td>
      <td>${d.paidCount}</td>
      <td>${d.notPaidCount}</td>
      <td>${formatRupiah(d.paidAmount)}</td>
      <td>${formatRupiah(d.notPaidAmount)}</td>
      <td>${formatRupiah(total)}</td>
    `;
    tbody.appendChild(tr);
  });

  totalRow.innerHTML = `
    <td><b>TOTAL</b></td>
    <td><b>${totalPaid}</b></td>
    <td><b>${totalNotPaid}</b></td>
    <td><b>${formatRupiah(totalPaidAmt)}</b></td>
    <td><b>${formatRupiah(totalNotPaidAmt)}</b></td>
    <td><b>${formatRupiah(totalPaidAmt + totalNotPaidAmt)}</b></td>
  `;
}

// ================= PIVOT =================
function generatePivot() {

  if (!Array.isArray(dataList) || dataList.length === 0) {
    console.log("Data kosong");
    return;
  }

  const areaFilter = document.getElementById("filterArea")?.value || "";
  const bulanFilter = document.getElementById("filterBulan")?.value || "";
  const remarkFilter = document.getElementById("filterRemark")?.value || "";

  const filteredData = dataList.filter(d =>
    d &&
    (!areaFilter || d.area === areaFilter) &&
    (!bulanFilter || d.month === bulanFilter) &&
    (!remarkFilter || d.remark === remarkFilter)
  );

  const ctx1 = document.getElementById("chartAmount");
  const ctx2 = document.getElementById("chartStatus");

  if (!ctx1 || !ctx2) {
    console.log("Canvas belum siap");
    return;
  }

  let areaMap = {};
  let areaDetail = {};

  filteredData.forEach(d => {
    const area = d.area || "UNKNOWN";
    const amount = Number(d.amount) || 0;
    const isPaid = (d.remark || "").toUpperCase() === "PAID";

    if (!areaDetail[area]) {
      areaDetail[area] = {
        paidCount: 0,
        notPaidCount: 0,
        paidAmount: 0,
        notPaidAmount: 0
      };
    }

    areaMap[area] = (areaMap[area] || 0) + amount;

    if (isPaid) {
      areaDetail[area].paidCount++;
      areaDetail[area].paidAmount += amount;
    } else {
      areaDetail[area].notPaidCount++;
      areaDetail[area].notPaidAmount += amount;
    }
  });

  let paidCount = 0;
  let notPaidCount = 0;

  Object.values(areaDetail).forEach(d => {
    paidCount += d.paidCount;
    notPaidCount += d.notPaidCount;
  });

  // 🔥 FIX CHART DESTROY
  if (chartAmount instanceof Chart) {
    chartAmount.destroy();
  }

  chartAmount = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: Object.keys(areaMap),
      datasets: [{
        label: "Total Amount",
        data: Object.values(areaMap)
      }]
    },
    options: {
      responsive: true
    }
  });

  if (chartStatus instanceof Chart) {
    chartStatus.destroy();
  }

  chartStatus = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: ["PAID", "NOT PAID"],
      datasets: [{
        label: "Jumlah",
        data: [paidCount, notPaidCount]
      }]
    },
    options: {
      responsive: true
    }
  });

  renderPivotTable(areaDetail);
}
