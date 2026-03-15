// --- 1. State Management & Constants ---

const WELCOME_MESSAGE = `⚡️ 251223 업데이트 완료! (v1.4.3)

[오류수정] 이미지 오버레이 적용 후 재 접속 시, 이미지가 없어도 오버레이가 적용되던 현상을 수정했습니다.

[시즌인사] 새해 복 많이 받으세요.

  💡내용 입력 창을 누르면 이 메세지는 퐁!
`;

const state = {
    canvas: null,
    ctx: null,
    bgImage: null,
    bgImageName: null,
    logoImages: {}, // Preloaded logos
    platform: '',
    isDarkMode: localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches),
    // Colors managed by state now (synced with Pickr)
    bgType: 'gradient', // Default to Gradient
    gradDirection: 'to bottom right',
    canvasRatio: '1:1',
    fontFamily: 'Noto Serif KR',
    indentation: false, // New Indentation State
    isCurlyQuotes: false, // New Quote Style State
    isEditorExpanded: false, // Desktop Editor Expansion State
    isWelcomeActive: true, // Track if welcome message is being shown
    colors: {
        text: '#ffffff', // Default Text Color White for Neon Sunset
        bgMain: '#E6E6FA', // Default Solid Color: Lavender
        gradStart: '#ec4447', // New Default Gradient Start (Neon Sunset)
        gradEnd: '#8c5af2',   // New Default Gradient End (Neon Sunset)
    },
    pickrs: {}
};

const LOGO_URLS = {
    bloom: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/bloom.jpg',
    carat: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/carat.png',
    caveDuck: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/Caveduck.jpg',  
    dokiChat: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/dokichat.jpg',
    inkChat: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/inkchat.jpg',
    zeta: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/zeta.jpg',
    luvDuv: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/LoveyDovey.jpg',
    melting: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/melting.jpg',
    pulse: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/pulse.jpg',
    ropanAI: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/rofan.png',
    crack: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/crack.png',
    whif: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/whif.jpg',
    chemi: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/chemi.png',
    Fizzchat: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/Fizzchat.png',
    reppley: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/reppley.jpg',
    rplay: 'https://raw.githubusercontent.com/yuliyulidaz/yulilog/refs/heads/logos/rplay.png'
};

// --- 2. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSettings(); // Load persisted settings
    initCanvas();
    initColorPickers();
    loadLogos();
    bindEvents();
    
    // Set default styling in UI
    updateRatioUI();
    updateFontUI();
    updateDirectionUI();
    togglePaletteVisibility(); // Ensure correct palette shows based on loaded type
    
    // Set Welcome Message
    const quoteInput = document.getElementById('quote');
    quoteInput.value = WELCOME_MESSAGE;
    quoteInput.classList.add('text-slate-400'); // Faded text style

    // Mobile Check to hide Copy buttons (iOS and Android)
    const isMobile = /Android|iPad|iPhone|iPod/i.test(navigator.userAgent);
    if (isMobile) {
        document.querySelectorAll('.copy-btn').forEach(el => el.style.display = 'none');
        const divider = document.getElementById('desktop-action-divider');
        if(divider) divider.style.display = 'none';
    }

    // Init Mobile Steppers (Long Press + Direct Input)
    setupMobileSteppers();

    // Font Loading Fix
    document.fonts.ready.then(() => {
        updateCanvas();
    });
    setTimeout(updateCanvas, 500);

    // FIX: Ensure canvas is resized to match restored settings (e.g. 4:5)
    resizeCanvas();
    
    updateCanvas(); // Initial draw
});

