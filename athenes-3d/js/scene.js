/* Athènes en 3D — scène procédurale générée avec Three.js (aucun asset externe). */
import * as THREE from "./three.module.js";

(() => {
  "use strict";

  const canvas = document.getElementById("canvas3d");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xbfd4e8, 140, 520);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 2000);

  /* ------------------------------------------------------------------ */
  /* Matériaux                                                           */
  /* ------------------------------------------------------------------ */
  const mat = {
    marble:   new THREE.MeshStandardMaterial({ color: 0xf2ecdd, roughness: 0.85 }),
    marble2:  new THREE.MeshStandardMaterial({ color: 0xe6dfca, roughness: 0.9 }),
    rock:     new THREE.MeshStandardMaterial({ color: 0x8d7f66, roughness: 1 }),
    grass:    new THREE.MeshStandardMaterial({ color: 0x6d7f4a, roughness: 1 }),
    soil:     new THREE.MeshStandardMaterial({ color: 0x9b8560, roughness: 1 }),
    sea:      new THREE.MeshStandardMaterial({ color: 0x2f6f9f, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.92 }),
    roof:     new THREE.MeshStandardMaterial({ color: 0xb5533c, roughness: 0.9 }),
    wall:     new THREE.MeshStandardMaterial({ color: 0xf5f2e8, roughness: 0.95 }),
    wood:     new THREE.MeshStandardMaterial({ color: 0x7a5a38, roughness: 0.8 }),
    gold:     new THREE.MeshStandardMaterial({ color: 0xffd76a, roughness: 0.35, metalness: 0.8, emissive: 0x8a6a1f, emissiveIntensity: 0.5 }),
  };

  const group = new THREE.Group();
  scene.add(group);

  function mesh(geo, material, x = 0, y = 0, z = 0, cast = true, receive = true) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = cast;
    m.receiveShadow = receive;
    group.add(m);
    return m;
  }

  /* ------------------------------------------------------------------ */
  /* Ciel + soleil                                                        */
  /* ------------------------------------------------------------------ */
  const skyGeo = new THREE.SphereGeometry(900, 32, 16);
  const skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      top:    { value: new THREE.Color(0x2c5f9e) },
      bottom: { value: new THREE.Color(0xd9e7f2) },
      sunPos: { value: new THREE.Vector3(0.4, 0.35, -0.86).normalize() },
    },
    vertexShader: `
      varying vec3 vPos;
      void main() { vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec3 vPos;
      uniform vec3 top; uniform vec3 bottom; uniform vec3 sunPos;
      void main() {
        float h = clamp(vPos.y * 0.6 + 0.5, 0.0, 1.0);
        vec3 col = mix(bottom, top, h);
        float sun = pow(max(dot(vPos, normalize(sunPos)), 0.0), 220.0);
        col += vec3(1.0, 0.85, 0.55) * sun * 0.9;
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const skyMesh = new THREE.Mesh(skyGeo, skyMat);
  scene.add(skyMesh);

  const sunLight = new THREE.DirectionalLight(0xfff2d9, 1.6);
  sunLight.position.set(120, 110, -160);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.left = -160;
  sunLight.shadow.camera.right = 160;
  sunLight.shadow.camera.top = 160;
  sunLight.shadow.camera.bottom = -160;
  sunLight.shadow.camera.far = 600;
  sunLight.shadow.bias = -0.0004;
  scene.add(sunLight);
  scene.add(new THREE.HemisphereLight(0xbcd6f2, 0x6d5b3e, 0.55));
  scene.add(new THREE.AmbientLight(0xffffff, 0.18));

  /* ------------------------------------------------------------------ */
  /* Sol : plaine vallonnée                                              */
  /* ------------------------------------------------------------------ */
  function noise2(x, z) {
    return (
      Math.sin(x * 0.045 + 1.7) * Math.cos(z * 0.04 + 0.6) * 0.6 +
      Math.sin(x * 0.012 - 2.1) * Math.sin(z * 0.016 + 1.2) * 1.4 +
      Math.sin((x + z) * 0.006) * 2.2
    );
  }

  const groundGeo = new THREE.PlaneGeometry(1400, 1400, 140, 140);
  const gpos = groundGeo.attributes.position;
  for (let i = 0; i < gpos.count; i++) {
    const x = gpos.getX(i), z = gpos.getZ(i);
    let h = noise2(x, z);
    const dA = Math.hypot(x - 6, z - 10);      // loin de l'Acropole
    const dH = Math.hypot(x + 90, z + 40);     // colline de l'Agora
    h -= Math.max(0, 10 - dH) * 0.55;          // relief doux de l'Agora
    if (dA > 70) h *= 1.6;                      // montagnes lointaines
    gpos.setZ(i, h);
  }
  groundGeo.computeVertexNormals();
  const ground = mesh(groundGeo, mat.grass, 0, -2.2, 0);
  ground.receiveShadow = true;

  // Taches de terre / herbe sèche
  for (let i = 0; i < 220; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 30 + Math.random() * 480;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - 6, z - 10) < 34) continue;
    const w = 1 + Math.random() * 3, d = 1 + Math.random() * 3;
    const patch = mesh(
      new THREE.PlaneGeometry(w, d),
      Math.random() > 0.5 ? mat.soil : mat.grass,
      x, noise2(x, z) - 1.6, z
    );
    patch.rotation.x = -Math.PI / 2;
    patch.receiveShadow = true;
  }

  /* ------------------------------------------------------------------ */
  /* Mer Égée (au sud-est)                                               */
  /* ------------------------------------------------------------------ */
  const sea = mesh(new THREE.PlaneGeometry(1600, 1600, 1, 1), mat.sea, 260, -4.4, 420);
  sea.rotation.x = -Math.PI / 2;

  /* ------------------------------------------------------------------ */
  /* L'Acropole : colline + plateau                                      */
  /* ------------------------------------------------------------------ */
  const ACX = 6, ACZ = 10, ACRO_Y = 8; // sommet du plateau

  mesh(new THREE.CylinderGeometry(30, 78, 26, 40, 1, true), mat.rock, ACX, -4, ACZ);
  mesh(new THREE.CylinderGeometry(30, 30, 8, 40), mat.rock, ACX, 8, ACZ);
  mesh(new THREE.CylinderGeometry(31.5, 31.5, 1.2, 40), mat.marble2, ACX, 12.4, ACZ);
  mesh(new THREE.CylinderGeometry(29, 29, 1.4, 40), mat.marble, ACX, 13.4, ACZ);

  // Muret de soutènement du front sud
  const wallRing = new THREE.Mesh(
    new THREE.CylinderGeometry(31.6, 31.6, 9, 40, 1, true, Math.PI * 0.15, Math.PI * 1.7),
    mat.marble2
  );
  wallRing.position.set(ACX, 7.5, ACZ);
  wallRing.castShadow = true;
  group.add(wallRing);

  /* ------------------------------------------------------------------ */
  /* Colonne dorique                                                     */
  /* ------------------------------------------------------------------ */
  function column(x, z, h = 6.4, r = 0.62) {
    const g = new THREE.Group();
    const base = mesh(new THREE.CylinderGeometry(r * 1.25, r * 1.35, h * 0.06, 16), mat.marble2);
    base.position.y = h * 0.03;
    const shaft = mesh(new THREE.CylinderGeometry(r * 0.92, r, h * 0.82, 14), mat.marble);
    shaft.position.y = h * 0.06 + h * 0.41;
    const capital = mesh(new THREE.CylinderGeometry(r * 1.05, r * 0.95, h * 0.09, 14), mat.marble2);
    capital.position.y = h * 0.06 + h * 0.82 + h * 0.045;
    const abacus = mesh(new THREE.BoxGeometry(r * 2.3, h * 0.05, r * 2.3), mat.marble2);
    abacus.position.y = h * 0.06 + h * 0.82 + h * 0.09 + h * 0.025;
    g.add(base, shaft, capital, abacus);
    g.position.set(x, ACRO_Y + 14.2, z);
    group.add(g);
    return g;
  }

  function buildTemple(cx, cz, colsX, colsZ, depth) {
    const spacing = 2.35;
    const w = (colsX - 1) * spacing + 4.4;
    const d = (colsZ - 1) * spacing + 4.4;
    const baseY = ACRO_Y + 14.2;

    // Stylobate (3 marches)
    for (let i = 0; i < 3; i++) {
      mesh(new THREE.BoxGeometry(w + 2 + i * 1.2, 0.55, d + 2 + i * 1.2), mat.marble2,
        cx, baseY - 1.05 + i * 0.55, cz);
    }
    // Cella (murs)
    const wallH = 7.6;
    const t = 1.1;
    mesh(new THREE.BoxGeometry(w - 3.4, wallH, t), mat.marble2, cx, baseY + wallH / 2, cz - (d - 3.4) / 2);
    mesh(new THREE.BoxGeometry(w - 3.4, wallH, t), mat.marble2, cx, baseY + wallH / 2, cz + (d - 3.4) / 2);
    mesh(new THREE.BoxGeometry(t, wallH, d - 3.4), mat.marble2, cx - (w - 3.4) / 2, baseY + wallH / 2, cz);
    mesh(new THREE.BoxGeometry(t, wallH, d - 3.4), mat.marble2, cx + (w - 3.4) / 2, baseY + wallH / 2, cz);

    // Péristyle
    for (let i = 0; i < colsX; i++) {
      const x = cx + (i - (colsX - 1) / 2) * spacing;
      column(x, cz - (colsZ - 1) * spacing / 2);
      if (colsZ > 2 || i === 0 || i === colsX - 1)
        column(x, cz + (colsZ - 1) * spacing / 2);
    }
    for (let j = 1; j < colsZ - 1; j++) {
      const z = cz + (j - (colsZ - 1) / 2) * spacing;
      column(cx - (colsX - 1) * spacing / 2, z);
      column(cx + (colsX - 1) * spacing / 2, z);
    }

    // Entablement
    const entY = baseY + wallH + 2.2;
    mesh(new THREE.BoxGeometry(w, 0.5, d), mat.marble2, cx, entY, cz);              // architrave
    mesh(new THREE.BoxGeometry(w + 0.5, 0.45, d + 0.5), mat.marble, cx, entY + 0.55, cz); // frise + corniche

    // Toit à deux pentes + frontons
    const roofH = 3.4, over = 0.8;
    const slopeGeo = new THREE.BoxGeometry(w + 2 * over, 0.35, Math.hypot(d + 2 * over, roofH) + 0.2);
    const slopeL = mesh(slopeGeo, mat.roof, cx, entY + 1.05 + roofH / 2, cz - (d + 2 * over) / 4);
    slopeL.rotation.x = Math.atan2(roofH, (d + 2 * over) / 2);
    const slopeR = mesh(slopeGeo, mat.roof, cx, entY + 1.05 + roofH / 2, cz + (d + 2 * over) / 4);
    slopeR.rotation.x = -Math.atan2(roofH, (d + 2 * over) / 2);

    const pedW = w + 0.6, pedH = roofH + 0.6;
    const pedGeo = new THREE.BufferGeometry();
    pedGeo.setAttribute("position", new THREE.Float32BufferAttribute([
      -pedW / 2, 0, 0,  pedW / 2, 0, 0,  0, pedH, 0,
    ], 3));
    pedGeo.computeVertexNormals();
    mesh(pedGeo, mat.marble, cx, entY + 1.05, cz - (d / 2) - over, true, true);
    const pedBack = mesh(pedGeo, mat.marble, cx, entY + 1.05, cz + (d / 2) + over);
    pedBack.rotation.y = Math.PI;
    return { w, d, baseY };
  }

  /* Le Parthénon : 8 × 17 colonnes */
  buildTemple(ACX - 2, ACZ - 3, 8, 17);

  /* L'Érechthéion (forme en T simplifiée, au nord du Parthénon) */
  (function erechthion() {
    const cx = ACX + 9, cz = ACZ - 13;
    const baseY = ACRO_Y + 14.2;
    mesh(new THREE.BoxGeometry(11, 1.4, 8), mat.marble2, cx, baseY - 0.7, cz);
    const wallH = 5.4, t = 0.9;
    mesh(new THREE.BoxGeometry(10, wallH, t), mat.marble, cx, baseY + wallH / 2, cz - 3.5);
    mesh(new THREE.BoxGeometry(10, wallH, t), mat.marble, cx, baseY + wallH / 2, cz + 3.5);
    mesh(new THREE.BoxGeometry(t, wallH, 7), mat.marble, cx - 4.5, baseY + wallH / 2, cz);
    mesh(new THREE.BoxGeometry(t, wallH, 7), mat.marble, cx + 4.5, baseY + wallH / 2, cz);
    // Porche des Caryatides (sud) : 6 statues-colonnes stylisées
    for (let i = 0; i < 6; i++) {
      const x = cx - 4.2 + i * 1.68;
      const g = new THREE.Group();
      const body = mesh(new THREE.CylinderGeometry(0.42, 0.5, 4.6, 10), mat.marble);
      body.position.y = 2.3;
      const head = mesh(new THREE.SphereGeometry(0.42, 10, 10), mat.marble);
      head.position.y = 4.9;
      const capital = mesh(new THREE.BoxGeometry(1.3, 0.35, 1.3), mat.marble2);
      capital.position.y = 5.25;
      g.add(body, head, capital);
      g.position.set(x, baseY, cz + 3.5);
      group.add(g);
    }
    // Colonnes ioniques simplifiées (nord, est, ouest)
    [[-4.5, -1.2], [-4.5, 1.2], [4.5, -1.2], [4.5, 1.2], [0, -3.5], [-2.2, -3.5], [2.2, -3.5]].forEach(([ox, oz]) => {
      column(cx + ox, cz + oz, 5.6, 0.45);
    });
    mesh(new THREE.BoxGeometry(11.6, 0.4, 9), mat.marble2, cx, baseY + wallH + 0.9, cz);
  })();

  /* Les Propylées (entrée ouest) */
  (function propylaea() {
    const cx = ACX - 19, cz = ACZ + 2;
    const baseY = ACRO_Y + 14.2 - 1.4;
    mesh(new THREE.BoxGeometry(13, 1.2, 9), mat.marble2, cx, baseY - 0.6, cz);
    for (let i = 0; i < 6; i++) column(cx - 5.5 + i * 2.2, cz, 6.2, 0.55);
    mesh(new THREE.BoxGeometry(13.6, 0.5, 9.6), mat.marble, cx, baseY + 6.6, cz);
    mesh(new THREE.BoxGeometry(13.6, 3.2, 1.2), mat.marble2, cx, baseY + 8.2, cz);
    // Toit
    const slope = mesh(new THREE.BoxGeometry(14.4, 0.3, 11), mat.roof, cx, baseY + 10.4, cz);
    slope.rotation.x = 0.12;
  })();

  /* ------------------------------------------------------------------ */
  /* Théâtre de Dionysos (flanc sud de l'Acropole)                      */
  /* ------------------------------------------------------------------ */
  (function theatre() {
    const cx = ACX + 2, cz = ACZ + 26, r0 = 9, rows = 14;
    for (let i = 0; i < rows; i++) {
      const r = r0 + i * 1.15;
      const h = 0.7 + i * 0.42;
      const seat = mesh(
        new THREE.CylinderGeometry(r + 1.15, r + 1.15, h, 36, 1, false, Math.PI * 0.62, Math.PI * 1.76),
        mat.marble2, cx, h / 2 - 1.2, cz
      );
      seat.rotation.y = Math.PI;
    }
    // Orchestre (aire circulaire)
    const orch = mesh(new THREE.CylinderGeometry(8.5, 8.5, 0.4, 36), mat.marble, cx, -1, cz);
    // Gradins de la colline (assise)
    mesh(new THREE.CylinderGeometry(r0 + rows * 1.15, r0 + rows * 1.15 + 6, 8, 36, 1, false, Math.PI * 0.62, Math.PI * 1.76),
      mat.rock, cx, 3, cz);
  })();

  /* ------------------------------------------------------------------ */
  /* La Plaka : maisons blanches, toits rouges                            */
  /* ------------------------------------------------------------------ */
  function house(x, z, s = 1) {
    const h = (2.2 + Math.random() * 2.2) * s;
    const w = (2.6 + Math.random() * 2.4) * s;
    const d = (2.6 + Math.random() * 2.4) * s;
    const y = noise2(x, z) - 1.9;
    mesh(new THREE.BoxGeometry(w, h, d), mat.wall, x, y + h / 2, z);
    const roof = mesh(
      new THREE.ConeGeometry(Math.max(w, d) * 0.75, 1.4 * s, 4),
      mat.roof, x, y + h + 0.7 * s, z
    );
    roof.rotation.y = Math.PI / 4;
    roof.scale.y = 0.55;
  }
  for (let i = 0; i < 90; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 42 + Math.random() * 130;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - ACX, z - (ACZ + 26)) < 22) continue; // loin du théâtre
    if (Math.hypot(x - ACX, z - ACZ) < 36) continue;         // loin de l'Acropole
    house(x, z, 0.8 + Math.random() * 0.6);
  }

  /* ------------------------------------------------------------------ */
  /* L'Agora : Stoa + temple d'Héphaïstos                                */
  /* ------------------------------------------------------------------ */
  (function agora() {
    const ax = -90, az = 40, baseY = noise2(ax, az) - 1.9 + 4.5;
    // Colline basse
    mesh(new THREE.CylinderGeometry(14, 26, 9, 32, 1, true), mat.rock, ax, baseY - 6, az);
    // Temple d'Héphaïstos (bien conservé) : 6 × 13
    const spacing = 2.1, colsX = 6, colsZ = 13;
    const w = (colsX - 1) * spacing + 4, d = (colsZ - 1) * spacing + 4;
    mesh(new THREE.BoxGeometry(w + 2, 1.2, d + 2), mat.marble2, ax, baseY - 0.6, az);
    const wallH = 6.8, t = 1;
    mesh(new THREE.BoxGeometry(w - 3, wallH, t), mat.marble2, ax, baseY + wallH / 2, az - (d - 3) / 2);
    mesh(new THREE.BoxGeometry(w - 3, wallH, t), mat.marble2, ax, baseY + wallH / 2, az + (d - 3) / 2);
    mesh(new THREE.BoxGeometry(t, wallH, d - 3), mat.marble2, ax - (w - 3) / 2, baseY + wallH / 2, az);
    mesh(new THREE.BoxGeometry(t, wallH, d - 3), mat.marble2, ax + (w - 3) / 2, baseY + wallH / 2, az);
    for (let i = 0; i < colsX; i++) {
      const x = ax + (i - (colsX - 1) / 2) * spacing;
      columnAgora(x, az - (colsZ - 1) * spacing / 2, baseY);
      columnAgora(x, az + (colsZ - 1) * spacing / 2, baseY);
    }
    for (let j = 1; j < colsZ - 1; j++) {
      const z = az + (j - (colsZ - 1) / 2) * spacing;
      columnAgora(ax - (colsX - 1) * spacing / 2, z, baseY);
      columnAgora(ax + (colsX - 1) * spacing / 2, z, baseY);
    }
    mesh(new THREE.BoxGeometry(w, 0.5, d), mat.marble2, ax, baseY + wallH + 1.1, az);
    const roof = mesh(new THREE.BoxGeometry(w + 0.6, 0.35, d + 0.6), mat.roof, ax, baseY + wallH + 1.5, az);
    roof.rotation.x = 0.06;

    // Stoa du côté est : longue colonnade
    const sx = ax + 20, sz = az;
    mesh(new THREE.BoxGeometry(34, 0.8, 5), mat.marble2, sx, baseY - 0.4, sz);
    for (let i = 0; i < 10; i++) columnAgora(sx - 15 + i * 3.3, sz - 1.8, baseY);
    const stoaRoof = mesh(new THREE.BoxGeometry(35, 0.4, 5.6), mat.roof, sx, baseY + 6.4, sz);
    stoaRoof.rotation.z = -0.14;

    function columnAgora(x, z, by) {
      const g = new THREE.Group();
      const shaft = mesh(new THREE.CylinderGeometry(0.4, 0.48, 5.6, 12), mat.marble);
      shaft.position.y = 2.8;
      const cap = mesh(new THREE.BoxGeometry(1.2, 0.4, 1.2), mat.marble2);
      cap.position.y = 5.8;
      g.add(shaft, cap);
      g.position.set(x, by, z);
      group.add(g);
    }
  })();

  /* ------------------------------------------------------------------ */
  /* Végétation : oliviers et cyprès                                     */
  /* ------------------------------------------------------------------ */
  function olive(x, z) {
    const y = noise2(x, z) - 1.9;
    mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8), mat.wood, x, y + 1.1, z);
    const crown = mesh(new THREE.SphereGeometry(1.6, 12, 10), new THREE.MeshStandardMaterial({ color: 0x5c6e3c, roughness: 1 }), x, y + 2.9, z);
    crown.scale.y = 0.75;
  }
  function cypress(x, z) {
    const y = noise2(x, z) - 1.9;
    mesh(new THREE.CylinderGeometry(0.18, 0.28, 1.4, 8), mat.wood, x, y + 0.7, z);
    const top = mesh(new THREE.ConeGeometry(0.9, 5.5, 10), new THREE.MeshStandardMaterial({ color: 0x2f4a2e, roughness: 1 }), x, y + 4.2, z);
    top.scale.y = 1.15;
  }
  for (let i = 0; i < 130; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 45 + Math.random() * 300;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.hypot(x - ACX, z - ACZ) < 40) continue;
    if (z > 380) continue; // pas dans la mer
    (Math.random() > 0.45 ? olive : cypress)(x, z);
  }

  /* ------------------------------------------------------------------ */
  /* Points d'intérêt interactifs                                        */
  /* ------------------------------------------------------------------ */
  const POIS = [
    { id: "parthenon",   name: "Le Parthénon",        desc: "Temple d'Athéna Parthénos, 447–432 av. J.-C. 46 colonnes doriques de marbre pentélique.",
      pos: new THREE.Vector3(ACX - 2, ACRO_Y + 30, ACZ - 3) },
    { id: "erechtheion", name: "L'Érechthéion",       desc: "Célèbre porche des Caryatides, gardiennes de pierre du toit du temple.",
      pos: new THREE.Vector3(ACX + 9, ACRO_Y + 28, ACZ - 13) },
    { id: "propylaea",   name: "Les Propylées",       desc: "Porte monumentale de l'Acropole : la voie processionnelle des Panathénées.",
      pos: new THREE.Vector3(ACX - 19, ACRO_Y + 28, ACZ + 2) },
    { id: "theatre",     name: "Théâtre de Dionysos", desc: "Berceau du théâtre grec au flanc sud de la colline, 17 000 spectateurs.",
      pos: new THREE.Vector3(ACX + 2, ACRO_Y + 14, ACZ + 34) },
    { id: "plaka",       name: "La Plaka",            desc: "Vieux quartier aux maisons blanches et toits rouges, au pied de l'Acropole.",
      pos: new THREE.Vector3(ACX + 42, 10, ACZ + 52) },
    { id: "agora",       name: "L'Agora",             desc: "Cœur civique d'Athènes : Stoa, temple d'Héphaïstos, débats et marchés.",
      pos: new THREE.Vector3(-90, 18, 40) },
  ];

  const poiMeshes = [];
  POIS.forEach((p) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.5, 0.14, 10, 28),
      new THREE.MeshBasicMaterial({ color: 0x4da3ff })
    );
    ring.position.copy(p.pos);
    ring.userData = { poi: p };
    group.add(ring);
    poiMeshes.push(ring);

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 14, 14),
      new THREE.MeshBasicMaterial({ color: 0xffd76a })
    );
    dot.position.copy(p.pos).add(new THREE.Vector3(0, 1.6, 0));
    dot.userData = { poi: p };
    group.add(dot);
    poiMeshes.push(dot);
  });

  /* ------------------------------------------------------------------ */
  /* Caméra : contrôles orbit manuels (souris + tactile)                */
  /* ------------------------------------------------------------------ */
  const cam = {
    theta: -0.9, phi: 1.02, radius: 95,
    target: new THREE.Vector3(ACX - 4, 16, ACZ + 4),
    auto: true,
  };
  const HOME = { theta: cam.theta, phi: cam.phi, radius: cam.radius,
    target: cam.target.clone() };

  function applyCamera() {
    const t = cam.target;
    const sinPhi = Math.sin(cam.phi);
    camera.position.set(
      t.x + cam.radius * sinPhi * Math.sin(cam.theta),
      t.y + cam.radius * Math.cos(cam.phi),
      t.z + cam.radius * sinPhi * Math.cos(cam.theta)
    );
    camera.lookAt(t);
  }
  applyCamera();

  let dragging = false, px = 0, py = 0, pinchD = 0;
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    if (e.pointerType === "touch" && e.isPrimary) { dragging = true; px = e.clientX; py = e.clientY; }
    else if (e.pointerType === "mouse") { dragging = true; px = e.clientX; py = e.clientY; }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    cam.auto = false;
    syncAutoChip();
    cam.theta -= (e.clientX - px) * 0.005;
    cam.phi = Math.min(1.5, Math.max(0.25, cam.phi - (e.clientY - py) * 0.004));
    px = e.clientX; py = e.clientY;
  });
  canvas.addEventListener("pointerup", () => { dragging = false; });
  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    cam.radius = Math.min(220, Math.max(24, cam.radius * (1 + e.deltaY * 0.0009)));
  }, { passive: false });
  canvas.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (pinchD > 0) cam.radius = Math.min(220, Math.max(24, cam.radius * (pinchD / d)));
      pinchD = d;
      cam.auto = false;
      syncAutoChip();
    }
  }, { passive: false });
  canvas.addEventListener("touchend", () => { pinchD = 0; });

  /* ------------------------------------------------------------------ */
  /* Raycasting : clic sur un repère POI                                 */
  /* ------------------------------------------------------------------ */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const poiLabel = document.getElementById("poi-label");
  let activePoi = null;

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1,
             -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(poiMeshes)[0];
    if (hit) focusPoi(hit.object.userData.poi);
  });

  function focusPoi(p) {
    activePoi = p;
    cam.target.lerp(p.pos.clone().add(new THREE.Vector3(0, -8, 0)), 0.35);
    cam.radius = Math.min(cam.radius, 55);
    poiLabel.hidden = false;
    poiLabel.querySelector("strong").textContent = p.name;
    poiLabel.querySelector("span").textContent = p.desc;
    document.querySelectorAll(".card").forEach((c) =>
      c.classList.toggle("flash", c.dataset.poi === p.id));
  }

  document.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", () => {
      const p = POIS.find((q) => q.id === card.dataset.poi);
      if (p) focusPoi(p);
      document.getElementById("scene").scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ------------------------------------------------------------------ */
  /* HUD                                                                 */
  /* ------------------------------------------------------------------ */
  const btnAuto = document.getElementById("btn-autorotate");
  const btnReset = document.getElementById("btn-reset");
  const btnSunset = document.getElementById("btn-sunset");
  const hint = document.getElementById("hint");

  function syncAutoChip() {
    btnAuto.classList.toggle("active", cam.auto);
    hint.style.opacity = cam.auto ? "0.4" : "1";
  }
  btnAuto.addEventListener("click", () => { cam.auto = !cam.auto; syncAutoChip(); });
  btnReset.addEventListener("click", () => {
    cam.theta = HOME.theta; cam.phi = HOME.phi; cam.radius = HOME.radius;
    cam.target.copy(HOME.target);
    cam.auto = true; syncAutoChip();
    poiLabel.hidden = true; activePoi = null;
  });

  let sunset = false;
  btnSunset.addEventListener("click", () => {
    sunset = !sunset;
    btnSunset.textContent = sunset ? "Lever de soleil" : "Coucher de soleil";
    btnSunset.classList.toggle("primary", sunset);
    btnSunset.classList.toggle("ghost", !sunset);
  });

  /* ------------------------------------------------------------------ */
  /* Boucle d'animation                                                  */
  /* ------------------------------------------------------------------ */
  const clock = new THREE.Clock();
  let t = 0;

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== w * renderer.getPixelRatio() || canvas.height !== h * renderer.getPixelRatio()) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
  }
  window.addEventListener("resize", resize);
  resize();

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;

    if (cam.auto) cam.theta += dt * 0.06;
    applyCamera();

    // Repères POI : pulsation
    poiMeshes.forEach((m, i) => {
      const s = 1 + Math.sin(t * 3 + i) * 0.12;
      m.scale.setScalar(s);
      if (m.geometry.type === "TorusGeometry") m.rotation.z = t * 0.8;
    });

    // Label POI : reste ancré à l'écran
    if (activePoi && !poiLabel.hidden) {
      const v = activePoi.pos.clone().project(camera);
      const rect = canvas.getBoundingClientRect();
      poiLabel.style.left = (rect.left + (v.x * 0.5 + 0.5) * rect.width) + "px";
      poiLabel.style.top = (rect.top + (-v.y * 0.5 + 0.5) * rect.height) + "px";
    }

    // Transition jour / crépuscule
    const goalIntensity = sunset ? 0.55 : 1.6;
    sunLight.intensity += (goalIntensity - sunLight.intensity) * dt * 1.5;
    const goalColor = new THREE.Color(sunset ? 0xff8c4a : 0xfff2d9);
    sunLight.color.lerp(goalColor, dt * 1.5);
    const goalFog = new THREE.Color(sunset ? 0xe8a06a : 0xbfd4e8);
    scene.fog.color.lerp(goalFog, dt * 1.5);
    const sunAngle = sunset ? 0.14 : 0.85;
    sunLight.position.set(
      Math.cos(t * 0.02 + 2.2) * 150,
      110 * sunAngle + 20,
      -160
    );
    skyMesh.material.uniforms.sunPos.value.copy(sunLight.position).normalize();

    renderer.render(scene, camera);

    const loader = document.getElementById("loader");
    if (loader && !loader.classList.contains("done")) loader.classList.add("done");
  }
  animate();
})();

