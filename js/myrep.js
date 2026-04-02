// =======================
// DATA STORAGE
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
// HITUNG OTOMATIS
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
// SWITCH TAB
// =======================
function showTab(tab){
    document.getElementById("dataTab").style.display = "none";
    document.getElementById("pivotTab").style.display = "none";

    if(tab === "data"){
        document.getElementById("dataTab").style.display = "block";
    } else {
        document.getElementById("pivotTab").style.display = "block";
    }
}

// =======================
// SIMPAN DATA
// =======================
function simpan(){

    let wo = document.getElementById("wo").value;
    let area = document.getElementById("area").value;

    // VALIDASI SEDERHANA
    if(wo === "" || area === ""){
        alert("WO & Area wajib diisi!");
        return;
    }

    // CEK DUPLIKAT WO
    let duplikat = dataList.find(d => d.wo === wo);
    if(duplikat){
        alert("WO sudah ada (duplikat!)");
        return;
    }

    let data = {
        wo: wo,
        area: area,
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

    alert("Data berhasil disimpan ✅");
}

// =======================
// RENDER TABLE
// =======================
function renderTable(){
    let tbody = document.querySelector("#tableData tbody");
    tbody.innerHTML = "";

    dataList.forEach((d, i) => {
        let row = `
        <tr>
            <td>${i+1}</td>
            <td>${d.wo}</td>
            <td>${d.area}</td>
            <td>${d.dpp}</td>
            <td>${d.amount}</td>
            <td>${d.remark}</td>
        </tr>
        `;
        tbody.innerHTML += row;
    });
}

// =======================
// CLEAR FORM
// =======================
function clearForm(){
    document.getElementById("wo").value = "";
    document.getElementById("area").value = "";
    document.getElementById("tahun").value = "";
    document.getElementById("bulan").value = "";
    document.getElementById("stb").value = "";
    document.getElementById("dpp").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("tgl").value = "";
    document.getElementById("payment").value = "";
    document.getElementById("remark").value = "NOT PAID";
    document.getElementById("invoice").value = "";
    document.getElementById("note").value = "";
}
