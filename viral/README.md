# Viral Video Creation System

## 🎯 Overview

This system enables automated viral video creation using MCP (Model Context Protocol) servers, providing capabilities that match and exceed platforms like DeepAgent for specialized video content creation.

## 📁 Files in this Directory

### Core Documentation
- **[`viral-video-mcp-analysis.md`](./viral-video-mcp-analysis.md)** - Original analysis comparing our approach to DeepAgent
- **[`mcp-servers-implementation.md`](./mcp-servers-implementation.md)** - Detailed implementation guide with specific MCP servers, costs, and roadmap
- **[`setup-mcp-servers.sh`](./setup-mcp-servers.sh)** - Automated setup script for installing all required MCP servers

## 🚀 Quick Start

### 1. Run the Setup Script
```bash
cd backend/viral
./setup-mcp-servers.sh
```

### 2. Configure API Keys
The script will create `~/mcp-servers/.env.template`. Copy it to `.env` and add your API keys:
- **RunwayML API Secret** (video generation)
- **Luma AI API Key** (alternative video generation)
- **ElevenLabs API Key** (text-to-speech, 10k credits/month free)
- **OpenAI API Key** (image generation, text processing)
- **YouTube API Key** (video upload)

### 3. Update MCP Configuration
Add the generated configuration snippet to your `.vscode/mcp.json` file and enable the servers you want to use.

### 4. Test the System
Try this prompt in Claude/Cursor:
```
Create a viral TikTok video about the latest AI breakthrough that will get 1M+ views. Include research, script, visuals, voiceover, and optimization.
```

## 💰 Cost Analysis

### Per Video Costs
- **Basic video (5-10 seconds)**: $0.40-1.00
- **High-quality with audio**: $1.00-2.50  
- **Full viral video package**: $2.00-5.00

### Monthly Estimates (100 videos)
- **Conservative usage**: $40-100/month
- **High-quality production**: $150-250/month
- **Premium features**: $200-300/month

## 🛠 Available MCP Servers

### ✅ Ready to Use
- **Video Generation**: RunwayML + Luma AI MCP Server
- **Text-to-Speech**: ElevenLabs MCP Server (official)
- **Image Generation**: DALL-E MCP Server
- **Video Editing**: FFmpeg-based Video Editor MCP
- **Content Research**: Reddit MCP (already configured)
- **Web Scraping**: Firecrawl MCP (already configured)

### 🔄 Platform Integration
- **YouTube**: Multiple MCP servers available
- **Twitter/X**: Several MCP servers for posting and analytics
- **TikTok**: Analysis and optimization tools
- **Instagram**: Content analysis and engagement tools

## 📊 Workflow Architecture

```
Single Prompt → Trend Analysis → Content Strategy → Script Generation
     ↓              ↓               ↓                ↓
Performance ← Platform Upload ← Video Assembly ← Visual Creation
Monitoring    & Optimization    & Editing       & Audio Generation
```

## 🎯 Advantages Over DeepAgent

1. **Specialized for Virality**: Purpose-built for viral content vs. general-purpose
2. **Cost-Effective**: $0.40-2.50 per video vs. $10/user/month subscription
3. **Customizable**: Full control over each step of the pipeline
4. **Scalable**: Can process multiple videos simultaneously
5. **Platform-Optimized**: Specific optimization for TikTok, YouTube, etc.

## 🔧 Technical Requirements

### Prerequisites
- Node.js 18+
- Python 3.8+ (for some MCP servers)
- FFmpeg (for video editing)
- uvx (Python package manager)

### API Keys Needed
- RunwayML (video generation)
- Luma AI (alternative video generation)  
- ElevenLabs (text-to-speech, free tier available)
- OpenAI (image generation, text processing)
- YouTube API (video upload)
- Twitter API (optional, for social media posting)

## 📈 Implementation Roadmap

### Phase 1: Core Pipeline (Week 1-2)
- ✅ Video generation (RunwayML/Luma AI)
- ✅ Audio generation (ElevenLabs)
- ✅ Content research (Reddit/Firecrawl)

### Phase 2: Content Creation (Week 3-4)
- Video editing and assembly
- Image generation for thumbnails
- Template system for viral formats

### Phase 3: Platform Integration (Week 5-6)
- YouTube upload automation
- Social media cross-posting
- Analytics and performance tracking

### Phase 4: Optimization (Week 7-8)
- A/B testing for thumbnails and titles
- Viral prediction algorithms
- Cost optimization and batch processing

## 🎬 Example Use Cases

### 1. Tech News Video
```
"Create a 60-second YouTube video about the latest AI breakthrough, 
optimized for tech audiences with professional voiceover and engaging visuals"
```

### 2. TikTok Trend
```
"Make a viral TikTok about productivity hacks using the latest trending format, 
include trending music and hashtags"
```

### 3. Educational Content
```
"Create an educational video explaining blockchain in simple terms, 
with animations and clear narration for beginners"
```

## 🔍 Monitoring & Analytics

### Success Metrics
- **Video Generation Time**: <5 minutes per video
- **Success Rate**: >95% completion rate
- **Viral Rate**: >10% videos reach 100k+ views
- **Cost Efficiency**: <$2.50 average per video
- **Engagement Rate**: >5% average engagement

### Performance Tracking
- Real-time generation monitoring
- Cost tracking per video
- Platform-specific analytics
- A/B testing results

## 🚨 Important Notes

1. **API Costs**: Monitor usage to avoid unexpected charges
2. **Rate Limits**: Respect API rate limits for each service
3. **Content Policy**: Ensure generated content follows platform guidelines
4. **Quality Control**: Review generated content before publishing
5. **Backup Plans**: Have alternative MCP servers configured

## 📞 Support & Troubleshooting

### Common Issues
- **FFmpeg not found**: Install FFmpeg for video editing
- **API key errors**: Verify all API keys are correctly configured
- **MCP server crashes**: Check logs and restart servers
- **Generation failures**: Monitor API quotas and rate limits

### Getting Help
- Check individual MCP server documentation
- Review setup script logs
- Test with simple prompts first
- Monitor API usage dashboards

---

**Ready to create viral videos with AI? Run the setup script and start generating!** 🎬✨