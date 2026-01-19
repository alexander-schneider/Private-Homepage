// Pitch Deck Drop Zone
const dropZone = document.getElementById('pitch-drop-zone');
const fileInput = document.getElementById('file-input');
const uploadStatus = document.getElementById('upload-status');
const statusText = document.getElementById('status-text');
const progressBar = document.getElementById('progress-bar');
let uploadComplete = false;

const VALID_FILE_TYPES = [
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOADCARE_PUBLIC_KEY = '40a891103e90c0934b6f';

function triggerFileSelect() {
    if (!uploadComplete) {
        fileInput.click();
    }
}

dropZone.addEventListener('click', triggerFileSelect);

dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerFileSelect();
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleFile(e.target.files[0]);
    }
});

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
    if (!uploadComplete && e.dataTransfer.files[0]) {
        handleFile(e.dataTransfer.files[0]);
    }
});

async function handleFile(file) {
    if (uploadComplete) {
        return;
    }

    if (!VALID_FILE_TYPES.includes(file.type)) {
        alert('Please upload a PDF, PPT, or PPTX file.');
        return;
    }

    if (file.size > MAX_FILE_SIZE) {
        alert('File size must be less than 10MB.');
        return;
    }

    showUploadProgress(file.name);

    const formData = new FormData();
    formData.append('UPLOADCARE_PUB_KEY', UPLOADCARE_PUBLIC_KEY);
    formData.append('UPLOADCARE_STORE', '1');
    formData.append('file', file);

    try {
        const uploadResponse = await fetch('https://upload.uploadcare.com/base/', {
            method: 'POST',
            body: formData
        });

        if (!uploadResponse.ok) {
            throw new Error('Upload failed');
        }

        const data = await uploadResponse.json();
        const fileUrl = `https://ucarecdn.com/${data.file}/`;

        await sendNotification(file, fileUrl);
        showUploadSuccess();
    } catch (error) {
        console.error('Upload error:', error);
        showUploadError();
    }
}

function showUploadProgress(filename) {
    uploadStatus.style.display = 'block';
    statusText.textContent = `Uploading ${filename}...`;
    dropZone.classList.add('uploading');
    progressBar.style.width = '0%';
}

function formatFileSize(bytes) {
    return (bytes / 1024 / 1024).toFixed(2);
}

async function sendNotification(file, fileUrl) {
    const notificationData = new FormData();
    notificationData.append('email', 'contact@innos.capital');
    notificationData.append('subject', 'New Pitch Deck Received');
    notificationData.append('message', [
        'New pitch deck submission:',
        '',
        `Filename: ${file.name}`,
        `Size: ${formatFileSize(file.size)}MB`,
        `Type: ${file.type}`,
        `Date: ${new Date().toLocaleString('de-DE')}`,
        '',
        `Download link: ${fileUrl}`
    ].join('\n'));

    await fetch('https://formspree.io/f/xvgrknbd', {
        method: 'POST',
        body: notificationData,
        headers: { 'Accept': 'application/json' }
    });
}

function showUploadSuccess() {
    progressBar.style.width = '100%';
    dropZone.classList.remove('uploading');
    dropZone.classList.add('success', 'complete');
    uploadComplete = true;

    const dropContent = dropZone.querySelector('div');
    dropContent.innerHTML = `
        <svg class="drop-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3 class="drop-title">Vielen Dank!</h3>
        <p class="drop-subtitle">Ihr Pitch Deck wurde erfolgreich übermittelt.</p>
        <p class="drop-info">Wir melden uns in Kürze bei Ihnen.</p>
    `;

    dropZone.style.cursor = 'default';
    setTimeout(() => { uploadStatus.style.display = 'none'; }, 2000);
}

function showUploadError() {
    dropZone.classList.remove('uploading');
    statusText.textContent = 'Upload failed. Please try again or email directly.';
    progressBar.style.width = '0%';
    setTimeout(resetUpload, 3000);
}

function resetUpload() {
    if (!uploadComplete) {
        dropZone.classList.remove('uploading', 'success');
        uploadStatus.style.display = 'none';
        progressBar.style.width = '0%';
        fileInput.value = '';
    }
}