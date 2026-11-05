import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')
const openapiPath = resolve(rootDir, 'openapi', 'blog-api.yaml')
const outputPath = resolve(rootDir, 'generated', 'web-client.ts')

const openapiSource = readFileSync(openapiPath, 'utf8')
const hasHealthEndpoint = openapiSource.includes('/api/health')

if (!hasHealthEndpoint) {
  throw new Error('OpenAPI 文件缺少 /api/health 定义')
}

const generated = `export interface paths {
  "/api/health": {
    get: {
      responses: {
        200: {
          content: {
            "application/json": {
              status: string
              timestamp: string
            }
          }
        }
      }
    }
  }
}
`

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, generated, 'utf8')
