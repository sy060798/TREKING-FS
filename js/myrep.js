// ================= GLOBAL =================
let dataList = [];
let currentEditId = null;

// 🔥 SERVER
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
    upload.addEventListener("change", importExcel);
  }

});

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

          let stb = parseInt(r.STB) || 0;

          let harga = getHarga(r.AREA);
          let dpp = harga + (stb * 50000);

          dataList.push({
            id: r.ID || Date.now(),
            wo: r.WO || "",
            area: r.AREA || "",
            wotype: r["WO TYPE"] || "",

            tahun: r.TAHUN || "",
            month: r.MONTH || "",
            tanggal: r.TANGGALPENGERJAAN || "",

            stb: stb,
            dpp: dpp,
            amount: Math.round(dpp * 1.11),
            remark: "NOT PAID",

            server: "-"
          });

        });
      });

      renderTable();

    }catch(err){
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

  dataList.forEach((d,i)=>{
    let tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i+1}</td>
      <td>${d.id}</td>
      <td>${d.wo}</td>
      <td>${d.area}</td>
      <td>${d.wotype}</td>
      <td>${d.stb}</td>
      <td>${d.dpp}</td>
      <td>${d.amount}</td>
      <td>${d.remark}</td>
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

  modalEdit.style.display = "block";
}

// ================= SAVE =================
function saveEdit(){
  let d = dataList.find(x => String(x.id) === String(currentEditId));
  if(!d) return;

  d.wo = edit_wo.value;
  d.area = edit_area.value;
  d.stb = parseInt(edit_stb.value) || 0;

  let harga = getHarga(d.area);
  d.dpp = harga + (d.stb * 50000);
  d.amount = Math.round(d.dpp * 1.11);

  d.remark = edit_remark.value;

  renderTable();
  closeModal();
}

// ================= CLOSE =================
function closeModal(){
  modalEdit.style.display = "none";
  currentEditId = null;
}

// ❌ HAPUS window.onclick (ini penyebab tombol mati)

// ================= SERVER =================
async function kirimKeServer(){
  try{
    await fetch(`${SERVER_URL}/api/save`,{
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify(dataList)
    });

    alert("Berhasil kirim");
  }catch{
    alert("Gagal kirim");
  }
}
