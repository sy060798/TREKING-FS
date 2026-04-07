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

// ================= SERVER =================
async function kirimKeServer(){
  if(dataList.length===0){
    alert("Data kosong");
    return;
  }

  try{
    let res = await fetch(`${SERVER_URL}/api/save`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify(dataList)
    });

    if(!res.ok) throw new Error("Server error");

    dataList.forEach(d=>d.server="✔ terkirim");

    renderTable();
    alert("Berhasil kirim ke server");

  }catch(err){
    alert("❌ Gagal kirim server");
    console.error(err);
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
