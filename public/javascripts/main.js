import Vector from './models/vector.js'
import FourByFour from './models/four_by_four.js'
import Camera from './models/orthographic.js'
import angles from './isomorphisms/angles.js'
import renderPolygon from './views/polygon.js'
import { remap, grid } from './utilities/index.js'
import { FACE_COLOR, EDGE_COLOR } from './constants/colors.js'
import {
  R, r, Δr, Δθdeg, Δφdeg, halfΔθdeg, halfΔφdeg, MIN_DISTANCE, MAX_DISTANCE,
  EXPANSION_MIN_φ, EXPANSION_MAX_φ, CONTRACTION_φ, EXPANSION_CHANCE,
  CONTRACTION_CHANCE, MAX_CULLING_φ, MIN_CULLING_φ, MIN_CULLING_θ, ZOOM, FPS
} from './constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const canvas = document.querySelector('.canvas')
const context = canvas.getContext('2d')
const { sin, cos } = Math

const perspective = FourByFour
  .identity()
  .rotX(angles.toRadians(60))
  .rotY(angles.toRadians(0))

const camera = new Camera({
  position: Vector.zeroes(),
  direction: Vector.zeroes(),
  up: Vector.from([0, 1, 0]),
  width: canvas.width,
  height: canvas.height,
  zoom: ZOOM
})

const lines = []
const faces = []
const points = []

let time = 0

const toPoint = (R, r, θdeg, φdeg) => {
  const θ = angles.toRadians(θdeg)
  const φ = angles.toRadians(φdeg)
  const Rrcosθ = R + r * cos(θ)

  return Vector.from([
    Rrcosθ * cos(φ),
    Rrcosθ * sin(φ),
    r * sin(θ)
  ])
}

const from = Vector.from([0, 0])
const to = Vector.from([360, 360])
const by = Vector.from([Δθdeg, Δφdeg])

grid({ from, to, by }, ([θdeg, φdeg]) => {
  const index = points.length
  const vertices = [
    Vector.from([r, θdeg, φdeg - halfΔφdeg]),
    Vector.from([r, θdeg + Δθdeg, φdeg - halfΔφdeg]),
    Vector.from([r, θdeg + Δθdeg, φdeg + halfΔφdeg]),
    Vector.from([r, θdeg, φdeg + halfΔφdeg]),
  ]

  vertices.map(vertex => points.push(vertex))
  faces.push([index, index + 1, index + 2, index + 3])
})

// Render loop
const render = () => {
  context.clearRect(0, 0, 600, 600)

  faces.forEach((face, index) => {
    const vertex = points[face[0]]

    // begin expansion
    if (vertex.φ > EXPANSION_MIN_φ && (
      (vertex.r === MIN_DISTANCE && Math.random() < EXPANSION_CHANCE) || vertex.r !== MIN_DISTANCE)
    ) {
      vertex[0] = Math.min(vertex.r + Δr, MAX_DISTANCE)
    }

    // finish expansion
    if (time > 2 && vertex.φ > EXPANSION_MAX_φ && vertex.r === MIN_DISTANCE) {
      vertex[0] = Math.min(vertex.r + Δr, MAX_DISTANCE)
    }

    // begin contraction
    if (vertex.φ < CONTRACTION_φ && (vertex.r !== MAX_DISTANCE || Math.random() < CONTRACTION_CHANCE)) {
      vertex[0] = Math.max(vertex.r - Δr, MIN_DISTANCE)
    }

    // hacky back-face culling
    if (
      vertex.r === MIN_DISTANCE && vertex.φ < MAX_CULLING_φ &&
        vertex.φ > MIN_CULLING_φ && vertex.θ > MIN_CULLING_θ
    ) return null

    context.globalAlpha = 1 - remap(vertex[0], [MIN_DISTANCE, MAX_DISTANCE], [0, 1])

    const vertices = face.map(index => {
      const [r, θ, φ] = points[index]
      const cartesian = toPoint(R, vertex.r, θ, φ)

      return camera.project(cartesian.transform(perspective))
    })

    renderPolygon(context, vertices, EDGE_COLOR, FACE_COLOR)

    context.globalAlpha = 1
  })

  points.forEach(point => point[2] = (point[2] + 0.5) % 360) // spin
  time += 0.01
}

let prevTick = 0

const step = () => {
  window.requestAnimationFrame(step)

  const now = Math.round(FPS * Date.now() / 1000)
  if (now === prevTick) return
  prevTick = now

  render()
}

step()
