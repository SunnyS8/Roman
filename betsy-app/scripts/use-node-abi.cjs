#!/usr/bin/env node
/**
 * Swap better-sqlite3's native binary to the Node-ABI version (for running vitest).
 * Run before `npm test`. After running the Electron app, run `use-electron-abi` to
 * restore the Electron-ABI build.
 *
 * Dev-only helper for Windows without VS C++ build tools — uses the root project's
 * already-compiled Node-ABI binary as the source.
 */
const { copyFileSync, existsSync, statSync } = require('node:fs')
const { join, resolve } = require('node:path')

const here = __dirname
const target = resolve(here, '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
const nodeAbiBackup = target + '.node-abi'
const electronAbiBackup = target + '.electron-abi'
const rootSrc = resolve(here, '..', '..', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')

if (existsSync(nodeAbiBackup)) {
  copyFileSync(nodeAbiBackup, target)
  console.log('restored cached node-abi binary')
} else if (existsSync(rootSrc)) {
  // back up the current (electron-abi) binary
  if (existsSync(target) && !existsSync(electronAbiBackup)) {
    copyFileSync(target, electronAbiBackup)
    console.log('backed up current binary as .electron-abi')
  }
  copyFileSync(rootSrc, target)
  copyFileSync(target, nodeAbiBackup)
  console.log('copied node-abi binary from root node_modules')
} else {
  console.error('ERROR: no source for node-abi binary. Run npm install in repo root first.')
  process.exit(1)
}
