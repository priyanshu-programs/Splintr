"use client";

import { useEffect, useRef } from "react";

const vsSource = `
attribute vec4 a_seed;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

varying vec3 v_pos;
varying float v_dist;
varying float v_isHead;
varying float v_pulseType;

vec3 getFlow(vec3 p, float t) {
  vec3 v = vec3(0.0);
  v += vec3(sin(p.y*2.1+t), cos(p.x*2.3+t), sin(p.z*1.9-t)) * 0.8;
  v += vec3(cos(p.z*3.4-t), sin(p.y*3.7+t), cos(p.x*3.1+t)) * 0.4;
  v += vec3(sin(p.x*5.2+t), cos(p.z*5.5-t), sin(p.y*5.7+t)) * 0.2;
  return v;
}

void main() {
  float pulseType = floor(a_seed.w / 10.0);
  float isHead = mod(a_seed.w, 10.0);

  float speedMult = pulseType > 0.5 ? 2.5 : 1.0;
  float timeLag = isHead == 1.0 ? 0.0 : -0.05 * speedMult;

  float t = u_time * 0.4 * speedMult + timeLag + a_seed.x * 0.2;

  vec3 p = a_seed.xyz * 1.5;

  for(int i=0; i<3; i++) {
    p += getFlow(p, t + float(i)*0.1) * 0.38;
  }

  float rotY = u_time * 0.08 + u_mouse.x * 1.5;
  float rotX = u_mouse.y * 1.5;

  float cy = cos(rotY);
  float sy = sin(rotY);
  float nx = p.x*cy - p.z*sy;
  float nz = p.x*sy + p.z*cy;
  p.x = nx; p.z = nz;

  float cx = cos(rotX);
  float sx = sin(rotX);
  float ny = p.y*cx - p.z*sx;
  nz = p.y*sx + p.z*cx;
  p.y = ny; p.z = nz;

  p *= 1.0 + sin(u_time * 0.5 + a_seed.z) * 0.05;

  v_pos = a_seed.xyz;
  v_dist = length(p);
  v_isHead = isHead;
  v_pulseType = pulseType;

  float zDist = p.z + 5.5;
  float scale = 2.4 / zDist;

  gl_Position = vec4(p.x * scale, p.y * scale * (u_resolution.x/u_resolution.y), 0.0, 1.0);
}
`;

const fsSource = `
precision highp float;
varying vec3 v_pos;
varying float v_dist;
varying float v_isHead;
varying float v_pulseType;

void main() {
  vec3 core = vec3(1.0, 1.0, 1.0);
  vec3 mid1 = vec3(0.7, 0.7, 0.7);
  vec3 mid2 = vec3(0.4, 0.4, 0.4);
  vec3 outer = vec3(0.15, 0.15, 0.15);

  vec3 color = core;
  color = mix(color, mid1, smoothstep(0.4, 1.1, v_dist));
  color = mix(color, mid2, smoothstep(0.9, 1.8, v_dist));
  color = mix(color, outer, smoothstep(1.5, 2.7, v_dist));

  color = mix(vec3(1.0, 1.0, 1.0), color, smoothstep(0.0, 0.6, v_dist));

  if(v_pulseType > 0.5) {
    color = mix(vec3(1.0), vec3(0.8, 0.8, 0.8), v_isHead);
  }

  float brightness = mix(0.15, 1.0, v_isHead);
  if(v_pulseType > 0.5) brightness *= 1.5;

  float alpha = mix(1.0, 0.0, smoothstep(1.8, 3.2, v_dist));
  alpha *= mix(0.0, 0.8, v_isHead);

  gl_FragColor = vec4(color * brightness * alpha, alpha);
}
`;

export default function WebGLCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
    });
    if (!gl) return;

    function createShader(type: number, source: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, source);
      gl!.compileShader(s);
      return s;
    }

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    const numLines = 80000;
    const data = new Float32Array(numLines * 2 * 4);

    for (let i = 0; i < numLines; i++) {
      const u = Math.random(),
        v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = Math.pow(Math.random(), 1.5) * 1.5;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      const isPulse = Math.random() > 0.95 ? 10.0 : 0.0;

      const off = i * 8;
      data[off + 0] = x; data[off + 1] = y; data[off + 2] = z; data[off + 3] = 0.0 + isPulse;
      data[off + 4] = x; data[off + 5] = y; data[off + 6] = z; data[off + 7] = 1.0 + isPulse;
    }

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    const aSeed = gl.getAttribLocation(program, "a_seed");
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, "u_time");
    const uRes = gl.getUniformLocation(program, "u_resolution");
    const uMouse = gl.getUniformLocation(program, "u_mouse");

    let mouseX = 0, mouseY = 0;
    let targetMouseX = 0, targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetMouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      targetMouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseLeave = () => {
      targetMouseX = 0;
      targetMouseY = 0;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      canvas!.width = canvas!.clientWidth * dpr;
      canvas!.height = canvas!.clientHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    window.addEventListener("resize", resize);
    resize();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    let animId: number;
    const startTime = performance.now();

    function render(now: number) {
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      const time = (now - startTime) * 0.001;
      gl!.uniform1f(uTime, time);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouseX, mouseY);

      gl!.drawArrays(gl!.LINES, 0, numLines * 2);

      const updateHUD = (window as unknown as Record<string, unknown>).updateHUD as
        | ((t: number, mx: number, my: number) => void)
        | undefined;
      if (updateHUD) updateHUD(time, mouseX, mouseY);

      animId = requestAnimationFrame(render);
    }
    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} id="webgl-canvas" />;
}
