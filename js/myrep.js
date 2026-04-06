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


// ==================== TAB SWITCH ====================
function showTab(tabId) {
  // Hapus semua tab aktif
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
  });

  // Tampilkan tab yang dipilih
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');

  // Highlight tombol menu
  document.querySelectorAll('.menu button').forEach(btn => {
    btn.classList.remove('active');
  });

  const btn = document.querySelector(`.menu button[onclick="showTab('${tabId}')"]`);
  if (btn) btn.classList.add('active');

  // 🔥 FIX PENTING UNTUK PIVOT
  if (tabId === "pivot") {
    // Load dropdown filter dulu
    if (typeof loadFilter === "function") {
      loadFilter();
    }

    // Delay supaya canvas sudah tampil (Chart.js butuh ini)
    setTimeout(() => {
      if (typeof generatePivot === "function") {
        generatePivot();
      }
    }, 200);
  }
}

// ==================== INIT TAB DEFAULT ====================
document.addEventListener("DOMContentLoaded", function(){
  // set default tab Data
  showTab('data');
});

// ================= INIT ==================
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

  let checkAll = document.getElementById("checkAll");
  if(checkAll){
    checkAll.addEventListener("change", function(e){
      document.querySelectorAll("#tableData tbody input[type=checkbox]")
      .forEach(c => c.checked = e.target.checked);
    });
  }
});

