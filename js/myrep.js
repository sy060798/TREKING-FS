let dataList = [];
let currentEditId = null;

const hargaArea = {
    "jakarta":300000,
    "surabaya":280000
};

// ================= TAB =================
function showTab(tab){
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.getElementById(tab).classList.add("active");
}

// ================= CHECK ALL =================
function checkAll(el){
    document.querySelectorAll("tbody input").forEach(c=>c.checked = el.checked);
}

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
            <td>${d.wotype||""}</td>
            <td>${d.stb}</td>
            <td>${d.dpp}</td>
            <td>${d.amount}</td>
            <td>${d.remark}</td>
            <td>
                <button onclick="editData('${d.id}')">✏</button>
            </td>
        </tr>`;
    });
}

// ================= IMPORT =================
function importExcel(){
    let file = document.getElementById("upload").files[0];
    let reader = new FileReader();

    reader.onload = e=>{
        let wb = XLSX.read(new Uint8Array(e.target.result),{type:'array'});
        let ws = wb.Sheets[wb.SheetNames[0]];
        let json = XLSX.utils.sheet_to_json(ws);

        dataList = json.map(r=>{
            let area = (r.AREA||"").toLowerCase();
            let stb = parseInt(r.STB)||0;
            let harga = hargaArea[area]||200000;

            let dpp = harga + stb*50000;
            let amount = Math.round(dpp*1.11);

            return {
                id: Date.now()+Math.random(),
                wo: r.WO,
                area: r.AREA,
                stb: stb,
                dpp: dpp,
                amount: amount,
                remark: r.REMARK || "NOT PAID"
            };
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

// ================= EDIT SINGLE =================
function editData(id){
    let d = dataList.find(x=>x.id==id);
    currentEditId = id;

    edit_wo.value = d.wo;
    edit_area.value = d.area;
    edit_stb.value = d.stb;
    edit_remark.value = d.remark;

    modalEdit.style.display="flex";
}

// ================= EDIT MASSAL =================
function editMassal(){
    let checked = [...document.querySelectorAll("tbody input:checked")];

    if(checked.length==0){
        alert("Pilih dulu!");
        return;
    }

    currentEditId = checked.map(c=>c.dataset.id);
    modalEdit.style.display="flex";
}

// ================= SAVE =================
function saveEdit(){

    // MASSAL
    if(Array.isArray(currentEditId)){
        dataList.forEach(d=>{
            if(currentEditId.includes(String(d.id))){
                d.remark = edit_remark.value || d.remark;
            }
        });
    }
    else{
        let d = dataList.find(x=>x.id==currentEditId);

        let area = edit_area.value.toLowerCase();
        let stb = parseInt(edit_stb.value)||0;
        let harga = hargaArea[area]||200000;

        d.wo = edit_wo.value;
        d.area = edit_area.value;
        d.stb = stb;
        d.dpp = harga + stb*50000;
        d.amount = Math.round(d.dpp*1.11);
        d.remark = edit_remark.value;
    }

    renderTable();
    closeModal();
}

// ================= DELETE =================
function hapusTerpilih(){
    let ids = [...document.querySelectorAll("tbody input:checked")]
        .map(c=>c.dataset.id);

    dataList = dataList.filter(d=>!ids.includes(String(d.id)));
    renderTable();
}

// ================= UPDATE =================
function cekUpdate(){
    alert("Data sudah terbaru ✅");
}

// ================= MODAL =================
function closeModal(){
    modalEdit.style.display="none";
}

// ================= PIVOT =================
function showPivot(){
    let total = dataList.reduce((a,b)=>a+b.amount,0);
    document.getElementById("pivotResult").innerHTML =
        "Total Amount: "+total;
}
