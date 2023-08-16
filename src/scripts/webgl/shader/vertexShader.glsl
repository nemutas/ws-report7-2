#version 300 es

layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec2 vUv;

void main() {
  vUv = uv;
  // gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4( position, 1.0 );
  gl_Position = vec4( position, 1.0 );
}