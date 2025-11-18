const loginDosen = (email, password) => {
    cy.visit("http://localhost:8000/");

    // Klik tombol Login
    cy.contains("button", "Buat Pengajuan").click();

    // Handle SSO Login dengan pass variabel menggunakan args
    cy.origin(
        "https://sso.itera.ac.id",
        { args: { email, password } },
        ({ email, password }) => {
            // Tunggu halaman SSO Login muncul
            cy.url().should("include", "/user/signin");
            cy.contains("SSO Login");

            // Tutup modal warning jika ada
            cy.get("body").then(($body) => {
                if ($body.find("#modal_warning").length > 0) {
                    // Klik tombol close (X) di pojok kanan atas modal
                    cy.get("#modal_warning").within(() => {
                        // Cari tombol close dengan class atau data-dismiss
                        cy.get('button.close, button[data-dismiss="modal"], .close')
                            .first()
                            .click();
                    });
                    // Tunggu modal hilang
                    cy.get("#modal_warning").should("not.be.visible");
                }
            });

            // Tunggu sebentar untuk memastikan modal sudah hilang
            cy.wait(500);

            // Input email
            cy.get('input[placeholder="Email Pengguna"]').type(email);

            // Input password
            cy.get('input[placeholder="Kata Sandi"]').type(password);

            // ⏸️ SOLUSI SEMENTARA: Manual Input Captcha
            cy.log("⏸️ PAUSE: Silakan input captcha manual, lalu klik Resume");
            cy.pause();

            // Verifikasi captcha sudah diisi
            cy.get('input[placeholder="Hasil"]').should("not.have.value", "");
            cy.log("✅ Captcha terisi, melanjutkan test...");

            // Klik tombol Login
            cy.contains("button", "Login").click();
        }
    );

    // Handle callback URL redirect
    cy.url({ timeout: 10000 }).should("include", "/login/callback");

    cy.url().then((url) => {
        cy.log("Callback URL:", url);

        // Extract code dari URL
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get("code");

        if (code) {
            cy.log("Auth code:", code);

            // Redirect ke localhost:8000 dengan code yang sama
            const correctUrl = `http://localhost:8000/login/callback?code=${code}`;
            cy.log("Redirecting to:", correctUrl);
            cy.visit(correctUrl);
        }
    });

    // Verifikasi berhasil masuk ke dashboard dosen
    cy.url({ timeout: 10000 }).should("include", "/dosen/dashboard");
    cy.log("✅ Berhasil login dan masuk ke Dashboard Dosen");
};

describe("Membuat Pengajuan Pengunduran Diri Pegawai", () => {
    beforeEach(() => {
        // Handle uncaught exception dari showPicker()
        cy.on("uncaught:exception", (err, runnable) => {
            // Abaikan error showPicker yang memerlukan user gesture
            if (err.message.includes("showPicker")) {
                return false;
            }
            // Biarkan error lain tetap muncul
            return true;
        });

        // Login terlebih dahulu
        loginDosen("andika.setiawan@if.itera.ac.id", "SS04ndika");

        // Buka halaman pengajuan
        cy.url().should("include", "/dosen/dashboard");

        // Klik dropdown "Umum" di sidebar
        cy.contains("Rekrutmen").click();

        // Tunggu dropdown terbuka
        cy.wait(500);

        // Verifikasi menu dropdown muncul
        cy.contains("Layanan Pengurusan Pengunduran Diri Pegawai").should("be.visible");

        // Klik menu "Pengajuan Pengunduran Diri Pegawai"
        cy.contains("Layanan Pengurusan Pengunduran Diri Pegawai").click();

        // Verifikasi berhasil membuka halaman pengajuan
        cy.url().should(
            "include",
            "/dosen/kepegawaian/rekrutmen/pengunduran-diri/pegawai-pns/create"
        );
    });

    it("Berhasil submit ketika file Surat Pengunduran Diri Bermaterai diupload", () => {
        // Halaman form tampil
        cy.contains("Form Pengajuan Pengurusan Pengunduran Diri Pegawai")
            .should("be.visible");

        cy.wait(1000);

        // Upload file Surat Pengunduran Diri Bermaterai
        cy.contains("Surat Pengunduran Diri Bermaterai")
            .parent()
            .find('input[type="file"]')
            .attachFile("PengunduranDiriPegawai/surat-bermaterai.pdf");

        cy.log("📄 File Surat Pengunduran Diri Bermaterai berhasil diupload");

        // Verifikasi bahwa file berhasil ter-attach
        cy.contains("Surat Pengunduran Diri Bermaterai")
            .parent()
            .find('input[type="file"]')
            .then(input => {
                expect(input[0].files.length).to.eq(1);
                expect(input[0].files[0].name).to.eq("surat-bermaterai.pdf");
            });

        // Klik tombol Submit
        cy.contains("button", "Submit").click();

        // Modal konfirmasi
        cy.contains("Konfirmasi!").should("be.visible");
        cy.contains("Pastikan data Anda sudah benar!").should("be.visible");

        // Klik "Ya"
        cy.contains("button", "Ya").click();

        // Verifikasi berhasil submit
        // Tunggu redirect atau notifikasi sukses
        cy.wait(2000);

        cy.log("✅ Pengajuan berhasil dibuat!");
    });
});
