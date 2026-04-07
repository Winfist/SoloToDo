/**
 * Volumetric Fog Shader (backup)
 *
 * Primary fog in DungeonCorridor.jsx uses Three.js built-in:
 *   <fogExp2 attach="fog" color="#060610" density={0.055} />
 *
 * Use this custom shader only if the built-in fog produces insufficient
 * depth feel — e.g., to add a coloured "mist plane" layer at mid-corridor.
 *
 * Usage with shaderMaterial from @react-three/drei:
 *   const FogMaterial = shaderMaterial({ fogColor, fogNear, fogFar }, fogVert, fogFrag);
 *   extend({ FogMaterial });
 *   // Render a large plane at mid-corridor:
 *   <mesh position={[0, 0, -15]} rotation={[-Math.PI/2, 0, 0]}>
 *     <planeGeometry args={[20, 50]} />
 *     <fogMaterial fogColor={new THREE.Color("#0a0a1a")} fogNear={5} fogFar={45}
 *       transparent blending={THREE.AdditiveBlending} depthWrite={false} />
 *   </mesh>
 */

export const fogVert = /* glsl */ `
  varying float vDepth;
  void main() {
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vDepth     = -mvPos.z;
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const fogFrag = /* glsl */ `
  uniform vec3  fogColor;
  uniform float fogNear;
  uniform float fogFar;
  varying float vDepth;

  void main() {
    float factor = smoothstep(fogNear, fogFar, vDepth);
    gl_FragColor = vec4(fogColor, factor * 0.55);
  }
`;
