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

describe("Konfirmasi Pengajuan SK Tim - Tendik Kepegawaian", () => {
  beforeEach(() => {
    loginTendik("ade.setiawan@staff.itera.ac.id", "setiawan19");
  });

  it("Harus berhasil mengonfirmasi pengajuan SK Tim", () => {
    // Verifikasi berada di dashboard Tendik Kepegawaian
    cy.url().should("include", "/tendik/dashboard");
    cy.contains("Dashboard tendik kepegawaian").should("be.visible");

    // Klik menu "Konfirmasi Hasil" di sidebar
    cy.contains("Konfirmasi Hasil").click();

    // Tunggu halaman Konfirmasi Hasil dimuat
    cy.wait(1000);

    // Verifikasi halaman Konfirmasi Hasil muncul
    cy.url().should("include", "/confirm");
    cy.contains("Konfirmasi Pengajuan Kepegawaiaan").should("be.visible");

    // Tunggu tabel dimuat
    cy.wait(1000);

    // Klik icon ceklis (button dengan SVG lucide-circle-check-big) pada kolom Aksi
    cy.get("svg.lucide-circle-check-big").first().parent("button").click();

    // Tunggu modal konfirmasi muncul
    cy.wait(500);

    // Verifikasi modal konfirmasi muncul
    cy.contains("Konfirmasi!").should("be.visible");

    // Ketik "Konfirmasi" pada input field di modal
    cy.get('input[type="text"]').type("Konfirmasi");

    // Klik tombol konfirmasi di modal
    cy.contains("button", "Konfirmasi").click();

    // Tunggu proses konfirmasi selesai
    cy.wait(2000);

    // Verifikasi kembali ke halaman Konfirmasi Pengajuan Kepegawaian
    cy.url().should("include", "/confirm");
    cy.contains("Konfirmasi Pengajuan Kepegawaiaan").should("be.visible");

    cy.log(
      "✅ Pengajuan berhasil dikonfirmasi dan kembali ke halaman Konfirmasi Pengajuan Kepegawaian!"
    );
  });
});
