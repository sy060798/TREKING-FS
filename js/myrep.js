let dataList = [];

const hargaArea = {
    "purwakarta": 280000,
    "surabaya": 280000,
    "sidoarjo": 280000,
    "pamatang siantar": 245000,
    "jakarta": 300000,
    "deli serdang": 260000
};

// ================= HITUNG
function hitung(){
    let area = document.getElementById("area").value.toLowerCase();
    let stb = parseInt(document.getElementById("stb").value) || 0;

    let harga = hargaArea[area] || 0;

    let dpp = harga + (stb * 50000);
    let amount = dpp * 1.11;

    document.getElementById("dpp").value = dpp;
    document.getElementById("amount").value = Math.round(amount);
}

// ================= TAB
function showTab(tab){
    document.getElementById("dataTab").style.display = "none";
    document.getElementById("pivotTab").style.display = "none";

    document.getElementById(tab + "Tab").style.display = "block";
}

// ================= SIMPAN
function simpan(){
    let wo = document.getElementById("wo").value;
    let area = document.getElementById("area").value;

    if(!wo || !area){
        alert("WO & Area wajib!");
        return;
    }

    if(dataList.find(d => d.wo === wo)){
        alert("WO sudah ada!");
        return;
    }

    let data = {
        wo,
        area,
        dpp: document.getElementById("dpp").value,
        amount: document.getElementById("amount").value,
        remark: document.getElementById("remark").value
    };

    dataList.push(data);

    renderTable();
    clearForm();
}

// ================= RENDER
function renderTable(){
    let tbody = document.querySelector("#tableData tbody");
    tbody.innerHTML = "";

    dataList.forEach((d,i)=>{

        let badgeRemark = d.remark === "PAID"
            ? `<span class="badge badge-paid">PAID</span>`
            : `<span class="badge badge-not">NOT PAID</span>`;

        let row = `
        <tr>
            <td>${i+1}</td>
            <td>${d.wo}</td>
            <td><span class="badge badge-area">${d.area}</span></td>
            <td>${d.dpp}</td>
            <td>${d.amount}</td>
            <td>${badgeRemark}</td>
        </tr>
        `;

        tbody.innerHTML += row;
    });
}

// ================= FILTER TABLE
function filterTable(col){
    let input = document.querySelectorAll("thead input")[col-1];
    let filter = input.value.toLowerCase();
    let rows = document.querySelectorAll("#tableData tbody tr");

    rows.forEach(row=>{
        let text = row.children[col].innerText.toLowerCase();
        row.style.display = text.includes(filter) ? "" : "none";
    });
}

// ================= CLEAR
function clearForm(){
    document.querySelectorAll("input").forEach(i=>i.value="");
    document.getElementById("remark").value="NOT PAID";
}
