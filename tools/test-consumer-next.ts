/**
 * Consumer smoke test with a real Next 16 app (tests/consumer-next).
 * Packs @evicons/react as a tarball (no `file:` link to the workspace, so the app
 * gets its own single React and the real package contents), builds the app and
 * checks the prerendered Server Component HTML. Run `npm run build` first.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, renameSync, rmSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const app = join(root, 'tests/consumer-next')
// A user-level `allow-scripts` npm setting makes npm 11 refuse installs in a project without
// an `allowScripts` field; this app needs no install scripts, so clear it for the child processes.
const env = { ...process.env, npm_config_allow_scripts: '' }
const run = (cmd: string, args: string[], cwd: string) => execFileSync(cmd, args, { cwd, env, stdio: 'inherit' })

if (!existsSync(join(root, 'packages/react/dist/index.js'))) {
  throw new Error('packages/react/dist is missing – run `npm run build` first')
}

const packed = JSON.parse(
  execFileSync('npm', ['pack', '-w', '@evicons/react', '--pack-destination', app, '--json'], {
    cwd: root,
    encoding: 'utf8',
  }),
) as Array<{ filename: string }>
renameSync(join(app, packed[0]!.filename), join(app, 'evicons-react.tgz'))

// Force a fresh copy of the tarball, then install and build.
rmSync(join(app, 'node_modules/@evicons'), { recursive: true, force: true })
rmSync(join(app, '.next'), { recursive: true, force: true })
run('npm', ['install', '--no-audit', '--no-fund', '--no-package-lock'], app)
run('npx', ['next', 'build'], app)

const html = readFileSync(join(app, '.next/server/app/index.html'), 'utf8')
const missing = ['role="img"', 'evicon-plug-type-2', 'vector-effect="non-scaling-stroke"'].filter((s) => !html.includes(s))
if (missing.length > 0) {
  console.error(`consumer-next: prerendered HTML lacks ${missing.join(', ')}`)
  process.exitCode = 1
} else {
  console.log('consumer-next: OK (role="img", evicon-plug-type-2, vector-effect="non-scaling-stroke")')
}
