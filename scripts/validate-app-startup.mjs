import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const mountExpression = "ReactDOM.createRoot(document.getElementById('app')).render(<AppErrorBoundary><App /></AppErrorBoundary>)"
const server = await createServer({
  appType: 'custom',
  server: { middlewareMode: true },
  plugins: [{
    name: 'validate-app-startup',
    enforce: 'pre',
    transform(code, id) {
      if (!id.endsWith('/src/main.jsx')) return
      if (!code.includes(mountExpression)) throw new Error('Expected the app mount expression to remain available for startup validation.')
      return code.replace(mountExpression, 'export { App }')
    }
  }]
})

try {
  const { App } = await server.ssrLoadModule('/src/main.jsx')
  const html = renderToString(React.createElement(App))
  if (!html.includes('Choisis un niveau')) throw new Error('Expected the default French level selection screen to render.')
  console.log('Validated app startup render.')
} finally {
  await server.close()
}
