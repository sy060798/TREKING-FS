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
});

// ================= IMPORT =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file){ alert("File tidak ada"); return; }

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{

        let area = (r.AREA||"").toString().trim();
        let stb = parseInt(r.STB)||0;
        let harga = getHarga(area);
        let dpp = harga + (stb*50000);

        dataList.push({
          id: r.ID||Date.now()+Math.random(),
          wo: r.WO||"",
          area: area,
          wotype: r["WO TYPE"]||"",
          tahun: r.TAHUN||"",
          month: r.MONTH||"",
          tanggal: r.TANGGALPENGERJAAN||"",
          stb: stb,
          dpp: dpp,
          amount: Math.round(dpp*1.11),
          remark: "NOT PAID",
          note: "", // 🔥 TAMBAHAN
          server: "-"
        });

      });
    });

    renderTable();
    loadFilter();
  };

  reader.readAsBinaryString(file);
}

// ================= RENDER =================
function renderTable(){
  let tbody = document.querySelector("#tableData tbody");
  if(!tbody) return;
  tbody.innerHTML = "";

  if(dataList.length===0){
    tbody.innerHTML=`<tr><td colspan="14">Tidak ada data</td></tr>`;
    return;
  }

  dataList.forEach((d,i)=>{
    if(!d) return;

    let tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${i+1}</td>
      <td><input type="checkbox" data-id="${d.id}"></td>
      <td>${d.id}</td>
      <td>${d.wo}</td>
      <td>${d.tanggal}</td>
      <td>${d.month}</td>
      <td>${d.area}</td>
      <td>${d.wotype}</td>
      <td>${d.stb}</td>
      <td>${d.dpp}</td>
      <td>${d.amount}</td>
      <td>${d.remark}</td>

      <!-- 🔥 NOTE BARU -->
      <td contenteditable="true" onblur="updateNote('${d.id}', this.innerText)">
        ${d.note||""}
      </td>

      <td>${d.server}</td>
    `;
    tbody.appendChild(tr);
  });
}

// ================= UPDATE NOTE =================
function updateNote(id, value){
  let d = dataList.find(x=>String(x.id)===String(id));
  if(d){
    d.note = value.trim();
  }
}

// ================= FILTER =================
function loadFilter(){

  const areaSet = new Set();
  const bulanSet = new Set();
  const remarkSet = new Set();
  const noteSet = new Set(); // 🔥

  dataList.forEach(d=>{
    if(!d) return;
    if(d.area) areaSet.add(d.area);
    if(d.month) bulanSet.add(d.month);
    if(d.remark) remarkSet.add(d.remark);
    if(d.note) noteSet.add(d.note); // 🔥
  });

  const filterArea = document.getElementById("filterArea");
  const filterBulan = document.getElementById("filterBulan");
  const filterRemark = document.getElementById("filterRemark");
  const filterNote = document.getElementById("filterNote"); // 🔥

  if(filterArea){
    filterArea.innerHTML = `<option value="">Semua</option>` +
      [...areaSet].map(a=>`<option value="${a}">${a}</option>`).join("");
  }

  if(filterBulan){
    filterBulan.innerHTML = `<option value="">Semua</option>` +
      [...bulanSet].map(b=>`<option value="${b}">${b}</option>`).join("");
  }

  if(filterRemark){
    filterRemark.innerHTML = `<option value="">Semua</option>` +
      [...remarkSet].map(r=>`<option value="${r}">${r}</option>`).join("");
  }

  if(filterNote){
    filterNote.innerHTML = `<option value="">Semua Note</option>` +
      [...noteSet].map(n=>`<option value="${n}">${n}</option>`).join("");
  }
}

// ================= FILTER EVENT =================
document.addEventListener("change", function(e){
  if(
    e.target.id === "filterArea" ||
    e.target.id === "filterBulan" ||
    e.target.id === "filterRemark" ||
    e.target.id === "filterNote" // 🔥
  ){
    generatePivot();
  }
});

// ================= SERVER =================
async function kirimKeServer(){
  if(dataList.length===0){ alert("Data kosong"); return; }

  try{
    let res = await fetch(`${SERVER_URL}/api/save`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(dataList)
    });

    let text = await res.text();
    console.log("RESPONSE SERVER:", text);

    if(!res.ok) throw new Error(text);

    dataList.forEach(d=>d.server="✔ terkirim");

    renderTable();
    loadFilter();

    alert("Berhasil kirim ke server");

  }catch(err){
    console.error(err);
    alert("Gagal kirim ke server");
  }
}
