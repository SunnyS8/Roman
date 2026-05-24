#!/usr/bin/env node
/**
 * Restore the Electron-ABI native binary (after running vitest).
 * Run before `npm start` / `npm run dist`.
 */
const { copyFileSync, existsSync } = require('node:fs')
const { resolve } = require('node:path')
const { execSync } = require('node:child_process')

const here = __dirname
const target = resolve(here, '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
const electronAbiBackup = target + '.electron-abi'

if (existsSync(electronAbiBackup)) {
  copyFileSync(electronAbiBackup, target)
  console.log('restored electron-abi binary')
} else {
  console.log('no electron-abi backup found — running electron-builder install-app-deps')
  execSync('npx electron-builder install-app-deps', { stdio: 'inherit', cwd: resolve(here, '..') })
}
