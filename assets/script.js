const canvas = document.getElementById("clock")
const ctx = canvas.getContext("2d")

const SIZE = Math.min(window.innerWidth, window.innerHeight) * 0.92
canvas.width = SIZE
canvas.height = SIZE

const cx = SIZE / 2
const cy = SIZE / 2

const potRim  = SIZE * 0.48
const soilR   = SIZE * 0.40
const vineR   = SIZE * 0.455

const LEAF_COLORS   = ["#a8d87a","#6db33f","#3d8c2f","#1f5e1a","#0f3d0a"]
const FLOWER_COLORS = ["#f76ca8","#b06fe8","#ff7043"]
const VINE_COLORS   = ["#7ec850","#4aaa30","#2a6b18"]

const ROTATION_STEP = Math.PI * (3 - Math.sqrt(5))
const FADE_HOURS    = 9

function soilPosition(index, rotationOffset) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5))
  const r = soilR * 0.88 * Math.sqrt((index + 0.5) / 60)
  const a = index * goldenAngle + rotationOffset
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

const drawLog = []

let lastSecond        = -1
let lastMinute        = -1
let lastHour          = -1
let leafMinuteCount   = 0
let totalMinutesLogged = 0

function vineAngle(m) {
  return -Math.PI / 2 + (m / 60) * Math.PI * 2
}

// ---- Draw primitives ----

function drawPotRim() {
  const shadow = ctx.createRadialGradient(cx, cy, soilR * 0.95, cx, cy, potRim)
  shadow.addColorStop(0, "#7a3a10")
  shadow.addColorStop(0.4, "#a04d18")
  shadow.addColorStop(1, "#5c2a08")
  ctx.beginPath()
  ctx.arc(cx, cy, potRim, 0, Math.PI * 2)
  ctx.fillStyle = shadow
  ctx.fill()

  ctx.beginPath()
  ctx.arc(cx, cy, potRim - SIZE * 0.005, 0, Math.PI * 2)
  ctx.strokeStyle = "rgba(255,180,100,0.25)"
  ctx.lineWidth = SIZE * 0.006
  ctx.stroke()
}

function drawSoil() {
  const g = ctx.createRadialGradient(cx - soilR * 0.2, cy - soilR * 0.2, soilR * 0.05, cx, cy, soilR)
  g.addColorStop(0, "#4a2808")
  g.addColorStop(0.6, "#3a1e06")
  g.addColorStop(1, "#2a1404")
  ctx.beginPath()
  ctx.arc(cx, cy, soilR, 0, Math.PI * 2)
  ctx.fillStyle = g
  ctx.fill()
}

function drawLeaf(pos, index, color, alpha) {
  const angle = index * 137.508 * Math.PI / 180
  const size  = SIZE * 0.058
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(pos.x, pos.y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(-size*0.35, -size*0.3, -size*0.3, -size*0.85, 0, -size)
  ctx.bezierCurveTo( size*0.3,  -size*0.85,  size*0.35, -size*0.3, 0, 0)
  ctx.fillStyle = color
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -size)
  ctx.strokeStyle = "rgba(0,60,0,0.45)"
  ctx.lineWidth = SIZE * 0.003
  ctx.stroke()
  ctx.restore()
}

function drawFlower(pos, index, color, alpha) {
  const size = SIZE * 0.046
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.translate(pos.x, pos.y)
  for (let p = 0; p < 5; p++) {
    const pa = (p / 5) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(
      Math.cos(pa) * size * 0.52,
      Math.sin(pa) * size * 0.52,
      size * 0.38, size * 0.24, pa, 0, Math.PI * 2
    )
    ctx.fillStyle = color
    ctx.fill()
  }
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.26, 0, Math.PI * 2)
  ctx.fillStyle = "#f9e05a"
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.14, 0, Math.PI * 2)
  ctx.fillStyle = "#e8a820"
  ctx.fill()
  ctx.restore()
}

