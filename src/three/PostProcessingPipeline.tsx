import { useEffect, useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/**
 * Selective Post-Processing Bloom Pipeline.
 *
 * Scoped selectively to emissive/highlight components:
 * - High threshold (0.85) ensures only emissive highlights / glow elements bloom
 * - Low strength (0.65) and tight radius (0.35) prevents blurry global wash
 * - Preserves canvas transparent alpha channel for background grid visibility
 */
export function PostProcessingPipeline() {
  const { gl, scene, camera, size } = useThree()
  const composerRef = useRef<EffectComposer | null>(null)

  useEffect(() => {
    // Create half-float RGBA render target for HDR bloom while preserving transparent background.
    // samples: 0 avoids expensive multisampling passes on full canvas resolution.
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      samples: 0,
    })

    const composer = new EffectComposer(gl, renderTarget)

    // Render pass with transparent clearAlpha
    const renderPass = new RenderPass(scene, camera)
    renderPass.clearAlpha = 0
    composer.addPass(renderPass)

    // Selective UnrealBloomPass:
    // Resolution is downsampled to half-size (w/2, h/2) for smooth blur kernels and minimal GPU fill cost.
    // Only pixels with luminance exceeding 0.85 (emissive screens, BLE pulses, focused rim highlights)
    // receive the subtle glow halo. Standard shaded body surfaces remain crisp.
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(Math.max(1, Math.floor(size.width / 2)), Math.max(1, Math.floor(size.height / 2))),
      0.65, // strength
      0.35, // radius
      0.85  // threshold
    )
    composer.addPass(bloomPass)

    // OutputPass handles sRGB color space conversion
    const outputPass = new OutputPass()
    composer.addPass(outputPass)

    composerRef.current = composer

    return () => {
      composer.dispose()
      renderTarget.dispose()
      composerRef.current = null
    }
  }, [gl, scene, camera, size.width, size.height])

  // Priority 1 ensures composer renders after all scene matrix updates and frame lerps
  useFrame((_, delta) => {
    if (composerRef.current) {
      composerRef.current.render(delta)
    }
  }, 1)

  return null
}
