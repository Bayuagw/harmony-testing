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

describe("Mengganti Role dari Dosen ke Koor Prodi", () => {
  beforeEach(() => {
    // Login terlebih dahulu
    loginDosen("andika.setiawan@if.itera.ac.id", "SS04ndika");
  });

  it("Harus berhasil mengganti role dari Dosen ke Koor Prodi", () => {
    // Verifikasi berada di dashboard dosen
    cy.url().should("include", "/dosen/dashboard");
    cy.contains("Dashboard Dosen").should("be.visible");

    // Tunggu halaman dashboard dimuat
    cy.wait(1000);

    // Klik "Ganti Role" pada kanan atas
    cy.contains("Ganti Role").click();

    // Tunggu dropdown/menu pilihan role muncul
    cy.wait(500);

    // Verifikasi dropdown role muncul
    cy.contains("Ganti Role:").should("be.visible");

    // Verifikasi beberapa pilihan role terlihat
    cy.contains("ketua kk").should("be.visible");
    cy.contains("koor prodi").should("be.visible");
    cy.contains("Dosen").should("be.visible");

    // Klik role "koor prodi"
    cy.contains("koor prodi").click();

    // Tunggu halaman dashboard Koor Prodi dimuat
    cy.wait(2000);

    // Verifikasi halaman dashboard Koor Prodi muncul
    cy.contains("Dashboard Koor Prodi").should("be.visible");

    // Verifikasi URL berubah ke dashboard Koor Prodi
    cy.url().should("include", "/koor-prodi/dashboard");

    // Verifikasi menu sidebar Koor Prodi muncul
    cy.contains("Dashboard Koor Prodi").should("be.visible");
    cy.contains("Tampilkan pengajuan dari:").should("be.visible");
    cy.contains("Status Pengajuan").should("be.visible");

    cy.log("✅ Berhasil mengganti role ke Koor Prodi!");
  });
});
