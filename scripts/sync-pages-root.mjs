import { cpSync, existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(root, '..')
const distDir = path.join(repoRoot, 'dist')

const indexHtml = readFileSync(path.join(distDir, 'index.html'), 'utf8')
writeFileSync(path.join(repoRoot, 'index.html'), indexHtml)
writeFileSync(path.join(repoRoot, '404.html'), indexHtml)

const assetsDir = path.join(repoRoot, 'assets')
rmSync(assetsDir, { recursive: true, force: true })
cpSync(path.join(distDir, 'assets'), assetsDir, { recursive: true })

const nojekyll = path.join(distDir, '.nojekyll')
if (existsSync(nojekyll)) {
  writeFileSync(path.join(repoRoot, '.nojekyll'), readFileSync(nojekyll))
}

mkdirSync(path.join(repoRoot, 'docs'), { recursive: true })
cpSync(distDir, path.join(repoRoot, 'docs'), { recursive: true })

console.log('Synced dist/ to repo root (index.html, assets/, 404.html) and docs/')
