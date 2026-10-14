/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** base URL of the FastAPI scoring engine (backend/) */
  readonly VITE_API_URL?: string
}

declare module 'cytoscape-fcose' {
  import type cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
