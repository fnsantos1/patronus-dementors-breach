// O Patrono, por enquanto so a forma. E um cervo feito de luz: material
// translucido com emissive, mais uma luz prateada no meio do corpo. Sai
// correndo para a frente quando o feitico acerta o gesto.

import * as THREE from 'three';

export class Patronus {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'patrono';
    this.group.visible = false;    // so aparece quando e conjurado

    // um material para o corpo inteiro. O emissive faz ele brilhar mesmo
    // sem nenhuma luz apontada, e o depthWrite false evita as partes do
    // corpo recortarem umas as outras por serem transparentes
    this.material = new THREE.MeshStandardMaterial({
      color: 0xcfe9ff,
      emissive: 0x9fd0ff,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.5,
      roughness: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.createBody();
    this.createHead();
    this.createLegs();

    this.light = new THREE.PointLight(0xdcefff, 0, 16);
    this.light.position.y = 1.4;
    this.group.add(this.light);

    this.timer = 0;
    this.duration = 0;
    this.direction = new THREE.Vector3(0, 0, -1);
  }

  createBody() {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 0.95, 6, 16), this.material);
    body.rotation.z = Math.PI / 2;   // capsula deitada vira o tronco
    body.position.y = 1.15;
    this.group.add(body);

    const chest = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), this.material);
    chest.position.set(0, 1.2, -0.55);
    chest.scale.set(0.9, 1, 0.85);
    this.group.add(chest);

    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.3, 8), this.material);
    tail.position.set(0, 1.35, 0.72);
    tail.rotation.x = -0.6;
    this.group.add(tail);
  }

  createHead() {
    this.neck = new THREE.Group();
    this.neck.name = 'pescoco';
    this.neck.position.set(0, 1.35, -0.7);
    this.neck.rotation.x = -0.55;
    this.group.add(this.neck);

    const neckMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.22, 0.75, 10),
      this.material
    );
    neckMesh.position.y = 0.37;
    this.neck.add(neckMesh);

    this.head = new THREE.Group();
    this.head.name = 'cabeca';
    this.head.position.y = 0.75;
    this.head.rotation.x = 0.75;   // desfaz parte da inclinacao do pescoco
    this.neck.add(this.head);

    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.17, 14, 12), this.material);
    skull.scale.set(0.85, 0.9, 1.3);
    this.head.add(skull);

    const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10), this.material);
    muzzle.position.set(0, -0.02, -0.26);
    muzzle.rotation.x = -Math.PI / 2;
    this.head.add(muzzle);

    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.19, 8), this.material);
      ear.position.set(side * 0.13, 0.13, 0.04);
      ear.rotation.z = side * 0.6;
      this.head.add(ear);

      this.head.add(this.createAntler(side));
    }
  }

  // Uma haste inclinada para fora e tres pontas saindo dela, cada uma mais
  // curta que a anterior.
  createAntler(side) {
    const antler = new THREE.Group();
    antler.name = side < 0 ? 'galhada-esquerda' : 'galhada-direita';
    antler.position.set(side * 0.09, 0.14, 0.02);
    antler.rotation.z = side * 0.35;
    antler.rotation.x = -0.25;

    const beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.026, 0.42, 6),
      this.material
    );
    beam.position.y = 0.21;
    antler.add(beam);

    const tines = [
      { height: 0.1, length: 0.2, angle: 0.8 },
      { height: 0.24, length: 0.17, angle: 0.6 },
      { height: 0.38, length: 0.13, angle: 0.4 },
    ];

    for (const tine of tines) {
      // um grupo por ponta so para poder girar a ponta a partir da base
      const pivot = new THREE.Group();
      pivot.position.y = tine.height;
      pivot.rotation.z = side * tine.angle;
      antler.add(pivot);

      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.008, 0.014, tine.length, 6),
        this.material
      );
      branch.position.y = tine.length / 2;
      pivot.add(branch);
    }

    return antler;
  }

  createLegs() {
    this.legs = [];

    // z positivo = pernas de tras, z negativo = da frente
    const hips = [
      [-0.26, 0.55], [0.26, 0.55],
      [-0.26, -0.5], [0.26, -0.5],
    ];

    for (const [x, z] of hips) {
      const hip = new THREE.Group();
      hip.position.set(x, 0.95, z);
      this.group.add(hip);

      const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.4, 3, 8), this.material);
      thigh.position.y = -0.2;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.42;
      hip.add(knee);

      const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.42, 3, 8), this.material);
      shin.position.y = -0.21;
      knee.add(shin);

      const hoof = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.12, 8), this.material);
      hoof.position.y = -0.46;
      hoof.rotation.x = Math.PI;
      knee.add(hoof);

      // frente e tras em contrafase, senao parece um coelho pulando
      this.legs.push({ hip, knee, phase: z > 0 ? 0 : Math.PI });
    }
  }

  cast(origin, direction, duration = 2.2) {
    this.group.visible = true;
    this.timer = duration;
    this.duration = duration;

    this.group.position.set(origin.x, 0, origin.z);
    this.direction.copy(direction).setY(0).normalize();

    // o modelo foi montado olhando para -Z, dai o Math.PI
    this.group.rotation.y = Math.atan2(this.direction.x, this.direction.z) + Math.PI;
  }

  update(delta, time) {
    if (!this.group.visible) return;

    this.timer -= delta;
    if (this.timer <= 0) {
      this.group.visible = false;
      this.light.intensity = 0;
      return;
    }

    const remaining = this.timer / this.duration;

    this.group.position.addScaledVector(this.direction, delta * 7.5);
    this.group.position.y = Math.abs(Math.sin(time * 9)) * 0.2;   // galope

    // desaparece no final do feitico
    this.material.opacity = 0.55 * Math.min(1, remaining * 2.2);
    this.light.intensity = 60 * Math.min(1, remaining * 2.5);

    for (const leg of this.legs) {
      leg.hip.rotation.x = Math.sin(time * 9 + leg.phase) * 0.6;
      leg.knee.rotation.x = Math.max(0, Math.sin(time * 9 + leg.phase + 1)) * 0.7;
    }
    this.neck.rotation.x = -0.55 + Math.sin(time * 9) * 0.1;
  }
}
