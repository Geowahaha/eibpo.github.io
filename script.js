// Toggle Navigation Menu for Mobile
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('active');
}

// Open Authentication Modal
function openAuthModal() {
    document.getElementById('auth-modal').style.display = 'block';
}

// Close Authentication Modal
function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

// Close Modal When Clicking Outside
window.onclick = function(event) {
    const modal = document.getElementById('auth-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Update Footer Year
document.getElementById('year').textContent = new Date().getFullYear();

// Handle Authentication
const loginForm = document.getElementById('login-form');
const authStatus = document.getElementById('auth-status');
const adminPanel = document.getElementById('admin-panel');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Successful login
            authStatus.textContent = 'Login successful!';
            authStatus.style.color = 'green';
            closeAuthModal();
            adminPanel.style.display = 'block';
        })
        .catch((error) => {
            // Handle Errors
            authStatus.textContent = error.message;
            authStatus.style.color = 'red';
        });
});

// Monitor Authentication State
auth.onAuthStateChanged((user) => {
    if (user) {
        adminPanel.style.display = 'block';
    } else {
        adminPanel.style.display = 'none';
    }
});

// Handle Content Upload
const uploadForm = document.getElementById('upload-form');
const uploadStatus = document.getElementById('upload-status');

uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const fileInput = document.getElementById('media');
    const textContent = document.getElementById('text-content').value;
    const file = fileInput.files[0];

    if (!file) {
        uploadStatus.textContent = 'Please select a file to upload.';
        uploadStatus.style.color = 'red';
        return;
    }

    const storageRef = storage.ref(`uploads/${Date.now()}_${file.name}`);
    const uploadTask = storageRef.put(file);

    // Create Progress Bar Element
    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');
    progressBar.innerHTML = '<div class="progress-bar-fill"></div>';
    uploadStatus.appendChild(progressBar);

    const progressFill = progressBar.querySelector('.progress-bar-fill');

    uploadTask.on('state_changed',
        (snapshot) => {
            // Update Progress Bar
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = `${progress}%`;
            uploadStatus.textContent = `Upload is ${progress.toFixed(2)}% done`;
            uploadStatus.style.color = 'blue';
        },
        (error) => {
            // Handle unsuccessful uploads
            uploadStatus.textContent = `Upload failed: ${error.message}`;
            uploadStatus.style.color = 'red';
        },
        () => {
            // Handle successful uploads
            uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                // Save to Firestore
                db.collection('uploads').add({
                    url: downloadURL,
                    text: textContent,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    uploadStatus.textContent = 'Upload successful!';
                    uploadStatus.style.color = 'green';
                    uploadForm.reset();
                    progressFill.style.width = '0%';
                })
                .catch((error) => {
                    uploadStatus.textContent = `Error saving to database: ${error.message}`;
                    uploadStatus.style.color = 'red';
                });
            });
        }
    );
});

// Display Uploaded Content
const contentContainer = document.getElementById('content-container');

db.collection('uploads').orderBy('timestamp', 'desc').onSnapshot((snapshot) => {
    contentContainer.innerHTML = ''; // Clear existing content
    snapshot.forEach((doc) => {
        const data = doc.data();
        const contentItem = document.createElement('div');
        contentItem.classList.add('content-item');

        // Determine if the file is an image or video
        const fileType = data.url.split('.').pop().split(/\#|\?/)[0];
        let mediaElement = '';
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileType.toLowerCase())) {
            mediaElement = `<img src="${data.url}" alt="Uploaded Image" />`;
        } else if (['mp4', 'webm', 'ogg'].includes(fileType.toLowerCase())) {
            mediaElement = `<video controls src="${data.url}"></video>`;
        } else {
            mediaElement = `<a href="${data.url}" target="_blank" rel="noopener noreferrer">View File</a>`;
        }

        const textElement = `<p>${data.text}</p>`;
        contentItem.innerHTML = `${mediaElement}${textElement}`;
        contentContainer.appendChild(contentItem);
    });
});

// Implement Logout Functionality
function logoutAdmin() {
    auth.signOut().then(() => {
        adminPanel.style.display = 'none';
        // Optionally, display a logout confirmation
    }).catch((error) => {
        console.error('Error signing out:', error);
    });
}

// Accessibility: Allow Enter key to toggle menu
document.querySelector('.menu-icon').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
    }
});

// Accessibility: Allow Enter key to activate video features
const videoFeatures = document.querySelectorAll('.video-feature');
videoFeatures.forEach(feature => {
    feature.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const videoSrc = this.getAttribute('data-video');
            document.getElementById('main-video').src = videoSrc;
            // Update active class
            videoFeatures.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
        }
    });
});
