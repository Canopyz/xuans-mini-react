import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import replace from '@rollup/plugin-replace'
import { resolvePkgPath } from '../scripts/rollup/utils'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    replace({
      __DEV__: true,
      preventAssignment: true,
    }),
    {
      name: 'replace-jsx-dev-runtime',
      resolveId(id) {
        if (id.includes('react/jsx-dev-runtime')) {
          return resolvePkgPath('react/src/jsx.ts')
        }
      }
    }
  ],
  resolve: {
    alias: [
      {
        find: 'react',
        replacement: resolvePkgPath('react'),
      },
      {
        find: 'react-dom/client',
        replacement: resolvePkgPath('react-dom'),
      },
      {
        find: 'hostConfig',
        replacement: path.resolve(
          resolvePkgPath('react-dom'),
          './src/hostConfig.ts',
        ),
      },
    ],
  },
})
