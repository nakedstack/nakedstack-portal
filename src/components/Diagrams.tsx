'use client';

import { useEffect, useRef } from 'react';

// Mini SVG generator (stessi colori, stesse funzioni, porting da diagrams.js)
const COLORS = {
  bg: '#FFFFFF', bg2: '#F5F7FA', border: '#E2E6ED', borderLight: '#F0F3F7',
  text: '#031B4E', textMuted: '#5B6B86', textLight: '#8895AD',
  blue: '#0069FF', blueLight: '#3387FF', blueBg: '#E5F0FF',
  cyan: '#00B5D8', cyanBg: '#E5F7FB', green: '#00B069', greenLight: '#33C087',
  greenBg: '#E5F9F0', orange: '#FF6D00', orangeBg: '#FFF3E6',
  purple: '#7B61FF', purpleBg: '#F2EFFF', red: '#FF3B30', redBg: '#FFECEB',
  yellow: '#FFBD2E', card: '#FFFFFF', cardBorder: '#E2E6ED', navy: '#031B4E',
};

const NS = 'http://www.w3.org/2000/svg';

function rect(x: number, y: number, w: number, h: number, opts: Record<string, unknown> = {}) {
  const g = document.createElementNS(NS, 'g');
  const r = document.createElementNS(NS, 'rect');
  r.setAttribute('x', String(x)); r.setAttribute('y', String(y));
  r.setAttribute('width', String(w)); r.setAttribute('height', String(h));
  r.setAttribute('rx', String(opts.rx || 4));
  r.setAttribute('fill', (opts.fill as string) || COLORS.card);
  r.setAttribute('stroke', (opts.stroke as string) || COLORS.border);
  r.setAttribute('stroke-width', String(opts.strokeWidth || 1.5));
  if (opts.dash) r.setAttribute('stroke-dasharray', opts.dash as string);
  g.appendChild(r);

  if (opts.label) {
    const lines = Array.isArray(opts.label) ? opts.label as string[] : [opts.label as string];
    const fs = (opts.fontSize as number) || 13;
    const lh = fs * 1.4;
    const totalH = lines.length * lh;
    const startY = y + (h - totalH) / 2 + fs * 0.85;
    lines.forEach((line, i) => {
      const t = document.createElementNS(NS, 'text');
      t.setAttribute('x', String(x + w / 2)); t.setAttribute('y', String(startY + i * lh));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('fill', (opts.textColor as string) || COLORS.text);
      t.setAttribute('font-family', "'Space Grotesk','Segoe UI',sans-serif");
      t.setAttribute('font-size', String(fs));
      if (opts.bold) t.setAttribute('font-weight', 'bold');
      t.textContent = line; g.appendChild(t);
    });
  }

  if (opts.subtitle) {
    const s = document.createElementNS(NS, 'text');
    s.setAttribute('x', String(x + w / 2)); s.setAttribute('y', String(y + h - 16));
    s.setAttribute('text-anchor', 'middle'); s.setAttribute('fill', COLORS.textMuted);
    s.setAttribute('font-family', "'Space Grotesk','Segoe UI',sans-serif");
    s.setAttribute('font-size', String(opts.subFontSize || 11));
    s.textContent = opts.subtitle as string; g.appendChild(s);
  }

  if (opts.badge) {
    const bw = (opts.badge as string).length * 9 + 14;
    const bx = x + w - bw - 8, by = y + 8;
    const br = document.createElementNS(NS, 'rect');
    br.setAttribute('x', String(bx)); br.setAttribute('y', String(by));
    br.setAttribute('width', String(bw)); br.setAttribute('height', '20');
    br.setAttribute('rx', '4');
    br.setAttribute('fill', (opts.badgeColor as string) || COLORS.blue);
    br.setAttribute('opacity', '0.2'); g.appendChild(br);
    const bt = document.createElementNS(NS, 'text');
    bt.setAttribute('x', String(bx + bw / 2)); bt.setAttribute('y', String(by + 14));
    bt.setAttribute('text-anchor', 'middle');
    bt.setAttribute('fill', (opts.badgeColor as string) || COLORS.blueLight);
    bt.setAttribute('font-family', "'Space Grotesk','Segoe UI',sans-serif");
    bt.setAttribute('font-size', '10'); bt.setAttribute('font-weight', 'bold');
    bt.textContent = opts.badge as string; g.appendChild(bt);
  }
  return g;
}

