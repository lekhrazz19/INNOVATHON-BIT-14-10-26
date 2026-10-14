/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** base URL of the FastAPI scoring engine (backend/) */
  readonly VITE_API_URL?: string
  /** 'real' loads a converted real graph instead of the fixture case */
  readonly VITE_DATA?: string
}

declare module 'cytoscape-fcose' {
  import type cytoscape from 'cytoscape'
  const ext: cytoscape.Ext
  export default ext
}
