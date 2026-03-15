// draw.js
import { normalizeColor } from './utils.js';

export function drawBackground(ctx, width, height, state) {
    ctx.globalAlpha = 1;
    if (state.bgType === 'solid') {
        let colorMain = normalizeColor(state.colors.bgMain);
        ctx.fillStyle = colorMain;
    } else {
        let x0 = 0, y0 = 0, x1 = 0, y1 = 0;
        switch(state.gradDirection) {
            case 'to bottom': y1 = height; break;
            case 'to top': y0 = height; y1 = 0; break;
            case 'to right': x1 = width; break;
            case 'to left': x0 = width; x1 = 0; break;
            case 'to bottom right': x1 = width; y1 = height; break;
            case 'to top right': y0 = height; x1 = width; y1 = 0; break;
            case 'to bottom left': x0 = width; y1 = height; break;
            case 'to top left': x0 = width; y0 = height; break;
        }
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, normalizeColor(state.colors.gradStart));
        grad.addColorStop(1, normalizeColor(state.colors.gradEnd));
        ctx.fillStyle = grad;
    }
    ctx.fillRect(0, 0, width, height);

    if (state.bgImage) {
        drawImage(ctx, width, height, state);

        const overlayOpacityInput = document.getElementById('overlayOpacity');
        const overlayVal = overlayOpacityInput ? parseInt(overlayOpacityInput.value) : 0;
        if (overlayVal !== 0) {
            ctx.save();
            if (overlayVal < 0) ctx.fillStyle = `rgba(255, 255, 255, ${Math.abs(overlayVal) / 100})`;
            else ctx.fillStyle = `rgba(0, 0, 0, ${overlayVal / 100})`;
            ctx.fillRect(0, 0, width, height);
            ctx.restore();
        }
    }
}

function drawImage(ctx, width, height, state) {
    const img = state.bgImage;
    // DOM 요소에서 값 읽기 (기존 로직 유지)
    const fit = document.querySelector('input[name="imageFit"]:checked').value;
    const position = document.querySelector('input[name="imagePosition"]:checked').value;
    const scalePercent = parseInt(document.getElementById('bgImageScale').value);
    const scale = scalePercent / 100;

    let sWidth = img.width;
    let sHeight = img.height;
    let dWidth, dHeight;
    const imgRatio = sWidth / sHeight;
    const canvasRatio = width / height;

    if (fit === 'cover') {
        if (imgRatio > canvasRatio) { dHeight = height; dWidth = height * imgRatio; } 
        else { dWidth = width; dHeight = width / imgRatio; }
    } else { 
            if (imgRatio > canvasRatio) { dWidth = width; dHeight = width / imgRatio; } 
            else { dHeight = height; dWidth = height * imgRatio; }
    }
    dWidth *= scale;
    dHeight *= scale;

    let dx, dy;
    const [vPos, hPos] = position.split('-');
    if (hPos === 'left') dx = 0;
    else if (hPos === 'center') dx = (width - dWidth) / 2;
    else if (hPos === 'right') dx = width - dWidth;

    if (vPos === 'top') dy = 0;
    else if (vPos === 'middle') dy = (height - dHeight) / 2;
    else if (vPos === 'bottom') dy = height - dHeight;

    ctx.drawImage(img, dx, dy, dWidth, dHeight);
}