function line(x1: number, y1: number, x2: number, y2: number, opts: Record<string, unknown> = {}) {
  const g = document.createElementNS(NS, 'g');
  const l = document.createElementNS(NS, 'line');
  l.setAttribute('x1', String(x1)); l.setAttribute('y1', String(y1));
  l.setAttribute('x2', String(x2)); l.setAttribute('y2', String(y2));
  l.setAttribute('stroke', (opts.color as string) || COLORS.border);
  l.setAttribute('stroke-width', String(opts.width || 1.5));
  if (opts.dash) l.setAttribute('stroke-dasharray', opts.dash as string);
  g.appendChild(l);
  if (opts.arrow) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const s = (opts.arrowSize as number) || 8;
    const ax = x2 - s * Math.cos(angle - Math.PI / 6);
    const ay = y2 - s * Math.sin(angle - Math.PI / 6);
    const bx = x2 - s * Math.cos(angle + Math.PI / 6);
    const by = y2 - s * Math.sin(angle + Math.PI / 6);
    const poly = document.createElementNS(NS, 'polygon');
    poly.setAttribute('points', `${x2},${y2} ${ax},${ay} ${bx},${by}`);
    poly.setAttribute('fill', (opts.color as string) || COLORS.border);
    g.appendChild(poly);
  }
  if (opts.label) {
    const t = document.createElementNS(NS, 'text');
    t.setAttribute('x', String((x1 + x2) / 2)); t.setAttribute('y', String((y1 + y2) / 2 - 8));
    t.setAttribute('text-anchor', 'middle'); t.setAttribute('fill', COLORS.textMuted);
    t.setAttribute('font-family', "'Space Grotesk','Segoe UI',sans-serif");
    t.setAttribute('font-size', '11');
    t.textContent = opts.label as string; g.appendChild(t);
  }
  return g;
}

function textEl(x: number, y: number, content: string, opts: Record<string, unknown> = {}) {
  const t = document.createElementNS(NS, 'text');
  t.setAttribute('x', String(x)); t.setAttribute('y', String(y));
  t.setAttribute('text-anchor', (opts.anchor as string) || 'middle');
  t.setAttribute('fill', (opts.color as string) || COLORS.text);
  t.setAttribute('font-family', "'Space Grotesk','Segoe UI',sans-serif");
  t.setAttribute('font-size', String(opts.size || 13));
  if (opts.bold) t.setAttribute('font-weight', 'bold');
  t.textContent = content; return t;
}

// ========== DIAGRAMMI ==========