// --- NEW: Persistence Logic ---
function saveSettings() {
    // Collect settings to save (excluding content)
    const settings = {
        bgType: state.bgType,
        gradDirection: state.gradDirection,
        canvasRatio: state.canvasRatio,
        fontFamily: state.fontFamily,
        indentation: state.indentation,
        colors: state.colors,
        platform: state.platform,
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
    saveTimeout = setTimeout(saveSettings, 1000); // Save after 1 second of inactivity
}

function loadSettings() {
    const saved = localStorage.getItem('geminiNexusSettings');
    if (saved) {
        try {
            const settings = JSON.parse(saved);
            // Restore State
            if (settings.bgType) state.bgType = settings.bgType;
            if (settings.gradDirection) state.gradDirection = settings.gradDirection;
            if (settings.canvasRatio) state.canvasRatio = settings.canvasRatio;
            if (settings.fontFamily) state.fontFamily = settings.fontFamily;
            if (settings.indentation !== undefined) state.indentation = settings.indentation;
            if (settings.colors) state.colors = { ...state.colors, ...settings.colors };
            if (settings.platform) state.platform = settings.platform;

            // Restore UI Elements (Styles)
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

            // Restore BG Mode Radio
            const bgRb = document.querySelector(`input[name="bgMode"][value="${state.bgType}"]`);
            if(bgRb) bgRb.checked = true;

            // Restore Platform Select
            const platSel = document.getElementById('platformSelect');
            if(platSel) platSel.value = state.platform;

            // Restore Indentation UI
            updateIndentationUI();

            // Update Labels
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

        } catch (e) {
            console.error("Failed to load settings", e);
        }
    }
}

// --- NEW: Mobile Stepper Logic with Long Press & Direct Input ---
function setupMobileSteppers() {
    // Configuration for each control
    const controls = [
        { key: 'fontSize', step: 1, min: 30, max: 80 },
        { key: 'lineHeight', step: 0.1, min: 1.2, max: 2.0 },
        { key: 'paraSpacing', step: 5, min: 0, max: 100 },
        { key: 'padding', step: 10, min: 50, max: 200 }
    ];

    controls.forEach(ctrl => {
        attachStepperEvents(ctrl.key, ctrl.step, ctrl.min, ctrl.max);
    });
}

function attachStepperEvents(key, step, min, max) {
    const minusBtn = document.getElementById(`btn-minus-${key}`);
    const plusBtn = document.getElementById(`btn-plus-${key}`);
    const inputMobile = document.getElementById(`input-mobile-${key}`);
    const sliderDesktop = document.getElementById(key); // The hidden slider is the source of truth

    // Sync: Desktop Slider -> Mobile Input
    sliderDesktop.addEventListener('input', (e) => {
        inputMobile.value = e.target.value;
    });
    
    // Init value
    inputMobile.value = sliderDesktop.value;

    // Sync: Mobile Input Direct Change -> Desktop Slider
    inputMobile.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value);
        if (isNaN(val)) val = parseFloat(sliderDesktop.value);
        if (val < min) val = min;
        if (val > max) val = max;
        
        // Update Desktop Slider
        sliderDesktop.value = val;
        inputMobile.value = val; // Reflect corrected value
        
        // Trigger canvas update via slider event
        sliderDesktop.dispatchEvent(new Event('input'));
    });

    // Long Press Logic Variables
    let pressTimer = null;
    let pressInterval = null;
    let pressSpeed = 200; // Start speed
    let pressCount = 0;

    const updateValue = (delta) => {
        let current = parseFloat(sliderDesktop.value);
        let next = current + delta;
        
        // Round for float precision
        if (step < 1) next = Math.round(next * 10) / 10;
        
        if (next >= min && next <= max) {
            sliderDesktop.value = next;
            inputMobile.value = next;
            sliderDesktop.dispatchEvent(new Event('input'));
        }
    };

    const startPress = (btn, delta) => {
        // Visual Feedback
        btn.classList.add('btn-pressing');
        
        // Tip Animation Trigger
        const tipContainer = document.getElementById('mobile-tip-container');
        if (tipContainer) {
            tipContainer.classList.remove('animate-tip');
            void tipContainer.offsetWidth; // Trigger reflow
            tipContainer.classList.add('animate-tip');
            tipContainer.classList.remove('opacity-70');
            tipContainer.classList.add('opacity-100');
        }

        // Immediate update
        updateValue(delta);

        // Reset speed logic
        pressSpeed = 200; 
        pressCount = 0;

        // Delay before rapid fire
        pressTimer = setTimeout(() => {
            pressInterval = setInterval(() => {
                updateValue(delta);
                pressCount++;
                
                // Acceleration: Every 5 steps, speed up until max speed
                if (pressCount % 5 === 0 && pressSpeed > 50) {
                    clearInterval(pressInterval);
                    pressSpeed = Math.max(50, pressSpeed - 30);
                    pressInterval = setInterval(() => {
                        updateValue(delta);
                        pressCount++;
                    }, pressSpeed);
                }
            }, pressSpeed);
        }, 400); // 400ms delay before auto-repeat
    };

    const stopPress = (btn) => {
        btn.classList.remove('btn-pressing');
        clearTimeout(pressTimer);
        clearInterval(pressInterval);
        pressTimer = null;
        pressInterval = null;
        
        // Reset Tip Opacity
        const tipContainer = document.getElementById('mobile-tip-container');
        if(tipContainer) {
            tipContainer.classList.remove('opacity-100');
            tipContainer.classList.add('opacity-70');
        }
    };

    // Bind Events (Touch + Mouse)
    const bindBtn = (btn, delta) => {
        // Touch
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent ghost click
            startPress(btn, delta);
        });
        btn.addEventListener('touchend', () => stopPress(btn));
        btn.addEventListener('touchcancel', () => stopPress(btn));

        // Mouse
        btn.addEventListener('mousedown', (e) => {
            startPress(btn, delta);
        });
        btn.addEventListener('mouseup', () => stopPress(btn));
        btn.addEventListener('mouseleave', () => stopPress(btn));
    };

    bindBtn(minusBtn, -step);
    bindBtn(plusBtn, step);
}