// ================= IMPORT =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file){ alert("File tidak ada"); return; }

  let reader = new FileReader();

  reader.onload = function(evt){
    try{
      let wb = XLSX.read(evt.target.result,{type:'binary'});

      let duplicateCount = 0;

      wb.SheetNames.forEach(s=>{
        let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

        json.forEach(r=>{

          let woBaru = (r.WO || "").toString().trim();
          let areaBaru = (r.AREA || "").toString().trim();
          let bulanBaru = (r.MONTH || "").toString().trim();

          // 🔥 CEK DUPLIKAT GLOBAL
          let sudahAda = dataList.some(d => 
            (d.wo || "").toString().trim() === woBaru &&
            (d.area || "").toString().trim() === areaBaru &&
            (d.month || "").toString().trim() === bulanBaru
          );

          if(sudahAda){
            duplicateCount++;
            return;
          }

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
            server: "-"
          });

        });
      });

      // 🔥 NOTIF SEKALI SAJA
      if(duplicateCount > 0){
        alert(duplicateCount + " data duplikat tidak dimasukkan");
      }

      renderTable();
      loadFilter();

    }catch(err){
      console.error(err);
      alert("Gagal baca file");
    }
  };

  reader.readAsBinaryString(file);
}
// ================= RENDER =================
function renderTable(){
  let tbody = document.querySelector("#tableData tbody");
  if(!tbody) return;
  tbody.innerHTML = "";

  if(dataList.length===0){
    tbody.innerHTML=`<tr><td colspan="12">Tidak ada data</td></tr>`;
    return;
  }

  dataList.forEach((d,i)=>{

    // 🔥 TAMBAHAN: anti error
    if(!d || typeof d !== "object") return;

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
      <td>${d.server}</td>
      <td><button onclick="editData('${d.id}')">✏</button></td>
    `;
    tbody.appendChild(tr);
  });
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

// ================= EDIT MASSAL =================
function editMassal(){
  let checked=[...document.querySelectorAll("#tableData tbody input:checked")];
  if(checked.length===0){ alert("Pilih data dulu"); return; }
  currentEditId=checked.map(c=>String(c.dataset.id));
  modalEdit.style.display="flex";
}

// ================= SAVE =================
function saveEdit(){
  if(Array.isArray(currentEditId)){
    dataList.forEach(d=>{
      if(currentEditId.includes(String(d.id))){
        d.remark=edit_remark.value||d.remark;
      }
    });
  }else{
    let d=dataList.find(x=>String(x.id)===String(currentEditId));
    if(!d) return;
    d.wo=edit_wo.value;
    d.area=edit_area.value;
    d.stb=parseInt(edit_stb.value)||0;
    let harga=getHarga(d.area);
    d.dpp=harga+(d.stb*50000);
    d.amount=Math.round(d.dpp*1.11);
    d.remark=edit_remark.value;
  }
  renderTable();
  closeModal();
}

// ================= CLOSE MODAL =================
function closeModal(){ modalEdit.style.display="none"; currentEditId=null; }

// ================= HAPUS =================
async function hapusTerpilih(){
  let ids=[...document.querySelectorAll("#tableData tbody input:checked")]
    .map(c=>String(c.dataset.id));

  if(ids.length===0){
    alert("Pilih data dulu");
    return;
  }

  // hapus di frontend
  dataList = dataList.filter(d=>!ids.includes(String(d.id)));

  // 🔥 TAMBAHAN: hapus di server
  try{
    await fetch(`${SERVER_URL}/api/delete`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(ids)
    });
  }catch(err){
    console.error(err);
    alert("Gagal hapus server");
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
  if(dataList.length===0){ alert("Data kosong"); return; }

  // 🔥 TAMBAHAN: fix nested
  dataList = dataList.flat();

  try{
    let res=await fetch(`${SERVER_URL}/api/save`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(dataList)
    });
    if(!res.ok) throw new Error("Server error");
    dataList.forEach(d=>d.server="✔ terkirim");
    renderTable();
    loadFilter();
    generatePivot();
    alert("Berhasil kirim ke server");
  }catch(err){ console.error(err); alert("Gagal kirim ke server"); }
}

// ================= AUTO LOAD =================
window.addEventListener("load",async function(){
  try{
    let res=await fetch(`${SERVER_URL}/api/get`);
    if(!res.ok) throw new Error("Server mati");

    let json=await res.json();
    console.log("DATA DARI SERVER:", json);

    if(Array.isArray(json) && json.length>0){

      // 🔥 TAMBAHAN: fix nested
      dataList = json.flat();

      // 🔥 TAMBAHAN: bersihkan data
      dataList = dataList.filter(d => d && typeof d === "object");

      dataList.forEach(d=>d.server="✔ dari server");
      renderTable();
      loadFilter();
      generatePivot();
    }

  }catch(err){ console.log("Server belum aktif / kosong"); }
});

// ================= TAMBAHAN =================
function triggerUpload(){ document.getElementById('upload').click(); }

// ================= GLOBAL CHART =================
let chartAmount, chartStatus, chartAreaStatus;

// ================= FORMAT RUPIAH =================
function formatRupiah(angka){
  return 'Rp ' + Number(angka).toLocaleString('id-ID');
}

// ================= FORMAT FILTER =================
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

document.addEventListener("change", function(e){
  if(
    e.target.id === "filterArea" ||
    e.target.id === "filterBulan" ||
    e.target.id === "filterRemark"
  ){
    generatePivot();
  }
});

// ================= PIVOT TABEL =================

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

  // ✅ TOTAL MASUK FOOTER (FIX SESUAI HTML)
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

  // ================= FILTER =================
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

  // ================= PIVOT =================
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

    // total amount per area (buat chart kiri)
    areaMap[area] = (areaMap[area] || 0) + amount;

    if (isPaid) {
      areaDetail[area].paidCount++;
      areaDetail[area].paidAmount += amount;
    } else {
      areaDetail[area].notPaidCount++;
      areaDetail[area].notPaidAmount += amount;
    }
  });

  // ================= TOTAL GLOBAL (FIX BUG) =================
  let paidCount = 0;
  let notPaidCount = 0;

  Object.values(areaDetail).forEach(d => {
    paidCount += d.paidCount;
    notPaidCount += d.notPaidCount;
  });

  // ================= CHART AMOUNT =================
  if (chartAmount) chartAmount.destroy();

  chartAmount = new Chart(ctx1, {
    type: "bar",
    data: {
      labels: Object.keys(areaMap),
      datasets: [{
        label: "Total Amount (Rp)",
        data: Object.values(areaMap),
        backgroundColor: "#4f46e5"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true }
      }
    }
  });

  // ================= CHART STATUS =================
  if (chartStatus) chartStatus.destroy();

  chartStatus = new Chart(ctx2, {
    type: "bar",
    data: {
      labels: ["PAID", "NOT PAID"],
      datasets: [{
        label: "Jumlah Data",
        data: [paidCount, notPaidCount],
        backgroundColor: ["#22c55e", "#ef4444"]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false }
      }
    }
  });

  // ================= TABLE =================
  renderPivotTable(areaDetail);
}