function clusterOverview(svg: SVGSVGElement) {
  const W = 760, H = 420;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(rect(20, 20, W - 40, H - 40, { label: 'IL TUO CLUSTER', bold: true, fontSize: 16, fill: COLORS.bg, stroke: COLORS.blue, strokeWidth: 2, dash: '8,4', rx: 6 }));
  svg.appendChild(rect(230, 70, 300, 120, { label: ['CONTROL PLANE', '─────────────────'], subtitle: '"il cervello"', bold: true, fontSize: 14, fill: 'rgba(0,105,255,0.06)', stroke: COLORS.blue, badge: '1 VPS', badgeColor: COLORS.blueLight }));
  ['kube-apiserver', 'etcd', 'scheduler', 'controller-mgr'].forEach((n, i) => {
    svg.appendChild(rect(248 + i * 93, 122, 80, 28, { label: n, fontSize: 9, fill: COLORS.card, stroke: COLORS.blue, strokeWidth: 1, rx: 4, textColor: COLORS.cyan }));
  });
  svg.appendChild(line(380, 190, 260, 250, { color: COLORS.blue, width: 2, arrow: true, label: 'comanda' }));
  svg.appendChild(line(380, 190, 520, 250, { color: COLORS.blue, width: 2, arrow: true }));
  [120, 440].forEach((wx, i) => {
    svg.appendChild(rect(wx, 255, 200, 120, { label: `WORKER ${i + 1}`, subtitle: '"i muscoli"', bold: true, fontSize: 14, fill: 'rgba(0,176,105,0.06)', stroke: COLORS.green, badge: '1 VPS', badgeColor: COLORS.greenLight }));
    svg.appendChild(rect(wx + 18, 302, 78, 28, { label: 'kubelet', fontSize: 10, fill: COLORS.card, stroke: COLORS.green, strokeWidth: 1, rx: 4, textColor: COLORS.greenLight }));
    svg.appendChild(rect(wx + 104, 302, 78, 28, { label: 'kube-proxy', fontSize: 10, fill: COLORS.card, stroke: COLORS.green, strokeWidth: 1, rx: 4, textColor: COLORS.greenLight }));
    svg.appendChild(rect(wx + 18, 338, 164, 28, { label: 'container runtime', fontSize: 10, fill: COLORS.card, stroke: COLORS.green, strokeWidth: 1, rx: 4, textColor: COLORS.textMuted }));
  });
  svg.appendChild(textEl(W / 2, H - 12, 'Ogni nodo = 1 VPS su provider cloud', { size: 11, color: COLORS.textMuted }));
}

function workersWithPods(svg: SVGSVGElement) {
  const W = 680, H = 300;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  [30, 360].forEach((wx, wi) => {
    svg.appendChild(rect(wx, 30, 290, 240, { label: `WORKER ${wi + 1}`, bold: true, fontSize: 15, fill: 'rgba(0,176,105,0.05)', stroke: COLORS.green, strokeWidth: 2 }));
  });
  const pods1 = [['Pod: app-web', 'nginx:1.25', COLORS.blue, '10.244.1.5'], ['Pod: api', 'node:20', COLORS.cyan, '10.244.1.6'], ['Pod: worker-bg', 'python:3.11', COLORS.orange, '10.244.1.7']];
  const pods2 = [['Pod: database', 'postgres:15', COLORS.purple, '10.244.2.3'], ['Pod: cache', 'redis:7', COLORS.red, '10.244.2.4'], ['Pod: fluentd', 'fluentd:latest', COLORS.yellow, '10.244.2.5']];
  [pods1, pods2].forEach((pods, wi) => {
    const wx = wi === 0 ? 30 : 360;
    pods.forEach((p, i) => {
      svg.appendChild(rect(wx + 25, 80 + i * 65, 240, 50, { label: p[0] as string, subtitle: `${p[1]} · IP: ${p[3]}`, fontSize: 13, fill: COLORS.card, stroke: p[2] as string, bold: true }));
    });
  });
}

