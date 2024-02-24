import generatePackageJson from 'rollup-plugin-generate-package-json'
import { getBaseRollupPlugins, getPackageJSON, resolvePkgPath } from './utils'
import alias from '@rollup/plugin-alias'

const { name, module, peerDependencies } = getPackageJSON('react-noop-renderer')
const folderName = name.slice(name.indexOf('/') + 1)
const pkgPath = resolvePkgPath(folderName)
const pkgDistPath = resolvePkgPath(folderName, true)

export default [
  {
    input: `${pkgPath}/${module || 'src/index.ts'}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: '@xuans-mini-react/react-noop-renderer',
        format: 'umd',
      },
    ],
    external: [...Object.keys(peerDependencies || {}), 'scheduler'],
    plugins: [
      ...getBaseRollupPlugins(undefined, {
        typescript: {
          tsconfigOverride: {
            exclude: ['./packages/react-dom/**/*'],
            compilerOptions: {
              paths: {
                hostConfig: [
                  './packages/react-noop-renderer/src/hostConfig.ts',
                ],
              },
            },
          },
        },
      }),
      alias({
        entries: {
          hostConfig: `${pkgPath}/src/hostConfig.ts`,
        },
      }),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({ name, description, version }) => ({
          name,
          description,
          version,
          peerDependencies: {
            '@xuans-mini-react/react': version,
          },
          main: 'index.js',
        }),
      }),
    ],
  },
]
