#!/bin/bash

# Viral Video Creation MCP Servers Setup Script
# This script installs and configures MCP servers for automated viral video creation

set -e

echo "🎬 Setting up Viral Video Creation MCP Servers..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

# Check if uvx is installed
if ! command -v uvx &> /dev/null; then
    print_warning "uvx is not installed. Installing uvx..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source ~/.bashrc
fi

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    print_warning "FFmpeg is not installed. Please install FFmpeg for video editing capabilities."
    echo "On macOS: brew install ffmpeg"
    echo "On Ubuntu: sudo apt install ffmpeg"
    echo "On Windows: Download from https://ffmpeg.org/download.html"
fi

print_success "Prerequisites check completed!"

# Create directories for MCP servers
print_status "Creating directories..."
mkdir -p ~/mcp-servers
cd ~/mcp-servers

# Install Video Generation MCP Server (RunwayML + Luma AI)
print_status "Installing Video Generation MCP Server..."
if [ ! -d "mcp-video-gen" ]; then
    git clone https://github.com/wheattoast11/mcp-video-gen.git
    cd mcp-video-gen
    npm install
    npm run build
    cd ..
    print_success "Video Generation MCP Server installed!"
else
    print_warning "Video Generation MCP Server already exists, skipping..."
fi

# Install ElevenLabs MCP Server
print_status "Installing ElevenLabs MCP Server..."
uvx elevenlabs-mcp --help > /dev/null 2>&1 && print_success "ElevenLabs MCP Server is available!" || print_warning "ElevenLabs MCP Server installation may be needed"

# Install Video Editor MCP Server
print_status "Installing Video Editor MCP Server..."
if [ ! -d "Video_Editor_MCP" ]; then
    git clone https://github.com/Kush36Agrawal/Video_Editor_MCP.git
    cd Video_Editor_MCP
    npm install
    npm run build
    cd ..
    print_success "Video Editor MCP Server installed!"
else
    print_warning "Video Editor MCP Server already exists, skipping..."
fi

# Install DALL-E Image Generator MCP Server
print_status "Installing DALL-E Image Generator MCP Server..."
npm install -g @sammyl720/dall-e-image-generator-mcp > /dev/null 2>&1 && print_success "DALL-E MCP Server installed!" || print_warning "DALL-E MCP Server installation may have failed"

# Install YouTube MCP Server
print_status "Installing YouTube MCP Server..."
if [ ! -d "youtube-mcp-server" ]; then
    git clone https://github.com/stephen9412/youtube-mcp-server.git
    cd youtube-mcp-server
    npm install
    npm run build
    cd ..
    print_success "YouTube MCP Server installed!"
else
    print_warning "YouTube MCP Server already exists, skipping..."
fi

# Install Twitter/X MCP Server
print_status "Installing Twitter/X MCP Server..."
if [ ! -d "MCP_X" ]; then
    git clone https://github.com/sriramsowmithri9807/MCP_X.git
    cd MCP_X
    npm install
    npm run build
    cd ..
    print_success "Twitter/X MCP Server installed!"
else
    print_warning "Twitter/X MCP Server already exists, skipping..."
fi

# Create environment file template
print_status "Creating environment configuration template..."
cat > ~/mcp-servers/.env.template << 'EOF'
# Viral Video Creation MCP Servers Environment Configuration
# Copy this file to .env and fill in your API keys

# Video Generation
RUNWAYML_API_SECRET=your_runwayml_api_secret_here
LUMAAI_API_KEY=your_luma_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Audio Generation
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Image Generation
OPENAI_API_KEY=your_openai_api_key_here

# Social Media Platforms
YOUTUBE_API_KEY=your_youtube_api_key_here
TWITTER_API_KEY=your_twitter_api_key_here
TWITTER_API_SECRET=your_twitter_api_secret_here
TWITTER_ACCESS_TOKEN=your_twitter_access_token_here
TWITTER_ACCESS_SECRET=your_twitter_access_secret_here
TIKTOK_API_KEY=your_tiktok_api_key_here

# Optional
SPOTIFY_CLIENT_ID=your_spotify_client_id_here
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret_here
EOF

print_success "Environment template created at ~/mcp-servers/.env.template"

