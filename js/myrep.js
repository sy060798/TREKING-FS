// ================= GLOBAL =================
let dataList = [];
let currentEditId = null;
let chart = null;

// 🔥 SERVER URL
const SERVER_URL = "https://tracking-server-production-6a12.up.railway.app";

// ================= INIT ==================
document.addEventListener("DOMContentLoaded", function(){

  window.edit_wo = document.getElementById("edit_wo");
  window.edit_area = document.getElementById("edit_area");
  window.edit_stb = document.getElementById("edit_stb");
  window.edit_remark = document.getElementById("edit_remark");
  window.modalEdit = document.getElementById("modalEdit");

  let upload = document.getElementById("upload");
  if(upload){
    upload.addEventListener("click", ()=>upload.value = null);
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

// ================= TAB =================
function showTab(tab){
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.getElementById(tab).classList.add("active");

  if(tab === "pivot"){
    generatePivot();
  }
}

// ================= UPLOAD =================
function triggerUpload(){
  let input = document.getElementById("upload");
  if(input) input.click();
}

// ================= IMPORT =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file){
    alert("File tidak ada");
    return;
  }

  let reader = new FileReader();

  reader.onload = function(evt){
    try{
      let wb = XLSX.read(evt.target.result, {type:'binary'});
      dataList = [];

      wb.SheetNames.forEach(s => {
        let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);
        json.forEach(r => {

          dataList.push({
            id: r.ID || Date.now()+Math.random(),
            wo: r.WO || "",
            area: r.AREA || "",
            wotype: r["WO TYPE"] || "",
            tahun: r.TAHUN || "",
            month: r.MONTH || "",
            tanggal: r.TANGGALPENGERJAAN || "",

            // 🔥 FIX: BALIKIN INI
            stb: parseInt(r.STB) || 0,
            remark: r.REMARK || "NOT PAID",

            server: "-"
          });

        });
      });

      renderTable();

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

  if(dataList.length === 0){
    tbody.innerHTML = `<tr><td colspan="12">Tidak ada data</td></tr>`;
    return;
  }

  dataList.forEach((d,i)=>{
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i+1}</td>
      <td><input type="checkbox" data-id="${d.id}"></td>
      <td>${d.wotype}</td>
      <td>${d.tahun}</td>
      <td>${d.month}</td>
      <td>${d.tanggal}</td>

      <!-- 🔥 TAMBAHAN -->
      <td>${d.stb}</td>
      <td>${d.remark}</td>

      <td>${d.server || "-"}</td>
      <td><button onclick="editData('${d.id}')">✏</button></td>
    `;
    tbody.appendChild(tr);
  });
}

// ================= EDIT =================
function editData(id){
  currentEditId = id;
  let d = dataList.find(x => String(x.id) === String(id));
  if(!d) return;

  edit_wo.value = d.wo;
  edit_area.value = d.area;
  edit_stb.value = d.stb;
  edit_remark.value = d.remark;
  modalEdit.style.display = "flex";
}

// ================= EDIT MASSAL =================
function editMassal(){
  let checked = [...document.querySelectorAll("#tableData tbody input:checked")];
  if(checked.length === 0){
    alert("Pilih data dulu");
    return;
  }
  currentEditId = checked.map(c => String(c.dataset.id));
  modalEdit.style.display = "flex";
}

// ================= SAVE =================
function saveEdit(){
  if(Array.isArray(currentEditId)){
    dataList.forEach(d => {
      if(currentEditId.includes(String(d.id))){
        d.remark = edit_remark.value || d.remark;
      }
    });
  }else{
    let d = dataList.find(x => String(x.id) === String(currentEditId));
    if(!d) return;
    d.wo = edit_wo.value;
    d.area = edit_area.value;
    d.stb = parseInt(edit_stb.value) || 0;
    d.remark = edit_remark.value;
  }
  renderTable();
  closeModal();
}

// ================= HAPUS =================
function hapusTerpilih(){
  let ids = [...document.querySelectorAll("#tableData tbody input:checked")]
    .map(c => String(c.dataset.id));
  dataList = dataList.filter(d => !ids.includes(String(d.id)));
  renderTable();
}

// ================= EXPORT =================
function exportExcel(){
  if(dataList.length === 0){
    alert("Data kosong");
    return;
  }

  let ws = XLSX.utils.json_to_sheet(dataList);
  let wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DATA");
  XLSX.writeFile(wb, "data.xlsx");
}

// ================= SERVER =================
async function kirimKeServer(){
  if(dataList.length === 0){
    alert("Data kosong");
    return;
  }

  try{
    let res = await fetch(`${SERVER_URL}/api/save`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(dataList) // 🔥 FIX DI SINI
    });

    if(!res.ok) throw new Error("Server error");

    let json = await res.json();

    dataList.forEach(d => d.server = "✔ terkirim");
    renderTable();

    alert("Berhasil kirim ke server");

  }catch(err){
    console.error(err);
    alert("Gagal kirim ke server (cek URL / server belum aktif)");
  }
}

// ================= AUTO LOAD =================
window.addEventListener("load", async function(){
  try{
    let res = await fetch(`${SERVER_URL}/api/get`);

    if(!res.ok) throw new Error("Server mati");

    let json = await res.json();

    if(json && json.length > 0){
      dataList = json;
      dataList.forEach(d => d.server = "✔ dari server");
      renderTable();
    }

  }catch(err){
    console.log("Server belum aktif / kosong");
  }
});

// ================= PIVOT =================
// (TIDAK DIUBAH)
