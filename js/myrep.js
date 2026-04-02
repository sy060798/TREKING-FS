const hargaArea = {
    "purwakarta": 280000,
    "surabaya": 280000,
    "sidoarjo": 280000,
    "pamatang siantar": 245000,
    "jakarta": 300000,
    "deli serdang": 260000
};

function hitung(){
    let area = document.getElementById("area").value.toLowerCase();
    let stb = parseInt(document.getElementById("stb").value) || 0;

    let harga = hargaArea[area] || 0;

    let dpp = harga + (stb * 50000);
    let amount = dpp * 1.11;

    document.getElementById("dpp").value = dpp;
    document.getElementById("amount").value = amount.toFixed(0);
}

function simpan(){
    let data = {
        wo: document.getElementById("wo").value,
        area: document.getElementById("area").value,
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

    console.log(data);
    alert("Data siap dikirim ke server 🚀");
}
