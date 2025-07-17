const { IncomingForm } = require("formidable");
const fs = require("fs");
const puppeteer = require("puppeteer");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).send("Only POST allowed");
  }

  const form = new IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Form error:", err);
      return res.status(500).send("Form parsing failed");
    }

    console.log("📥 Uploaded files:", files);
    console.log("📥 Uploaded fields:", fields);

    // const file = files.file;
    // if (!file || !file.filepath || !file.mimetype.includes("html")) {
    //   return res.status(400).send("Invalid file upload");
    // }
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file || !file.filepath || !file.mimetype.includes("html")) {
      return res.status(400).send("Invalid file upload");
    }

    try {
      const html = fs.readFileSync(file.filepath, "utf-8");

      //   const browser = await puppeteer.launch({
      //     args: ["--no-sandbox", "--disable-setuid-sandbox"],
      //   });

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        headless: "new", // <- Wichtig bei neueren Puppeteer-Versionen
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({ format: "A4" });
      await browser.close();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "attachment; filename=document.pdf");
      res.end(pdfBuffer);
    } catch (err) {
      console.error("Conversion error:", err);
      res.status(500).send("Failed to generate PDF");
    }
  });
};
