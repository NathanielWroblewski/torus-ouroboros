import Vector from '../models/vector.js'
import { SPHERE_RADIUS, HALF_WIDTH, HALF_HEIGHT } from '../constants/dimensions.js'

// Copyright (c) 2020 Nathaniel Wroblewski
// I am making my contributions/submissions to this project solely in my personal
// capacity and am not conveying any rights to any intellectual property of any
// third parties.

const coordinates = {
  toCartesian ([r, θ, φ]) {
    const sinθ = Math.sin(θ)
    const rsinθ = SPHERE_RADIUS * sinθ

    return Vector.from([
      HALF_WIDTH + Math.cos(φ) * rsinθ,
      HALF_HEIGHT + Math.sin(φ) * rsinθ,
      SPHERE_RADIUS * Math.cos(θ),
    ])
  },

  // cheats a bit: static r, otherwise r = Math.sqrt(cartesian.magnitude)
  toSpherical ([x, y, z]) {
    return Vector.from([
      SPHERE_RADIUS,
      Math.acos(z / SPHERE_RADIUS),
      Math.atan((y - HALF_HEIGHT) / z)
    ])
  }
}

export default coordinates
