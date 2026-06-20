'use client';

import { useEffect, useRef } from 'react';

const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  v_uv = (a_position + 1.0) / 2.0;
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_uv;

// Noise functions
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 5; i++) {
    val += amp * noise(p * freq);
    freq *= 2.0;
    amp *= 0.5;
  }
  return val;
}

void main() {
  vec2 uv = v_uv;
  float t = u_time * 0.15;

  // Flowing distortion
  vec2 distorted = uv;
  distorted.x += fbm(uv * 3.0 + vec2(t * 0.3, t * 0.2)) * 0.08;
  distorted.y += fbm(uv * 3.0 + vec2(t * 0.4, -t * 0.3)) * 0.08;

  // Gradient layers
  float grad1 = sin(distorted.x * 4.0 + t * 0.5) * cos(distorted.y * 3.0 + t * 0.4);
  float grad2 = cos(distorted.y * 5.0 - t * 0.6) * sin(distorted.x * 3.5 + t * 0.35);
  float grad3 = fbm(distorted * 2.5 + t * 0.2);

  // Color palette — deep tech blues & cyans
  vec3 color1 = vec3(0.0, 0.41, 1.0);   // #0069FF blue
  vec3 color2 = vec3(0.0, 0.71, 0.85);  // cyan
  vec3 color3 = vec3(0.01, 0.11, 0.31); // navy
  vec3 color4 = vec3(0.48, 0.38, 1.0);  // purple

  vec3 color = mix(color3, color1, grad1 * 0.5 + 0.5);
  color = mix(color, color2, grad2 * 0.4 + 0.4);
  color = mix(color, color4, grad3 * 0.3);

  // Subtle vignette
  float vignette = 1.0 - length(v_uv - 0.5) * 1.2;
  vignette = smoothstep(0.0, 1.0, vignette);
  color *= mix(0.65, 1.0, vignette);

  // Subtle grid lines
  vec2 grid = abs(fract(uv * 40.0) - 0.5);
  float gridLine = 1.0 - smoothstep(0.0, 0.02, min(grid.x, grid.y));
  color += gridLine * 0.03;

  gl_FragColor = vec4(color, 1.0);
}
`;

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Compile shader
    function compileShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        console.error(gl!.getShaderInfoLog(shader));
        gl!.deleteShader(shader);
        return null;
      }
      return shader;
    }

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      return;
    }

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const aPosition = gl.getAttribLocation(program, 'a_position');

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl!.viewport(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener('resize', resize);

    const startTime = performance.now();

    function render(now: number) {
      if (!canvas || !gl) return;

      resize();

      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.enableVertexAttribArray(aPosition);
      gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

      gl.uniform1f(uTime, (now - startTime) * 0.001);
      gl.uniform2f(uResolution, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="shader-bg"
      aria-hidden="true"
    />
  );
}
