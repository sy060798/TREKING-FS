// ================= GLOBAL =================
let dataList = [];
let currentEditId = null;
let chart = null;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS READY ✅");

    const upload = document.getElementById("upload");
    if(upload){
        upload.addEventListener("change", importExcel);
    }
});

// ================= TAB =================
function showTab(tab){
    document.querySelectorAll(".tab").forEach(t=>{
        t.classList.remove("active");
    });

    const el = document.getElementById(tab);
    if(el) el.classList.add("active");

    if(tab === "pivot"){
        generatePivot();
    }
}

// ================= IMPORT EXCEL =================
function importExcel(e){
    const file = e.target.files[0];
    if(!file){
        alert("File tidak ada ❌");
        return;
    }

    const reader = new FileReader();

    reader.onload = function(evt){
        try{
            const data = new Uint8Array(evt.target.result);
            const wb = XLSX.read(data, {type:'array'});

            dataList = [];

            wb.SheetNames.forEach(sheetName=>{
                const ws = wb.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(ws);

                json.forEach(r=>{
                    let stb = parseInt(r.STB) || 0;
                    let dpp = 200000 + (stb * 50000);
                    let amount = Math.round(dpp * 1.11);

                    dataList.push({
                        id: r.ID || r.Id || r.id || Math.floor(1000000 + Math.random()*9000000),
                        wo: r.WO || "",
                        area: r.AREA || "",
                        wotype: r["WO TYPE"] || "",
                        stb: stb,
                        dpp: dpp,
                        amount: amount,
                        remark: r.REMARK || "NOT PAID"
                    });
                });
            });

            renderTable();
            alert("Upload berhasil ✅");

        }catch(err){
            console.error(err);
            alert("Error baca file ❌");
        }
    };

    reader.readAsArrayBuffer(file);
}

// ================= RENDER TABLE =================
function renderTable(){
    const tbody = document.querySelector("#tableData tbody");
    if(!tbody) return;

    tbody.innerHTML = "";

    dataList.forEach((d,i)=>{
        let row = `
        <tr>
            <td>${i+1}</td>
            <td><input type="checkbox" data-id="${d.id}"></td>
            <td>${d.id}</td>
            <td>${d.wo}</td>
            <td>${d.area}</td>
            <td>${d.wotype}</td>
            <td>${d.stb}</td>
            <td>${d.dpp}</td>
            <td>${d.amount}</td>
            <td>${d.remark}</td>
            <td>
                <button onclick="editData('${d.id}')">✏</button>
            </td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// ================= EXPORT =================
function exportExcel(){
    if(dataList.length === 0){
        alert("Data kosong ❌");
        return;
    }

    const ws = XLSX.utils.json_to_sheet(dataList);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DATA");

    XLSX.writeFile(wb, "data_myrep.xlsx");
}

// ================= EDIT SINGLE =================
function editData(id){
    const d = dataList.find(x => String(x.id) === String(id));
    if(!d) return;

    currentEditId = id;

    document.getElementById("edit_wo").value = d.wo;
    document.getElementById("edit_area").value = d.area;
    document.getElementById("edit_stb").value = d.stb;
    document.getElementById("edit_remark").value = d.remark;

    document.getElementById("modalEdit").style.display = "flex";
}

// ================= EDIT MASSAL =================
function editMassal(){
    const checked = [...document.querySelectorAll("tbody input[type=checkbox]:checked")];

    if(checked.length === 0){
        alert("Pilih data dulu ❌");
        return;
    }

    currentEditId = checked.map(c => c.dataset.id);

    document.getElementById("modalEdit").style.display = "flex";
}

// ================= SAVE =================
function saveEdit(){

    if(Array.isArray(currentEditId)){
        dataList.forEach(d=>{
            if(currentEditId.includes(String(d.id))){
                d.remark = document.getElementById("edit_remark").value || d.remark;
            }
        });
    }else{
        const d = dataList.find(x => String(x.id) === String(currentEditId));
        if(!d) return;

        let stb = parseInt(document.getElementById("edit_stb").value) || 0;

        d.wo = document.getElementById("edit_wo").value;
        d.area = document.getElementById("edit_area").value;
        d.stb = stb;
        d.dpp = 200000 + (stb * 50000);
        d.amount = Math.round(d.dpp * 1.11);
        d.remark = document.getElementById("edit_remark").value;
    }

    renderTable();
    closeModal();
}

// ================= DELETE =================
function hapusTerpilih(){
    const ids = [...document.querySelectorAll("tbody input:checked")]
        .map(c => c.dataset.id);

    if(ids.length === 0){
        alert("Tidak ada yang dipilih ❌");
        return;
    }

    dataList = dataList.filter(d => !ids.includes(String(d.id)));

    renderTable();
}

// ================= UPDATE =================
function cekUpdate(){
    alert("Data sudah terbaru ✅");
}

// ================= MODAL =================
function closeModal(){
    document.getElementById("modalEdit").style.display = "none";
}

// ================= PIVOT =================
function generatePivot(){

    if(dataList.length === 0){
        alert("Data kosong ❌");
        return;
    }

    let group = {};

    dataList.forEach(d=>{
        let key = d.area || "UNKNOWN";

        if(!group[key]) group[key] = 0;
        group[key] += d.amount;
    });

    let labels = Object.keys(group);
    let values = Object.values(group);

    const ctx = document.getElementById("chartPivot");

    if(chart) chart.destroy();

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Amount',
                data: values
            }]
        }
    });
}
