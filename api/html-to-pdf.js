import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export default async function handler(req, res) {
  const order = Array.isArray(req.body) ? req.body[0] : req.body;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();

  const margin = 50;
  let y = height - margin;

  // Header
  page.drawText("AURELIUS SHIRTS", { x: margin, y, size: 18, font: fontBold });
  y -= 30;

  page.drawText(`Rechnung Nr.: ${order.number}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 15;
  page.drawText(`Datum: ${order.date_created.substring(0, 10)}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 30;

  // Kundenadresse
  const billing = order.billing;
  page.drawText("Rechnung an:", { x: margin, y, size: 12, font: fontBold });
  y -= 15;
  page.drawText(`${billing.first_name} ${billing.last_name}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 15;
  page.drawText(`${billing.address_1}`, { x: margin, y, size: 12, font });
  y -= 15;
  page.drawText(`${billing.postcode} ${billing.city}`, {
    x: margin,
    y,
    size: 12,
    font,
  });
  y -= 30;

  // Tabellenkopf
  page.drawText("Produkt", { x: margin, y, size: 12, font: fontBold });
  page.drawText("Menge", { x: 300, y, size: 12, font: fontBold });
  page.drawText("Einzelpreis", { x: 380, y, size: 12, font: fontBold });
  page.drawText("Gesamt", { x: 470, y, size: 12, font: fontBold });
  y -= 15;

  // Produktpositionen
  const items = order.line_items;
  items.forEach((item) => {
    const sizeMeta = item.meta_data.find((meta) => meta.key === "pa_groesse");
    const size = sizeMeta ? ` (Größe: ${sizeMeta.value})` : "";
    const name = item.name + size;

    page.drawText(name, { x: margin, y, size: 11, font });
    page.drawText(`${item.quantity}`, { x: 300, y, size: 11, font });
    page.drawText(`${Number(item.price).toFixed(2)} €`, {
      x: 380,
      y,
      size: 11,
      font,
    });
    page.drawText(`${Number(item.total).toFixed(2)} €`, {
      x: 470,
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

  // Summenbereich
  const rightAlign = 470;

  page.drawText(`Zwischensumme:`, { x: rightAlign - 100, y, size: 11, font });
  page.drawText(
    `${order.line_items
      .reduce((sum, i) => sum + parseFloat(i.total), 0)
      .toFixed(2)} €`,
    { x: rightAlign, y, size: 11, font }
  );
  y -= 15;

  page.drawText(`Versand:`, { x: rightAlign - 100, y, size: 11, font });
  page.drawText(`${order.shipping_total} €`, {
    x: rightAlign,
    y,
    size: 11,
    font,
  });
  y -= 15;

  page.drawText(`Gesamtsumme:`, {
    x: rightAlign - 100,
    y,
    size: 12,
    font: fontBold,
  });
  page.drawText(`${order.total} €`, {
    x: rightAlign,
    y,
    size: 12,
    font: fontBold,
  });
  y -= 30;

  // Zahlungsart
  page.drawText(`Bezahlmethode: ${order.payment_method_title}`, {
    x: margin,
    y,
    size: 11,
    font,
  });

  // Footer
  y = 80;
  page.drawText(
    "Aurelius GmbH · Musterstraße 1 · 12345 Berlin · aurelius-shirts.com",
    {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    }
  );

  const pdfBytes = await pdfDoc.save();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=rechnung-${order.number}.pdf`
  );
  res.send(Buffer.from(pdfBytes));
}
