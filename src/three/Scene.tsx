import { Canvas } from '@react-three/fiber'
import { StageSetup } from './StageSetup'
import { WatchModel } from './WatchModel'
import { CameraRig } from './CameraRig'
import { PostProcessingPipeline } from './PostProcessingPipeline'

interface SceneProps {
  className?: string
}

export function Scene({ className = '' }: SceneProps) {
  return (
    <div className={`w-full h-full relative ${className}`}>
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 38 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'default',
        }}
        dpr={[1, 1.5]}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            console.warn('[Three] WebGL context lost - restoring')
          }, false)
        }}
        className="w-full h-full pointer-events-auto"
      >
        <StageSetup>
          <WatchModel />
          <CameraRig />
          <PostProcessingPipeline />
        </StageSetup>
      </Canvas>
    </div>
  )
}
