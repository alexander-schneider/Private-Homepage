// Pitch Deck Drop Zone
const dropZone = document.getElementById('pitch-drop-zone');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
let uploadComplete = false;

// Click to upload
dropZone.addEventListener('click', () => {
    if (!uploadComplete) {
        fileInput.click();
    }
});

// Keyboard support
dropZone.addEventListener('keydown', (e) => {
    if (!uploadComplete && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        fileInput.click();
    }
});

// File input change
fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
});

// Drag and drop events
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (!uploadComplete) {
        dropZone.classList.add('drag-over');
    }
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    if (!uploadComplete) {
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFile(file);
        }
    }
});

async function handleFile(file) {
    // Don't process if already uploaded
    if (uploadComplete) {
        return;
    }
    
    // Validate file type
    const validTypes = ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    if (!validTypes.includes(file.type)) {
        alert('Please upload a PDF, PPT, or PPTX file.');
        return;
    }
    
    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
    }
    
    // Show upload status
    uploadStatus.style.display = 'block';
    statusText.textContent = `Uploading ${file.name}...`;
    dropZone.classList.add('uploading');
    progressBar.style.width = '0%';
    
    // Using Uploadcare for file upload (free tier: 3GB/month)
    const UPLOADCARE_PUBLIC_KEY = '40a891103e90c0934b6f';
    
    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', file);
    
    try {
        // Upload to Uploadcare
        const uploadResponse = await fetch('https://upload.uploadcare.com/base/', {
            method: 'POST',
            body: formData
        });
        
        if (uploadResponse.ok) {
            const data = await uploadResponse.json();
            const fileUrl = `https://ucarecdn.com/${data.file}/`;
            
            // Send notification via Formspree with the file URL
            const notificationData = new FormData();
            notificationData.append('email', 'contact@innos.capital');
            notificationData.append('subject', 'New Pitch Deck Received');
            notificationData.append('message', `
New pitch deck submission:

Filename: ${file.name}
Size: ${(file.size / 1024 / 1024).toFixed(2)}MB
Type: ${file.type}
Date: ${new Date().toLocaleString('de-DE')}

Download link: ${fileUrl}
            `.trim());
            
            await fetch('https://formspree.io/f/xvgrknbd', {
                method: 'POST',
                body: notificationData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            // Success
            progressBar.style.width = '100%';
            dropZone.classList.remove('uploading');
            dropZone.classList.add('success', 'complete');
            uploadComplete = true;
            
            // Update the UI to show thank you message
            const dropContent = dropZone.querySelector('div');
            dropContent.innerHTML = `
                <svg class="drop-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <h3 class="drop-title">Vielen Dank!</h3>
                <p class="drop-subtitle">Ihr Pitch Deck wurde erfolgreich übermittelt.</p>
                <p class="drop-info">Wir melden uns in Kürze bei Ihnen.</p>
            `;
            
            // Remove interactive cursor
            dropZone.style.cursor = 'default';
            
            // Hide upload status after a moment
            setTimeout(() => {
                uploadStatus.style.display = 'none';
            }, 2000);
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        // Error handling
        console.error('Upload error:', error);
        dropZone.classList.remove('uploading');
        statusText.textContent = 'Upload failed. Please try again or email directly.';
        progressBar.style.width = '0%';
        
        setTimeout(() => {
            resetUpload();
        }, 3000);
    }
}

function resetUpload() {
    if (!uploadComplete) {
        dropZone.classList.remove('uploading', 'success');
        uploadStatus.style.display = 'none';
        progressBar.style.width = '0%';
        fileInput.value = '';
    }
}