function physicalVsVPS(svg: SVGSVGElement) {
  const W = 740, H = 380;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  // --- LEFT: Bare Metal ---
  svg.appendChild(textEl(190, 28, 'Macchina Fisica (Bare Metal)', { size: 15, bold: true, color: COLORS.orange }));
  svg.appendChild(rect(30, 48, 320, 310, { fill: 'rgba(255,109,0,0.05)', stroke: COLORS.orange, strokeWidth: 2, rx: 6 }));
  svg.appendChild(rect(55, 80, 270, 55, { label: 'CPU', subtitle: 'Dedicata, nessun contendente', fill: COLORS.card, stroke: COLORS.orange, rx: 4 }));
  svg.appendChild(rect(55, 148, 270, 55, { label: 'RAM', subtitle: 'Dedicata, nessun contendente', fill: COLORS.card, stroke: COLORS.orange, rx: 4 }));
  svg.appendChild(rect(55, 216, 270, 55, { label: 'Disco SSD / NVMe', subtitle: 'Dedicato, IOPS garantiti', fill: COLORS.card, stroke: COLORS.orange, rx: 4 }));
  svg.appendChild(rect(55, 290, 270, 40, { label: 'Ubuntu Server 24.04', fontSize: 12, fill: COLORS.card, stroke: COLORS.cyan, textColor: COLORS.cyan, rx: 4 }));
  svg.appendChild(textEl(190, 350, 'Tutto dedicato · Massime performance', { size: 10, color: COLORS.textMuted }));

  // --- RIGHT: VPS ---
  svg.appendChild(textEl(570, 28, 'Server Virtualizzato (VPS)', { size: 15, bold: true, color: COLORS.blueLight }));
  // Outer: physical host (no label — we draw header separately)
  svg.appendChild(rect(390, 48, 320, 310, { fill: 'rgba(0,105,255,0.04)', stroke: COLORS.blue, strokeWidth: 2, dash: '6,3', rx: 6 }));
  // Header bar inside dashed box
  svg.appendChild(rect(410, 62, 280, 32, { label: 'HOST FISICO CONDIVISO', bold: true, fontSize: 12, fill: 'rgba(0,105,255,0.08)', stroke: COLORS.blueLight, rx: 4, textColor: COLORS.blue }));
  svg.appendChild(textEl(550, 108, 'Datacenter (es. Contabo)', { size: 10, color: COLORS.textMuted }));
  // Hypervisor layer
  svg.appendChild(rect(410, 122, 280, 28, { label: 'Hypervisor (KVM / Xen / VMware)', fontSize: 10, fill: COLORS.card, stroke: COLORS.cyan, textColor: COLORS.cyan, rx: 4 }));
  // VPS instances
  svg.appendChild(rect(410, 158, 130, 54, { label: 'Il tuo VPS', subtitle: 'CPU, RAM, Disk', bold: true, fontSize: 11, subFontSize: 9, fill: COLORS.card, stroke: COLORS.blueLight, strokeWidth: 2, rx: 4 }));
  svg.appendChild(rect(550, 158, 140, 54, { label: 'VPS Cliente B', fontSize: 10, fill: 'rgba(240,243,247,0.6)', stroke: COLORS.border, dash: '4,3', rx: 4 }));
  svg.appendChild(rect(410, 220, 130, 54, { label: 'VPS Cliente C', fontSize: 10, fill: 'rgba(240,243,247,0.6)', stroke: COLORS.border, dash: '4,3', rx: 4 }));
  svg.appendChild(rect(550, 220, 140, 54, { label: 'VPS Cliente D', fontSize: 10, fill: 'rgba(240,243,247,0.6)', stroke: COLORS.border, dash: '4,3', rx: 4 }));
  // Bottom info
  svg.appendChild(rect(410, 286, 280, 36, { label: 'Hardware condiviso tra i tenant', fontSize: 10, fill: 'rgba(240,243,247,0.4)', stroke: COLORS.border, rx: 4, textColor: COLORS.textMuted }));
  svg.appendChild(textEl(550, 350, 'Risorse condivise · Economico · Scalabile', { size: 10, color: COLORS.textMuted }));
}

function buildingMetaphor(svg: SVGSVGElement) {
  const W = 740, H = 270;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(textEl(W / 2, 24, 'Dal Datacenter al Tuo VPS: la metafora del palazzo', { size: 14, bold: true, color: COLORS.navy }));
  const cols = [
    { label: 'Concetto Tecnico', x: 30, w: 175, color: COLORS.cyan },
    { label: 'Metafora', x: 210, w: 200, color: COLORS.blueLight },
    { label: 'Cosa significa', x: 415, w: 295, color: COLORS.text }
  ];
  const rows = [
    ['Server fisico (host)', 'Il palazzo intero', "L'hardware nel datacenter: CPU, RAM, dischi, rete"],
    ['Hypervisor', 'Il gestore del palazzo', 'Divide lo spazio fisico in appartamenti isolati tra loro'],
    ['Il tuo VPS', 'Il tuo appartamento', 'Hai stanze private (CPU, RAM) ma condividi le mura'],
    ['Bare Metal', 'Una villa indipendente', 'Tutto dedicato a te: nessun vicino, nessuna condivisione'],
  ];
  const colH = 36, startY = 42;
  // Header row
  cols.forEach(c => svg.appendChild(rect(c.x, startY, c.w, colH, { label: c.label, bold: true, fontSize: 11, fill: COLORS.card, stroke: COLORS.border, textColor: c.color, rx: 4 })));
  // Data rows
  rows.forEach((row, i) => {
    const y = startY + colH + 4 + i * (colH + 4);
    const bg = i % 2 === 0 ? COLORS.card : COLORS.bg2;
    row.forEach((cell, j) => svg.appendChild(rect(cols[j].x, y, cols[j].w, colH, { label: cell, fontSize: 10, fill: bg, stroke: COLORS.border, textColor: j < 2 ? [COLORS.cyan, COLORS.blueLight][j] : COLORS.textMuted, rx: 4 })));
  });
}