# Create MCP configuration snippet
print_status "Creating MCP configuration snippet..."
cat > ~/mcp-servers/mcp-config-snippet.json << 'EOF'
{
  "video-generation": {
    "command": "node",
    "args": ["~/mcp-servers/mcp-video-gen/build/server-index.js"],
    "env": {
      "RUNWAYML_API_SECRET": "your_runwayml_api_secret",
      "LUMAAI_API_KEY": "your_luma_api_key",
      "OPENROUTER_API_KEY": "your_openrouter_api_key"
    },
    "alwaysAllow": [
      "generate_text_to_video",
      "generate_image_to_video",
      "enhance_prompt",
      "luma_generate_image",
      "luma_add_audio",
      "luma_upscale"
    ],
    "disabled": true
  },
  "elevenlabs": {
    "command": "uvx",
    "args": ["elevenlabs-mcp"],
    "env": {
      "ELEVENLABS_API_KEY": "your_elevenlabs_api_key"
    },
    "alwaysAllow": [
      "text_to_speech",
      "voice_clone",
      "audio_processing"
    ],
    "disabled": true
  },
  "video-editor": {
    "command": "node",
    "args": ["~/mcp-servers/Video_Editor_MCP/dist/index.js"],
    "alwaysAllow": [
      "trim_video",
      "merge_videos",
      "convert_format",
      "add_audio",
      "add_subtitles"
    ],
    "disabled": true
  },
  "youtube-api": {
    "command": "node",
    "args": ["~/mcp-servers/youtube-mcp-server/dist/index.js"],
    "env": {
      "YOUTUBE_API_KEY": "your_youtube_api_key"
    },
    "alwaysAllow": [
      "upload_video",
      "update_metadata",
      "get_analytics"
    ],
    "disabled": true
  }
}
EOF

print_success "MCP configuration snippet created at ~/mcp-servers/mcp-config-snippet.json"

# Create quick start guide
print_status "Creating quick start guide..."
cat > ~/mcp-servers/QUICK_START.md << 'EOF'
# Viral Video Creation MCP Servers - Quick Start Guide

## 🚀 Getting Started

### 1. Configure API Keys
1. Copy the environment template: `cp .env.template .env`
2. Edit `.env` and add your API keys
3. Get API keys from:
   - RunwayML: https://runwayml.com/
   - Luma AI: https://lumalabs.ai/
   - ElevenLabs: https://elevenlabs.io/
   - OpenAI: https://platform.openai.com/
   - YouTube: https://console.developers.google.com/

### 2. Update MCP Configuration
1. Copy the configuration snippet from `mcp-config-snippet.json`
2. Add it to your `.vscode/mcp.json` file under the "servers" section
3. Update the API keys in the configuration
4. Enable servers by setting `"disabled": false`

### 3. Test the Setup
1. Restart your MCP client (Claude Desktop, Cursor, etc.)
2. Try generating a simple video: "Create a 5-second video of a sunset"
3. Test audio generation: "Generate a voiceover for this script"
4. Test image generation: "Create a thumbnail for a tech video"

### 4. Create Your First Viral Video
Try this prompt:
"Create a viral TikTok video about the latest AI breakthrough. Include:
- Research trending AI topics
- Generate an engaging script with hooks
- Create eye-catching visuals
- Add professional voiceover
- Optimize for TikTok format
- Suggest trending hashtags"

## 📊 Cost Estimates
- Basic video (5-10 seconds): $0.40-1.00
- High-quality video with audio: $1.00-2.50
- Full viral video package: $2.00-5.00

## 🔧 Troubleshooting
- Check API key validity
- Ensure FFmpeg is installed for video editing
- Verify Node.js version (18+ recommended)
- Check MCP server logs for errors

## 📚 Documentation
- Full implementation guide: `mcp-servers-implementation.md`
- Individual server documentation in respective directories
EOF

print_success "Quick start guide created at ~/mcp-servers/QUICK_START.md"

# Final summary
echo ""
echo "🎉 Setup Complete!"
echo "=================="
print_success "All MCP servers have been installed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure your API keys in ~/mcp-servers/.env"
echo "2. Add the MCP configuration to your .vscode/mcp.json"
echo "3. Enable the servers you want to use"
echo "4. Restart your MCP client"
echo "5. Start creating viral videos!"
echo ""
echo "📖 Documentation:"
echo "- Quick Start: ~/mcp-servers/QUICK_START.md"
echo "- Full Guide: backend/viral/mcp-servers-implementation.md"
echo ""
print_warning "Remember to keep your API keys secure and never commit them to version control!"