import { handlers } from "../../../../auth-simple"

export const { GET, POST } = handlers

// Configure for Cloudflare Pages deployment
export const runtime = 'edge'
export const dynamic = 'force-dynamic'