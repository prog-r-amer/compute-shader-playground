import tgpu from 'typegpu';
import * as std from 'typegpu/std';
import * as d from 'typegpu/data';
import { getNormals, sphere } from './fun';
import { textureStore } from 'typegpu/std';
import { rayDirection } from './fun';

const canvas = document.getElementById('canvas')! as HTMLCanvasElement;
const ctx = canvas.getContext('webgpu')!;
const root = await tgpu.init();

let width = globalThis.innerWidth;
let height = globalThis.innerHeight;

ctx.configure({
	device: root.device,
	format: 'rgba8unorm',
	alphaMode: 'premultiplied',
	usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.STORAGE_BINDING,
});

canvas.width = width;
canvas.height = height;

const bindGroupLayout = tgpu.bindGroupLayout({
	writeTexture: {
		storageTexture: d.textureStorage2d('rgba8unorm'),
	},
});

const myFn = tgpu['~unstable'].computeFn({
	in: {
		num: d.builtin.numWorkgroups,
		id: d.builtin.globalInvocationId,
	},

	workgroupSize: [8, 8],
})(({ id }) => {
	'use gpu';

	const px = id.x;
	const py = id.y;

	if (px >= width || py >= height) {
		return;
	}

	const fragCoord = d.vec2f(px / width, py / height);
	const ro = d.vec3f(0, 0, 5);
	const rd = rayDirection(45, fragCoord);

	let t = d.f32(0);
	let hit = false;
	let p = d.vec3f(0, 0, 0);

	for (let i = 0; i < 100; i++) {
		p = std.add(ro, std.mul(rd, t));
		let dist = sphere(p);
		if (dist < 0.001) {
			hit = true;
			break;
		}
		t = std.add(dist, t);
		if (t > 100.0) break;
	}

	if (hit) {
		const normals = getNormals(p);
		const lightDirection = std.normalize(d.vec3f(1, 1, 1));
		const diff = std.max(std.dot(normals, lightDirection), 0);
		const baseColor = d.vec3f(1, 1, 1);
		const shaded = std.mul(baseColor, diff);
		textureStore(
			bindGroupLayout.$.writeTexture,
			d.vec2u(px, py),
			d.vec4f(shaded, 1.0),
		);
	}
});

const step = () => {
	const canvasTexture = ctx.getCurrentTexture();
	// Bind group
	const bindGroup = root.createBindGroup(bindGroupLayout, {
		writeTexture: canvasTexture,
	});

	const computePipeline = root['~unstable'].withCompute(myFn).createPipeline();
	computePipeline
		.with(bindGroup)
		.dispatchWorkgroups(Math.ceil(width / 8), Math.ceil(height / 8));
	requestAnimationFrame(step);
};

requestAnimationFrame(step);
