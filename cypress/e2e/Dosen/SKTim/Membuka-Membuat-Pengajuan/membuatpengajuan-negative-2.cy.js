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

describe("Membuat Pengajuan Surat Keterangan Kerja - Negative Test (Lampiran Anggota Kosong)", () => {
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
    cy.contains("Umum").click();
    cy.wait(500);

    // Klik menu "Pengajuan Pembuatan SK Tim"
    cy.contains("Pengajuan Pembuatan SK Tim").click();

    // Verifikasi berhasil membuka halaman pengajuan
    cy.url().should(
      "include",
      "/dosen/kepegawaian/umum/pengajuan-sk-tim/create"
    );
  });

  it("Tidak boleh submit dengan field Lampiran Anggota kosong", () => {
    // Verifikasi form pengajuan muncul
    cy.contains("Form Pengajuan SK Tim").should("be.visible");

    // Tunggu form sepenuhnya dimuat
    cy.wait(1000);

    // Tanggal Mulai SK TIDAK DIISI (dikosongkan)
    cy.get('input[name="tgl_mulai"]').type("2025-11-15", { force: true });
    cy.log("✅ Tanggal Mulai SK terisi");

    // Isi Tanggal Selesai SK
    cy.get('input[name="tgl_selesai"]').type("2026-11-20", { force: true });
    cy.log("✅ Tanggal Selesai Kerja terisi");

    //Isi Lampiran Anggota
    cy.contains("Lampiran Anggota")
      .parent()
      .find("input")
      .clear()
      .type(" ");

    // Verifikasi lampiran anggota terisi
    cy.contains("Lampiran Anggota")
      .parent()
      .find("input")
      .should("have.value", " ");
    cy.log("✅ Lampiran Anggota Kosong");

    // Isi Keperluan SK Tim
    // Cari input berdasarkan label atau name attribute
    cy.contains("Keperluan SK Tim")
      .parent()
      .find("input")
      .clear()
      .type("Akreditasi");

    // Verifikasi keperluan terisi
    cy.contains("Keperluan SK Tim")
      .parent()
      .find("input")
      .should("have.value", "Akreditasi");
    cy.log("✅ Keperluan SK Tim terisi");

    // Klik tombol Submit
    cy.contains("button", "Submit").click();

    // Tunggu modal konfirmasi muncul
    cy.contains("Konfirmasi!").should("be.visible");
    cy.contains("Pastikan data Anda sudah benar!").should("be.visible");

    // Klik tombol "Ya" di modal konfirmasi
    cy.contains("button", "Ya").click();

    // Verifikasi validasi error muncul atau submit gagal
    cy.wait(1000);

    // Verifikasi masih di halaman yang sama (tidak redirect)
    cy.url().should(
      "include",
      "/dosen/kepegawaian/umum/pengajuan-sk-tim/create"
    );

    cy.log("✅ Validasi berhasil: Submit gagal karena field tanggal mulai kosong");
  });
});
