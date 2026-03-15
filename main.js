// main.js
import { WELCOME_MESSAGE, LOGO_URLS } from './constants.js';
import { drawBackground, drawContent } from './draw.js';
import { downloadImage, copyImage } from './utils.js';
import { initCustomLogo } from './customLogo.js';

const state = {
    canvas: null,
    ctx: null,
    bgImage: null,
    bgImageName: null,
    logoImages: {}, // Preloaded logos
    platform: '',
    isDarkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
    bgType: 'gradient',
    gradDirection: 'to bottom right',
    canvasRatio: '1:1',
    fontFamily: 'Noto Serif KR',
    indentation: false,
    isCurlyQuotes: false,
    isEditorExpanded: false,
    isWelcomeActive: true,
    logoMode: 'platform', // 'platform' or 'custom'
    customLogoImage: null,
    customLogoDataUrl: '',
    colors: {
        text: '#ffffff',
        bgMain: '#E6E6FA',
        gradStart: '#ec4447',
        gradEnd: '#8c5af2',
    },
    pickrs: {}
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSettings();
    initCanvas();
    initColorPickers();
    loadLogos();
    bindEvents();
    
    // UI Init
    updateRatioUI();
    updateFontUI();
    updateDirectionUI();
    togglePaletteVisibility();
    updateIndentationUI(); 
    
    // Custom Logo Module Init
    initCustomLogo(state, updateCanvas);

    // Welcome Message
    const quoteInput = document.getElementById('quote');
    quoteInput.value = WELCOME_MESSAGE;
    quoteInput.classList.add('text-slate-400');

    // Mobile Check
    const isMobile = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        document.querySelectorAll('.copy-btn').forEach(el => el.style.display = 'none');
        const divider = document.getElementById('desktop-action-divider');
        if(divider) divider.style.display = 'none';
    }

    setupMobileSteppers();

    document.fonts.ready.then(() => { updateCanvas(); });
    setTimeout(updateCanvas, 500);
    resizeCanvas();
    updateCanvas();
});

// --- Settings Persistence ---
function saveSettings() {
    const settings = {
        bgType: state.bgType,
        gradDirection: state.gradDirection,
        canvasRatio: state.canvasRatio,
        fontFamily: state.fontFamily,
        indentation: state.indentation,
        colors: state.colors,
        platform: state.platform,
        logoMode: state.logoMode,
        customLogoDataUrl: state.customLogoDataUrl,
        styles: {
            fontSize: document.getElementById('fontSize').value,
            lineHeight: document.getElementById('lineHeight').value,
            paraSpacing: document.getElementById('paraSpacing').value,
            padding: document.getElementById('padding').value,
            align: document.querySelector('input[name="align"]:checked').value,
            linebreak: document.querySelector('input[name="linebreak"]:checked').value,
            logoSize: document.getElementById('logoSize').value,
            overlayOpacity: document.getElementById('overlayOpacity').value,
            bgImageScale: document.getElementById('bgImageScale').value,
        }
    };
    localStorage.setItem('geminiNexusSettings', JSON.stringify(settings));
}

let saveTimeout;
function debouncedSaveSettings() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveSettings, 1000);
}

