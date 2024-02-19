import generatePackageJson from 'rollup-plugin-generate-package-json'
import { getBaseRollupPlugins, getPackageJSON, resolvePkgPath } from './utils'
import alias from '@rollup/plugin-alias'

const { name, module, peerDependencies } = getPackageJSON('react-dom')
const folderName = name.slice(name.indexOf('/') + 1)
const pkgPath = resolvePkgPath(folderName)
const pkgDistPath = resolvePkgPath(folderName, true)

export default [
  // react-dom
  {
    input: `${pkgPath}/${module || 'index.ts'}`,
    output: [
      {
        file: `${pkgDistPath}/index.js`,
        name: '@xuans-mini-react/react-dom',
        format: 'umd',
      },
      {
        file: `${pkgDistPath}/client.js`,
        name: '@xuans-mini-react/react-dom',
        format: 'umd',
      },
    ],
    external: [...Object.keys(peerDependencies || {})],
    plugins: [
      ...getBaseRollupPlugins(),
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
  // test-utils
  {
    input: `${pkgPath}/src/test-utils.ts`,
    output: [
      {
        file: `${pkgDistPath}/test-utils.js`,
        name: '@xuans-mini-react/test-utils',
        format: 'umd',
      },
    ],
    external: ['@xuans-mini-react/react-dom', '@xuans-mini-react/react'],
    plugins: [...getBaseRollupPlugins()],
  },
]