function mixedCluster(svg: SVGSVGElement) {
  const W = 760, H = 350;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(rect(15, 15, W - 30, H - 30, { label: 'CLUSTER K8S IBRIDO', bold: true, fontSize: 16, fill: COLORS.bg, stroke: COLORS.blueLight, strokeWidth: 2, dash: '8,4', rx: 6 }));
  svg.appendChild(rect(240, 55, 280, 90, { label: ['CONTROL PLANE'], subtitle: 'VPS su Contabo (cloud)', bold: true, fontSize: 14, fill: 'rgba(0,105,255,0.06)', stroke: COLORS.blue }));
  svg.appendChild(rect(270, 95, 110, 28, { label: 'kube-apiserver', fontSize: 9, fill: COLORS.card, stroke: COLORS.blue, rx: 4, textColor: COLORS.cyan }));
  svg.appendChild(rect(390, 95, 110, 28, { label: 'etcd + scheduler', fontSize: 9, fill: COLORS.card, stroke: COLORS.blue, rx: 4, textColor: COLORS.cyan }));
  svg.appendChild(line(380, 145, 210, 210, { color: COLORS.blue, width: 2, arrow: true, label: 'comanda' }));
  svg.appendChild(line(380, 145, 550, 210, { color: COLORS.blue, width: 2, arrow: true }));
  // Worker 1 VPS
  svg.appendChild(rect(60, 215, 270, 110, { label: 'WORKER 1', subtitle: 'VPS Contabo (cloud)', bold: true, fontSize: 14, fill: 'rgba(0,176,105,0.05)', stroke: COLORS.green }));
  svg.appendChild(rect(80, 252, 110, 30, { label: 'Pod: app-web', fontSize: 10, fill: COLORS.card, stroke: COLORS.blue, rx: 4 }));
  svg.appendChild(rect(200, 252, 110, 30, { label: 'Pod: api', fontSize: 10, fill: COLORS.card, stroke: COLORS.cyan, rx: 4 }));
  svg.appendChild(rect(80, 288, 230, 28, { label: 'Cloud · IP pubblico', fontSize: 10, fill: COLORS.card, stroke: COLORS.blueLight, rx: 4, textColor: COLORS.blueLight }));
  // Worker 2 Raspberry
  svg.appendChild(rect(430, 215, 270, 110, { label: 'WORKER 2', subtitle: 'Raspberry Pi 5 (casa)', bold: true, fontSize: 14, fill: 'rgba(123,97,255,0.05)', stroke: COLORS.purple }));
  svg.appendChild(rect(450, 252, 110, 30, { label: 'Pod: home-db', fontSize: 10, fill: COLORS.card, stroke: COLORS.purple, rx: 4 }));
  svg.appendChild(rect(570, 252, 110, 30, { label: 'Pod: sensors', fontSize: 10, fill: COLORS.card, stroke: COLORS.orange, rx: 4 }));
  svg.appendChild(rect(450, 288, 230, 28, { label: 'Casa · ARM64 · Edge', fontSize: 10, fill: COLORS.card, stroke: COLORS.purple, rx: 4, textColor: COLORS.purple }));
}