function loadSettings() {
    const saved = localStorage.getItem('geminiNexusSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            if (settings.bgType) state.bgType = settings.bgType;
            if (settings.gradDirection) state.gradDirection = settings.gradDirection;
            if (settings.canvasRatio) state.canvasRatio = settings.canvasRatio;
            if (settings.fontFamily) state.fontFamily = settings.fontFamily;
            if (settings.indentation !== undefined) state.indentation = settings.indentation;
            if (settings.isCurlyQuotes !== undefined) state.isCurlyQuotes = settings.isCurlyQuotes;
            if (settings.logoMode) state.logoMode = settings.logoMode;
            if (settings.customLogoDataUrl) {
                state.customLogoDataUrl = settings.customLogoDataUrl;
                state.customLogoImage = new Image();
                state.customLogoImage.onload = updateCanvas; // Redraw when custom image loads
                state.customLogoImage.src = state.customLogoDataUrl;
            }
            if (settings.colors) state.colors = { ...state.colors, ...settings.colors };
            if (settings.platform) state.platform = settings.platform;

            if (settings.styles) {
                if(settings.styles.fontSize) document.getElementById('fontSize').value = settings.styles.fontSize;
                if(settings.styles.lineHeight) document.getElementById('lineHeight').value = settings.styles.lineHeight;
                if(settings.styles.paraSpacing) document.getElementById('paraSpacing').value = settings.styles.paraSpacing;
                if(settings.styles.padding) document.getElementById('padding').value = settings.styles.padding;
                if(settings.styles.logoSize) document.getElementById('logoSize').value = settings.styles.logoSize;
                if(settings.styles.overlayOpacity) document.getElementById('overlayOpacity').value = settings.styles.overlayOpacity;
                if(settings.styles.bgImageScale) document.getElementById('bgImageScale').value = settings.styles.bgImageScale;
                
                if(settings.styles.align) {
                    const rb = document.querySelector(`input[name="align"][value="${settings.styles.align}"]`);
                    if(rb) rb.checked = true;
                }
                if(settings.styles.linebreak) {
                    const rb = document.querySelector(`input[name="linebreak"][value="${settings.styles.linebreak}"]`);
                    if(rb) rb.checked = true;
                }
            }

            const bgRb = document.querySelector(`input[name="bgMode"][value="${state.bgType}"]`);
            if(bgRb) bgRb.checked = true;
            const platSel = document.getElementById('platformSelect');
            if(platSel) platSel.value = state.platform;

            updateIndentationUI();

            document.getElementById('fontSizeValue').innerText = document.getElementById('fontSize').value;
            document.getElementById('lineHeightValue').innerText = document.getElementById('lineHeight').value;
            document.getElementById('paraSpacingValue').innerText = document.getElementById('paraSpacing').value;
            document.getElementById('paddingValue').innerText = document.getElementById('padding').value;
            document.getElementById('logoSizeValue').innerText = document.getElementById('logoSize').value;
            document.getElementById('scaleValue').innerText = document.getElementById('bgImageScale').value;
            
            const overlayVal = parseInt(document.getElementById('overlayOpacity').value);
            let text = "원본";
            if(overlayVal < 0) text = `밝게 ${Math.abs(overlayVal)}%`;
            if(overlayVal > 0) text = `어둡게 ${overlayVal}%`;
            document.getElementById('overlayValueText').innerText = text;
        } catch (e) { console.error("Failed to load settings", e); }
    }
}

// --- Mobile Stepper ---
function setupMobileSteppers() {
    const controls = [
        { key: 'fontSize', step: 1, min: 30, max: 80 },
        { key: 'lineHeight', step: 0.1, min: 1.2, max: 2.0 },
        { key: 'paraSpacing', step: 5, min: 0, max: 100 },
        { key: 'padding', step: 10, min: 50, max: 200 }
    ];
    controls.forEach(ctrl => { attachStepperEvents(ctrl.key, ctrl.step, ctrl.min, ctrl.max); });
}

