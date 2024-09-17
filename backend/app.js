const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const MOONSHOT_API_KEY = 'sk-rD4ESSMjWQaf8ybrddUNXkpRroyG8if47fJK0lCz3cnwaw8n';

// 确保 public 目录存在
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

app.post('/generate-apology', async (req, res) => {
  try {
    console.log('Received request:', req.body);
    const { recipient, senderName, senderRole, reason, wordCount, style } = req.body;

    // 创建道歉信内容
    const apologyContent = `我是${senderName}，由于${reason}，需要给${recipient}道歉，道歉字数为${wordCount}，我是道歉人的${senderRole}，要求风格为${style}。`;
    
    // 创建临时文本文件
    const tempFilePath = path.join(__dirname, 'temp_apology.txt');
    fs.writeFileSync(tempFilePath, apologyContent, 'utf8');

    // 准备表单数据
    const formData = new FormData();
    formData.append('file', fs.createReadStream(tempFilePath));
    formData.append('purpose', 'file-extract');

    console.log('Sending file to Moonshot API');
    const moonshotResponse = await axios.post(
      'https://api.moonshot.cn/v1/files',
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        },
      }
    );

    console.log('Received response from Moonshot API:', moonshotResponse.data);
    
    // 删除临时文件
    fs.unlinkSync(tempFilePath);

    // 使用上传的文件ID来生成道歉信
    const fileId = moonshotResponse.data.id;
    const chatResponse = await axios.post(
      'https://api.moonshot.cn/v1/chat/completions',
      {
        model: 'moonshot-v1-8k',
        messages: [
          { role: 'system', content: '你是一个专业的道歉信生成助手。' },
          { role: 'user', content: `请根据以下内容生成一封道歉信：${apologyContent}` }
        ],
        temperature: 0.7,
        max_tokens: parseInt(wordCount) * 2
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MOONSHOT_API_KEY}`,
        },
      }
    );

    const apologyText = chatResponse.data.choices[0].message.content;

    // 计算所需的画布高度
    const fontSize = 16;
    const lineHeight = fontSize * 1.5;
    const maxWidth = 760;
    const padding = 20;
    const lines = getLines(apologyText, maxWidth, fontSize);
    const canvasHeight = Math.max(1000, lines.length * lineHeight + padding * 2);

    // 生成道歉信图片
    const canvas = createCanvas(800, canvasHeight);
    const ctx = canvas.getContext('2d');

    // 设置背景
    ctx.fillStyle = '#f5f5dc';
    ctx.fillRect(0, 0, 800, canvasHeight);

    // 添加纸张纹理
    const texturePath = path.join(__dirname, 'paper_texture.jpg');
    if (fs.existsSync(texturePath)) {
      const texture = await loadImage(texturePath);
      ctx.globalAlpha = 0.1;
      ctx.drawImage(texture, 0, 0, 800, canvasHeight);
      ctx.globalAlpha = 1.0;
    } else {
      console.warn('Texture file not found:', texturePath);
    }

    // 在canvas上逐字符绘制文本
    ctx.font = `${fontSize}px sans-serif`;
    ctx.fillStyle = 'black';
    let currentY = padding + lineHeight;
    let currentX = padding;

    for (const line of lines) {
      for (const char of line) {
        ctx.fillText(char, currentX, currentY);
        currentX += ctx.measureText(char).width;
      }
      currentY += lineHeight;
      currentX = padding;
    }

    // 保存图片
    const imagePath = path.join(publicDir, `apology_${Date.now()}.jpg`);
    const out = fs.createWriteStream(imagePath);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);
    out.on('finish', () => {
      res.json({ imageUrl: `http://localhost:3001/${path.basename(imagePath)}` });
    });
    out.on('error', (err) => {
      console.error('Error saving image:', err);
      res.status(500).json({ error: 'Failed to save apology image', details: err.message });
    });
  } catch (error) {
    console.error('Error generating apology:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failed to generate apology', details: error.response ? error.response.data : error.message });
  }
});

function getLines(text, maxWidth, fontSize) {
  const canvas = createCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px sans-serif`;

  const lines = [];
  let line = '';
  let lineWidth = 0;

  for (const char of text) {
    const charWidth = ctx.measureText(char).width;
    if (lineWidth + charWidth > maxWidth) {
      lines.push(line);
      line = char;
      lineWidth = charWidth;
    } else {
      line += char;
      lineWidth += charWidth;
    }
  }

  if (line.length > 0) {
    lines.push(line);
  }

  return lines;
}

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
;