import jsPDF from 'jspdf';
import { fmt } from './api';

const PRIMARY = [25, 87, 64] as const;    // #195740
const ACCENT  = [76, 133, 127] as const;  // #4C857F
const BEIGE   = [234, 226, 207] as const; // #EAE2CF

function header(doc: jsPDF, titulo: string, obra: any) {
  // Fondo superior
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, 210, 28, 'F');

  // Título
  doc.setTextColor(234, 226, 207);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Vesica Obras', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, 14, 19);

  // Número de recibo (timestamp)
  const num = Date.now().toString().slice(-8);
  doc.setFontSize(9);
  doc.text(`Recibo N° ${num}`, 196, 19, { align: 'right' });

  // Banda beige con datos de obra
  doc.setFillColor(...BEIGE);
  doc.rect(0, 28, 210, 18, 'F');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Obra:', 14, 36);
  doc.setFont('helvetica', 'normal');
  doc.text(obra.nombre, 28, 36);
  doc.setFont('helvetica', 'bold');
  doc.text('Cliente:', 14, 43);
  doc.setFont('helvetica', 'normal');
  doc.text(obra.cliente, 30, 43);
}

function footer(doc: jsPDF) {
  const y = 285;
  doc.setDrawColor(...ACCENT);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Vesica Obras · Gestión financiera de obra', 105, y + 5, { align: 'center' });
}

function campo(doc: jsPDF, label: string, value: string, x: number, y: number, ancho = 85) {
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...ACCENT);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(value || '-', x, y + 5);
}

export function generarReciboIngreso(ingreso: any, obra: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  header(doc, 'RECIBO DE PAGO — INGRESO', obra);

  // Monto destacado
  doc.setFillColor(...ACCENT);
  doc.roundedRect(14, 54, 182, 22, 3, 3, 'F');
  doc.setTextColor(234, 226, 207);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO RECIBIDO', 105, 63, { align: 'center' });
  doc.setFontSize(20);
  doc.text(fmt(ingreso.monto, obra.moneda || 'ARS'), 105, 72, { align: 'center' });

  // Campos
  let y = 90;
  campo(doc, 'Fecha', ingreso.fecha, 14, y);
  campo(doc, 'Tipo de pago', ingreso.tipo || '-', 110, y);

  y += 18;
  campo(doc, 'N° Cuota', ingreso.numero_cuota ? String(ingreso.numero_cuota) : '-', 14, y);
  campo(doc, 'Moneda', obra.moneda || 'ARS', 110, y);

  y += 18;
  campo(doc, 'Descripción', ingreso.descripcion || '-', 14, y, 182);

  // Línea separadora
  y += 18;
  doc.setDrawColor(...BEIGE);
  doc.setLineWidth(0.3);
  doc.line(14, y, 196, y);

  // Firma
  y += 20;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(14, y + 15, 90, y + 15);
  doc.line(120, y + 15, 196, y + 15);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma responsable', 52, y + 20, { align: 'center' });
  doc.text('Firma cliente', 158, y + 20, { align: 'center' });

  footer(doc);
  doc.save(`recibo-ingreso-${obra.nombre}-${ingreso.fecha}.pdf`);
}

export function generarReciboEgreso(egreso: any, obra: any) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  header(doc, 'COMPROBANTE DE PAGO — EGRESO', obra);

  // Monto destacado
  doc.setFillColor(180, 60, 60);
  doc.roundedRect(14, 54, 182, 22, 3, 3, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO PAGADO', 105, 63, { align: 'center' });
  doc.setFontSize(20);
  doc.text(fmt(egreso.monto, obra.moneda || 'ARS'), 105, 72, { align: 'center' });

  // Campos
  let y = 90;
  campo(doc, 'Fecha', egreso.fecha, 14, y);
  campo(doc, 'Estado', (egreso.estado || 'pagado').toUpperCase(), 110, y);

  y += 18;
  campo(doc, 'Rubro', egreso.rubro_nombre || '-', 14, y);
  campo(doc, 'Proveedor', egreso.proveedor_nombre || '-', 110, y);

  y += 18;
  campo(doc, 'N° Factura', egreso.numero_factura || '-', 14, y);
  campo(doc, 'Moneda', obra.moneda || 'ARS', 110, y);

  y += 18;
  campo(doc, 'Descripción', egreso.descripcion || '-', 14, y, 182);

  // Línea separadora
  y += 18;
  doc.setDrawColor(...BEIGE);
  doc.setLineWidth(0.3);
  doc.line(14, y, 196, y);

  // Firma
  y += 20;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(14, y + 15, 90, y + 15);
  doc.line(120, y + 15, 196, y + 15);
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('Firma responsable', 52, y + 20, { align: 'center' });
  doc.text('Firma proveedor', 158, y + 20, { align: 'center' });

  footer(doc);
  doc.save(`comprobante-egreso-${obra.nombre}-${egreso.fecha}.pdf`);
}
