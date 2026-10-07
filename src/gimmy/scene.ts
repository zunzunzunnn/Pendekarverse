import * as THREE from "three";
import type { Quality } from "./rules";
import type { BedId } from "./collections";
import { loadGimmyAnim, drawGimmyAnim, animDuration, type GimmyAnim } from "./gimmy-animations";

type SleepLevel = 1 | 2 | 3 | 4 | 5;
const idleName = (n: Exclude<SleepLevel, 5>) => `sleep${n}` as GimmyAnim;
const eatName = (n: Exclude<SleepLevel, 5>) => `eat${n}` as GimmyAnim;
const transitionName = (from: number) => `trans${from}${from + 1}` as GimmyAnim;

export class GimmyScene {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-100,100,100,-100,.1,2000);
  ready = false;
  bed: BedId = "daun";
  sprite: HTMLCanvasElement;
  spriteName: GimmyAnim = "sleep1";
  decodedName: GimmyAnim = "sleep1";
  spriteImage?: HTMLImageElement;
  spriteTime = 0;
  spriteGeneration = 0;
  qualityLevel: Quality;
  reduced = false;
  sleepLevel: SleepLevel = 1;
  targetLevel: SleepLevel = 1;
  mode: "idle" | "eat" | "transition" | "failed" = "idle";
  wakeComplete = false;

  constructor(public canvas: HTMLCanvasElement, quality: Quality) {
    this.qualityLevel = quality;
    this.sprite = document.createElement("canvas");
    this.sprite.className = "sleep-sprite new-gimmy-animation";
    canvas.parentElement!.append(this.sprite);
    this.renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:false,powerPreference:"low-power"});
    this.renderer.setClearColor(0,0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.quality(quality);
  }
  quality(q: Quality) {
    this.qualityLevel=q;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,q==="low"?1:q==="medium"?1.5:2));
    this.resize();
  }
  resize() {
    const w=this.canvas.clientWidth,h=this.canvas.clientHeight;
    if(!w||!h)return;
    this.renderer.setSize(w,h,false);
  }
  async load(bed: BedId="daun") {
    this.bed=bed; this.ready=true; this.resize();
    await this.setHome();
  }
  private async change(name:GimmyAnim, mode=this.mode) {
    this.spriteName=name; this.spriteTime=0; this.mode=mode;
    const generation=++this.spriteGeneration;
    try {
      const image=await loadGimmyAnim(name);
      if(generation!==this.spriteGeneration)return;
      this.spriteImage=image; this.decodedName=name;
      drawGimmyAnim(this.sprite,name,image,0,mode!=="idle");
    } catch(e) { console.error(e); }
  }
  async setHome() {
    this.sleepLevel=1; this.targetLevel=1; this.wakeComplete=false;
    await this.change("sleep1","idle");
  }
  async startGameplay() {
    this.sleepLevel=3; this.targetLevel=3; this.wakeComplete=false;
    await this.change("sleep3","idle");
  }
  resetSleep() { void this.setHome(); }

  private levelForSleep(value:number):SleepLevel {
    // Broad bands keep each anxiety stage on screen longer.
    if(value<=0)return 5;
    if(value>=96)return 1;
    if(value>=85)return 2;
    if(value>=35)return 3;
    return 4;
  }
  setSleep(value:number) {
    const next=this.levelForSleep(value);
    this.targetLevel=next;
    if(next===5 && this.sleepLevel===4 && this.mode==="idle") void this.beginWorsening();
    // Recovery is intentionally responsive: calmer states may replace the idle immediately.
    if(next<this.sleepLevel && this.mode==="idle") {
      this.sleepLevel=next;
      void this.change(idleName(next as Exclude<SleepLevel,5>),"idle");
    }
  }
  feed() {
    if(this.mode!=="idle" || this.sleepLevel===5)return;
    void this.change(eatName(this.sleepLevel as Exclude<SleepLevel,5>),"eat");
  }
  private async beginWorsening() {
    if(this.mode!=="idle" || this.targetLevel<=this.sleepLevel)return;
    const from=this.sleepLevel;
    await this.change(transitionName(from),"transition");
  }
  private async finishOnce() {
    if(this.mode==="eat") {
      // Eat always finishes. Afterwards use the newest meter state.
      const next=this.targetLevel;
      if(next<this.sleepLevel) this.sleepLevel=next;
      await this.change(idleName(this.sleepLevel as Exclude<SleepLevel,5>),"idle");
      if(this.targetLevel>this.sleepLevel) await this.beginWorsening();
      return;
    }
    if(this.mode==="transition") {
      this.sleepLevel=(this.sleepLevel+1) as SleepLevel;
      if(this.sleepLevel===5) {
        this.mode="failed"; this.wakeComplete=true;
        return;
      }
      await this.change(idleName(this.sleepLevel as Exclude<SleepLevel,5>),"idle");
      if(this.targetLevel>this.sleepLevel) await this.beginWorsening();
    }
  }
  render(dt:number, playing:boolean) {
    if(playing) this.spriteTime+=dt;
    const once=this.mode!=="idle";
    if(this.spriteImage) drawGimmyAnim(this.sprite,this.decodedName,this.spriteImage,this.reduced?0:this.spriteTime,once);
    if(playing && once && this.spriteTime>=animDuration(this.decodedName)) void this.finishOnce();
    if(playing && this.mode==="idle" && this.targetLevel>this.sleepLevel) {
      const duration=animDuration(this.decodedName);
      // Anxiety increases only at a clean idle-loop boundary.
      if(this.spriteTime>=duration) {
        this.spriteTime%=duration;
        void this.beginWorsening();
      }
    }
    this.renderer.render(this.scene,this.camera);
  }
}
