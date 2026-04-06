// ================= GLOBAL =================
let dataList = [];
let currentEditId = null;
let chart = null;

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
      dataList = [];
      wb.SheetNames.forEach(s=>{
        let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);
        json.forEach(r=>{
          let stb = parseInt(r.STB)||0;
          let harga = getHarga(r.AREA);
          let dpp = harga + (stb*50000);
          dataList.push({
            id: r.ID||Date.now()+Math.random(),
            wo: r.WO||"",
            area: r.AREA||"",
            wotype: r["WO TYPE"]||"",
            tahun: r.TAHUN||"",
            month: r.MONTH||"",
            tanggal: r.TANGGALPENGERJAAN||"",
            stb: stb,
            dpp: dpp,
            amount: Math.round(dpp*1.11),
            remark: "NOT PAID",
            server: "-"
          });
        });
      });
      renderTable();
    }catch(err){ console.error(err); alert("Gagal baca file"); }
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
    }

  }catch(err){ console.log("Server belum aktif / kosong"); }
});

// ================= TAMBAHAN =================
function triggerUpload(){ document.getElementById('upload').click(); }
function showTab(id){
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}
