import { Color3, StandardMaterial } from "@babylonjs/core";
import type { Scene } from "@babylonjs/core";
import type { MaterialRecipe } from "./representation-materials";

interface Entry { readonly material: StandardMaterial; users: number; }
/** Scene-scoped cache: one GPU material per family/role/quantized palette bucket. */
export class BuildingMaterialLibrary {
  private readonly cache = new Map<string, Entry>();
  private disposed = false;
  constructor(private readonly scene: Scene) {}
  get materialCount(): number { return this.cache.size; }
  get activeLeases(): number {
    let total = 0;
    for (const entry of this.cache.values()) total += entry.users;
    return total;
  }
  acquire(recipe: MaterialRecipe): StandardMaterial {
    if (this.disposed) throw new Error("Cannot acquire from disposed material library");
    let entry = this.cache.get(recipe.key);
    if (!entry) {
      const material = new StandardMaterial("meridian-material:" + recipe.key, this.scene);
      material.diffuseColor = Color3.FromHexString(recipe.color);
      material.specularColor = new Color3(
        0.04 + recipe.metalness * 0.14, 0.04 + recipe.metalness * 0.14, 0.04 + recipe.metalness * 0.14,
      );
      material.specularPower = Math.max(8, Math.round(72 * (1 - recipe.roughness)));
      material.alpha = recipe.alpha;
      entry = { material, users: 0 };
      this.cache.set(recipe.key, entry);
    }
    entry.users += 1;
    return entry.material;
  }
  /** Materials remain cached at zero leases for subsequent buildings. */
  release(key: string): void {
    const entry = this.cache.get(key);
    if (!entry || this.disposed) return;
    if (entry.users <= 0) throw new Error("Unbalanced material release: " + key);
    entry.users -= 1;
  }
  /** Scene owner disposes the library after all generated buildings are removed. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    for (const entry of this.cache.values()) entry.material.dispose();
    this.cache.clear();
  }
}
