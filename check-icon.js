const fs = require('fs');
const path = require('path');

console.log('🔍 检查 Windows 图标文件...\n');

const iconFiles = [
  'build/icon.ico',
  'build/icon22.ico', 
  'build/icon222.ico'
];

iconFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    console.log(`❌ ${file} 不存在`);
    return;
  }

  const buffer = fs.readFileSync(file);
  const size = buffer.length;
  
  console.log(`\n📄 ${file}`);
  console.log(`   文件大小: ${(size / 1024).toFixed(2)} KB (${size} 字节)`);
  
  // 检查 ICO 文件头
  // ICO 格式: 00 00 01 00 [图像数量]
  const header = buffer.slice(0, 6);
  console.log(`   文件头: ${header.toString('hex').toUpperCase().match(/.{1,2}/g).join(' ')}`);
  
  if (header[0] === 0 && header[1] === 0 && header[2] === 1 && header[3] === 0) {
    const imageCount = header.readUInt16LE(4);
    console.log(`   ✓ 有效的 ICO 文件`);
    console.log(`   包含图像数量: ${imageCount}`);
    
    // 读取图像信息
    for (let i = 0; i < Math.min(imageCount, 10); i++) {
      const offset = 6 + i * 16;
      const width = buffer[offset] === 0 ? 256 : buffer[offset];
      const height = buffer[offset + 1] === 0 ? 256 : buffer[offset + 1];
      const colorCount = buffer[offset + 2];
      const bitsPerPixel = buffer.readUInt16LE(offset + 6);
      const imageSize = buffer.readUInt32LE(offset + 8);
      
      console.log(`     图像 ${i + 1}: ${width}x${height}, ${bitsPerPixel} 位色深, 大小: ${imageSize} 字节`);
    }
    
    // 检查是否包含必需的尺寸
    const requiredSizes = [16, 32, 48, 64, 128, 256];
    const foundSizes = [];
    for (let i = 0; i < imageCount; i++) {
      const offset = 6 + i * 16;
      const width = buffer[offset] === 0 ? 256 : buffer[offset];
      foundSizes.push(width);
    }
    
    console.log(`\n   推荐尺寸检查:`);
    requiredSizes.forEach(size => {
      if (foundSizes.includes(size)) {
        console.log(`     ✓ ${size}x${size}`);
      } else {
        console.log(`     ❌ 缺少 ${size}x${size}`);
      }
    });
    
  } else {
    console.log(`   ❌ 不是有效的 ICO 文件！`);
    console.log(`   期望开头: 00 00 01 00`);
    console.log(`   实际开头: ${header.slice(0, 4).toString('hex').toUpperCase().match(/.{1,2}/g).join(' ')}`);
  }
});

console.log('\n\n📋 Windows 图标要求:');
console.log('  ✅ 文件格式: .ico');
console.log('  ✅ 必需尺寸: 16x16, 32x32, 48x48, 256x256');
console.log('  ✅ 推荐尺寸: 16, 24, 32, 48, 64, 128, 256');
console.log('  ✅ 色深: 32 位（带 alpha 通道）');
console.log('  ✅ 文件大小: 通常 < 200KB');
console.log('\n💡 如果图标不符合要求，推荐使用以下工具生成:');
console.log('  - https://www.icoconverter.com/');
console.log('  - https://redketchup.io/icon-converter');
console.log('  - https://convertio.co/zh/png-ico/');