function attachStepperEvents(key, step, min, max) {
    const minusBtn = document.getElementById(`btn-minus-${key}`);
    const plusBtn = document.getElementById(`btn-plus-${key}`);
    const inputMobile = document.getElementById(`input-mobile-${key}`);
    const sliderDesktop = document.getElementById(key);

    sliderDesktop.addEventListener('input', (e) => { inputMobile.value = e.target.value; });
    inputMobile.value = sliderDesktop.value;

    inputMobile.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = parseFloat(sliderDesktop.value);
        if (val < min) val = min;
        if (val > max) val = max;
        sliderDesktop.value = val;
        inputMobile.value = val; 
        sliderDesktop.dispatchEvent(new Event('input'));
    });

    let pressTimer = null;
    let pressInterval = null;
    let pressSpeed = 200;
    let pressCount = 0;

    const updateValue = (delta) => {
        let current = parseFloat(sliderDesktop.value);
        let next = current + delta;
        if (step < 1) next = Math.round(next * 10) / 10;
        if (next >= min && next <= max) {
            sliderDesktop.value = next;
            inputMobile.value = next;
            sliderDesktop.dispatchEvent(new Event('input'));
        }
    };

    const startPress = (btn, delta) => {
        btn.classList.add('btn-pressing');
        const tipContainer = document.getElementById('mobile-tip-container');
        if (tipContainer) {
            tipContainer.classList.remove('animate-tip');
            void tipContainer.offsetWidth;
            tipContainer.classList.add('animate-tip');
            tipContainer.classList.remove('opacity-70');
            tipContainer.classList.add('opacity-100');
        }
        updateValue(delta);
        pressSpeed = 200; pressCount = 0;

        pressTimer = setTimeout(() => {
            pressInterval = setInterval(() => {
                updateValue(delta);
                pressCount++;
                if (pressCount % 5 === 0 && pressSpeed > 50) {
                    clearInterval(pressInterval);
                    pressSpeed = Math.max(50, pressSpeed - 30);
                    pressInterval = setInterval(() => { updateValue(delta); pressCount++; }, pressSpeed);
                }
            }, pressSpeed);
        }, 400);
    };

    const stopPress = (btn) => {
        btn.classList.remove('btn-pressing');
        clearTimeout(pressTimer);
        clearInterval(pressInterval);
        pressTimer = null;
        pressInterval = null;
        const tipContainer = document.getElementById('mobile-tip-container');
        if(tipContainer) {
            tipContainer.classList.remove('opacity-100');
            tipContainer.classList.add('opacity-70');
        }
    };

    const bindBtn = (btn, delta) => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); startPress(btn, delta); });
        btn.addEventListener('touchend', () => stopPress(btn));
        btn.addEventListener('touchcancel', () => stopPress(btn));
        btn.addEventListener('mousedown', (e) => { startPress(btn, delta); });
        btn.addEventListener('mouseup', () => stopPress(btn));
        btn.addEventListener('mouseleave', () => stopPress(btn));
    };
    bindBtn(minusBtn, -step);
    bindBtn(plusBtn, step);
}

