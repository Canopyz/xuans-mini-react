import path from 'path'
import fs from 'fs'
import cjs from '@rollup/plugin-commonjs'
import ts from 'rollup-plugin-typescript2'

const pkgPath = path.resolve(__dirname, '../../packages')
const distPath = path.resolve(__dirname, '../../dist/node_modules')

export function resolvePkgPath(pkgName, isDist = false) {
  if (isDist) {
    return `${distPath}/${pkgName}`
  }
  return `${pkgPath}/${pkgName}`
}

export function getPackageJSON(pkgName) {
  const path = `${resolvePkgPath(pkgName)}/package.json`
  const str = fs.readFileSync(path, 'utf-8')

  return JSON.parse(str)
}

export function getBaseRollupPlugins({ typescrit = {} } = {}) {
  return [cjs(), ts(typescrit)]
}