export function drawContent(ctx, width, height, state) {
    // DOM 요소에서 값 읽기
    const quote = document.getElementById('quote').value;
    const author = document.getElementById('author').value;
    const title = document.getElementById('title').value;
    const platform = state.platform;
    
    const fontSize = parseInt(document.getElementById('fontSize').value);
    const lineHeightMultiplier = parseFloat(document.getElementById('lineHeight').value);
    const paraSpacing = parseInt(document.getElementById('paraSpacing').value); 
    const padding = parseInt(document.getElementById('padding').value);
    const align = document.querySelector('input[name="align"]:checked').value;
    const fontFamily = state.fontFamily; 
    const breakMode = document.querySelector('input[name="linebreak"]:checked').value;
    const logoSize = parseInt(document.getElementById('logoSize').value);
    
    // Indentation Logic
    const indentSize = state.indentation ? fontSize : 0; 

    ctx.fillStyle = state.colors.text;
    ctx.textBaseline = 'middle';

    const footerFontSize = Math.max(24, fontSize * 0.8);
    const footerLineHeight = footerFontSize * 1.5;

    let fontWeight = 400; 
    if (fontFamily === 'Noto Serif KR') fontWeight = 300;       
    else if (fontFamily === 'Noto Sans KR') fontWeight = 200;    
    else if (fontFamily === 'Pretendard') fontWeight = 200;      
    else if (fontFamily === 'KoPub Batang') fontWeight = 300;    
    
    ctx.font = `${fontWeight} ${fontSize}px '${fontFamily}'`;
    const contentWidth = width - (padding * 2);
    const lineHeight = fontSize * lineHeightMultiplier;
    
    // getLines Helper 호출
    const lines = getLines(ctx, quote, contentWidth, breakMode, indentSize);
    
    let quoteBlockHeight = lines.length * lineHeight;
    lines.forEach((line, i) => {
        if (!line.isSoftBreak && i < lines.length - 1) quoteBlockHeight += paraSpacing;
    });

    const hasFooterText = !!(author || title);
    const spacing = hasFooterText ? (fontSize * 1.0) : 0;
    const totalContentHeight = quoteBlockHeight + spacing + (hasFooterText ? footerLineHeight : 0);
    
    let currentY = (height - totalContentHeight) / 2 + (lineHeight / 2);

    if (quote) {
        lines.forEach((lineObj, index) => {
            const lineText = lineObj.text;
            const isJustify = align === 'justify' && lineObj.isSoftBreak;
            
            // Determine X position based on indentation
            let currentPadding = padding;
            let currentLineWidth = contentWidth;
            
            if (lineObj.isParaStart && state.indentation) {
                currentPadding += indentSize;
                currentLineWidth -= indentSize;
            }

            if (isJustify) {
                drawJustifiedTextLine(ctx, lineText, currentPadding, currentY, currentLineWidth);
            } else {
                let x;
                if (align === 'justify') { x = currentPadding; ctx.textAlign = 'left'; } 
                else if (align === 'left') { x = currentPadding; ctx.textAlign = 'left'; } 
                else if (align === 'center') { x = width / 2; ctx.textAlign = 'center'; } 
                else if (align === 'right') { x = width - padding; ctx.textAlign = 'right'; }
                ctx.fillText(lineText, x, currentY);
            }
            currentY += lineHeight;
            if (!lineObj.isSoftBreak && index < lines.length - 1) currentY += paraSpacing;
        });
    }

    if (hasFooterText) {
        let footerAlign = align;
        if(align === 'justify') footerAlign = 'left';

        const startY = (height - totalContentHeight) / 2;
        currentY = startY + quoteBlockHeight + spacing + (footerLineHeight / 2);
        
        const authorPart = author || '';
        const separator = (author && title) ? ' | ' : '';
        const titlePart = title || '';

        const footerFontFamily = 'Pretendard';
        const fontNormal = `200 ${footerFontSize}px '${footerFontFamily}'`;
        const fontBold = `400 ${footerFontSize}px '${footerFontFamily}'`;

        ctx.font = fontNormal;
        const wAuthor = ctx.measureText(authorPart).width;
        const wSep = ctx.measureText(separator).width;
        ctx.font = fontBold;
        const wTitle = ctx.measureText(titlePart).width;
        const totalFooterWidth = wAuthor + wSep + wTitle;

        let startX;
        if (footerAlign === 'left') startX = padding;
        else if (footerAlign === 'center') startX = (width - totalFooterWidth) / 2;
        else if (footerAlign === 'right') startX = width - padding - totalFooterWidth;

        ctx.textAlign = 'left'; // Always draw left-aligned from startX
        ctx.font = fontNormal;
        ctx.fillText(authorPart, startX, currentY);
        ctx.fillText(separator, startX + wAuthor, currentY);
        ctx.font = fontBold;
        ctx.fillText(titlePart, startX + wAuthor + wSep, currentY);
    }

    // --- 4. Draw Logo ---
    let logoImg = null;
    if (state.logoMode === 'custom') {
        logoImg = state.customLogoImage;
    } else {
        logoImg = platform ? state.logoImages[platform] : null;
    }

    if (logoImg && logoImg.complete && logoImg.naturalHeight !== 0) {
        const radius = logoSize / 2;
        const margin = 60; 
        const logoX = width - margin - radius;
        const logoY = height - margin - radius;

        ctx.save();
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.arc(logoX, logoY, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        const aspect = logoImg.width / logoImg.height;
        let sw, sh, sx, sy;
        if (aspect > 1) { sh = logoImg.height; sw = sh; sx = (logoImg.width - sw) / 2; sy = 0; } 
        else { sw = logoImg.width; sh = sw; sx = 0; sy = (logoImg.height - sh) / 2; }

        ctx.drawImage(logoImg, sx, sy, sw, sh, logoX - radius, logoY - radius, logoSize, logoSize);
        ctx.restore();
    }
}

function drawJustifiedTextLine(ctx, text, x, y, width) {
    const words = text.split(' ');
    if (words.length <= 1) { ctx.textAlign = 'left'; ctx.fillText(text, x, y); return; }
    
    const totalWordWidth = words.reduce((acc, word) => acc + ctx.measureText(word).width, 0);
    const totalSpace = width - totalWordWidth;
    const spaceWidth = totalSpace / (words.length - 1);
    
    let currentX = x;
    ctx.textAlign = 'left';
    words.forEach((word, index) => {
        ctx.fillText(word, currentX, y);
        currentX += ctx.measureText(word).width;
        if (index < words.length - 1) currentX += spaceWidth;
    });
}

function getLines(ctx, text, maxWidth, breakMode, indentSize) {
    if (!text) return [];
    const paragraphs = text.split('\n');
    let lines = [];
    paragraphs.forEach(para => {
        let isParaStart = true;
        let currentMaxWidth = maxWidth - (isParaStart ? indentSize : 0);

        if (breakMode === 'word') {
            const words = para.split(' ');
            let currentLine = words[0];
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const width = ctx.measureText(currentLine + " " + word).width;
                if (width < currentMaxWidth) {
                        currentLine += " " + word;
                } else { 
                    lines.push({ text: currentLine, isSoftBreak: true, isParaStart: isParaStart }); 
                    currentLine = word; 
                    isParaStart = false; 
                    currentMaxWidth = maxWidth;
                }
            }
            lines.push({ text: currentLine, isSoftBreak: false, isParaStart: isParaStart });
        } else {
            let currentLine = para[0] || '';
            for (let i = 1; i < para.length; i++) {
                const char = para[i];
                const width = ctx.measureText(currentLine + char).width;
                if (width < currentMaxWidth) {
                        currentLine += char;
                } else { 
                    lines.push({ text: currentLine, isSoftBreak: true, isParaStart: isParaStart }); 
                    currentLine = char;
                    isParaStart = false; 
                    currentMaxWidth = maxWidth;
                }
            }
            lines.push({ text: currentLine, isSoftBreak: false, isParaStart: isParaStart });
        }
    });
    return lines;
}
