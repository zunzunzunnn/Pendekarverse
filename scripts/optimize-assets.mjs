import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTTextureWebP } from "@gltf-transform/extensions";
import { dedup, prune } from "@gltf-transform/functions";
import sharp from "sharp";
import fs from "node:fs";
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read("Characters/char test.glb");
doc.createExtension(EXTTextureWebP).setRequired(true);
// Preserve the supplied source. Resize runtime textures only, preserving alpha.
for (const texture of doc.getRoot().listTextures()) {
  const bytes = await sharp(texture.getImage())
    .resize({
      width: 1024,
      height: 1024,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88, alphaQuality: 95 })
    .toBuffer();
  texture.setImage(bytes).setMimeType("image/webp");
}
await doc.transform(dedup(), prune());
await io.write("public/models/pendekar.glb", doc);
console.log(
  "Runtime model bytes:",
  fs.statSync("public/models/pendekar.glb").size,
);
