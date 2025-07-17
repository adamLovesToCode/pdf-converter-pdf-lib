import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default async function handler(req, res) {
  const data = Array.isArray(req.body) ? req.body[0] : req.body;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const margin = 50;
  let y = height - margin;

  // Verkäuferdaten (Logo optional)
  page.drawText(data.seller.company, {
    x: margin,
    y,
    size: 16,
    font: fontBold,
  });
  y -= 15;
  page.drawText(data.seller.address, { x: margin, y, size: 10, font });
  y -= 12;
  page.drawText(data.seller.email, { x: margin, y, size: 10, font });
  y -= 30;

  // Rechnungstitel & Metadaten
  page.drawText(`Rechnung Nr.: ${data.invoiceNumber}`, {
    x: margin,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 15;
  page.drawText(`Bestelldatum: ${data.orderDate.substring(0, 10)}`, {
    x: margin,
    y,
    size: 11,
    font,
  });
  page.drawText(`Bezahlt am: ${data.datePaid?.substring(0, 10) || "-"}`, {
    x: margin + 200,
    y,
    size: 11,
    font,
  });
  y -= 30;

  // Kundendaten
  page.drawText("Rechnung an:", { x: margin, y, size: 12, font: fontBold });
  y -= 15;
  page.drawText(data.customerName, { x: margin, y, size: 11, font });
  y -= 15;
  page.drawText(data.billingAddress, { x: margin, y, size: 11, font });
  y -= 15;
  page.drawText(data.customerEmail, { x: margin, y, size: 11, font });
  y -= 30;

  // Tabellenkopf
  page.drawText("Produkt", { x: margin, y, size: 11, font: fontBold });
  page.drawText("Menge", { x: 250, y, size: 11, font: fontBold });
  page.drawText("Einzelpreis", { x: 320, y, size: 11, font: fontBold });
  page.drawText("MwSt.", { x: 400, y, size: 11, font: fontBold });
  page.drawText("Gesamt", { x: 480, y, size: 11, font: fontBold });
  y -= 15;

  // Produkte
  data.products.forEach((p) => {
    page.drawText(p.name, { x: margin, y, size: 11, font });
    page.drawText(String(p.quantity), { x: 250, y, size: 11, font });
    page.drawText(`${p.unitPriceGross} ${data.currencySymbol}`, {
      x: 320,
      y,
      size: 11,
      font,
    });
    page.drawText(`${p.taxRate}`, { x: 400, y, size: 11, font });
    page.drawText(`${p.total} ${data.currencySymbol}`, {
      x: 480,
      y,
      size: 11,
      font,
    });
    y -= 15;
  });

  y -= 20;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // Summen
  page.drawText("Versandkosten:", { x: 400, y, size: 11, font });
  page.drawText(`${data.shippingTotal} ${data.currencySymbol}`, {
    x: 480,
    y,
    size: 11,
    font,
  });
  y -= 15;

  page.drawText("Gesamtbetrag:", { x: 400, y, size: 12, font: fontBold });
  page.drawText(`${data.orderTotal} ${data.currencySymbol}`, {
    x: 480,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 30;

  // Zahlungsdetails
  page.drawText(`Zahlungsmethode: ${data.paymentMethod}`, {
    x: margin,
    y,
    size: 11,
    font,
  });
  y -= 15;
  page.drawText(`Transaktions-ID: ${data.transactionId}`, {
    x: margin,
    y,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 30;

  // Hinweis auf §19 UStG
  if (data.isSmallBusinessRegulation && data.seller.vatNotice) {
    page.drawText(data.seller.vatNotice, {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });
    y -= 20;
  }

  // Footer
  page.drawText(data.seller.company, {
    x: margin,
    y: 60,
    size: 9,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });
  page.drawText("Danke für deinen Einkauf!", {
    x: margin,
    y: 45,
    size: 10,
    font,
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Rechnung-${data.invoiceNumber}.pdf`
  );
  res.send(Buffer.from(pdfBytes));
}
