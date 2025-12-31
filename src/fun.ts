import * as d from 'typegpu/data';
import * as std from 'typegpu/std';
import * as sdf from '@typegpu/sdf';

export const sphere = (p: d.v3f) => {
	'use gpu';
	return sdf.sdSphere(std.add(p, d.vec3f(-3, -5, -5)), 3);
};

export const getNormals = (p: d.v3f) => {
	'use gpu';
	const e = 0.001;
	return std.normalize(
		d.vec3f(
			std.sub(
				sphere(std.add(p, d.vec3f(e, 0.0, 0.0))),
				sphere(std.sub(p, d.vec3f(e, 0.0, 0.0))),
			),
			std.sub(
				sphere(std.add(p, d.vec3f(0.0, e, 0.0))),
				sphere(std.sub(p, d.vec3f(0.0, e, 0.0))),
			),
			std.sub(
				sphere(std.add(p, d.vec3f(0.0, 0.0, e))),
				sphere(std.sub(p, d.vec3f(0.0, 0.0, e))),
			),
		),
	);
};

export const rayDirection = (fov: number, fragCoord: d.v2f) => {
	'use gpu';
	const z = std.tan(std.radians(d.f32(fov)) * 0.5);
	return std.normalize(d.vec3f(fragCoord, -z));
};
