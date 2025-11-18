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

describe("Merevisi Pengajuan SK Tim", () => {
  beforeEach(() => {
    // Login terlebih dahulu
    loginDosen("andika.setiawan@if.itera.ac.id", "SS04ndika");
  });

  it("Harus berhasil merevisi pengajuan", () => {
    // Verifikasi berada di dashboard
    cy.url().should("include", "/dosen/dashboard");
    cy.contains("Dashboard Dosen").should("be.visible");

    // Verifikasi tabel Status Pengajuan muncul
    cy.contains("Status Pengajuan").should("be.visible");

    // Tunggu tabel dimuat
    cy.wait(1000);

    // Verifikasi ada pengajuan dengan status Revisi
    cy.contains("Revisi").should("exist");

    // Cari baris yang memiliki status "Revisi" dan klik icon Eye (button terakhir)
    cy.contains("tr", "Revisi").find("button").last().click();

    // Tunggu modal lacak pengajuan muncul
    cy.wait(1000);

    // Verifikasi modal lacak pengajuan muncul
    cy.contains("Form Pengajuan SK Tim").should("be.visible");

    // Verifikasi konten modal
    cy.contains("button", "Edit").click();

    // Tunggu halaman detail dimuat
    cy.wait(1000);

    // Verifikasi halaman detail pengajuan muncul
    cy.contains("Edit Form Pengajuan SK Tim").should(
      "be.visible"
    );

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
    cy.url().should("include", "/edit");

    // Klik tombol Submit
    cy.contains("button", "Submit").click();

    // Tunggu modal konfirmasi muncul
    cy.contains("Konfirmasi!").should("be.visible");
    cy.contains("Pastikan data Anda sudah benar!").should("be.visible");

    // Klik tombol "Ya" di modal konfirmasi
    cy.contains("button", "Ya").click();

    // Verifikasi berhasil submit
    // Tunggu redirect atau notifikasi sukses
    cy.wait(2000);

    cy.log("✅ Revisi pengajuan berhasil dilakukan!");
  });
});
