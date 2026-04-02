// =======================
// DATA
// =======================
let dataList = [];

// =======================
// HARGA AREA
// =======================
const hargaArea = {
    "purwakarta": 280000,
    "surabaya": 280000,
    "sidoarjo": 280000,
    "pamatang siantar": 245000,
    "jakarta": 300000,
    "deli serdang": 260000
};

// =======================
// HITUNG
// =======================
function hitung(){
    let area = document.getElementById("area").value.toLowerCase();
    let stb = parseInt(document.getElementById("stb").value) || 0;

    let harga = hargaArea[area] || 0;

    let dpp = harga + (stb * 50000);
    let amount = dpp * 1.11;

    document.getElementById("dpp").value = dpp;
    document.getElementById("amount").value = Math.round(amount);
}

// =======================
// SIMPAN
// =======================
function simpan(){

    let wo = document.getElementById("wo").value;
    let area = document.getElementById("area").value;

    if(wo === "" || area === ""){
        alert("WO & Area wajib diisi!");
        return;
    }

    let cek = dataList.find(d => d.wo === wo);
    if(cek){
        alert("WO sudah ada!");
        return;
    }

    let data = {
        id: Date.now(),
        wo: wo,
        area: area,
        wotype: document.getElementById("wotype").value,
        tahun: document.getElementById("tahun").value,
        bulan: document.getElementById("bulan").value,
        stb: document.getElementById("stb").value,
        dpp: document.getElementById("dpp").value,
        amount: document.getElementById("amount").value,
        tgl: document.getElementById("tgl").value,
        payment: document.getElementById("payment").value,
        remark: document.getElementById("remark").value,
        invoice: document.getElementById("invoice").value,
        note: document.getElementById("note").value
    };

    dataList.push(data);

    renderTable();
    clearForm();

    alert("Data berhasil disimpan");
}

// =======================
// RENDER
// =======================
function renderTable(){

    let tbody = document.querySelector("#tableData tbody");
    tbody.innerHTML = "";

    dataList.forEach((d,i)=>{

        let row = `
        <tr>
        <td>${i+1}</td>
        <td><input type="checkbox" class="cek" data-id="${d.id}"></td>
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

        tbody.innerHTML += row;
    });
}

// =======================
// HAPUS
// =======================
function hapusTerpilih(){

    let cek = document.querySelectorAll(".cek:checked");

    if(cek.length === 0){
        alert("Tidak ada yang dipilih");
        return;
    }

    cek.forEach(c=>{
        let id = c.dataset.id;
        dataList = dataList.filter(d => d.id != id);
    });

    renderTable();
}

// =======================
// UPDATE MASSAL
// =======================
function updateMassal(){

    let cek = document.querySelectorAll(".cek:checked");

    if(cek.length === 0){
        alert("Pilih data dulu!");
        return;
    }

    let remark = document.getElementById("remark").value;
    let invoice = document.getElementById("invoice").value;

    cek.forEach(c=>{
        let id = c.dataset.id;
        let data = dataList.find(d=>d.id == id);

        if(data){
            data.remark = remark;
            data.invoice = invoice;
        }
    });

    renderTable();
}

// =======================
// EDIT
// =======================
function editData(id){

    let d = dataList.find(x=>x.id==id);

    document.getElementById("wo").value = d.wo;
    document.getElementById("area").value = d.area;
    document.getElementById("wotype").value = d.wotype;
    document.getElementById("tahun").value = d.tahun;
    document.getElementById("bulan").value = d.bulan;
    document.getElementById("stb").value = d.stb;
    document.getElementById("dpp").value = d.dpp;
    document.getElementById("amount").value = d.amount;
    document.getElementById("tgl").value = d.tgl;
    document.getElementById("payment").value = d.payment;
    document.getElementById("remark").value = d.remark;
    document.getElementById("invoice").value = d.invoice;
    document.getElementById("note").value = d.note;
}

// =======================
// CLEAR
// =======================
function clearForm(){
    document.querySelectorAll("input").forEach(i=>i.value="");
}

// =======================
// EXPORT EXCEL
// =======================
function exportExcel(){

    if(dataList.length === 0){
        alert("Data kosong!");
        return;
    }

    let ws = XLSX.utils.json_to_sheet(dataList);
    let wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "DATA");
    XLSX.writeFile(wb, "treking_myrep.xlsx");
}

// =======================
// IMPORT EXCEL
// =======================
function importExcel(){

    let file = document.getElementById("uploadExcel").files[0];

    if(!file){
        alert("Pilih file dulu!");
        return;
    }

    let reader = new FileReader();

    reader.onload = function(e){

        let data = new Uint8Array(e.target.result);
        let workbook = XLSX.read(data, {type:'array'});

        let sheet = workbook.Sheets[workbook.SheetNames[0]];
        let json = XLSX.utils.sheet_to_json(sheet);

        json.forEach(row => {

            let cek = dataList.find(d => d.wo == row.WO);
            if(cek) return;

            dataList.push({
                id: Date.now(),
                wo: row.WO || "",
                area: row.AREA || "",
                wotype: row["WO TYPE"] || "",
                tahun: row.TAHUN || "",
                bulan: row.MONTH || "",
                stb: row.STB || 0,
                dpp: row.DPP || 0,
                amount: row.AMOUNT || 0,
                tgl: row["TANGGAL PENGERJAAN"] || "",
                payment: row["PAYMENT DATE"] || "",
                remark: row["REMARK PAYMENT"] || "NOT PAID",
                invoice: row["NO INVOICE"] || "",
                note: row.NOTE || ""
            });

        });

        renderTable();
        alert("Import selesai");
    };

    reader.readAsArrayBuffer(file);
}