function drawVineArc(fromMin, toMin, color) {
  const steps = Math.max(20, Math.round((toMin - fromMin) * 4))
  const span  = (toMin - fromMin) / 60 * Math.PI * 2

  ctx.beginPath()
  for (let i = 0; i <= steps; i++) {
    const t  = i / steps
    const a  = vineAngle(fromMin) + span * t
    const w  = Math.sin(t * Math.PI * 7) * SIZE * 0.016
    const px = cx + Math.cos(a) * (vineR + w)
    const py = cy + Math.sin(a) * (vineR + w)
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.strokeStyle  = color
  ctx.lineWidth    = SIZE * 0.009
  ctx.lineCap      = "round"
  ctx.lineJoin     = "round"
  ctx.stroke()

  const lc = Math.max(1, Math.round((toMin - fromMin) / 5))
  for (let i = 1; i <= lc; i++) {
    const t    = i / (lc + 1)
    const a    = vineAngle(fromMin) + span * t
    const w    = Math.sin(t * Math.PI * 7) * SIZE * 0.016
    const px   = cx + Math.cos(a) * (vineR + w)
    const py   = cy + Math.sin(a) * (vineR + w)
    const side = i % 2 === 0 ? 1 : -1
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(a + side * Math.PI / 2.5)
    const ls = SIZE * 0.022
    ctx.beginPath()
    ctx.ellipse(0, -ls * 0.6, ls * 0.22, ls * 0.55, 0, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()
  }
}

function drawVines(minutes) {
  if (minutes === 0) return
  const ten     = Math.floor(minutes / 10)
  const partial = minutes % 10
  for (let v = 0; v < ten; v++) {
    drawVineArc(v * 10, (v + 1) * 10, VINE_COLORS[v % 3])
  }
  if (partial > 0) {
    drawVineArc(ten * 10, ten * 10 + partial, VINE_COLORS[ten % 3])
  }
}

function drawTimeLabel(h, m, s) {
  ctx.font         = `${SIZE * 0.026}px ui-monospace, monospace`
  ctx.fillStyle    = "rgba(255,255,255,0.18)"
  ctx.textAlign    = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(
    String(h).padStart(2,"0") + ":" + String(m).padStart(2,"0") + ":" + String(s).padStart(2,"0"),
    cx, cy + soilR + SIZE * 0.065
  )
}

function buildRenderOrder(currentHour, currentSecond, currentMinute) {
  const byHour = {}
  for (const e of drawLog) {
    if (!byHour[e.hour]) byHour[e.hour] = { leaves: [], flowers: [] }
    byHour[e.hour][e.type === "leaf" ? "leaves" : "flowers"].push(e)
  }

  const fadingHour = currentHour - FADE_HOURS
  const render     = []

  for (let h = 0; h <= currentHour; h++) {
    const group = byHour[h]
    if (!group) continue

    let leafAlpha   = 1
    let flowerAlpha = 1

    if (h === fadingHour) {
      leafAlpha   = Math.max(0, 60 - currentSecond) / 60
      flowerAlpha = Math.max(0, 60 - currentMinute) / 60
    } else if (h < fadingHour) {
      leafAlpha   = 0
      flowerAlpha = 0
    }

    // 3rd-hour: leaves of this hour surface above all previous flowers
    for (const e of group.leaves)   render.push({ ...e, alpha: leafAlpha })
    for (const e of group.flowers)  render.push({ ...e, alpha: flowerAlpha })
  }

  return render
}

function draw() {
  const now     = new Date()
  const hours   = now.getHours()
  const minutes = now.getMinutes()
  const seconds = now.getSeconds()

  if (minutes !== lastMinute) {
    if (lastMinute !== -1) leafMinuteCount++
    lastMinute = minutes
  }

  if (hours !== lastHour) lastHour = hours

  if (seconds !== lastSecond) {
    lastSecond = seconds
    drawLog.push({
      type:         "leaf",
      hour:         hours,
      indexInBatch: seconds,
      rotOffset:    leafMinuteCount * ROTATION_STEP,
      color:        LEAF_COLORS[hours % LEAF_COLORS.length]
    })
  }

  const totalMinutesElapsed = hours * 60 + minutes
  while (totalMinutesLogged < totalMinutesElapsed) {
    const flowerHour   = Math.floor(totalMinutesLogged / 60)
    const indexInBatch = totalMinutesLogged % 60
    drawLog.push({
      type:         "flower",
      hour:         flowerHour,
      indexInBatch,
      rotOffset:    flowerHour * ROTATION_STEP,
      color:        FLOWER_COLORS[flowerHour % FLOWER_COLORS.length]
    })
    totalMinutesLogged++
  }

  const renderOrder = buildRenderOrder(hours, seconds, minutes)

  ctx.clearRect(0, 0, SIZE, SIZE)
  ctx.fillStyle = "#0d0d0d"
  ctx.fillRect(0, 0, SIZE, SIZE)

  drawPotRim()
  drawSoil()

  for (const entry of renderOrder) {
    if (entry.alpha <= 0) continue
    const pos = soilPosition(entry.indexInBatch, entry.rotOffset)
    if (entry.type === "leaf") {
      drawLeaf(pos, entry.indexInBatch, entry.color, entry.alpha)
    } else {
      drawFlower(pos, entry.indexInBatch, entry.color, entry.alpha)
    }
  }

  drawVines(minutes)
  drawTimeLabel(hours, minutes, seconds)
}

draw()
setInterval(draw, 1000)