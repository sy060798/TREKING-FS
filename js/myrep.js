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
    setTimeout(()=>generatePivot(),200);
  }
}

document.addEventListener("DOMContentLoaded", ()=>{
  showTab('data');

  let upload = document.getElementById("upload");
  if(upload){
    upload.addEventListener("click", ()=>upload.value=null);
    upload.addEventListener("change", importExcel);
  }

  document.getElementById("checkAll")?.addEventListener("change", e=>{
    document.querySelectorAll("#tableData tbody input[type=checkbox]")
      .forEach(c => c.checked = e.target.checked);
  });
});

// ================= IMPORT =================
function importExcel(e){
  let file = e.target.files[0];
  if(!file) return;

  let reader = new FileReader();

  reader.onload = function(evt){
    let wb = XLSX.read(evt.target.result,{type:'binary'});
    let duplicateCount = 0;

    wb.SheetNames.forEach(s=>{
      let json = XLSX.utils.sheet_to_json(wb.Sheets[s]);

      json.forEach(r=>{
        let woBaru = (r.WO||"").trim();
        let areaBaru = (r.AREA||"").trim();
        let bulanBaru = (r.MONTH||"").trim();

        let sudahAda = dataList.some(d =>
          d.wo===woBaru && d.area===areaBaru && d.month===bulanBaru
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
          note: "", // 🔥 NEW
          server: "-"
        });
      });
    });

    if(duplicateCount>0){
      alert(duplicateCount+" data duplikat tidak dimasukkan");
    }

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

  const noteFilter = document.getElementById("filterNote")?.value || "";

  if(dataList.length===0){
    tbody.innerHTML=`<tr><td colspan="15">Tidak ada data</td></tr>`;
    return;
  }

  dataList.forEach((d,i)=>{
    if(!d) return;
    if(noteFilter && d.note !== noteFilter) return;

    let tr = document.createElement("tr");

    tr.innerHTML=`
      <td>${i+1}</td>
      <td><input type="checkbox" data-id="${d.id}"></td>
      <td>${d.id}</td>
      <td>${d.wo}</td>
      <td>${formatTanggalExcel(d.tanggal)}</td>
      <td>${d.month||"-"}</td>
      <td>${d.area}</td>
      <td>${d.wotype}</td>
      <td>${d.stb}</td>
      <td>${d.dpp}</td>
      <td>${d.amount}</td>
      <td>${d.remark}</td>

      <td contenteditable="true"
          onblur="updateNote('${d.id}', this.innerText)">
          ${d.note||""}
      </td>

      <td>${d.server}</td>
      <td><button onclick="editData('${d.id}')">✏</button></td>
    `;

    tbody.appendChild(tr);
  });
}

// ================= NOTE =================
function updateNote(id,val){
  let d = dataList.find(x=>String(x.id)===String(id));
  if(d) d.note = val;
}

// ================= EDIT =================
function editData(id){
  currentEditId=id;
  let d = dataList.find(x=>String(x.id)===String(id));
  edit_wo.value=d.wo;
  edit_area.value=d.area;
  edit_stb.value=d.stb;
  edit_remark.value=d.remark;
  modalEdit.style.display="flex";
}

function saveEdit(){
  let d=dataList.find(x=>String(x.id)===String(currentEditId));
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
}

// ================= DELETE =================
async function hapusTerpilih(){
  let ids=[...document.querySelectorAll("#tableData tbody input:checked")]
    .map(c=>String(c.dataset.id));

  dataList = dataList.filter(d=>!ids.includes(String(d.id)));

  await fetch(`${SERVER_URL}/api/delete`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(ids)
  });

  renderTable();
}

// ================= SERVER =================
async function kirimKeServer(){
  let res = await fetch(`${SERVER_URL}/api/save`,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify(dataList)
  });

  if(res.ok){
    dataList.forEach(d=>d.server="✔ terkirim");
    renderTable();
    alert("Berhasil kirim");
  }
}

// ================= AUTO LOAD =================
window.addEventListener("load",async ()=>{
  try{
    let res=await fetch(`${SERVER_URL}/api/get`);
    let json=await res.json();

    dataList = json.flat().filter(d=>d);

    // 🔥 fix note hilang
    dataList.forEach(d=>{
      if(!d.note) d.note="";
      d.server="✔ dari server";
    });

    renderTable();
    loadFilter();

    setTimeout(()=>generatePivot(),200);

  }catch(e){
    console.log("server kosong");
  }
});

// ================= FILTER =================
function loadFilter(){
  const noteSet = new Set();

  dataList.forEach(d=>{
    if(d.note) noteSet.add(d.note);
  });

  const filterNote = document.getElementById("filterNote");

  if(filterNote){
    filterNote.innerHTML =
      `<option value="">Semua</option>`+
      [...noteSet].map(n=>`<option>${n}</option>`).join("");
  }
}

// ================= UTILS =================
function triggerUpload(){
  document.getElementById('upload').click();
}

function formatTanggalExcel(serial){
  if(!serial) return "-";
  if(typeof serial==="string") return serial;

  let d=new Date((serial-25569)*86400*1000);
  return d.toLocaleDateString("id-ID");
}

// ================= PIVOT =================
let chartAmount, chartStatus;

function generatePivot(){

  if(!dataList.length) return;

  let areaMap={};
  let paid=0,notPaid=0;

  dataList.forEach(d=>{
    let area=d.area||"UNKNOWN";
    let amt=d.amount||0;

    areaMap[area]=(areaMap[area]||0)+amt;

    if(d.remark==="PAID") paid++;
    else notPaid++;
  });

  let ctx1=document.getElementById("chartAmount");
  let ctx2=document.getElementById("chartStatus");

  if(chartAmount) chartAmount.destroy();
  if(chartStatus) chartStatus.destroy();

  chartAmount=new Chart(ctx1,{
    type:"bar",
    data:{
      labels:Object.keys(areaMap),
      datasets:[{data:Object.values(areaMap)}]
    }
  });

  chartStatus=new Chart(ctx2,{
    type:"bar",
    data:{
      labels:["PAID","NOT PAID"],
      datasets:[{data:[paid,notPaid]}]
    }
  });
}
