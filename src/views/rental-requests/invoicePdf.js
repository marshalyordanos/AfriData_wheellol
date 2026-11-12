import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import { methodLabel } from "./rentalRequestHelpers";

const money = (n) =>
  n === null || n === undefined
    ? "-"
    : `${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETB`;

const NAVY = [9, 35, 76];
const ORANGE = [252, 107, 56];
const GRAY = [100, 116, 139];

/**
 * Builds and downloads a payment invoice / receipt PDF.
 * `p` is one row from GET /rental-requests/payments/all
 */
export function downloadInvoicePdf(p) {
  const r = p.request;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;

  // header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Wheellol", M, 45);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Car with driver rental", M, 64);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT INVOICE", W - M, 45, { align: "right" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(p.invoiceNo, W - M, 64, { align: "right" });

  // meta
  let y = 125;
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.text("BILLED TO", M, y);
  doc.text("PAYMENT DETAILS", W / 2 + 10, y);
  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(r.contactName || "-", M, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(r.contactPhone || "", M, y + 34);
  if (r.contactEmail) doc.text(r.contactEmail, M, y + 48);

  const meta = [
    ["Invoice no.", p.invoiceNo],
    ["Date paid", dayjs(p.paidAt).format("DD MMM YYYY, HH:mm")],
    ["Method", methodLabel(p.method)],
    ["Reference", p.reference || "-"],
  ];
  meta.forEach(([k, v], i) => {
    doc.setTextColor(...GRAY);
    doc.text(k, W / 2 + 10, y + 18 + i * 15);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v), W - M, y + 18 + i * 15, { align: "right" });
  });

  // booking table
  y += 95;
  autoTable(doc, {
    startY: y,
    head: [["Booking", "Trip", "Pickup date", "Days"]],
    body: [
      [
        r.trackingCode,
        `${r.pickupCity} -> ${(r.destinations || []).join(", ") || "-"}`,
        dayjs(r.pickupDate).format("DD MMM YYYY"),
        String(r.days),
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: NAVY },
    styles: { fontSize: 10 },
    margin: { left: M, right: M },
  });

  // amounts table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 20,
    head: [["Description", "Amount"]],
    body: [
      [`Payment #${p.paymentNumber} of ${r.paymentCount} for booking ${r.trackingCode}`, money(p.amount)],
    ],
    foot: [
      ["Share of agreed price", p.sharePercent !== null ? `${p.sharePercent}%` : "-"],
      ["Total paid so far", p.cumulativePercent !== null ? `${p.cumulativePercent}% of price` : "-"],
      ["Agreed price", money(r.totalPrice)],
      ["Balance remaining after this payment", money(p.balanceAfter)],
    ],
    theme: "grid",
    headStyles: { fillColor: NAVY },
    footStyles: { fillColor: [244, 246, 250], textColor: [20, 20, 20], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" } },
    styles: { fontSize: 10 },
    margin: { left: M, right: M },
  });

  let ny = doc.lastAutoTable.finalY + 24;
  if (p.note) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.text("NOTE", M, ny);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(p.note, W - 2 * M), M, ny + 14);
    ny += 14 + 14 * Math.ceil(p.note.length / 90);
  }
  if (p.recordedBy) {
    doc.setTextColor(...GRAY);
    doc.setFontSize(9);
    doc.text(`Received by ${p.recordedBy.firstName} ${p.recordedBy.lastName}`, M, ny + 10);
  }

  // footer
  doc.setDrawColor(...ORANGE);
  doc.setLineWidth(2);
  doc.line(M, 780, W - M, 780);
  doc.setTextColor(...GRAY);
  doc.setFontSize(9);
  doc.text("Thank you for travelling with Wheellol.", M, 798);
  doc.text(`Generated ${dayjs().format("DD MMM YYYY HH:mm")}`, W - M, 798, { align: "right" });

  doc.save(`${p.invoiceNo}.pdf`);
}
