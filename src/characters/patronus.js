// O Patrono, por enquanto so a forma: um cervo de caixas feito de luz.
// Tronco, pescoco, cabeca com galhada e quatro pernas. Modelo estatico -
// o galope e a projecao do feitico ficam para a etapa da jogabilidade.

import * as THREE from 'three';

export class Patronus {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'patrono';

    // um material para o corpo inteiro. O emissive faz brilhar mesmo sem
    // luz apontada; o depthWrite false evita as partes transparentes
    // recortarem umas as outras
    this.material = new THREE.MeshStandardMaterial({
      color: 0xcfe9ff,
      emissive: 0x9fd0ff,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.55,
      flatShading: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.buildBody();
    this.buildHead();
    this.buildLegs();

    const light = new THREE.PointLight(0xdcefff, 25, 16);
    light.position.y = 1.4;
    this.group.add(light);
  }

  buildBody() {
    // tronco deitado ao longo de Z; a frente do cervo e o -Z
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.66, 1.55), this.material);
    body.position.y = 1.15;
    this.group.add(body);
  }

  buildHead() {
    this.neck = new THREE.Group();
    this.neck.name = 'pescoco';
    this.neck.position.set(0, 1.35, -0.7);
    this.neck.rotation.x = -0.55;
    this.group.add(this.neck);

    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.75, 0.3), this.material);
    neck.position.y = 0.37;
    this.neck.add(neck);

    this.head = new THREE.Group();
    this.head.name = 'cabeca';
    this.head.position.y = 0.75;
    this.head.rotation.x = 0.75;   // desfaz parte da inclinacao do pescoco
    this.neck.add(this.head);

    // cabeca e focinho num bloco alongado
    const skull = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.62), this.material);
    skull.position.z = -0.12;
    this.head.add(skull);

    // galhada: uma haste inclinada para fora de cada lado
    for (const side of [-1, 1]) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.46, 0.06), this.material);
      beam.position.set(side * 0.12, 0.36, 0.02);
      beam.rotation.z = side * 0.45;
      this.head.add(beam);

      const tine = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.22, 0.045), this.material);
      tine.position.set(side * 0.28, 0.5, 0.02);
      tine.rotation.z = side * 0.9;
      this.head.add(tine);
    }
  }

  // As pernas ficam paradas por enquanto. A divisao quadril -> joelho fica
  // de pe para quando o galope entrar: e so girar os dois grupos.
  buildLegs() {
    this.legs = [];

    // z positivo = pernas de tras, z negativo = da frente
    for (const [x, z] of [[-0.24, 0.5], [0.24, 0.5], [-0.24, -0.5], [0.24, -0.5]]) {
      const hip = new THREE.Group();
      hip.position.set(x, 0.95, z);
      this.group.add(hip);

      const thigh = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.44, 0.15), this.material);
      thigh.position.y = -0.22;
      hip.add(thigh);

      const knee = new THREE.Group();
      knee.position.y = -0.44;
      hip.add(knee);

      const shin = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.46, 0.11), this.material);
      shin.position.y = -0.23;
      knee.add(shin);

      this.legs.push({ hip, knee });
    }
  }

  setPosition(x, y, z) {
    this.group.position.set(x, y, z);
    return this;
  }
}
