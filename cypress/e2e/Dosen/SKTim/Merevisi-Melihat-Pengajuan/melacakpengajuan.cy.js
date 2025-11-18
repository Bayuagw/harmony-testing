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

describe("Melacak Pengajuan SK Tim", () => {
  beforeEach(() => {
    // Login terlebih dahulu
    loginDosen("andika.setiawan@if.itera.ac.id", "SS04ndika");
  });

  it("Harus berhasil melihat modal lacak pengajuan", () => {
    // Verifikasi berada di dashboard
    cy.url().should("include", "/dosen/dashboard");
    cy.contains("Dashboard Dosen").should("be.visible");

    // Verifikasi tabel Status Pengajuan muncul
    cy.contains("Status Pengajuan").should("be.visible");

    // Tunggu tabel dimuat
    cy.wait(1000);

    // Verifikasi ada data pengajuan dalam tabel
    cy.contains("Form Form Pengajuan SK Tim").should("be.visible");

    // Klik tombol icon Eye (button di sebelah kanan button Detail) pada baris pertama
    // Button Eye biasanya memiliki class atau icon tertentu
    cy.get("tbody tr")
      .first()
      .within(() => {
        // Cari button dengan icon eye atau button terakhir di kolom Aksi
        cy.get("button").last().click();
      });

    // Tunggu modal lacak pengajuan muncul
    cy.wait(500);

    // Verifikasi modal lacak pengajuan muncul
    cy.contains("Form Pengajuan SK Tim").should("be.visible");

    // Verifikasi konten modal
    cy.contains("Tanggal Pengajuan").should("be.visible");
    cy.contains("Status Pengajuan").should("be.visible");
    cy.contains("Keterangan").should("be.visible");
    cy.contains("Timestamp").should("be.visible");

    // Verifikasi ada data status pengajuan dalam tabel modal
    cy.contains("Menunggu verifikasi dari Tendik Kepegawaian").should(
      "be.visible"
    );

    cy.log("✅ Modal lacak pengajuan berhasil ditampilkan!");
  });
});
