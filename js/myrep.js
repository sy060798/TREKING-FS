let dataList = [];

const hargaArea = {
    "purwakarta": 280000,
    "surabaya": 280000,
    "sidoarjo": 280000,
    "pamatang siantar": 245000,
    "jakarta": 300000,
    "deli serdang": 260000
};

// HITUNG
function hitung(){
    let area = document.getElementById("area").value.toLowerCase();
    let stb = parseInt(document.getElementById("stb").value) || 0;

    let harga = hargaArea[area] || 0;

    let dpp = harga + (stb * 50000);
    let amount = dpp * 1.11;

    document.getElementById("dpp").value = dpp;
    document.getElementById("amount").value = Math.round(amount);
}

// TAB
function showTab(tab){
    document.getElementById("dataTab").style.display = "none";
    document.getElementById("pivotTab").style.display = "none";
    document.getElementById(tab+"Tab").style.display = "block";
}

// SIMPAN
function simpan(){

    let wo = document.getElementById("wo").value;

    if(dataList.find(d => d.wo === wo)){
        alert("WO DOUBLE ❌");
        return;
    }

    let data = {
        id: "WO-" + Math.floor(Math.random()*100000),
        wo,
        area: document.getElementById("area").value,
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
        note: document.getElementById("note").value,
        checked:false
    };

    dataList.push(data);
    renderTable();
    clearForm();

    alert("READY ✅");
}

// RENDER
function renderTable(){
    let tbody = document.querySelector("#tableData tbody");
    tbody.innerHTML = "";

    dataList.forEach((d,i)=>{

        let row = `
        <tr>
            <td>${i+1}</td>
            <td><input type="checkbox" ${d.checked?"checked":""} onchange="toggleCheck('${d.id}')"></td>
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
                <button onclick="editData('${d.id}')">✏️</button>
                <button onclick="hapus('${d.id}')">🗑</button>
            </td>
        </tr>
        `;

        tbody.innerHTML += row;
    });
}

// CHECK
function toggleCheck(id){
    let d = dataList.find(x=>x.id===id);
    d.checked = !d.checked;
}

// HAPUS
function hapus(id){
    dataList = dataList.filter(d=>d.id!==id);
    renderTable();
}

// HAPUS MASSAL
function hapusTerpilih(){
    dataList = dataList.filter(d=>!d.checked);
    renderTable();
}

// EDIT
function editData(id){
    let d = dataList.find(x=>x.id===id);

    document.getElementById("wo").value = d.wo;
    document.getElementById("area").value = d.area;
    document.getElementById("wotype").value = d.wotype;
    document.getElementById("tahun").value = d.tahun;
    document.getElementById("bulan").value = d.bulan;
    document.getElementById("stb").value = d.stb;
    document.getElementById("tgl").value = d.tgl;
    document.getElementById("payment").value = d.payment;
    document.getElementById("invoice").value = d.invoice;
    document.getElementById("note").value = d.note;

    hitung();
    hapus(id);
}

// UPDATE MASSAL
function updateMassal(){
    let remark = prompt("Isi Remark (PAID / NOT PAID)");
    let invoice = prompt("Isi Invoice");

    dataList.forEach(d=>{
        if(d.checked){
            if(remark) d.remark = remark;
            if(invoice) d.invoice = invoice;
        }
    });

    renderTable();
}

// CLEAR
function clearForm(){
    document.querySelectorAll("input").forEach(i=>i.value="");
}
