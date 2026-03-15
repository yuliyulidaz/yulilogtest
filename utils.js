// utils.js

// 16진수 색상을 RGBA로 변환
export function normalizeColor(color) {
    if (!color) return '#000000';
    if (/^#[0-9A-F]{8}$/i.test(color)) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const a = parseInt(color.slice(7, 9), 16) / 255;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
    }
    return color;
}

// 이미지 다운로드
export async function downloadImage(canvas) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && navigator.share) {
        canvas.toBlob(async (blob) => {
            const file = new File([blob], "lumina_quote.png", { type: "image/png" });
            try { await navigator.share({ files: [file], }); } catch (err) { console.log("Share failed or canceled", err); }
        });
    } else {
        const link = document.createElement('a');
        link.download = `lumina_quote_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }
}

// 이미지 복사
export function copyImage(canvas) {
    canvas.toBlob(blob => {
        // 일부 구형 브라우저 호환성을 위한 try-catch
        try {
            const item = new ClipboardItem({ "image/png": blob });
            navigator.clipboard.write([item]).then(() => { alert('클립보드에 복사되었습니다!'); })
            .catch(err => { console.error('복사 실패:', err); alert('복사에 실패했습니다.'); });
        } catch (err) {
            console.error(err);
            alert('이 브라우저에서는 이미지 복사를 지원하지 않을 수 있습니다.');
        }
    });
}
