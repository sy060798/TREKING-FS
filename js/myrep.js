let dataList = [];

const hargaArea = {
    "purwakarta":280000,
    "surabaya":280000,
    "sidoarjo":280000,
    "pamatang siantar":245000,
    "jakarta":300000,
    "deli serdang":260000
};

// HITUNG
function hitung(){
    let area=document.getElementById("area").value.toLowerCase();
    let stb=parseInt(document.getElementById("stb").value)||0;
    let harga=hargaArea[area]||0;
    let dpp=harga+(stb*50000);
    let amount=dpp*1.11;
    document.getElementById("dpp").value=dpp;
    document.getElementById("amount").value=Math.round(amount);
}

// SIMPAN
function simpan(){
    let wo=document.getElementById("wo").value;

    if(dataList.find(d=>d.wo===wo)){
        alert("WO DOUBLE ❌");return;
    }

    let data={
        id:"WO-"+Math.floor(Math.random()*100000),
        wo,
        area:document.getElementById("area").value,
        wotype:document.getElementById("wotype").value,
        tahun:document.getElementById("tahun").value,
        bulan:document.getElementById("bulan").value,
        stb:document.getElementById("stb").value,
        dpp:document.getElementById("dpp").value,
        amount:document.getElementById("amount").value,
        tgl:document.getElementById("tgl").value,
        payment:document.getElementById("payment").value,
        remark:document.getElementById("remark").value,
        invoice:document.getElementById("invoice").value,
        note:document.getElementById("note").value,
        checked:false
    };

    dataList.push(data);
    renderTable();
    clearForm();
    alert("READY ✅");
}

// RENDER
function renderTable(){
    let tbody=document.querySelector("#tableData tbody");
    tbody.innerHTML="";

    dataList.forEach((d,i)=>{
        tbody.innerHTML+=`
        <tr>
        <td>${i+1}</td>
        <td><input type="checkbox" onchange="toggleCheck('${d.id}')"></td>
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
        </tr>`;
    });
}

// FILTER
function applyFilter(){
    let fwo=document.getElementById("f_wo").value.toLowerCase();
    let ftahun=document.getElementById("f_tahun").value;
    let fbulan=document.getElementById("f_bulan").value;
    let finv=document.getElementById("f_invoice").value.toLowerCase();

    document.querySelectorAll("#tableData tbody tr").forEach(row=>{
        let wo=row.children[3].innerText.toLowerCase();
        let tahun=row.children[6].innerText;
        let bulan=row.children[7].innerText;
        let inv=row.children[14].innerText.toLowerCase();

        row.style.display=
        wo.includes(fwo)&&
        tahun.includes(ftahun)&&
        bulan.includes(fbulan)&&
        inv.includes(finv)?"":"none";
    });
}

// CHECK
function toggleCheck(id){
    let d=dataList.find(x=>x.id===id);
    d.checked=!d.checked;
}

// HAPUS
function hapus(id){
    dataList=dataList.filter(d=>d.id!==id);
    renderTable();
}

// HAPUS MASSAL
function hapusTerpilih(){
    dataList=dataList.filter(d=>!d.checked);
    renderTable();
}

// EDIT
function editData(id){
    let d=dataList.find(x=>x.id===id);
    Object.keys(d).forEach(k=>{
        if(document.getElementById(k)){
            document.getElementById(k).value=d[k];
        }
    });
    hitung();
    hapus(id);
}

// UPDATE MASSAL
function updateMassal(){
    let remark=prompt("Remark?");
    let invoice=prompt("Invoice?");

    dataList.forEach(d=>{
        if(d.checked){
            if(remark)d.remark=remark;
            if(invoice)d.invoice=invoice;
        }
    });

    renderTable();
}

// CLEAR
function clearForm(){
    document.querySelectorAll("input").forEach(i=>i.value="");
}

// IMPORT EXCEL
function importExcel(){
    let file=document.getElementById("uploadExcel").files[0];
    if(!file)return alert("Pilih file!");

    let reader=new FileReader();
    reader.onload=e=>{
        let wb=XLSX.read(e.target.result,{type:'array'});
        let data=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

        let ok=0,dup=0;

        data.forEach(r=>{
            if(dataList.find(d=>d.wo===r.WO)){dup++;return;}

            dataList.push({
                id:"WO-"+Math.random(),
                wo:r.WO,
                area:r.AREA||"",
                wotype:r["WO TYPE"]||"",
                tahun:r.TAHUN||"",
                bulan:r.MONTH||"",
                stb:0,
                dpp:0,
                amount:0,
                tgl:r["TANGGAL PENGERJAAN"]||"",
                payment:"",
                remark:"NOT PAID",
                invoice:"",
                note:"",
                checked:false
            });
            ok++;
        });

        renderTable();
        alert(`Import selesai\nMasuk:${ok}\nDouble:${dup}`);
    };
    reader.readAsArrayBuffer(file);
}

// EXPORT
function exportExcel(){
    let data=dataList.map(d=>({
        ID:d.id,WO:d.wo,AREA:d.area,"WO TYPE":d.wotype,
        TAHUN:d.tahun,MONTH:d.bulan,DPP:d.dpp,AMOUNT:d.amount,
        TANGGAL:d.tgl,PAYMENT:d.payment,REMARK:d.remark,
        INVOICE:d.invoice,NOTE:d.note
    }));

    let ws=XLSX.utils.json_to_sheet(data);
    let wb=XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb,ws,"DATA");
    XLSX.writeFile(wb,"tracking.xlsx");
}
