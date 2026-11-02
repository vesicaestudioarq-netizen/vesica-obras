import jsPDF from 'jspdf';
import { fmt } from './api';

const GREEN: [number, number, number] = [25, 87, 64];   // #195740
const BEIGE: [number, number, number] = [234, 226, 207]; // #EAE2CF
const DARK:  [number, number, number] = [30, 30, 30];

const LOGO_BLANCO = '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';

async function loadFont(doc: jsPDF, url: string, name: string, style: string) {
  const resp = await fetch(url);
  const buf = await resp.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  const b64 = btoa(binary);
  doc.addFileToVFS(${name}-.ttf, b64);
  doc.addFont(${name}-.ttf, name, style);
}

async function loadFonts(doc: jsPDF) {
  await Promise.all([
    loadFont(doc, '/fonts/TASAOrbiter-Regular.ttf', 'TASAOrbiter', 'normal'),
    loadFont(doc, '/fonts/TASAOrbiter-Bold.ttf', 'TASAOrbiter', 'bold'),
    loadFont(doc, '/fonts/Inter-Regular.ttf', 'Inter', 'normal'),
    loadFont(doc, '/fonts/Inter-SemiBold.ttf', 'Inter', 'bold'),
  ]);
}

function numRecibo(tipo: 'I' | 'E', id: number): string {
  return ${tipo}-;
}

function header(doc: jsPDF, titulo: string, tipo: 'I' | 'E', id: number, obra: any) {
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, 210, 32, 'F');

  try {
    doc.addImage(LOGO_BLANCO, 'PNG', 12, 4, 48, 14);
  } catch {
    doc.setFont('TASAOrbiter', 'bold');
    doc.setTextColor(...BEIGE);
    doc.setFontSize(15);
    doc.text('vesica estudio', 14, 16);
  }

  doc.setFont('TASAOrbiter', 'normal');
  doc.setTextColor(...BEIGE);
  doc.setFontSize(9);
  doc.text(titulo.toLowerCase(), 14, 27);
  doc.setFont('Inter', 'bold');
  doc.setFontSize(10);
  doc.text(
° , 196, 27, { align: 'right' });

  doc.setFillColor(...BEIGE);
  doc.rect(0, 32, 210, 16, 'F');
  doc.setTextColor(...DARK);
  doc.setFontSize(8);
  doc.setFont('TASAOrbiter', 'normal');
  doc.text('obra', 14, 39);
  doc.setFont('Inter', 'normal');
  doc.text(obra.nombre, 28, 39);
  doc.setFont('TASAOrbiter', 'normal');
  doc.text('cliente', 14, 45);
  doc.setFont('Inter', 'normal');
  doc.text(obra.cliente, 32, 45);
}

function footer(doc: jsPDF) {
  doc.setFillColor(...GREEN);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setFont('Inter', 'normal');
  doc.setTextColor(...BEIGE);
  doc.setFontSize(8);
  doc.text('vesica estudio · gestión financiera de obra', 105, 290, { align: 'center' });
}

function campo(doc: jsPDF, label: string, value: string, x: number, y: number) {
  doc.setFont('TASAOrbiter', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(110, 110, 100);
  doc.text(label.toLowerCase(), x, y);
  doc.setFont('Inter', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...DARK);
  doc.text(value || '—', x, y + 6);
}

function separador(doc: jsPDF, y: number) {
  doc.setDrawColor(...BEIGE);
  doc.setLineWidth(0.4);
  doc.line(14, y, 196, y);
}

export async function generarReciboIngreso(ingreso: any, obra: any, numero: number) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  header(doc, 'recibo de pago — ingreso', 'I', numero, obra);

  doc.setFillColor(...GREEN);
  doc.roundedRect(14, 55, 182, 24, 2, 2, 'F');
  doc.setFont('TASAOrbiter', 'normal');
  doc.setTextColor(...BEIGE);
  doc.setFontSize(8);
  doc.text('monto recibido', 105, 64, { align: 'center' });
  doc.setFont('Inter', 'bold');
  doc.setFontSize(22);
  doc.text(fmt(ingreso.monto, obra.moneda || 'ARS'), 105, 74, { align: 'center' });

  let y = 92;
  campo(doc, 'fecha', ingreso.fecha, 14, y);
  campo(doc, 'tipo de pago', ingreso.tipo || '—', 110, y);
  y += 20;
  campo(doc, 'n° cuota', ingreso.numero_cuota ? String(ingreso.numero_cuota) : '—', 14, y);
  campo(doc, 'moneda', obra.moneda || 'ARS', 110, y);
  y += 20;
  campo(doc, 'descripción', ingreso.descripcion || '—', 14, y);
  y += 20;
  separador(doc, y);

  footer(doc);
  doc.save(ecibo-I-.pdf);
}

export async function generarReciboEgreso(egreso: any, obra: any, numero: number) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  await loadFonts(doc);
  header(doc, 'comprobante de pago — egreso', 'E', numero, obra);

  doc.setFillColor(160, 50, 50);
  doc.roundedRect(14, 55, 182, 24, 2, 2, 'F');
  doc.setFont('TASAOrbiter', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text('monto pagado', 105, 64, { align: 'center' });
  doc.setFont('Inter', 'bold');
  doc.setFontSize(22);
  doc.text(fmt(egreso.monto, obra.moneda || 'ARS'), 105, 74, { align: 'center' });

  let y = 92;
  campo(doc, 'fecha', egreso.fecha, 14, y);
  campo(doc, 'estado', (egreso.estado || 'pagado').toLowerCase(), 110, y);
  y += 20;
  campo(doc, 'rubro', egreso.rubro_nombre || '—', 14, y);
  campo(doc, 'proveedor', egreso.proveedor_nombre || '—', 110, y);
  y += 20;
  campo(doc, 'n° factura', egreso.numero_factura || '—', 14, y);
  campo(doc, 'moneda', obra.moneda || 'ARS', 110, y);
  y += 20;
  campo(doc, 'descripción', egreso.descripcion || '—', 14, y);
  y += 20;
  separador(doc, y);

  footer(doc);
  doc.save(comprobante-E-.pdf);
}