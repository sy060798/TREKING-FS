let dataList = [];
let currentEditId = null;

const hargaArea = {
    "purwakarta":280000,
    "surabaya":280000,
    "sidoarjo":280000,
    "pamatang siantar":245000,
    "jakarta":300000,
    "deli serdang":260000
};

// =======================
// RENDER
// =======================
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
            <td>
                <button onclick="editData(${d.id})">✏</button>
            </td>
        </tr>
        `;
    });
}

// =======================
// EDIT
// =======================
function editData(id){
    let d = dataList.find(x=>x.id==id);
    currentEditId = id;

    document.getElementById("edit_wo").value = d.wo;
    document.getElementById("edit_area").value = d.area;
    document.getElementById("edit_wotype").value = d.wotype;
    document.getElementById("edit_tahun").value = d.tahun;
    document.getElementById("edit_bulan").value = d.bulan;
    document.getElementById("edit_stb").value = d.stb;
    document.getElementById("edit_dpp").value = d.dpp;
    document.getElementById("edit_amount").value = d.amount;
    document.getElementById("edit_tgl").value = d.tgl;
    document.getElementById("edit_payment").value = d.payment;
    document.getElementById("edit_remark").value = d.remark;
    document.getElementById("edit_invoice").value = d.invoice;
    document.getElementById("edit_note").value = d.note;

    document.getElementById("modalEdit").style.display = "flex";
}

// =======================
function closeModal(){
    document.getElementById("modalEdit").style.display = "none";
}

// =======================
function saveEdit(){
    let d = dataList.find(x=>x.id==currentEditId);

    let area = document.getElementById("edit_area").value.toLowerCase();
    let stb = parseInt(document.getElementById("edit_stb").value)||0;

    let harga = hargaArea[area]||0;
    let dpp = harga + (stb*50000);
    let amount = Math.round(dpp*1.11);

    d.wo = document.getElementById("edit_wo").value;
    d.area = document.getElementById("edit_area").value;
    d.wotype = document.getElementById("edit_wotype").value;
    d.tahun = document.getElementById("edit_tahun").value;
    d.bulan = document.getElementById("edit_bulan").value;
    d.stb = stb;
    d.dpp = dpp;
    d.amount = amount;
    d.tgl = document.getElementById("edit_tgl").value;
    d.payment = document.getElementById("edit_payment").value;
    d.remark = document.getElementById("edit_remark").value;
    d.invoice = document.getElementById("edit_invoice").value;
    d.note = document.getElementById("edit_note").value;

    renderTable();
    closeModal();
}

// =======================
// DELETE
// =======================
function hapusTerpilih(){
    let checked = document.querySelectorAll("input[type=checkbox]:checked");

    let ids = [...checked].map(c=>parseInt(c.dataset.id));

    dataList = dataList.filter(d=>!ids.includes(d.id));

    renderTable();
}

// =======================
// IMPORT EXCEL
// =======================
function importExcel(){

    let file = document.getElementById("uploadExcel").files[0];
    let reader = new FileReader();

    reader.onload = function(e){
        let data = new Uint8Array(e.target.result);
        let wb = XLSX.read(data,{type:'array'});
        let ws = wb.Sheets[wb.SheetNames[0]];
        let json = XLSX.utils.sheet_to_json(ws);

        json.forEach(row=>{

            let area = (row.AREA||"").toLowerCase();
            let stb = parseInt(row.STB)||0;

            let harga = hargaArea[area]||0;
            let dpp = harga + (stb*50000);
            let amount = Math.round(dpp*1.11);

            dataList.push({
                id: Date.now()+Math.random(),
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

// =======================
// EXPORT EXCEL
// =======================
function exportExcel(){
    let ws = XLSX.utils.json_to_sheet(dataList);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DATA");
    XLSX.writeFile(wb, "data.xlsx");
}
