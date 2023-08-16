#version 300 es
precision mediump float;

#define m4v3Vec(m4, v3) normalize((m4 * vec4(v3, 0.0)).xyz)
#define m4v3Coord(m4, v3) (m4 * vec4(v3, 1.0)).xyz
#define PI 3.141592653589793

uniform float uTime;
uniform sampler2D uMatcap;
uniform samplerCube uEnvMap;
uniform vec3 cameraPosition;
uniform mat4 projectionMatrixInverse;
uniform mat4 viewMatrixInverse;
uniform mat4 normalMatrix;

in vec2 vUv;
out vec4 fragColor;

const vec3 Light = normalize(vec3(1.0, 1.0, 0.5));

#include '../glsl/math.glsl'
#include '../glsl/matcap.glsl'
#include '../glsl/color.glsl'
#include '../raymarching/primitives.glsl'
#include '../raymarching/combinations.glsl'

float sdf(vec3 p) {
  mat4 rotMatY = rotation3d(vec3(0.0, 1.0, 0.0), -uTime * 0.1);
  mat4 rotMatZ = rotation3d(vec3(0.0, 0.0, 1.0), PI * 0.20);
  mat4 rotMatX = rotation3d(vec3(1.0, 0.0, 0.0), PI * 0.25);
  vec3 rp = m4v3Coord(rotMatX * rotMatZ * rotMatY, p);

  mat4 rotMatY2 = rotation3d(vec3(0.0, 1.0, 0.0), uTime * 0.1);
  vec3 rp2 = m4v3Coord(rotMatY2, p);

  float box1 = sdBox(rp, vec3(0.4)) - 0.05;
  float box2 = sdBox(rp2, vec3(0.4)) - 0.05;
  float sph = sdSphere(p, 0.55 + sin(uTime * 0.0) * 0.15);
  float final = opSmoothUnion(box1, box2, 0.05);
  final = opSmoothSubtraction(sph, final, 0.05);

  return final;
}

#include '../raymarching/normal.glsl'

void main() {
  vec2 p = vUv * 2.0 - 1.0;

  vec4 ndcRay = vec4(p, 1.0, 1.0);
  vec3 ray = (viewMatrixInverse * projectionMatrixInverse * ndcRay).xyz;
  ray = normalize(ray);

  vec3 rayPos = cameraPosition;
  float totalDist = 0.0;
  float totalMax = length(cameraPosition) * 2.0;

  for (int i = 0; i < 128; i++) {
    float dist = sdf(rayPos);
    if (abs(dist) < 0.001 || totalMax < totalDist) break;
    totalDist += dist;
    rayPos = cameraPosition + totalDist * ray;
  }

  vec3 color = vec3(0.05);
  vec4 env = texture(uEnvMap, ray);
  color = env.rgb;

  if (totalDist < totalMax) {
    vec3 normal = calcNormal(rayPos);
    vec3 recalcNormal = m4v3Vec(normalMatrix, normal);
    vec3 recalcRay = m4v3Vec(normalMatrix, ray);
  
    vec2 mUv = matcap(recalcRay, recalcNormal);
    mUv.y = 1.0 - mUv.y;
    vec4 mTex = texture(uMatcap, mUv);

    vec3 mHsv = rgb2hsv(mTex.rgb);
    mHsv.g = 0.0;
    vec3 mRgb = hsv2rgb(mHsv);

    vec3 reflection = reflect(ray, normal);
    vec4 env = texture(uEnvMap, reflection);

    float speculer = dot(normalize(reflect(recalcRay, recalcNormal)), Light);
    speculer = clamp(speculer, 0.0, 1.0);
    speculer = pow(speculer, 50.0);

    color = mix(vec3(0), env.rgb, mRgb.r + 0.3);
    color += speculer;

    // color = recalcNormal;
    // color = env.rgb;
    // color = mTex.rgb;
    // color = vec3(speculer);
  }

  fragColor = vec4(color, 1.0);
}