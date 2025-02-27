document.addEventListener('DOMContentLoaded', () => {
    const galleryCards = document.querySelectorAll('.gallery-card');
    const header = document.querySelector('header');
    const hero = document.querySelector('#hero');
    const footer = document.querySelector('footer');
    const spinningCircle = document.querySelector('.spinning-circle');
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    let currentPlaying = null;
    let overlayTimeout = null;
    let lastScrollY = window.scrollY;
    let rotation = 0;
    let velocity = 0;
    let isAnimating = false;
    const videoStates = new Map(); // Store video states (time position, etc.)

    console.log("Gallery cards found:", galleryCards.length);
    console.log("Is mobile:", isMobile);

    // ---------- VIDEO HANDLING FUNCTIONS ----------

    // Load the first frame of all videos for previews
    function preloadVideoFrames() {
        galleryCards.forEach(card => {
            const video = card.querySelector('video');
            if (!video) return;

            // Apply classes and attributes for better playback
            video.classList.add('video-preview');
            video.preload = "auto";
            video.muted = true;
            video.setAttribute('playsinline', '');

            // Force immediate loading
            video.load();

            // Function to safely load the first frame
            const loadFirstFrame = () => {
                try {
                    // Set time to slightly after start to avoid black frame
                    video.currentTime = 0.01;
                    video.pause();
                    video.classList.add('ready');

                    // Ensure video is visible once loaded
                    video.style.opacity = "1";
                    video.style.visibility = "visible";

                    console.log("Preview loaded for:", video.src);
                } catch (e) {
                    console.warn("Error setting video time:", e);
                }
            };

            // Try to load frame using multiple events
            video.addEventListener('loadeddata', loadFirstFrame, { once: true });
            video.addEventListener('loadedmetadata', loadFirstFrame, { once: true });
            video.addEventListener('canplay', loadFirstFrame, { once: true });

            // Fallback attempts
            setTimeout(loadFirstFrame, 100);
            setTimeout(loadFirstFrame, 500);
        });
    }

    // Play video with error handling
    function playVideo(video) {
        if (!video) return false;

        try {
            // Use Promise to handle autoplay restrictions
            const playPromise = video.play();

            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log("Video playing:", video.src);
                    currentPlaying = video;
                    video.classList.remove('paused');
                }).catch(error => {
                    console.warn("Play promise error:", error);
                    video.pause();
                });
            }
            return true;
        } catch (e) {
            console.error("Error playing video:", e);
            return false;
        }
    }

    // Pause video with error handling
    function pauseVideo(video) {
        if (!video) return;

        try {
            video.pause();
            video.classList.add('paused');

            // Save current time for resuming later
            if (videoStates.has(video)) {
                videoStates.get(video).lastTime = video.currentTime;
            }
        } catch (e) {
            console.error("Error pausing video:", e);
        }
    }

    // Hide overlay with delay
    function hideOverlay(card, delay = 0) {
        if (!card) return;

        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;

        clearTimeout(overlayTimeout);
        if (delay > 0) {
            overlayTimeout = setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.opacity = '0';
                console.log("Overlay hidden after 2s for:", card.textContent || "unknown");
            }, delay);
        } else {
            overlay.classList.add('hidden');
            overlay.style.opacity = '0';
        }
    }

    // Show overlay
    function showOverlay(card) {
        if (!card) return;

        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;

        clearTimeout(overlayTimeout);
        overlay.classList.remove('hidden');
        overlay.style.opacity = '1';
        console.log("Overlay shown for card");
    }

    // Check if element is centered in viewport (for mobile)
    function isElementCentered(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // Element center point
        const elementCenter = rect.top + (rect.height / 2);
        // Viewport center point
        const viewportCenter = windowHeight / 2;
        // How far element is from center
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
        // Element is considered "centered" if within 30% of viewport center
        const threshold = windowHeight * 0.3;

        // Also check element is actually visible
        const isVisible = (
            rect.bottom > 0 &&
            rect.top < windowHeight
        );

        return isVisible && (distanceFromCenter < threshold);
    }

    // Handle video playback (main function)
    function handleVideoPlayback(card, shouldPlay) {
        if (!card) return;

        const video = card.querySelector('video');
        if (!video) {
            console.log("No video found in card:", card);
            return;
        }

        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) {
            console.log("No overlay found in card:", card);
            return;
        }

        // If this is a video we want to play
        if (shouldPlay) {
            // Check if we're playing a different video already
            if (currentPlaying && currentPlaying !== video) {
                const previousCard = currentPlaying.closest('.gallery-card');
                pauseVideo(currentPlaying);
                showOverlay(previousCard);
                previousCard.classList.remove('playing');
            }

            // Now play the new video
            playVideo(video);
            card.classList.add('playing');
            currentPlaying = video;

            // Hide overlay text (with delay on mobile)
            const delay = isMobile ? 1500 : 0;
            hideOverlay(card, delay);
            console.log("Hiding overlay for playing video");
        } else {
            // If we should stop this video

            // Save current time then pause
            pauseVideo(video);

            // Show overlay immediately
            showOverlay(card);
            card.classList.remove('playing');
            console.log("Showing overlay for paused video");

            // If this was the current video, clear that reference
            if (currentPlaying === video) {
                currentPlaying = null;
            }
        }
    }

    // ---------- INITIALIZATION & EVENTS ----------

    // Initialize video previews
    preloadVideoFrames();

    // Desktop hover behavior
    if (!isMobile) {
        galleryCards.forEach(card => {
            // Mouse enter - play video
            card.addEventListener('mouseenter', () => {
                handleVideoPlayback(card, true);
            });

            // Mouse leave - pause video and restore overlay
            card.addEventListener('mouseleave', () => {
                handleVideoPlayback(card, false);
            });
        });
    }

    // Mobile scroll behavior
    if (isMobile) {
        let isScrolling = false;
        let scrollTimeout;

        // Throttled scroll handler
        const handleScroll = () => {
            isScrolling = true;

            // Refresh playing status based on viewport position
            galleryCards.forEach(card => {
                const isCentered = isElementCentered(card);

                if (isCentered && !card.classList.contains('playing')) {
                    // Start playing this video
                    handleVideoPlayback(card, true);
                } else if (!isCentered && card.classList.contains('playing')) {
                    // Stop this video if it's playing but not centered
                    handleVideoPlayback(card, false);
                }
            });

            // Clear previous timeout
            clearTimeout(scrollTimeout);

            // Set new timeout
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 100);
        };

        // Listen for scroll events with throttling
        let lastScrollTime = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 100) { // Throttle to max 10 times per second
                lastScrollTime = now;
                handleScroll();
            }
        });
    }

    // ---------- HEADER SHRINKING & SPINNING CIRCLE ----------

    // Handle header shrinking on scroll
    function handleHeaderShrink() {
        const currentScroll = window.scrollY;

        // If we've scrolled down 100px or more, shrink the header
        if (currentScroll > 100) {
            header.classList.add('shrunk');
        } else {
            header.classList.remove('shrunk');
        }

        // Calculate velocity for spinning circle rotation
        if (spinningCircle) {
            velocity = (currentScroll - lastScrollY) * 0.2;
            rotation += velocity;

            // Animate the spinning circle
            if (!isAnimating) {
                animateSpinningCircle();
            }
        }

        lastScrollY = currentScroll;
    }

    function animateSpinningCircle() {
        isAnimating = true;

        // Apply rotation to spinning circle group
        const spinningGroup = document.querySelector('.spinning-group');
        if (spinningGroup) {
            spinningGroup.style.transform = `rotate(${rotation}deg)`;
        }

        // Continuous animation when there's velocity
        // Otherwise stop after velocity becomes small
        if (Math.abs(velocity) > 0.1) {
            velocity *= 0.95; // Dampen velocity
            rotation += velocity;
            requestAnimationFrame(animateSpinningCircle);
        } else {
            isAnimating = false;
        }
    }

    // Add scroll event listener for header and spinning circle
    window.addEventListener('scroll', handleHeaderShrink);

    // Handle project page video autoplay if it exists
    const projectVideo = document.getElementById('projectVideo');
    if (projectVideo) {
        projectVideo.play().catch(error => {
            console.warn("Autoplay failed:", error);

            // Show play button if autoplay fails
            const playButton = document.getElementById('playButton');
            if (playButton) {
                playButton.style.display = 'block';
                playButton.addEventListener('click', () => {
                    projectVideo.play();
                    playButton.style.display = 'none';
                });
            }
        });
    }
});