function containerVsVMLayers(svg: SVGSVGElement) {
  const W = 740, H = 360;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(textEl(190, 28, 'MACCHINA VIRTUALE', { size: 16, bold: true, color: COLORS.orange }));
  svg.appendChild(rect(25, 48, 330, 290, { fill: 'rgba(255,109,0,0.04)', stroke: COLORS.orange, strokeWidth: 2, rx: 6 }));
  const vmLayers = [{ l: 'App A', y: 68, h: 38, c: COLORS.blueLight }, { l: 'Bins/Libs', y: 112, h: 30, c: COLORS.textMuted }, { l: 'Guest OS (Ubuntu)', y: 148, h: 38, c: COLORS.cyan }, { l: 'Hypervisor', y: 202, h: 34, c: COLORS.orange }, { l: 'Host OS', y: 242, h: 34, c: COLORS.textMuted }, { l: 'Hardware fisico', y: 282, h: 38, c: COLORS.green }];
  vmLayers.forEach(l => svg.appendChild(rect(50, l.y, 280, l.h, { label: l.l, fontSize: 11, fill: COLORS.card, stroke: l.c, textColor: l.c, rx: 4 })));
  svg.appendChild(textEl(555, 28, 'CONTAINER', { size: 16, bold: true, color: COLORS.blueLight }));
  svg.appendChild(rect(385, 48, 330, 290, { fill: 'rgba(0,105,255,0.04)', stroke: COLORS.blueLight, strokeWidth: 2, rx: 6 }));
  const cLayers = [{ l: 'App A', y: 68, h: 38, c: COLORS.blueLight }, { l: 'App B', y: 112, h: 38, c: COLORS.cyan }, { l: 'App C', y: 156, h: 38, c: COLORS.orange }, { l: 'Container Engine (Docker)', y: 210, h: 34, c: COLORS.blue }, { l: 'Host OS (condiviso)', y: 250, h: 34, c: COLORS.textMuted }, { l: 'Hardware fisico', y: 290, h: 38, c: COLORS.green }];
  cLayers.forEach(l => svg.appendChild(rect(410, l.y, 280, l.h, { label: l.l, fontSize: 11, fill: COLORS.card, stroke: l.c, textColor: l.c, rx: 4 })));
}

function podInternals(svg: SVGSVGElement) {
  const W = 680, H = 280;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(rect(25, 25, W - 50, H - 50, { label: 'POD: my-app-7d8f-xk92', subtitle: 'IP: 10.244.1.5 · Node: worker-1', bold: true, fontSize: 14, fill: 'rgba(0,105,255,0.05)', stroke: COLORS.blue, strokeWidth: 2, rx: 6 }));
  svg.appendChild(rect(55, 70, 250, 90, { label: 'Container: app', subtitle: 'immagine: my-app:v2', fontSize: 12, bold: true, fill: COLORS.card, stroke: COLORS.blueLight, strokeWidth: 1.5 }));
  svg.appendChild(textEl(180, 108, '· Porta: 3000', { size: 10, color: COLORS.textMuted }));
  svg.appendChild(textEl(180, 124, '· CPU: 100m · RAM: 128Mi', { size: 10, color: COLORS.textMuted }));
  svg.appendChild(textEl(180, 140, '· Volume: /app/data', { size: 10, color: COLORS.textMuted }));
  svg.appendChild(rect(330, 70, 250, 90, { label: 'Container: log-sidecar', subtitle: 'immagine: fluentd:latest', fontSize: 12, bold: true, fill: COLORS.card, stroke: COLORS.cyan, strokeWidth: 1.5 }));
  svg.appendChild(textEl(455, 108, '· Porta: 24224', { size: 10, color: COLORS.textMuted }));
  svg.appendChild(textEl(455, 124, '· CPU: 50m · RAM: 64Mi', { size: 10, color: COLORS.textMuted }));
  svg.appendChild(textEl(455, 140, '· Volume: shared-logs', { size: 10, color: COLORS.textMuted }));
  svg.appendChild(rect(55, 180, 525, 40, { label: 'Network Namespace condiviso (localhost + IP unico)', fontSize: 11, fill: 'rgba(0,181,216,0.06)', stroke: COLORS.cyan, strokeWidth: 1, dash: '4,3', rx: 4, textColor: COLORS.cyan }));
  svg.appendChild(rect(55, 228, 525, 30, { label: 'Volumi condivisi: entrambi i container vedono /shared-logs', fontSize: 10, fill: COLORS.card, stroke: COLORS.border, rx: 4, textColor: COLORS.textMuted }));
}

