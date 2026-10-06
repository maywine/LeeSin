const path = require('node:path')
const { readFile, writeFile } = require('node:fs/promises')
const { Resvg } = require('@resvg/resvg-js')

async function generateIcons() {
  const resources = path.join(__dirname, '../resources')
  const svg = await readFile(path.join(resources, 'icon.svg'))
  const render = size => new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  }).render().asPng()
  await writeFile(path.join(resources, 'icon.png'), render(1024))

  // 用同一份矢量源生成窗口图标和 Windows 所需的多尺寸 ICO。
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const images = sizes.map(render)
  const header = Buffer.alloc(6 + sizes.length * 16)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  images.forEach((image, index) => {
    const entry = 6 + index * 16
    // ICO 用 0 表示 256 像素；每个尺寸独立渲染以保持小图标清晰。
    header[entry] = header[entry + 1] = sizes[index] % 256
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(image.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += image.length
  })
  await writeFile(path.join(resources, 'icon.ico'), Buffer.concat([header, ...images]))
  console.log('Generated resources/icon.png and resources/icon.ico')
}

generateIcons().catch(error => {
  console.error(error)
  process.exitCode = 1
})
