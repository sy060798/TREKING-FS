function simpan(){
    let nama = document.getElementById("nama").value;
    let customer = document.getElementById("customer").value;
    let alamat = document.getElementById("alamat").value;
    let status = document.getElementById("status").value;

    if(!nama || !customer){
        alert("Isi data dulu!");
        return;
    }

    console.log({
        nama,
        customer,
        alamat,
        status,
        jenis: "MYREP"
    });

    alert("Data siap dikirim ke server 🔥");
}

function kembali(){
    window.location.href = "../index.html";
}
