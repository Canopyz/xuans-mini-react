import generatePackageJson from 'rollup-plugin-generate-package-json'
import { getBaseRollupPlugins, getPackageJSON, resolvePkgPath } from './utils'
import alias from '@rollup/plugin-alias'

const { name, module } = getPackageJSON('react-dom')
const folderName = name.slice(name.indexOf('/') + 1)
const pkgPath = resolvePkgPath(folderName)
const pkgDistPath = resolvePkgPath(folderName, true)

export default [
  // react-dom
  {
    input: `${pkgPath}/src/${module || 'index.ts'}`,
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
            'xuans-mini-react': version,
          },
          main: 'index.js',
        }),
      }),
    ],
  },
]
