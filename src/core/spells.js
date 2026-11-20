// Sistema de magias disparadas pelos gestos (Circulo, Triangulo, Quadrado).
import * as THREE from 'three';

export class SpellManager {
  constructor(scene, conjurerStand, dementors, onDementorDefeated = null) {
    this.scene = scene;
    this.conjurerStand = conjurerStand;
    this.dementors = dementors;
    this.onDementorDefeated = onDementorDefeated;
    this.projectiles = [];
    this.beams = [];
    this.shieldTimer = 0;

    // Escudo protetor (Quadrado)
    const shieldGeo = new THREE.SphereGeometry(1.15, 16, 12);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    this.shieldMesh.position.y = -0.35;
    this.shieldMesh.visible = false;
    this.conjurerStand.add(this.shieldMesh);
  }

  cast(shape, origin, direction) {
    if (shape === 'circle') {
      this.castPatronusWave(origin, direction);
    } else if (shape === 'triangle') {
      this.castBeam(origin, direction);
    } else if (shape === 'square') {
      this.castShield();
    }
  }

  castPatronusWave(origin, direction) {
    const group = new THREE.Group();
    group.position.copy(origin);

    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 10),
      new THREE.MeshBasicMaterial({
        color: 0xbfe6ff,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    const light = new THREE.PointLight(0x88ccff, 18, 10);
    group.add(core, light);
    this.scene.add(group);

    this.projectiles.push({
      mesh: group,
      velocity: direction.clone().normalize().multiplyScalar(11),
      life: 1.6,
    });
  }

  castBeam(origin, direction) {
    const dir = direction.clone().normalize();
    const length = 12;
    const geo = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xdff6ff,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(geo, mat);
    beam.position.copy(origin).addScaledVector(dir, length / 2);
    beam.lookAt(origin.clone().add(dir));
    this.scene.add(beam);

    this.beams.push({ mesh: beam, life: 0.28 });

    // Empurra e causa dano aos dementadores proximos ao raio
    for (let i = this.dementors.length - 1; i >= 0; i--) {
      const dementor = this.dementors[i];
      const toDementor = dementor.group.position.clone().sub(origin);
      const proj = toDementor.dot(dir);
      if (proj > 0 && proj < length) {
        const perpDist = toDementor.sub(dir.clone().multiplyScalar(proj)).length();
        if (perpDist < 1.3) {
          dementor.group.position.addScaledVector(dir, 2.2);
          this.damageDementor(i, 1);
        }
      }
    }
  }

  damageDementor(index, amount) {
    const dementor = this.dementors[index];
    if (!dementor) return;
    dementor.hp = (dementor.hp ?? 2) - amount;
    if (dementor.hp <= 0) {
      this.scene.remove(dementor.group);
      this.dementors.splice(index, 1);
      if (this.onDementorDefeated) this.onDementorDefeated();
    }
  }

  castShield() {
    this.shieldTimer = 4.0;
    this.shieldMesh.visible = true;
  }

  update(delta) {
    // Atualiza escudo
    if (this.shieldTimer > 0) {
      this.shieldTimer -= delta;
      this.shieldMesh.rotation.y += delta * 1.2;
      this.shieldMesh.material.opacity = 0.18 + Math.sin(this.shieldTimer * 6) * 0.07;
      if (this.shieldTimer <= 0) {
        this.shieldMesh.visible = false;
      }
    }

    // Atualiza projeteis do Patrono
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= delta;
      p.mesh.position.addScaledVector(p.velocity, delta);

      let hit = false;
      for (let j = this.dementors.length - 1; j >= 0; j--) {
        const dementor = this.dementors[j];
        if (p.mesh.position.distanceTo(dementor.group.position) < 1.5) {
          const pushDir = p.velocity.clone().setY(0).normalize();
          dementor.group.position.addScaledVector(pushDir, 2.5);
          this.damageDementor(j, 2);
          hit = true;
          break;
        }
      }

      if (hit || p.life <= 0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
      }
    }

    // Atualiza feixes
    for (let i = this.beams.length - 1; i >= 0; i--) {
      const b = this.beams[i];
      b.life -= delta;
      b.mesh.material.opacity = Math.max(0, b.life / 0.28);
      if (b.life <= 0) {
        this.scene.remove(b.mesh);
        this.beams.splice(i, 1);
      }
    }
  }
}
