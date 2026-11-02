import jsPDF from 'jspdf';
import { fmt } from './api';

const GREEN: [number, number, number] = [25, 87, 64];   // #195740
const BEIGE: [number, number, number] = [234, 226, 207]; // #EAE2CF
const DARK:  [number, number, number] = [30, 30, 30];

const LOGO_BLANCO = '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';

function numRecibo(tipo: 'I' | 'E', id: number): string {
  return `${tipo}-${String(id).padStart(4, '0')}`;
}

function header(doc: jsPDF, titulo: string, tipo: 'I' | 'E', id: number, obra: any) {
  // Fondo header verde
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, 210, 32, 'F');

  // Logo blanco
  try {
    doc.addImage(LOGO_BLANCO, 'PNG', 12, 4, 48, 14);
  } catch {
    doc.setTextColor(...BEIGE);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('Vesica Estudio', 14, 14);
  }

  // Título y número de recibo
  doc.setTextColor(...BEIGE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(titulo, 14, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`N° ${numRecibo(tipo, id)}`, 196, 27, { align: 'right' });

  // Banda beige con datos de obra
  doc.setFillColor(...BEIGE);
  doc.rect(0, 32, 210, 16, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('OBRA', 14, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(obra.nombre, 28, 39);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', 14, 45);
  doc.setFont('helvetica', 'normal');
  doc.text(obra.cliente, 32, 45);
}

function footer(doc: jsPDF) {
  doc.setFillColor(...GREEN);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(...BEIGE);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Vesica Estudio · Gestión financiera de obra', 105, 290, { align: 'center' });
}

function campo(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text(label.toUpperCase(), x, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  doc.text(value || '—', x, y + 6);
}

function separador(doc: jsPDF, y: number) {
  doc.setDrawColor(...BEIGE);
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
}

export function generarReciboIngreso(ingreso: any, obra: any, numero: number) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  header(doc, 'RECIBO DE PAGO — INGRESO', 'I', numero, obra);

  // Monto
  doc.setFillColor(...GREEN);
  doc.roundedRect(14, 55, 182, 24, 2, 2, 'F');
  doc.setTextColor(...BEIGE);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO RECIBIDO', 105, 64, { align: 'center' });
  doc.setFontSize(22);
  doc.text(fmt(ingreso.monto, obra.moneda || 'ARS'), 105, 74, { align: 'center' });

  let y = 92;
  campo(doc, 'Fecha', ingreso.fecha, 14, y);
  campo(doc, 'Tipo de pago', ingreso.tipo || '—', 110, y);
  y += 20;
  campo(doc, 'N° Cuota', ingreso.numero_cuota ? String(ingreso.numero_cuota) : '—', 14, y);
  campo(doc, 'Moneda', obra.moneda || 'ARS', 110, y);
  y += 20;
  campo(doc, 'Descripción', ingreso.descripcion || '—', 14, y);
  y += 20;
  separador(doc, y);

  footer(doc);
  doc.save(`recibo-I${String(numero).padStart(4,'0')}-${obra.nombre}.pdf`);
}

export function generarReciboEgreso(egreso: any, obra: any, numero: number) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  header(doc, 'COMPROBANTE DE PAGO — EGRESO', 'E', numero, obra);

  // Monto
  doc.setFillColor(160, 50, 50);
  doc.roundedRect(14, 55, 182, 24, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MONTO PAGADO', 105, 64, { align: 'center' });
  doc.setFontSize(22);
  doc.text(fmt(egreso.monto, obra.moneda || 'ARS'), 105, 74, { align: 'center' });

  let y = 92;
  campo(doc, 'Fecha', egreso.fecha, 14, y);
  campo(doc, 'Estado', (egreso.estado || 'pagado').toUpperCase(), 110, y);
  y += 20;
  campo(doc, 'Rubro', egreso.rubro_nombre || '—', 14, y);
  campo(doc, 'Proveedor', egreso.proveedor_nombre || '—', 110, y);
  y += 20;
  campo(doc, 'N° Factura', egreso.numero_factura || '—', 14, y);
  campo(doc, 'Moneda', obra.moneda || 'ARS', 110, y);
  y += 20;
  campo(doc, 'Descripción', egreso.descripcion || '—', 14, y);
  y += 20;
  separador(doc, y);

  footer(doc);
  doc.save(`comprobante-E${String(numero).padStart(4,'0')}-${obra.nombre}.pdf`);
}