// --- Logic & Helpers ---
function initTheme() {
    if (state.isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
}

function initCanvas() {
    state.canvas = document.getElementById('canvas');
    state.ctx = state.canvas.getContext('2d');
}

function initColorPickers() {
    const createPickr = (elId, defaultColor, key) => {
        let initialColor = defaultColor;
        const pickr = Pickr.create({
            el: elId,
            theme: 'classic',
            default: defaultColor,
            swatches: [
                '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4',
                '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e', '#000000', '#ffffff',
                '#1a1a1a', '#0f2027', '#4b1248', '#203a43', '#2c5364', '#f0c27b'
            ],
            components: {
                preview: true, opacity: true, hue: true,
                interaction: { hex: true, input: true, save: true, cancel: true }
            },
            i18n: { 'btn:save': '확인', 'btn:cancel': '취소', 'btn:clear': '지우기' }
        });
        pickr.on('show', (color, instance) => { initialColor = state.colors[key]; });
        pickr.on('change', (color, source, instance) => {
            state.colors[key] = color.toHEXA().toString();
            updateCanvas();     
        });
        pickr.on('save', (color, instance) => {
            state.colors[key] = color.toHEXA().toString();
            instance.applyColor(true);
            instance.hide();
        });
        pickr.on('cancel', (instance) => {
            state.colors[key] = initialColor;
            pickr.setColor(initialColor, true); 
            updateCanvas();
            instance.hide();
        });
        pickr.on('hide', (instance) => {
            const currentColor = instance.getColor().toHEXA().toString();
            if (state.colors[key] === currentColor) instance.applyColor(true);
        });
        pickr.on('swatchselect', (color) => {
            state.colors[key] = color.toHEXA().toString();
            updateCanvas();
        });
        return pickr;
    };
    state.pickrs.text = createPickr('#textColorPicker', state.colors.text, 'text');
    state.pickrs.bgMain = createPickr('#bgColorMainPicker', state.colors.bgMain, 'bgMain');
    state.pickrs.gradStart = createPickr('#gradStartColorPicker', state.colors.gradStart, 'gradStart');
    state.pickrs.gradEnd = createPickr('#gradEndColorPicker', state.colors.gradEnd, 'gradEnd');
}

function loadLogos() {
    for (const [key, url] of Object.entries(LOGO_URLS)) {
        const img = new Image();
        img.crossOrigin = "Anonymous"; 
        img.src = url;
        state.logoImages[key] = img;
        img.onload = () => { if (state.platform === key) updateCanvas(); };
    }
}

function bindEvents() {
    const quoteInput = document.getElementById('quote');
    quoteInput.addEventListener('focus', function() {
        if (state.isWelcomeActive) {
            state.isWelcomeActive = false;
            this.value = '';
            this.classList.remove('text-slate-400');
            updateCanvas();
        }
    });
    quoteInput.addEventListener('input', updateCanvas);
    document.getElementById('author').addEventListener('input', updateCanvas);
    document.getElementById('title').addEventListener('input', updateCanvas);

    ['fontSize', 'lineHeight', 'paraSpacing', 'padding', 'logoSize', 'overlayOpacity', 'bgImageScale'].forEach(id => {
        document.getElementById(id).addEventListener('input', (e) => {
            if(id === 'fontSize') document.getElementById('fontSizeValue').innerText = e.target.value;
            if(id === 'lineHeight') document.getElementById('lineHeightValue').innerText = e.target.value;
            if(id === 'paraSpacing') document.getElementById('paraSpacingValue').innerText = e.target.value;
            if(id === 'padding') document.getElementById('paddingValue').innerText = e.target.value;
            if(id === 'logoSize') document.getElementById('logoSizeValue').innerText = e.target.value;
            if(id === 'bgImageScale') document.getElementById('scaleValue').innerText = e.target.value;
            if(id === 'overlayOpacity') {
                    const val = parseInt(e.target.value);
                    let text = "원본";
                    if(val < 0) text = `밝게 ${Math.abs(val)}%`;
                    if(val > 0) text = `어둡게 ${val}%`;
                    document.getElementById('overlayValueText').innerText = text;
            }
            updateCanvas();
        });
    });

    document.querySelectorAll('input[name="align"], input[name="linebreak"], input[name="imageFit"], input[name="imagePosition"]').forEach(el => {
        el.addEventListener('change', updateCanvas);
    });
    
    document.querySelectorAll('input[name="bgMode"]').forEach(el => {
        el.addEventListener('change', (e) => {
            state.bgType = e.target.value;
            togglePaletteVisibility();
            updateCanvas();
        });
    });

    document.getElementById('platformSelect').addEventListener('change', (e) => {
        state.platform = e.target.value;
        updateCanvas();
    });

    document.getElementById('bgImageUpload').addEventListener('change', handleImageUpload);
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
            state.bgImage = img;
            state.bgImageName = file.name;
            document.getElementById('imageFileName').innerText = file.name;
            document.getElementById('imageControlPanel').classList.remove('hidden');
            updateCanvas();
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
}

function updateCanvas() {
    debouncedSaveSettings();
    if (!state.ctx) return;
    const width = state.canvas.width;
    const height = state.canvas.height;
    state.ctx.clearRect(0, 0, width, height);
    drawBackground(state.ctx, width, height, state);
    drawContent(state.ctx, width, height, state);
}

function togglePaletteVisibility() {
    const solidPanel = document.getElementById('solidColorPanel');
    const gradPanel = document.getElementById('gradientColorPanel');
    const solidPalette = document.getElementById('solidPalette');
    const gradPalette = document.getElementById('gradientPalette');

    if (state.bgType === 'solid') {
        solidPanel.classList.remove('hidden');
        gradPanel.classList.add('hidden');
        solidPalette.classList.remove('hidden');
        gradPalette.classList.add('hidden');
    } else {
        solidPanel.classList.add('hidden');
        gradPanel.classList.remove('hidden');
        solidPalette.classList.add('hidden');
        gradPalette.classList.remove('hidden');
    }
}

function resizeCanvas() {
    let width = 1080;
    let height = 1080;
    if (state.canvasRatio === '4:5') height = 1350;
    else if (state.canvasRatio === '16:9') { width = 1920; height = 1080; }
    state.canvas.width = width;
    state.canvas.height = height;
}

function updateRatioUI() {
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.classList.remove('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
    });
    const idMap = { '1:1': 'btn-ratio-1-1', '4:5': 'btn-ratio-4-5', '16:9': 'btn-ratio-16-9' };
    const activeBtn = document.getElementById(idMap[state.canvasRatio]);
    if(activeBtn) activeBtn.classList.add('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
}

function updateFontUI() {
    document.querySelectorAll('.font-btn').forEach(btn => {
        if(btn.dataset.font === state.fontFamily) btn.classList.add('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
        else btn.classList.remove('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
    });
}

function updateDirectionUI() {
    document.querySelectorAll('.dir-btn').forEach(btn => {
        if(btn.dataset.dir === state.gradDirection) btn.classList.add('active-dir', 'bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400');
        else btn.classList.remove('active-dir', 'bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400');
    });
}

function updateIndentationUI() {
    const btn = document.getElementById('btn-indent');
    const text = document.getElementById('text-indent');
    if (state.indentation) {
        btn.classList.remove('text-slate-400');
        btn.classList.add('text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/30', 'border-brand-200', 'dark:border-brand-800');
        btn.classList.remove('bg-slate-50', 'dark:bg-slate-800');
        text.innerText = "들여쓰기 ON";
    } else {
        btn.classList.add('text-slate-400', 'bg-slate-50', 'dark:bg-slate-800');
        btn.classList.remove('text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/30', 'border-brand-200', 'dark:border-brand-800');
        text.innerText = "들여쓰기 OFF";
    }
}

// --- Global Functions (Window Binding for HTML onclick) ---

window.toggleDarkMode = function() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    initTheme();
};

window.copyImage = () => copyImage(state.canvas);
window.downloadImage = () => downloadImage(state.canvas);

window.toggleIndentation = function() {
    state.indentation = !state.indentation;
    updateIndentationUI();
    updateCanvas();
};

window.toggleQuoteStyle = function() {
    const textarea = document.getElementById('quote');
    let text = textarea.value;
    const btn = document.getElementById('btn-quote-toggle');
    const btnText = document.getElementById('text-quote-toggle');

    if (!state.isCurlyQuotes) {
        text = text.replace(/(^|[\s\(\[\{])"/g, "$1“").replace(/"/g, "”");
        text = text.replace(/(^|[\s\(\[\{])'/g, "$1‘").replace(/'/g, "’");
        state.isCurlyQuotes = true;
        btnText.innerText = "직선 따옴표 자동 변환";
        btn.classList.add('text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/30');
        btn.classList.remove('text-slate-400', 'bg-slate-50');
    } else {
        text = text.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        state.isCurlyQuotes = false;
        btnText.innerText = "둥근 따옴표 자동 변환";
        btn.classList.remove('text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/30');
        btn.classList.add('text-slate-400', 'bg-slate-50');
    }
    textarea.value = text;
    updateCanvas();
};

window.openMobileEditor = function() {
    const modal = document.getElementById('mobile-editor-modal');
    document.getElementById('mobile-quote-input').value = document.getElementById('quote').value;
    document.getElementById('mobile-author-input').value = document.getElementById('author').value;
    document.getElementById('mobile-title-input').value = document.getElementById('title').value;

    modal.classList.remove('hidden-modal');
    modal.classList.add('visible-modal');

    if (state.isWelcomeActive) {
        state.isWelcomeActive = false;
        document.getElementById('mobile-quote-input').value = ''; 
        document.getElementById('quote').classList.remove('text-slate-400');
    }
};

window.closeMobileEditor = function() {
    const modal = document.getElementById('mobile-editor-modal');
    document.getElementById('quote').value = document.getElementById('mobile-quote-input').value;
    document.getElementById('author').value = document.getElementById('mobile-author-input').value;
    document.getElementById('title').value = document.getElementById('mobile-title-input').value;

    modal.classList.remove('visible-modal');
    modal.classList.add('hidden-modal');
    updateCanvas();
};

window.setRatio = function(ratio) {
    state.canvasRatio = ratio;
    updateRatioUI();
    resizeCanvas();
    updateCanvas();
};

window.setFont = function(fontName) {
    state.fontFamily = fontName;
    updateFontUI();
    let fontWeight = '400';
    if (['Noto Serif KR', 'KoPub Batang'].includes(fontName)) fontWeight = '300';
    else if (['Noto Sans KR', 'Pretendard'].includes(fontName)) fontWeight = '200';
    const fontString = `${fontWeight} 40px '${fontName}'`;
    document.fonts.load(fontString).then(() => { updateCanvas(); }).catch(() => { updateCanvas(); });
    setTimeout(updateCanvas, 100);
};

window.setDirection = function(direction) {
    state.gradDirection = direction;
    updateDirectionUI();
    updateCanvas();
};

window.setPreset = function(type, color1, color2, textColor) {
    state.bgType = type;
    state.colors.text = textColor;
    if (type === 'solid') {
        state.colors.bgMain = color1;
        document.querySelector('input[name="bgMode"][value="solid"]').checked = true;
        if(state.pickrs.bgMain) state.pickrs.bgMain.setColor(color1); 
    } else {
        state.colors.gradStart = color1;
        state.colors.gradEnd = color2;
        document.querySelector('input[name="bgMode"][value="gradient"]').checked = true;
        if(state.pickrs.gradStart) state.pickrs.gradStart.setColor(color1);
        if(state.pickrs.gradEnd) state.pickrs.gradEnd.setColor(color2);
    }
    if(state.pickrs.text) state.pickrs.text.setColor(textColor);
    togglePaletteVisibility();
    updateCanvas();
};

window.clearQuoteTextOnly = function() {
    const quoteInput = document.getElementById('quote');
    quoteInput.value = '';
    state.isWelcomeActive = false;
    quoteInput.classList.remove('text-slate-400');
    updateCanvas();
};

window.toggleDesktopEditorSize = function() {
    const textarea = document.getElementById('quote');
    const icon = document.getElementById('icon-expand');
    state.isEditorExpanded = !state.isEditorExpanded;
    
    if (state.isEditorExpanded) {
        textarea.classList.remove('h-32');
        textarea.classList.add('h-96');
        icon.classList.remove('ph-arrows-vertical');
        icon.classList.add('ph-arrows-in-simple');
    } else {
        textarea.classList.remove('h-96');
        textarea.classList.add('h-32');
        icon.classList.remove('ph-arrows-in-simple');
        icon.classList.add('ph-arrows-vertical');
    }
};

window.deleteBackgroundImage = function() {
    state.bgImage = null;
    state.bgImageName = null;
    document.getElementById('bgImageUpload').value = '';
    document.getElementById('imageControlPanel').classList.add('hidden');
    document.getElementById('overlayOpacity').value = 0;
    document.getElementById('overlayValueText').innerText = "원본";
    updateCanvas();
};
