import generatePackageJson from 'rollup-plugin-generate-package-json'
import { getBaseRollupPlugins, getPackageJSON, resolvePkgPath } from './utils'

const { name, module } = getPackageJSON('react')
const folderName = name.slice(name.indexOf('/') + 1)
const pkgPath = resolvePkgPath(folderName)
const pkgDistPath = resolvePkgPath(folderName, true)

export default [
  // react
  {
    input: `${pkgPath}/src/${module || 'index.ts'}`,
    output: {
      file: `${pkgDistPath}/index.js`,
      name: 'mini-react',
      format: 'umd',
    },
    plugins: [
      ...getBaseRollupPlugins(),
      generatePackageJson({
        inputFolder: pkgPath,
        outputFolder: pkgDistPath,
        baseContents: ({ name, description, version }) => ({
          name,
          description,
          version,
          main: 'index.js',
        }),
      }),
    ],
  },
  // jsx-runtime
  {
    input: `${pkgPath}/src/jsx.ts`,
    output: [
      // jsx-runtime
      {
        file: `${pkgDistPath}/jsx-runtime.js`,
        format: 'cjs',
      },
      // jsx-dev-runtime
      {
        file: `${pkgDistPath}/jsx-dev-runtime.js`,
        format: 'cjs',
      },
    ],
    plugins: getBaseRollupPlugins(),
  },
]