function namespaceOverview(svg: SVGSVGElement) {
  const W = 720, H = 320;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.appendChild(rect(15, 15, W - 30, H - 30, { label: 'CLUSTER KUBERNETES', bold: true, fontSize: 16, fill: COLORS.bg, stroke: COLORS.blue, strokeWidth: 2, dash: '8,4', rx: 6 }));
  // dev
  svg.appendChild(rect(35, 55, 310, 110, { label: 'Namespace: development', fontSize: 13, bold: true, fill: 'rgba(0,176,105,0.04)', stroke: COLORS.green, strokeWidth: 1.5, dash: '6,3' }));
  svg.appendChild(rect(55, 88, 85, 30, { label: 'Pod: api-dev', fontSize: 9, fill: COLORS.card, stroke: COLORS.green, rx: 4 }));
  svg.appendChild(rect(148, 88, 85, 30, { label: 'Pod: web-dev', fontSize: 9, fill: COLORS.card, stroke: COLORS.green, rx: 4 }));
  svg.appendChild(rect(240, 88, 88, 30, { label: 'Service: api', fontSize: 9, fill: COLORS.card, stroke: COLORS.blue, rx: 4 }));
  svg.appendChild(rect(55, 124, 273, 28, { label: 'ConfigMap · Secret · PVC', fontSize: 9, fill: COLORS.card, stroke: COLORS.border, rx: 4, textColor: COLORS.textMuted }));
  // prod
  svg.appendChild(rect(375, 55, 310, 110, { label: 'Namespace: production', fontSize: 13, bold: true, fill: 'rgba(255,59,48,0.04)', stroke: COLORS.red, strokeWidth: 1.5, dash: '6,3' }));
  svg.appendChild(rect(395, 88, 85, 30, { label: 'Pod: api-prod', fontSize: 9, fill: COLORS.card, stroke: COLORS.red, rx: 4 }));
  svg.appendChild(rect(488, 88, 85, 30, { label: 'Pod: web-prod', fontSize: 9, fill: COLORS.card, stroke: COLORS.red, rx: 4 }));
  svg.appendChild(rect(580, 88, 88, 30, { label: 'Ingress', fontSize: 9, fill: COLORS.card, stroke: COLORS.purple, rx: 4 }));
  svg.appendChild(rect(395, 124, 273, 28, { label: 'ConfigMap · Secret · PVC', fontSize: 9, fill: COLORS.card, stroke: COLORS.border, rx: 4, textColor: COLORS.textMuted }));
  // kube-system
  svg.appendChild(rect(35, 180, 650, 55, { label: 'Namespace: kube-system (componenti interni)', fontSize: 12, bold: true, fill: 'rgba(136,149,173,0.04)', stroke: COLORS.border, strokeWidth: 1, dash: '5,3' }));
  svg.appendChild(rect(55, 206, 130, 22, { label: 'CoreDNS', fontSize: 9, fill: COLORS.card, stroke: COLORS.border, rx: 3, textColor: COLORS.textMuted }));
  svg.appendChild(rect(192, 206, 130, 22, { label: 'kube-proxy', fontSize: 9, fill: COLORS.card, stroke: COLORS.border, rx: 3, textColor: COLORS.textMuted }));
  svg.appendChild(rect(329, 206, 130, 22, { label: 'metrics-server', fontSize: 9, fill: COLORS.card, stroke: COLORS.border, rx: 3, textColor: COLORS.textMuted }));
  svg.appendChild(rect(466, 206, 130, 22, { label: 'CSI driver', fontSize: 9, fill: COLORS.card, stroke: COLORS.border, rx: 3, textColor: COLORS.textMuted }));
  // monitoring
  svg.appendChild(rect(35, 248, 650, 55, { label: 'Namespace: monitoring (osservabilit\u00e0)', fontSize: 12, bold: true, fill: 'rgba(255,189,46,0.04)', stroke: COLORS.border, strokeWidth: 1, dash: '5,3' }));
  svg.appendChild(rect(55, 274, 130, 22, { label: 'Prometheus', fontSize: 9, fill: COLORS.card, stroke: COLORS.orange, rx: 3, textColor: COLORS.orange }));
  svg.appendChild(rect(192, 274, 130, 22, { label: 'Grafana', fontSize: 9, fill: COLORS.card, stroke: COLORS.orange, rx: 3, textColor: COLORS.orange }));
  svg.appendChild(rect(329, 274, 130, 22, { label: 'Loki', fontSize: 9, fill: COLORS.card, stroke: COLORS.orange, rx: 3, textColor: COLORS.orange }));
  svg.appendChild(rect(466, 274, 130, 22, { label: 'Tempo/Jaeger', fontSize: 9, fill: COLORS.card, stroke: COLORS.orange, rx: 3, textColor: COLORS.orange }));
}

