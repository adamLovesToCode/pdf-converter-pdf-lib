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

  // LINKS: Verkäuferdaten
  page.drawText("Aurelius Shirts", { x: margin, y, size: 16, font: fontBold });
  y -= 15;
  page.drawText("Hertzstr. 57", { x: margin, y, size: 10, font });
  y -= 12;
  page.drawText("13158 Berlin", { x: margin, y, size: 10, font });
  y -= 12;
  page.drawText("adam.konopka@aurelius-shirts.com", {
    x: margin,
    y,
    size: 10,
    font,
  });

  // RECHTS: Rechnungsdetails
  let yRight = height - margin;
  const rightX = width - margin - 200;
  page.drawText("Rechnung", { x: rightX, yRight, size: 16, font: fontBold });
  y -= 15;
  yRight -= 18;
  page.drawText(`Rechnung Nr.: ${data.invoiceNumber}`, {
    x: rightX,
    y: yRight,
    size: 11,
    font,
  });
  yRight -= 14;
  page.drawText(`Bestelldatum: ${data.orderDate?.substring(0, 10)}`, {
    x: rightX,
    y: yRight,
    size: 11,
    font,
  });
  yRight -= 14;
  page.drawText(`Bezahlt am: ${data.datePaid?.substring(0, 10) || "-"}`, {
    x: rightX,
    y: yRight,
    size: 11,
    font,
  });

  // KUNDENDATEN
  y -= 60;
  page.drawText("Rechnung an:", { x: margin, y, size: 12, font: fontBold });
  y -= 15;
  page.drawText(data.customerName, { x: margin, y, size: 11, font });
  y -= 15;
  page.drawText(data.billingAddress, { x: margin, y, size: 11, font });
  y -= 15;
  page.drawText(data.customerEmail, { x: margin, y, size: 11, font });

  // ZAHLUNGSMETHODE
  y -= 30;
  page.drawText(`Zahlungsmethode: ${data.paymentMethod}`, {
    x: width - margin - 200,
    y,
    size: 11,
    font,
  });
  y -= 20;

  // TABELLENKOPF
  page.drawText("Produkt", { x: margin, y, size: 11, font: fontBold });
  page.drawText("Menge", { x: 230, y, size: 11, font: fontBold });
  page.drawText("Einzelpreis", { x: 300, y, size: 11, font: fontBold });
  page.drawText("MwSt.", { x: 400, y, size: 11, font: fontBold });
  page.drawText("Gesamt", { x: 480, y, size: 11, font: fontBold });
  y -= 14;

  // PRODUKTE
  data.products.forEach((p) => {
    page.drawText(p.name, { x: margin, y, size: 11, font });
    page.drawText(String(p.quantity), { x: 230, y, size: 11, font });
    page.drawText(`${p.unitPriceGross} ${data.currencySymbol}`, {
      x: 300,
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

  // TRENNLINIE
  y -= 10;
  page.drawLine({
    start: { x: margin, y },
    end: { x: width - margin, y },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });
  y -= 20;

  // VERSAND + GESAMT
  page.drawText("Versandkosten:", { x: 400, y, size: 11, font });
  page.drawText(`${data.shippingTotal} ${data.currencySymbol}`, {
    x: 490,
    y,
    size: 11,
    font,
  });
  y -= 15;

  page.drawText("Gesamtbetrag:", { x: 400, y, size: 12, font: fontBold });
  page.drawText(`${data.orderTotal} ${data.currencySymbol}`, {
    x: 490,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 30;

  // KLEINUNTERNEHMER-HINWEIS
  page.drawText(
    "Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
    {
      x: margin,
      y,
      size: 10,
      font,
      color: rgb(0.4, 0.4, 0.4),
    }
  );

  // FOOTER
  const footerY = 60;
  page.drawText(
    "Adam Konopka\nHertzstr. 57\n13158 Berlin\ntel. +49 176 123123123\nadam.konopka@aurelius-shirts.com",
    {
      x: margin,
      y: footerY,
      size: 8,
      font,
      lineHeight: 10,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  page.drawText("USt-ID: DE123456789", {
    x: width / 2 - 40,
    y: footerY,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText("Dies ist ein automatisch erstelltes PDF.", {
    x: width - margin - 160,
    y: footerY,
    size: 8,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=Rechnung-${data.invoiceNumber}.pdf`
  );
  res.send(Buffer.from(pdfBytes));
}
