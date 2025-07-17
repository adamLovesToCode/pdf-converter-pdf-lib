const puppeteer = require("puppeteer");
const multer = require("multer");
const upload = multer();

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST method is allowed.");
  }

  // HTML-Datei entgegennehmen
  await new Promise((resolve, reject) => {
    upload.single("file")(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const file = req.file;
  if (!file || !file.originalname.endsWith(".html")) {
    return res.status(400).send("Please upload a valid .html file.");
  }

  const htmlContent = file.buffer.toString("utf-8");

  // PDF generieren mit Puppeteer
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  // PDF zurückgeben
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=document.pdf");
  res.send(pdfBuffer);
};
