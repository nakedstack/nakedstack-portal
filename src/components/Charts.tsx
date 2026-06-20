'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const COLORS = {
  blue: '#0069FF',
  blueLight: '#3387FF',
  cyan: '#00B5D8',
  green: '#00B069',
  orange: '#FF6D00',
  red: '#FF3B30',
  purple: '#7B61FF',
  gray: '#8895AD',
};

Chart.defaults.color = '#5B6B86';
Chart.defaults.borderColor = '#E2E6ED';
Chart.defaults.font.family = "'Space Grotesk', 'Segoe UI', sans-serif";

export function AdoptionChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = new Chart(ref.current, {
      type: 'line',
      data: {
        labels: ['2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
        datasets: [{
          label: 'Adozione K8s (% aziende)',
          data: [5, 12, 25, 40, 52, 62, 70, 76, 82, 88],
          borderColor: COLORS.blue,
          backgroundColor: 'rgba(0,105,255,0.08)',
          fill: true, tension: 0.4, pointRadius: 5,
          pointBackgroundColor: COLORS.blue,
          pointBorderColor: '#FFFFFF', pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { min: 0, max: 100, grid: { color: '#F0F3F7' }, ticks: { callback: (v) => v + '%' } },
          x: { grid: { color: '#F0F3F7' } }
        },
        plugins: {
          legend: { display: false },
          title: { display: true, text: 'Crescita Adozione Kubernetes', font: { size: 16, weight: 'bold' } }
        }
      }
    });
    return () => c.destroy();
  }, []);
  return <canvas ref={ref} height={250} />;
}

export function ContainerVsVMChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = new Chart(ref.current, {
      type: 'bar',
      data: {
        labels: ['Avvio', 'Dimensione Immagine', 'Isolamento', 'Performance', 'Densita'],
        datasets: [
          { label: 'Container', data: [95, 90, 60, 92, 95], backgroundColor: COLORS.blueLight, borderRadius: 6 },
          { label: 'VM', data: [40, 35, 90, 65, 40], backgroundColor: COLORS.gray, borderRadius: 6 }
        ]
      },
      options: {
        indexAxis: 'y', responsive: true,
        scales: { x: { max: 100, grid: { color: '#F0F3F7' } } },
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true } },
          title: { display: true, text: 'Container vs Macchine Virtuali', font: { size: 16, weight: 'bold' } }
        }
      }
    });
    return () => c.destroy();
  }, []);
  return <canvas ref={ref} height={300} />;
}

export function ArchitectureChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels: ['Master Node (Control Plane)', 'Worker Nodes', 'etcd (Database)'],
        datasets: [{ data: [35, 55, 10], backgroundColor: [COLORS.blue, COLORS.green, COLORS.purple], borderColor: '#FFFFFF', borderWidth: 2 }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } },
          title: { display: true, text: 'Distribuzione Componenti K8s', font: { size: 16, weight: 'bold' } }
        }
      }
    });
    return () => c.destroy();
  }, []);
  return <canvas ref={ref} height={300} />;
}

export function ComponentsRadarChart() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const c = new Chart(ref.current, {
      type: 'radar',
      data: {
        labels: ['API Server', 'Scheduler', 'Controller Manager', 'etcd', 'kubelet', 'kube-proxy'],
        datasets: [{
          label: 'Importanza Relativa', data: [100, 85, 80, 95, 75, 65],
          backgroundColor: 'rgba(0,105,255,0.15)', borderColor: COLORS.blue, borderWidth: 2,
          pointBackgroundColor: COLORS.blue, pointBorderColor: '#FFFFFF', pointBorderWidth: 2, pointRadius: 5,
        }]
      },
      options: {
        responsive: true,
        scales: { r: { grid: { color: '#E2E6ED' }, pointLabels: { color: '#5B6B86', font: { size: 11 } }, ticks: { display: false } } },
        plugins: { legend: { display: false }, title: { display: true, text: 'Componenti Control Plane', font: { size: 16 } } }
      }
    });
    return () => c.destroy();
  }, []);
  return <canvas ref={ref} height={350} />;
}