// --- Existing Functions ---

function initTheme() {
    if (state.isDarkMode) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
}

function toggleDarkMode() {
    state.isDarkMode = !state.isDarkMode;
    localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light');
    initTheme();
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
                preview: true,
                opacity: true,
                hue: true,
                interaction: {
                    hex: true,
                    input: true,
                    save: true,
                    cancel: true // 취소 버튼
                }
            },
            i18n: {
                'btn:save': '확인',
                'btn:cancel': '취소',
                'btn:clear': '지우기'
            }
        });

        pickr.on('show', (color, instance) => { initialColor = state.colors[key]; });
        pickr.on('change', (color, source, instance) => {
            const hex = color.toHEXA().toString();
            state.colors[key] = hex;
            updateCanvas();     
        });
        pickr.on('save', (color, instance) => {
            const hex = color.toHEXA().toString();
            state.colors[key] = hex;
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
            const hex = color.toHEXA().toString();
            state.colors[key] = hex;
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

// --- 3. Event Binding ---
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

    // Desktop Sliders Events
    ['fontSize', 'lineHeight', 'paraSpacing', 'padding', 'logoSize', 'overlayOpacity', 'bgImageScale'].forEach(id => {
        const el = document.getElementById(id);
        el.addEventListener('input', (e) => {
            // Update Text Labels
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

// --- Logic Functions ---

function setRatio(ratio) {
    state.canvasRatio = ratio;
    updateRatioUI();
    resizeCanvas();
    updateCanvas();
}

function updateRatioUI() {
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.classList.remove('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
    });
    const idMap = { '1:1': 'btn-ratio-1-1', '4:5': 'btn-ratio-4-5', '16:9': 'btn-ratio-16-9' };
    const activeBtn = document.getElementById(idMap[state.canvasRatio]);
    if(activeBtn) {
        activeBtn.classList.add('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
    }
}

function setFont(fontName) {
    state.fontFamily = fontName;
    updateFontUI();
    let fontWeight = '400';
    if (fontName === 'Noto Serif KR' || fontName === 'KoPub Batang') fontWeight = '300';
    else if (fontName === 'Noto Sans KR' || fontName === 'Pretendard') fontWeight = '200';
    const fontString = `${fontWeight} 40px '${fontName}'`;
    document.fonts.load(fontString).then(() => { updateCanvas(); }).catch(() => { updateCanvas(); });
    setTimeout(updateCanvas, 100);
}

function updateFontUI() {
    document.querySelectorAll('.font-btn').forEach(btn => {
        if(btn.dataset.font === state.fontFamily) {
            btn.classList.add('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
        } else {
            btn.classList.remove('bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400', 'ring-1', 'ring-brand-500', 'dark:ring-slate-500');
        }
    });
}

function setDirection(direction) {
    state.gradDirection = direction;
    updateDirectionUI();
    updateCanvas();
}

function updateDirectionUI() {
    document.querySelectorAll('.dir-btn').forEach(btn => {
        if(btn.dataset.dir === state.gradDirection) {
            btn.classList.add('active-dir', 'bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400');
        } else {
            btn.classList.remove('active-dir', 'bg-brand-50', 'dark:bg-slate-800', 'border-brand-500', 'dark:border-slate-500', 'text-brand-600', 'dark:text-brand-400');
        }
    });
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

function deleteBackgroundImage() {
    state.bgImage = null;
    state.bgImageName = null;
    document.getElementById('bgImageUpload').value = '';
    document.getElementById('imageControlPanel').classList.add('hidden');
    document.getElementById('overlayOpacity').value = 0;
    document.getElementById('overlayValueText').innerText = "원본";
    updateCanvas();
}

function clearQuoteTextOnly() {
    const quoteInput = document.getElementById('quote');
    quoteInput.value = '';
    state.isWelcomeActive = false;
    quoteInput.classList.remove('text-slate-400');
    updateCanvas();
}

// New Indentation Toggle Function
function toggleIndentation() {
    state.indentation = !state.indentation;
    updateIndentationUI();
    updateCanvas();
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

// --- NEW: Smart Quote Toggle Function ---
function toggleQuoteStyle() {
    const textarea = document.getElementById('quote');
    let text = textarea.value;
    const btn = document.getElementById('btn-quote-toggle');
    const btnText = document.getElementById('text-quote-toggle');

    if (!state.isCurlyQuotes) {
        // Convert Straight to Curly
        // " at start or after space/bracket -> “
        text = text.replace(/(^|[\s\(\[\{])"/g, "$1“");
        // Remaining " -> ”
        text = text.replace(/"/g, "”");
        
        // ' at start or after space/bracket -> ‘
        text = text.replace(/(^|[\s\(\[\{])'/g, "$1‘");
        // Remaining ' -> ’
        text = text.replace(/'/g, "’");
        
        state.isCurlyQuotes = true;
        btnText.innerText = "직선 따옴표 자동 변환";
        btn.classList.add('text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/30');
        btn.classList.remove('text-slate-400', 'bg-slate-50');
    } else {
        // Convert Curly to Straight
        text = text.replace(/[“”]/g, '"');
        text = text.replace(/[‘’]/g, "'");
        
        state.isCurlyQuotes = false;
        btnText.innerText = "둥근 따옴표 자동 변환";
        btn.classList.remove('text-brand-600', 'bg-brand-50', 'dark:bg-brand-900/30');
        btn.classList.add('text-slate-400', 'bg-slate-50');
    }
    
    textarea.value = text;
    updateCanvas();
}

// Desktop Editor Expand Toggle
function toggleDesktopEditorSize() {
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
}

function setPreset(type, color1, color2, textColor) {
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
}

// --- NEW: Mobile Editor Logic ---
function openMobileEditor() {
    const modal = document.getElementById('mobile-editor-modal');
    const mainQuote = document.getElementById('quote');
    const mainAuthor = document.getElementById('author');
    const mainTitle = document.getElementById('title');
    
    const mobileQuote = document.getElementById('mobile-quote-input');
    const mobileAuthor = document.getElementById('mobile-author-input');
    const mobileTitle = document.getElementById('mobile-title-input');

    // Sync values from main to mobile
    mobileQuote.value = mainQuote.value;
    mobileAuthor.value = mainAuthor.value;
    mobileTitle.value = mainTitle.value;

    // Show Modal
    modal.classList.remove('hidden-modal');
    modal.classList.add('visible-modal');

    // Handle Welcome Active State removal if opening editor
    if (state.isWelcomeActive) {
        state.isWelcomeActive = false;
        mobileQuote.value = ''; // Clear welcome text for fresh input
        mainQuote.classList.remove('text-slate-400');
    }
}

function closeMobileEditor() {
    const modal = document.getElementById('mobile-editor-modal');
    const mainQuote = document.getElementById('quote');
    const mainAuthor = document.getElementById('author');
    const mainTitle = document.getElementById('title');
    
    const mobileQuote = document.getElementById('mobile-quote-input');
    const mobileAuthor = document.getElementById('mobile-author-input');
    const mobileTitle = document.getElementById('mobile-title-input');

    // Sync values from mobile to main
    mainQuote.value = mobileQuote.value;
    mainAuthor.value = mobileAuthor.value;
    mainTitle.value = mobileTitle.value;

    // Hide Modal
    modal.classList.remove('visible-modal');
    modal.classList.add('hidden-modal');

    // Trigger Update
    updateCanvas();
}

// --- 5. Drawing Core ---
function updateCanvas() {
    debouncedSaveSettings(); // Trigger save logic on update
    if (!state.ctx) return;
    const ctx = state.ctx;
    const width = state.canvas.width;
    const height = state.canvas.height;
    ctx.clearRect(0, 0, width, height);
    drawBackground(ctx, width, height);
    drawContent(ctx, width, height);
}

function normalizeColor(color) {
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

function drawBackground(ctx, width, height) {
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
        drawImage(ctx, width, height);

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

function drawImage(ctx, width, height) {
    const img = state.bgImage;
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

function drawContent(ctx, width, height) {
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
    
    // Indentation Logic: Use fontSize if active, else 0
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
        // Footer Alignment Logic: Follow alignment unless Justify, then Left
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

    const logoImg = platform ? state.logoImages[platform] : null;
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
        
        // Effective width for the first line is reduced by indentation
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
                    isParaStart = false; // Next lines are not start of paragraph
                    currentMaxWidth = maxWidth; // Reset width for subsequent lines
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

async function downloadImage() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && navigator.share) {
            state.canvas.toBlob(async (blob) => {
            const file = new File([blob], "lumina_quote.png", { type: "image/png" });
            try { await navigator.share({ files: [file], }); } catch (err) { console.log("Share failed or canceled", err); }
        });
    } else {
        const link = document.createElement('a');
        link.download = `lumina_quote_${Date.now()}.png`;
        link.href = state.canvas.toDataURL('image/png');
        link.click();
    }
}

function copyImage() {
    state.canvas.toBlob(blob => {
        const item = new ClipboardItem({ "image/png": blob });
        navigator.clipboard.write([item]).then(() => { alert('클립보드에 복사되었습니다!'); })
        .catch(err => { console.error('복사 실패:', err); alert('복사에 실패했습니다.'); });
    });
}