function kubectlFlow(svg: SVGSVGElement) {
  const W = 760, H = 200;
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const steps = [
    { l: 'kubectl\napply', x: 20, w: 100, c: COLORS.cyan },
    { l: 'API Server', x: 165, w: 110, c: COLORS.blueLight },
    { l: 'etcd\n(salva stato)', x: 320, w: 110, c: COLORS.purple },
    { l: 'Controller\n(crea Pod)', x: 475, w: 110, c: COLORS.green },
    { l: 'Scheduler\n(assegna nodo)', x: 630, w: 110, c: COLORS.orange },
  ];
  steps.forEach((s, i) => {
    svg.appendChild(rect(s.x, 60, s.w, 70, { label: s.l.split('\n'), bold: true, fontSize: 12, fill: COLORS.card, stroke: s.c, strokeWidth: 2, rx: 6, textColor: s.c }));
    const cx = s.x + s.w / 2;
    const c = document.createElementNS(NS, 'circle');
    c.setAttribute('cx', String(cx)); c.setAttribute('cy', '40'); c.setAttribute('r', '14');
    c.setAttribute('fill', s.c); c.setAttribute('opacity', '0.25');
    svg.appendChild(c);
    svg.appendChild(textEl(cx, 46, String(i + 1), { size: 12, color: s.c, bold: true }));
  });
  for (let i = 0; i < steps.length - 1; i++) {
    const s1 = steps[i], s2 = steps[i + 1];
    svg.appendChild(line(s1.x + s1.w, 95, s2.x, 95, { color: COLORS.textMuted, width: 2, arrow: true, arrowSize: 6 }));
  }
  svg.appendChild(textEl(W / 2, H - 12, 'Flusso dichiarativo: descrivi lo stato → K8s lo realizza', { size: 12, color: COLORS.textMuted }));
}

// Mappa diagram types → generator functions
const DIAGRAMS: Record<string, (svg: SVGSVGElement) => void> = {
  'diagram-cluster-overview': clusterOverview,
  'diagram-workers-pods': workersWithPods,
  'diagram-physical-vs-vps': physicalVsVPS,
  'diagram-building-metaphor': buildingMetaphor,
  'diagram-mixed-cluster': mixedCluster,
  'diagram-container-vs-vm': containerVsVMLayers,
  'diagram-pod-internals': podInternals,
  'diagram-namespace-overview': namespaceOverview,
  'diagram-kubectl-flow': kubectlFlow,
};

// ========== REACT COMPONENT ==========
export function Diagram({ id }: { id: keyof typeof DIAGRAMS }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const fn = DIAGRAMS[id];
    if (!fn) return;
    ref.current.innerHTML = '';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', 'auto');
    svg.style.maxWidth = '100%';
    fn(svg);
    ref.current.appendChild(svg);
  }, [id]);
  return <div ref={ref} />;
}
