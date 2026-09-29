import * as T from "three";
import { Character, loadCharacter } from "./character";
import { buildWorld, World } from "./world";
import { Navigation } from "./collision";
import { Input } from "./input";
import { AudioSystem } from "./audio";
import {
  RULES,
  Settings,
  State,
  resolveQuality,
  isMobile,
  enemyCap,
  hitEligible,
  attackPhase,
  saveSettings,
} from "./config";
export interface Enemy {
  body: Character;
  hp: number;
  state: "spawn" | "idle" | "chase" | "attack" | "recovery" | "dead";
  timer: number;
  cooldown: number;
  hit: boolean;
  flash: number;
  path: T.Vector3[];
  repath: number;
  lost: number;
  home: T.Vector3;
}
export class Game {
  scene = new T.Scene();
  camera = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 260);
  renderer: T.WebGLRenderer;
  world: World;
  nav: Navigation;
  input: Input;
  audio = new AudioSystem();
  state: State = "menu";
  player?: Character;
  enemies: Enemy[] = [];
  hp = 100;
  score = 0;
  kills = 0;
  elapsed = 0;
  introTime = 0;
  deathTime = 0;
  attackTime = -1;
  attackHit = false;
  buffered = false;
  velocityY = 0;
  invulnerability = 0;
  flash = 0;
  yaw = 0;
  pitch = 0.28;
  manualCamera = 0;
  spawnTimer = 0;
  initialSpawn = false;
  stepTime = 0;
  fps = 60;
  quality = "medium";
  session = 0;
  onState: (state: State) => void = () => {};
  onHUD: () => void = () => {};
  onProgress: (s: string) => void = () => {};
  error = "";
  private accumulator = 0;
  private last = 0;
  private frameCount = 0;
  private frameElapsed = 0;
  private performanceWindow = 0;
  private slowFrames = 0;
  private target = new T.Vector3();
  private previewAngle = 0;
  private particles: { mesh: T.Mesh; life: number; velocity: T.Vector3 }[] = [];
  private sparkGeo = new T.SphereGeometry(0.035, 5, 4);
  private sparkMat = new T.MeshBasicMaterial({ color: 0xffd9a0 });
  constructor(public settings: Settings) {
    this.renderer = new T.WebGLRenderer({
      canvas: document.querySelector("#world")!,
      antialias: !isMobile(),
      powerPreference: "high-performance",
    });
    this.renderer.outputColorSpace = T.SRGBColorSpace;
    this.renderer.toneMapping = T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    this.renderer.shadowMap.type = T.PCFSoftShadowMap;
    this.world = buildWorld(this.scene);
    this.nav = new Navigation(this.world.collision);
    this.applySettings();
    this.camera.position.set(22, 12, 28);
    this.input = new Input(
      this.renderer.domElement,
      () => this.state === "playing",
      () => this.togglePause(),
      () => this.skip(),
    );
    addEventListener("resize", () => {
      this.resize();
      this.checkOrientation();
    });
    addEventListener("blur", () => this.pause());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.pause();
    });
    this.renderer.domElement.addEventListener("webglcontextlost", (e) => {
      e.preventDefault();
      this.pause();
      this.error =
        "Memori grafis terputus. Muat ulang halaman untuk melanjutkan.";
      this.setState("error");
    });
    this.renderer.domElement.addEventListener("webglcontextrestored", () =>
      location.reload(),
    );
    this.resize();
    requestAnimationFrame((t) => this.frame(t));
  }
  applySettings() {
    this.quality = resolveQuality(this.settings.quality);
    const high = this.quality === "high",
      low = this.quality === "low";
    this.renderer.setPixelRatio(
      Math.min(devicePixelRatio, low ? 1 : high ? 1.5 : 1.25),
    );
    this.renderer.shadowMap.enabled = !low;
    this.world.detail.visible = !low;
    this.world.sun.castShadow = !low;
    this.world.sun.shadow.mapSize.set(high ? 2048 : 1024, high ? 2048 : 1024);
    this.world.sun.shadow.map?.dispose();
    this.world.sun.shadow.map = null;
    this.audio.volume = Math.max(0, Math.min(1, this.settings.volume));
    this.audio.music = Math.max(0, Math.min(1, this.settings.music));
    this.audio.active(this.state === "playing");
    saveSettings(this.settings);
  }
  resize() {
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(innerWidth, innerHeight);
  }
  setState(s: State) {
    this.state = s;
    this.input?.clear();
    this.accumulator = 0;
    this.audio.active(s === "playing");
    this.onState(s);
  }
  async select() {
    this.audio.unlock();
    const request = ++this.session;
    this.setState("loading");
    try {
      await loadCharacter((s) => this.onProgress(s));
      if (request !== this.session) return;
      this.clearActors();
      this.player = new Character(this.settings.character);
      this.player.root.position.set(0, 0, 19);
      this.scene.add(this.player.root);
      this.previewAngle = 0;
      this.setState("select");
    } catch (e) {
      if (request !== this.session) return;
      this.error = `Karakter gagal dimuat. Periksa koneksi lalu coba lagi. ${e instanceof Error ? e.message : ""}`;
      this.setState("error");
    }
  }
  choose(i: number) {
    this.settings.character = i;
    saveSettings(this.settings);
    this.player?.dispose();
    this.player = new Character(i);
    this.player.root.position.set(0, 0, 19);
    this.scene.add(this.player.root);
  }
  start() {
    if (!this.player) return;
    this.applySettings();
    this.enemies.forEach((e) => e.body.dispose());
    this.enemies = [];
    this.particles.forEach((p) => p.mesh.removeFromParent());
    this.particles = [];
    this.hp = 100;
    this.score =
      this.kills =
      this.elapsed =
      this.introTime =
      this.deathTime =
      this.spawnTimer =
      this.velocityY =
      this.invulnerability =
      this.flash =
        0;
    this.attackTime = -1;
    this.attackHit = this.buffered = this.initialSpawn = false;
    this.yaw = 0;
    this.pitch = 0.28;
    this.manualCamera = 0;
    this.player.root.position.set(0, 0, 19);
    this.player.root.rotation.set(0, Math.PI, 0);
    this.player.play("Idle");
    this.setState("intro");
    this.checkOrientation();
  }
  clearActors() {
    this.player?.dispose();
    this.player = undefined;
    this.enemies.forEach((e) => e.body.dispose());
    this.enemies = [];
    this.particles.forEach((p) => p.mesh.removeFromParent());
    this.particles = [];
  }
  menu() {
    this.session++;
    this.clearActors();
    this.setState("menu");
  }
  skip() {
    if (this.state === "intro") {
      this.setState("playing");
      this.followCamera(1, true);
      this.checkOrientation();
    } else if (this.state === "dead") this.menu();
  }
  pause() {
    if (this.state === "playing" || this.state === "intro") {
      this.setState("paused");
    }
  }
  togglePause() {
    if (this.state === "playing" || this.state === "intro") this.pause();
    else if (this.state === "paused") this.resume();
  }
  resume() {
    if (isMobile() && innerHeight > innerWidth) return;
    this.audio.unlock();
    this.setState("playing");
  }
  checkOrientation() {
    if (
      isMobile() &&
      innerHeight > innerWidth &&
      (this.state === "playing" || this.state === "intro")
    )
      this.pause();
  }
  beginAttack() {
    if (!this.player || this.player.root.position.y > 0.05) return;
    if (this.attackTime >= 0) {
      if (this.attackTime > RULES.attackDuration - RULES.buffer)
        this.buffered = true;
      return;
    }
    this.attackTime = 0;
    this.attackHit = false;
    this.player.play("Attack_01");
    this.audio.sound("punch");
    const pos = this.player.root.position;
    const near = this.enemies
      .filter(
        (e) =>
          e.hp > 0 &&
          e.state !== "spawn" &&
          hitEligible(
            e.body.root.position.x - pos.x,
            e.body.root.position.z - pos.z,
            0,
            this.player!.root.rotation.y,
            2.4,
            Math.PI / 3,
          ),
      )
      .sort(
        (a, b) =>
          a.body.root.position.distanceToSquared(pos) -
          b.body.root.position.distanceToSquared(pos),
      )[0];
    if (near) {
      const angle = Math.atan2(
          near.body.root.position.x - pos.x,
          near.body.root.position.z - pos.z,
        ),
        delta =
          T.MathUtils.euclideanModulo(
            angle - this.player.root.rotation.y + Math.PI,
            Math.PI * 2,
          ) - Math.PI;
      this.player.root.rotation.y += T.MathUtils.clamp(
        delta,
        -Math.PI / 6,
        Math.PI / 6,
      );
    }
  }
  fixed(dt: number) {
    if (this.state !== "playing" || !this.player) return;
    this.elapsed += dt;
    const p = this.player.root.position;
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.flash = Math.max(0, this.flash - dt);
    this.manualCamera = Math.max(0, this.manualCamera - dt);
    if (this.input.attack) {
      this.beginAttack();
      this.input.attack = false;
    }
    if (this.input.jump) {
      if (p.y <= 0.001 && this.attackTime < 0) {
        this.velocityY = RULES.jump;
        this.player.play("Jump");
      }
      this.input.jump = false;
    }
    const move = this.input.movement(),
      moving = Math.hypot(move.x, move.y) > 0.05,
      sprinting = move.sprint && this.attackTime < 0;
    const speed =
      this.attackTime >= 0
        ? RULES.walk * 0.35
        : sprinting
          ? RULES.sprint
          : RULES.walk;
    const dx = move.x * Math.cos(this.yaw) + move.y * Math.sin(this.yaw),
      dz = -move.x * Math.sin(this.yaw) + move.y * Math.cos(this.yaw);
    this.world.collision.move(p, dx * speed * dt, dz * speed * dt);
    if (moving && this.attackTime < 0) {
      const desired = Math.atan2(dx, dz);
      this.player.root.rotation.y +=
        (T.MathUtils.euclideanModulo(
          desired - this.player.root.rotation.y + Math.PI,
          Math.PI * 2,
        ) -
          Math.PI) *
        Math.min(1, dt * 16);
    }
    if (p.y > 0 || this.velocityY > 0) {
      this.velocityY -= RULES.gravity * dt;
      p.y += this.velocityY * dt;
      if (p.y <= 0) {
        p.y = 0;
        this.velocityY = 0;
        this.player.play("Land");
      }
    }
    if (!Number.isFinite(p.x) || Math.abs(p.x) > 59 || Math.abs(p.z) > 59)
      p.set(0, 0, 19);
    if (this.attackTime >= 0) {
      this.attackTime += dt;
      if (attackPhase(this.attackTime) === "active" && !this.attackHit) {
        const target = this.enemies
          .filter(
            (e) =>
              e.hp > 0 &&
              e.state !== "spawn" &&
              hitEligible(
                e.body.root.position.x - p.x,
                e.body.root.position.z - p.z,
                e.body.root.position.y - p.y,
                this.player!.root.rotation.y,
                RULES.range,
              ) &&
              this.world.collision.clear(p, e.body.root.position, 0.08),
          )
          .sort(
            (a, b) =>
              a.body.root.position.distanceToSquared(p) -
              b.body.root.position.distanceToSquared(p),
          )[0];
        if (target) {
          this.attackHit = true;
          target.hp = Math.max(0, target.hp - RULES.damage);
          target.flash = 0.18;
          this.spark(target.body.root.position);
          this.audio.sound("hit");
          if (target.hp === 0) {
            target.state = "dead";
            target.timer = 0;
            target.body.play("Death");
            this.kills++;
            this.score = this.kills * RULES.points;
          } else {
            target.state = "recovery";
            target.timer = 0.3;
            target.body.play("Hit");
          }
        }
      }
      if (this.attackTime >= RULES.attackDuration) {
        this.attackTime = -1;
        if (this.buffered) {
          this.buffered = false;
          this.beginAttack();
        }
      }
    }
    if (this.attackTime < 0 && p.y <= 0 && this.flash <= 0)
      this.player.play(moving ? (sprinting ? "Run" : "Walk") : "Idle");
    if (moving && p.y <= 0) {
      this.stepTime += dt;
      if (this.stepTime > (sprinting ? 0.27 : 0.4)) {
        this.stepTime = 0;
        this.audio.sound("step");
      }
    }
    this.tickEnemies(dt);
    this.tickSpawn(dt);
    this.player.update(dt, this.hp, 100, this.flash);
    this.updateParticles(dt);
    if (this.hp <= 0) this.die();
  }
  tickEnemies(dt: number) {
    const p = this.player!.root.position;
    let attackers = this.enemies.filter((e) => e.state === "attack").length;
    for (const e of this.enemies) {
      e.timer += dt;
      e.cooldown = Math.max(0, e.cooldown - dt);
      e.flash = Math.max(0, e.flash - dt);
      const pos = e.body.root.position,
        distance = pos.distanceTo(p);
      if (e.state === "dead") {
        e.body.root.rotation.z = Math.min(Math.PI / 2, e.timer * 1.6);
        e.body.bar.visible = false;
        e.body.update(dt, 0, RULES.enemyHP);
        continue;
      }
      if (e.state === "spawn") {
        e.body.root.scale.setScalar(Math.min(1, e.timer * 2));
        if (e.timer >= 0.5) {
          e.state = "idle";
          e.timer = 0;
        }
        e.body.update(dt, e.hp, RULES.enemyHP);
        continue;
      }
      const sees = distance < 12 && this.world.collision.clear(pos, p, 0.1);
      e.lost = sees ? 0 : e.lost + dt;
      if (e.state === "attack") {
        e.body.ring.scale.setScalar(1 + Math.sin(e.timer * 18) * 0.15);
        if (e.timer >= RULES.enemyWindup && !e.hit) {
          e.hit = true;
          if (
            distance <= RULES.enemyRange &&
            Math.abs(p.y - pos.y) < 1.35 &&
            this.world.collision.clear(pos, p, 0.08) &&
            this.invulnerability <= 0
          ) {
            this.hp = Math.max(0, this.hp - RULES.enemyDamage);
            this.invulnerability = RULES.invulnerability;
            this.flash = 0.18;
            this.audio.sound("hurt");
            if (this.attackTime < 0) this.player!.play("Hit");
          }
        }
        if (e.timer > 0.85) {
          e.state = "recovery";
          e.timer = 0;
          e.body.ring.scale.setScalar(1);
        }
      } else if (e.state === "recovery") {
        if (e.timer > 0.5) {
          e.state = "chase";
          e.timer = 0;
        }
      } else {
        const chasing = sees || e.lost < 5;
        const goal = chasing ? p : e.home;
        e.state = chasing ? "chase" : "idle";
        if (
          distance < RULES.enemyRange - 0.12 &&
          e.cooldown <= 0 &&
          attackers < 2 &&
          chasing
        ) {
          e.state = "attack";
          e.timer = 0;
          e.hit = false;
          e.cooldown = RULES.enemyCooldown;
          attackers++;
          e.body.play("Attack_01");
          e.body.root.rotation.y = Math.atan2(p.x - pos.x, p.z - pos.z);
        } else if (pos.distanceTo(goal) > 1.05) {
          e.repath -= dt;
          let dest = goal;
          if (!this.world.collision.clear(pos, goal, 0.5)) {
            if (e.repath <= 0) {
              e.path = this.nav.path(pos, goal);
              e.repath = 1.5;
            }
            while (e.path.length && pos.distanceTo(e.path[0]) < 0.7)
              e.path.shift();
            dest = e.path[0] || pos;
          }
          let direction = dest.clone().sub(pos);
          direction.y = 0;
          if (direction.lengthSq() > 0) direction.normalize();
          for (const other of this.enemies) {
            if (other === e || other.hp <= 0) continue;
            const away = pos.clone().sub(other.body.root.position),
              n = away.length();
            if (n < 1 && n > 0.01)
              direction.addScaledVector(away, ((1 - n) * 2) / n);
          }
          direction.clampLength(0, 1);
          this.world.collision.move(
            pos,
            direction.x * RULES.enemySpeed * dt,
            direction.z * RULES.enemySpeed * dt,
          );
          if (direction.lengthSq() > 0.01)
            e.body.root.rotation.y = Math.atan2(direction.x, direction.z);
          e.body.play("Walk");
        } else e.body.play("Idle");
      }
      e.body.update(dt, e.hp, RULES.enemyHP, e.flash);
    }
    this.enemies = this.enemies.filter((e) => {
      if (e.state === "dead" && e.timer > 2) {
        e.body.dispose();
        return false;
      }
      return true;
    });
  }
  tickSpawn(dt: number) {
    if (this.elapsed < RULES.grace) return;
    if (!this.initialSpawn) {
      this.spawn();
      this.spawn();
      this.initialSpawn = true;
      this.spawnTimer = 0;
    }
    this.spawnTimer += dt;
    if (this.spawnTimer >= RULES.spawnInterval) {
      this.spawnTimer = 0;
      if (this.enemies.filter((e) => e.hp > 0).length < enemyCap(this.elapsed))
        this.spawn();
    }
  }
  spawn() {
    const p = this.player!.root.position;
    const forward = new T.Vector3();
    this.camera.getWorldDirection(forward);
    const candidates = this.world.spawnPoints.filter((s) => {
      const d = s.distanceTo(p);
      return (
        d >= 10 &&
        d <= 22 &&
        !this.enemies.some((e) => e.body.root.position.distanceTo(s) < 2) &&
        this.nav.path(s, p).length
      );
    });
    candidates.sort(
      (a, b) =>
        forward.dot(a.clone().sub(p).normalize()) -
        forward.dot(b.clone().sub(p).normalize()),
    );
    const point = candidates[0];
    if (!point) return;
    const body = new Character(2, true);
    body.root.position.copy(point);
    body.root.scale.setScalar(0.01);
    this.scene.add(body.root);
    this.enemies.push({
      body,
      hp: RULES.enemyHP,
      state: "spawn",
      timer: 0,
      cooldown: 0,
      hit: false,
      flash: 0,
      path: [],
      repath: 0,
      lost: 0,
      home: point.clone(),
    });
  }
  die() {
    this.hp = 0;
    this.settings.last = this.score;
    this.settings.kills = this.kills;
    this.settings.best = Math.max(this.settings.best, this.score);
    saveSettings(this.settings);
    this.player!.play("Death");
    this.audio.sound("death");
    this.deathTime = 0;
    this.setState("dead");
  }
  spark(p: T.Vector3) {
    for (let i = 0; i < 9; i++) {
      const mesh = new T.Mesh(this.sparkGeo, this.sparkMat);
      mesh.position.copy(p).add(new T.Vector3(0, 1.1, 0));
      this.scene.add(mesh);
      this.particles.push({
        mesh,
        life: 0.32,
        velocity: new T.Vector3(
          (Math.random() - 0.5) * 3,
          Math.random() * 3,
          (Math.random() - 0.5) * 3,
        ),
      });
    }
  }
  updateParticles(dt: number) {
    for (const p of this.particles) {
      p.life -= dt;
      p.mesh.position.addScaledVector(p.velocity, dt);
      p.velocity.y -= 9 * dt;
      p.mesh.scale.setScalar(Math.max(0, p.life * 3));
    }
    this.particles = this.particles.filter((p) => {
      if (p.life <= 0) {
        p.mesh.removeFromParent();
        return false;
      }
      return true;
    });
  }
  followCamera(dt: number, snap = false) {
    if (!this.player) return;
    const input = this.input;
    if (input.cameraX || input.cameraY) {
      this.yaw -= input.cameraX * 0.004 * this.settings.sensitivity;
      this.pitch = T.MathUtils.clamp(
        this.pitch +
          input.cameraY *
            0.003 *
            this.settings.sensitivity *
            (this.settings.invertY ? -1 : 1),
        -0.12,
        0.96,
      );
      input.cameraX = input.cameraY = 0;
      this.manualCamera = 2;
    }
    const moving = this.input.movement();
    if (input.recenter) {
      this.yaw = this.player.root.rotation.y + Math.PI;
      input.recenter = false;
      this.manualCamera = 2;
    } else if (
      this.manualCamera <= 0 &&
      Math.abs(moving.x) + Math.abs(moving.y) > 0.05
    ) {
      const behind = this.player.root.rotation.y + Math.PI;
      this.yaw +=
        (T.MathUtils.euclideanModulo(behind - this.yaw + Math.PI, Math.PI * 2) -
          Math.PI) *
        Math.min(1, dt * 0.6);
    }
    const target = this.player.root.position
      .clone()
      .add(new T.Vector3(0, 1.25, 0));
    const desired = target
      .clone()
      .add(
        new T.Vector3(
          Math.sin(this.yaw) * 5 * Math.cos(this.pitch),
          Math.sin(this.pitch) * 5,
          Math.cos(this.yaw) * 5 * Math.cos(this.pitch),
        ),
      );
    desired.y = Math.max(0.55, desired.y);
    const dist = this.world.collision.cameraDistance(target, desired);
    desired.sub(target).setLength(dist).add(target);
    this.camera.position.lerp(desired, snap ? 1 : 1 - Math.exp(-dt * 9));
    this.target.lerp(target, snap ? 1 : 1 - Math.exp(-dt * 14));
    this.camera.lookAt(this.target);
    const fov = this.settings.reducedMotion ? 58 : moving.sprint ? 63 : 58;
    this.camera.fov = T.MathUtils.lerp(this.camera.fov, fov, dt * 5);
    this.camera.updateProjectionMatrix();
    if (this.flash > 0 && this.settings.shake && !this.settings.reducedMotion)
      this.camera.position.x += Math.sin(this.elapsed * 85) * 0.025;
  }
  frame(time: number) {
    requestAnimationFrame((t) => this.frame(t));
    const dt = Math.min((time - this.last) / 1000 || 0, 0.0833);
    this.last = time;
    if (document.hidden) return;
    if (this.state === "playing") {
      this.accumulator += dt;
      let steps = 0;
      while (this.accumulator >= 1 / 60 && steps++ < 5) {
        this.fixed(1 / 60);
        this.accumulator -= 1 / 60;
        if (this.state !== "playing") break;
      }
      this.accumulator = Math.max(0, this.accumulator);
      this.followCamera(dt);
    } else if (this.state === "intro" && this.player) {
      this.introTime += dt;
      const duration = this.settings.reducedMotion ? 0.3 : 3.6,
        t = Math.min(1, this.introTime / duration),
        smooth = t * t * (3 - 2 * t);
      this.camera.position.set(
        18 * (1 - smooth),
        10 * (1 - smooth) + 2.65 * smooth,
        -2 * (1 - smooth) + 23.8 * smooth,
      );
      this.camera.lookAt(0, 1.3, 19 * smooth - 15 * (1 - smooth));
      this.player.update(dt, 100, 100);
      if (t === 1) this.skip();
    } else if (this.state === "dead" && this.player) {
      this.deathTime += dt;
      this.player.root.rotation.z = Math.min(Math.PI / 2, this.deathTime * 1.5);
      this.player.update(dt, 0, 100);
      if (!this.settings.reducedMotion)
        this.camera.position.lerp(
          this.player.root.position.clone().add(new T.Vector3(2, 2.2, 3)),
          dt * 0.7,
        );
      this.camera.lookAt(
        this.player.root.position.clone().add(new T.Vector3(0, 0.6, 0)),
      );
      if (this.deathTime > 2.8) this.menu();
    } else if (this.state === "select" && this.player) {
      if (!this.settings.reducedMotion) this.previewAngle += dt * 0.12;
      this.player.update(dt, 100, 100);
      this.player.bar.visible = false;
      this.player.root.rotation.y = Math.PI + 0.2;
      this.camera.position.set(
        -2.8 + Math.sin(this.previewAngle) * 0.4,
        1.65,
        15.4,
      );
      this.camera.lookAt(0.55, 1.05, 19);
    } else if (
      this.state === "menu" ||
      this.state === "loading" ||
      this.state === "error"
    ) {
      const t = this.settings.reducedMotion ? 0 : time * 0.000012;
      this.camera.position.set(20 + Math.sin(t) * 3, 9.5, 25);
      this.camera.lookAt(-2, 2, -17);
    }
    if (this.player && this.state !== "select")
      this.player.bar.visible = this.state === "playing";
    for (const e of this.enemies) {
      const p = e.body.root.position.clone().add(new T.Vector3(0, 2, 0)),
        screen = p.clone().project(this.camera);
      e.body.bar.visible =
        e.hp > 0 &&
        e.state !== "spawn" &&
        p.distanceTo(this.camera.position) < 15 &&
        screen.z < 1 &&
        screen.z > -1 &&
        Math.abs(screen.x) < 1 &&
        Math.abs(screen.y) < 1 &&
        this.world.collision.clear(
          this.camera.position,
          e.body.root.position,
          0.02,
        );
    }
    this.world.water.material instanceof T.MeshStandardMaterial &&
      (this.world.water.material.opacity =
        0.81 + Math.sin(time * 0.0007) * 0.035);
    this.renderer.render(this.scene, this.camera);
    this.frameCount++;
    this.frameElapsed += dt;
    if (this.frameElapsed >= 1) {
      this.fps = Math.round(this.frameCount / this.frameElapsed);
      this.frameCount = this.frameElapsed = 0;
      this.onHUD();
      if (this.state === "playing" && this.settings.quality === "auto") {
        this.performanceWindow++;
        if (this.fps < 35) this.slowFrames++;
        if (this.performanceWindow >= 6) {
          if (this.slowFrames >= 4) {
            const ratio = this.renderer.getPixelRatio();
            this.renderer.setPixelRatio(Math.max(0.65, ratio - 0.2));
            this.world.detail.visible = false;
          }
          this.performanceWindow = this.slowFrames = 0;
        }
      }
    }
    if (this.state === "playing") this.onHUD();
  }
}
