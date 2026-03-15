export function initCustomLogo(state, updateCanvasCb) {
    if (window._logoHandlerReady) return;
    // 1. DOM Elements
    const logoModeRadios = document.querySelectorAll('input[name="logoMode"]');
    const platformSelectPanel = document.getElementById('platformSelectPanel');
    const customLogoPanel = document.getElementById('customLogoPanel');
    
    // Custom Logo Elements
    const customLogoUpload = document.getElementById('customLogoUpload');
    const customLogoControlPanel = document.getElementById('customLogoControlPanel');
    const btnCustomLogoDelete = document.getElementById('btnCustomLogoDelete');
    
    // Thumbnail & Preview Elements
    const customLogoPreviewWrapper = document.getElementById('customLogoPreviewWrapper');
    const customLogoPreviewImg = document.getElementById('customLogoPreviewImg');

    // Crop Modal Elements
    const cropModal = document.getElementById('crop-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const btnCancelCrop = document.getElementById('btn-cancel-crop');
    const btnApplyCrop = document.getElementById('btn-apply-crop');

    let cropper = null;

    // 2. Logic to Switch Logo Modes
    logoModeRadios.forEach(radio => {
        radio.addEventListener('change', handleRadioChange);
    });

    function handleRadioChange(e) {
        if (state.logoMode !== e.target.value) {
            state.logoMode = e.target.value;
            toggleLogoPanels();
            updateCanvasCb();
        }
    }

    function toggleLogoPanels() {
        if (state.logoMode === 'platform') {
            platformSelectPanel.classList.remove('hidden');
            customLogoPanel.classList.add('hidden');
        } else {
            platformSelectPanel.classList.add('hidden');
            customLogoPanel.classList.remove('hidden');
        }
    }

    // Initialize UI based on state
    toggleLogoPanels();
    const activeRadio = document.querySelector(`input[name="logoMode"][value="${state.logoMode}"]`);
    if(activeRadio) activeRadio.checked = true;
    
    // Custom Logo Initialization (If exists from loadSettings)
    if (state.customLogoDataUrl) {
        setThumbnail(state.customLogoDataUrl);
    }

    // 3. Upload & Cropper Logic
    customLogoUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            // Open Modal & Initialize Cropper
            imageToCrop.src = event.target.result;
            cropModal.style.display = 'flex';
            
            // Destroy existing cropper if any
            if (cropper) {
                cropper.destroy();
            }

            // Initialize new cropper after img src is set and visible
            setTimeout(() => {
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1 / 1,
                    viewMode: 1, // Restrict crop box to not exceed canvas
                    dragMode: 'move', // Allow moving the image itself
                    guides: false,
                    center: true,
                    background: false,
                    autoCropArea: 0.8,
                });
            }, 100); 

            // Reset input so the same file can be selected again
            customLogoUpload.value = '';
        };
        reader.readAsDataURL(file);
    });

    // 4. Crop Apply
    btnApplyCrop.addEventListener('click', () => {
        if (!cropper) return;

        // Get cropped canvas
        const canvas = cropper.getCroppedCanvas({
            width: 200, // Resize to 200x200 max to save space
            height: 200,
            fillColor: 'transparent',
            imageSmoothingEnabled: true,
            imageSmoothingQuality: 'high',
        });

        // Convert to Data URL (PNG for transparency)
        const croppedDataUrl = canvas.toDataURL('image/png', 0.9);
        
        // Update State
        state.customLogoDataUrl = croppedDataUrl;
        state.customLogoImage = new Image();
        state.customLogoImage.onload = () => {
             // Only update UI and Canvas after image is loaded
             setThumbnail(croppedDataUrl);
             cropModal.style.display = 'none';
             cropper.destroy();
             cropper = null;
             updateCanvasCb();
        };
        state.customLogoImage.src = croppedDataUrl;
    });

    // 5. Crop Cancel
    btnCancelCrop.addEventListener('click', () => {
        cropModal.style.display = 'none';
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    });

    // 6. Delete Custom Logo
    btnCustomLogoDelete.addEventListener('click', () => {
        state.customLogoDataUrl = '';
        state.customLogoImage = null;
        
        // Reset UI
        customLogoControlPanel.style.display = 'none';
        customLogoPreviewWrapper.style.display = 'none';
        customLogoPreviewImg.src = '';
        
        updateCanvasCb();
    });

    // Helper: Set Thumbnail
    function setThumbnail(dataUrl) {
        customLogoPreviewImg.src = dataUrl;
        customLogoControlPanel.style.display = 'flex';
        customLogoPreviewWrapper.style.display = 'flex';
    }
}
