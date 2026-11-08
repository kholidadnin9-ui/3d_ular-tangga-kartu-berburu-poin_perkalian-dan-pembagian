import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Robot } from "../game/robot";
import { ROBOT_COLORS } from "../game/constants";
import type { RobotColorId } from "../game/constants";
import RobotIcon from "./RobotIcon";

interface PreviewScene {
  scene: THREE.Scene;
  robot: Robot;
}

/** One lightweight preview renderer, using the exact robot model from the game. */
export default function RobotPreview({ colorId, poseKey }: { colorId: RobotColorId; poseKey: number }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<PreviewScene | null>(null);
  const [previewAvailable, setPreviewAvailable] = useState(true);
  const accent = ROBOT_COLORS.find((color) => color.id === colorId)?.accentCss ?? "#f6c945";

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    } catch (error) {
      console.warn("Preview 3D robot tidak tersedia:", error);
      setPreviewAvailable(false);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xe9faff, 1.2));
    const key = new THREE.DirectionalLight(0xffe7bc, 2.5);
    key.position.set(3, 5, 5);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x99e9ff, 1.2);
    fill.position.set(-4, 2, -3);
    scene.add(fill);

    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x127186, metalness: 0.28, roughness: 0.55 });
    const edgeMaterial = new THREE.MeshStandardMaterial({ color: 0xf6c945, metalness: 0.7, roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.18, 40), baseMaterial);
    base.position.y = -0.13;
    scene.add(base);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.13, 0.045, 8, 48), edgeMaterial);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = -0.04;
    scene.add(rim);

    const robot = new Robot(colorId);
    robot.group.position.y = 0.2;
    robot.setMode("celebrate", 1.3);
    scene.add(robot.group);
    previewRef.current = { scene, robot };

    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30);
    camera.position.set(2.7, 2.5, 4.4);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.1, 0);
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.5;
    controls.minDistance = 3.2;
    controls.maxDistance = 7;
    controls.minPolarAngle = 0.35;
    controls.maxPolarAngle = 2.15;
    controls.update();

    const resize = () => {
      const w = host.clientWidth;
      const h = host.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(host);
    if (!observer) window.addEventListener("resize", resize);
    resize();

    let frame = 0;
    let last = performance.now();
    const render = () => {
      frame = requestAnimationFrame(render);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      previewRef.current?.robot.update(dt);
      controls.update();
      renderer.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", resize);
      controls.dispose();
      previewRef.current?.robot.dispose();
      previewRef.current = null;
      base.geometry.dispose();
      rim.geometry.dispose();
      baseMaterial.dispose();
      edgeMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // The renderer is reused when the chosen color changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || preview.robot.colorId === colorId) return;
    preview.scene.remove(preview.robot.group);
    preview.robot.dispose();
    const robot = new Robot(colorId);
    robot.group.position.y = 0.2;
    robot.setMode("celebrate", 1.3);
    preview.scene.add(robot.group);
    preview.robot = robot;
  }, [colorId]);

  useEffect(() => {
    if (poseKey > 0) previewRef.current?.robot.setMode("celebrate", 1.6);
  }, [poseKey]);

  return (
    <div ref={hostRef} className="relative h-full w-full" aria-label="Preview robot 3D, geser untuk memutar">
      {!previewAvailable && (
        <div className="absolute inset-0 flex items-center justify-center">
          <RobotIcon accent={accent} size={104} />
        </div>
      )}
    </div>
  );
}