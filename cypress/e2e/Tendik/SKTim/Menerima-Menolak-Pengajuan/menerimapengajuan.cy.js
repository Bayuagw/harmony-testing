const loginTendik = (email, password) => {
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

  // Verifikasi berhasil masuk ke dashboard tendik
  cy.url({ timeout: 10000 }).should("include", "/tendik/dashboard");
  cy.log("✅ Berhasil login dan masuk ke Dashboard Tendik Kepegawaian");
};

describe("Menerima Pengajuan SK Tim - Tendik Kepegawaian", () => {
  beforeEach(() => {
    loginTendik("ade.setiawan@staff.itera.ac.id", "setiawan19");
  });

  it("Harus berhasil menerima pengajuan SK Tim", () => {
    // Verifikasi berada di dashboard Tendik Kepegawaian
    cy.url().should("include", "/tendik/dashboard");
    cy.contains("Dashboard tendik kepegawaian").should("be.visible");

    // Verifikasi tabel Status Pengajuan muncul
    cy.contains("Status Pengajuan").should("be.visible");

    // Tunggu tabel dimuat
    cy.wait(1000);

    // Verifikasi ada data pengajuan dalam tabel
    cy.contains("Form Pengajuan SK Tim").should("be.visible");

    // Klik tombol "Detail" dalam baris yang mengandung "Form Pengajuan SK Tim"
    // Cari parent row terlebih dahulu, lalu klik Detail di row tersebut
    cy.contains("tr", "Form Pengajuan SK Tim")
      .find("button")
      .contains("Detail")
      .click();

    // Tunggu halaman detail dimuat
    cy.wait(2000);

    // Verifikasi halaman detail pengajuan muncul dengan URL
    cy.url().should("include", "/pengajuan-sk-tim/");

    // Verifikasi section Data Dosen muncul
    cy.contains("Detail Data Pengajuan SK Tim").should("be.visible");
    cy.contains("Data Dosen").should("be.visible");

    // Verifikasi tombol Tolak dan Terima ada
    cy.contains("button", "Tolak").should("be.visible");
    cy.contains("button", "Terima").should("be.visible");

    // Verifikasi beberapa field data dosen terlihat
    cy.contains("Nama").should("be.visible");
    cy.contains("NIP / NRK").should("be.visible");
    cy.contains("Tanggal Mulai SK Berlaku").should("be.visible");
    cy.contains("Tanggal Selesai SK Berlaku").should("be.visible");
    cy.contains("Lampiran Anggota").should("be.visible");
    cy.contains("Keperluan SK Tim").should("be.visible");

    // Klik tombol "Terima" berwarna merah
    cy.contains("button", "Terima").click();

    // Tunggu modal konfirmasi muncul
    cy.wait(500);

    // Verifikasi modal konfirmasi muncul
    cy.contains("Konfirmasi!").should("be.visible");
    cy.contains("Pastikan data Anda sudah benar!").should("be.visible");

    // Klik tombol "Ya" di modal konfirmasi
    cy.contains("button", "Ya").click();

    // Tunggu redirect ke dashboard
    cy.wait(2000);

    // Verifikasi kembali ke halaman dashboard
    cy.url().should("include", "/tendik/dashboard");
    cy.contains("Dashboard tendik kepegawaian").should("be.visible");

    cy.log("✅ Pengajuan berhasil diterima dan kembali ke dashboard!");
  });
});
