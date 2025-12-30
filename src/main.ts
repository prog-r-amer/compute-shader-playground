import tgpu from "typegpu";
import * as d from "typegpu/data";
import { textureStore } from "typegpu/std";

const canvas = document.getElementById("canvas")! as HTMLCanvasElement;
const ctx = canvas.getContext("webgpu")!;
const root = await tgpu.init({
  unstable_logOptions: { logCountLimit: 10000 },
});

ctx.configure({
  device: root.device,
  format: "rgba8unorm",
  alphaMode: "premultiplied",
  usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
});

// Create texture
const size = 512;
canvas.width = size;
canvas.height = size;

const bindGroupLayout = tgpu.bindGroupLayout({
  writeTexture: {
    storageTexture: d.textureStorage2d("rgba8unorm"),
  },
});

const myFn = tgpu["~unstable"].computeFn({
  in: {
    num: d.builtin.numWorkgroups,
    id: d.builtin.globalInvocationId,
  },

  workgroupSize: [8, 8],
})(({ id }) => {
  "use gpu";
  const x = id[0];
  const y = id[1];

  // Prevent out-of-bounds writes
  if (x >= size || y >= size) {
    return;
  }

  if (x > 256) {
    textureStore(
      bindGroupLayout.$.writeTexture,
      d.vec2u(x, y),
      d.vec4f(0.0, 0.0, 0.0, 1.0),
    );
  }
});

const step = () => {
  const canvasTexture = ctx.getCurrentTexture();
  // Bind group
  const bindGroup = root.createBindGroup(bindGroupLayout, {
    writeTexture: canvasTexture,
  });

  const computePipeline = root["~unstable"].withCompute(myFn).createPipeline();
  computePipeline.with(bindGroup).dispatchWorkgroups(64, 64);
  requestAnimationFrame(step);
};

requestAnimationFrame(step);
