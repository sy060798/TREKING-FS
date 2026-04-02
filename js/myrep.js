let dataList = [];
let currentEditId = null;
let lastId = 0;

const hargaArea = {
    "purwakarta":280000,
    "surabaya":280000,
    "sidoarjo":280000,
    "pamatang siantar":245000,
    "jakarta":300000,
    "deli serdang":260000
};

// ================= RENDER =================
function renderTable(){
    let tbody = document.querySelector("#tableData tbody");
    tbody.innerHTML = "";

    dataList.forEach((d,i)=>{
        tbody.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td><input type="checkbox" data-id="${d.id}"></td>
            <td>${d.id}</td>
            <td>${d.wo}</td>
            <td>${d.area}</td>
            <td>${d.wotype}</td>
            <td>${d.tahun}</td>
            <td>${d.bulan}</td>
            <td>${d.stb}</td>
            <td>${d.dpp}</td>
            <td>${d.amount}</td>
            <td>${d.tgl}</td>
            <td>${d.payment}</td>
            <td>${d.remark}</td>
            <td>${d.invoice}</td>
            <td>${d.note}</td>
            <td><button onclick="editData(${d.id})">✏</button></td>
        </tr>
        `;
    });
}

// ================= CHECK ALL =================
function checkAll(el){
    let checkboxes = document.querySelectorAll("tbody input[type=checkbox]");
    checkboxes.forEach(c=>c.checked = el.checked);
}

// ================= DELETE =================
function hapusTerpilih(){
    let checked = document.querySelectorAll("input[type=checkbox]:checked");
    let ids = [...checked].map(c=>c.dataset.id);

    dataList = dataList.filter(d=>!ids.includes(String(d.id)));
    renderTable();
}

// ================= EDIT =================
function editData(id){
    let d = dataList.find(x=>x.id==id);
    let newWo = prompt("Edit WO", d.wo);
    if(newWo===null) return;

    d.wo = newWo;
    renderTable();
}

// ================= EDIT MASSAL =================
function editMassal(){
    let checked = document.querySelectorAll("input[type=checkbox]:checked");
    if(checked.length===0){
        alert("Pilih data dulu!");
        return;
    }

    let ids = [...checked].map(c=>c.dataset.id);
    let status = prompt("Ubah Remark jadi (PAID / NOT PAID)");

    if(!status) return;

    dataList.forEach(d=>{
        if(ids.includes(String(d.id))){
            d.remark = status.toUpperCase();
        }
    });

    renderTable();
}

// ================= IMPORT =================
document.getElementById("uploadExcel").addEventListener("change", importExcel);

function importExcel(e){
    let file = e.target.files[0];
    if(!file){
        alert("Pilih file dulu!");
        return;
    }

    dataList = [];
    lastId = 0;

    let reader = new FileReader();

    reader.onload = function(e){
        let data = new Uint8Array(e.target.result);
        let wb = XLSX.read(data,{type:'array'});
        let ws = wb.Sheets[wb.SheetNames[0]];
        let json = XLSX.utils.sheet_to_json(ws);

        json.forEach(row=>{
            lastId++;

            let area = (row.AREA || "").toLowerCase().trim();
            let stb = parseInt(row.STB)||0;

            let harga = hargaArea[area]||0;
            let dpp = harga + (stb*50000);
            let amount = Math.round(dpp*1.11);

            dataList.push({
                id:lastId,
                wo: row.WO||"",
                area: row.AREA||"",
                wotype: row["WO TYPE"]||"",
                tahun: row.TAHUN||"",
                bulan: row.MONTH||"",
                stb: stb,
                dpp: dpp,
                amount: amount,
                tgl: row["TANGGAL PENGERJAAN"]||"",
                payment: row["PAYMENT DATE"]||"",
                remark: row["REMARK PAYMENT"]||"NOT PAID",
                invoice: row["NO INVOICE"]||"",
                note: row.NOTE||""
            });
        });

        renderTable();
    };

    reader.readAsArrayBuffer(file);
}

// ================= EXPORT =================
function exportExcel(){
    let ws = XLSX.utils.json_to_sheet(dataList);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DATA");
    XLSX.writeFile(wb, "data.xlsx");
}

// ================= MENU =================
function showPage(page){
    document.getElementById("page-tracking").style.display = "none";
    document.getElementById("page-pivot").style.display = "none";

    document.getElementById("page-"+page).style.display = "block";
}
