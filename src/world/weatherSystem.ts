import * as THREE from 'three';
import type { WeatherType } from '../core/types';

export class WeatherAndSkySystem {
  private sunLight: THREE.DirectionalLight;
  private hemiLight: THREE.HemisphereLight;
  private scene: THREE.Scene;
  private streetLamps: THREE.PointLight[];
  private asphaltMat: THREE.MeshStandardMaterial;

  private rainPoints: THREE.Points;
  private rainPositions: Float32Array;
  private rainCount = 700;
  private isRaining = false;

  private skyClearDay = new THREE.Color('#bae6fd');
  private skyGolden = new THREE.Color('#fdba74');
  private skyNight = new THREE.Color('#0b1120');
  private skyRain = new THREE.Color('#475569');
  private scratchSky = new THREE.Color();

  constructor(
    scene: THREE.Scene,
    sunLight: THREE.DirectionalLight,
    hemiLight: THREE.HemisphereLight,
    streetLamps: THREE.PointLight[],
    asphaltMat: THREE.MeshStandardMaterial,
  ) {
    this.scene = scene;
    this.sunLight = sunLight;
    this.hemiLight = hemiLight;
    this.streetLamps = streetLamps;
    this.asphaltMat = asphaltMat;

    // Procedural Rain Streak Particles
    this.rainPositions = new Float32Array(this.rainCount * 3);
    for (let i = 0; i < this.rainCount; i++) {
      this.rainPositions[i * 3] = (Math.random() - 0.5) * 44;
      this.rainPositions[i * 3 + 1] = Math.random() * 14;
      this.rainPositions[i * 3 + 2] = 6 + Math.random() * 20; // Outdoor street rain
    }

    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: '#cbd5e1',
      size: 0.09,
      transparent: true,
      opacity: 0.65,
    });
    this.rainPoints = new THREE.Points(rainGeo, rainMat);
    this.rainPoints.visible = false;
    this.scene.add(this.rainPoints);
  }

  public setWeather(weather: WeatherType): void {
    this.isRaining = weather === 'rain';
    this.rainPoints.visible = this.isRaining;
    // Wet street sheen when raining
    this.asphaltMat.roughness = this.isRaining ? 0.18 : 0.78;
    this.asphaltMat.metalness = this.isRaining ? 0.25 : 0.05;
  }

  public update(dt: number, hour: number): void {
    // Sun & Sky Cycle based on simulation hour (0..24)
    const isNight = hour < 6 || hour >= 19;
    const isGolden = (hour >= 6 && hour < 8) || (hour >= 16.5 && hour < 19);

    if (this.isRaining) {
      this.scratchSky.copy(isNight ? this.skyNight : this.skyRain);
      this.sunLight.intensity = isNight ? 0.25 : 0.85;
      this.hemiLight.intensity = isNight ? 0.45 : 0.9;
    } else if (isNight) {
      this.scratchSky.copy(this.skyNight);
      this.sunLight.intensity = 0.22;
      this.hemiLight.intensity = 0.45;
    } else if (isGolden) {
      this.scratchSky.copy(this.skyGolden);
      this.sunLight.intensity = 1.45;
      this.sunLight.color.set('#fed7aa');
      this.hemiLight.intensity = 0.85;
    } else {
      this.scratchSky.copy(this.skyClearDay);
      this.sunLight.intensity = 1.9;
      this.sunLight.color.set('#fffbeb');
      this.hemiLight.intensity = 1.0;
    }

    this.scene.background = this.scratchSky;
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.copy(this.scratchSky);
    }

    // Street lamps illuminate at evening/night/rain
    const lampIntensity = isNight || this.isRaining ? 4.2 : 0.1;
    for (const lamp of this.streetLamps) {
      lamp.intensity = lampIntensity;
    }

    // Update rain fall
    if (this.isRaining) {
      for (let i = 0; i < this.rainCount; i++) {
        let y = this.rainPositions[i * 3 + 1] - dt * 16;
        if (y < 0) y = 13 + Math.random() * 2;
        this.rainPositions[i * 3 + 1] = y;
      }
      this.rainPoints.geometry.attributes.position.needsUpdate = true;
    }
  }
}
