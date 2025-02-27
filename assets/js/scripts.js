
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
    const playedVideos = new Set();
    
    console.log("Gallery cards found:", galleryCards.length);
    console.log("Is mobile:", isMobile);
    
    // Aggressive video preloading for better previews, especially on desktop
    galleryCards.forEach(card => {
        const video = card.querySelector('video');
        if (video) {
            // Apply a CSS class to prevent black flash before play
            video.classList.add('video-preview');
            
            // Force full preload for all devices
            video.preload = "auto";
            video.muted = true; // Ensure autoplay works
            
            // Force preload immediately
            video.load();
            
            // More aggressive frame loading
            const attemptToShowFrame = () => {
                // Ensure we start at the very beginning
                video.currentTime = 0.01; // Slightly after start to avoid black frame
                video.pause();
                video.classList.add('ready');
                // Make thumbnail visible
                video.style.visibility = 'visible';
                console.log("Frame loaded for video:", video.src);
            };
            
            // Try multiple events to catch the first available frame
            video.addEventListener('loadeddata', attemptToShowFrame, { once: true });
            video.addEventListener('loadedmetadata', attemptToShowFrame, { once: true });
            video.addEventListener('canplay', attemptToShowFrame, { once: true });
            
            // Additional attempts if events don't fire - more frequent for mobile
            setTimeout(attemptToShowFrame, 100);
            setTimeout(attemptToShowFrame, 300);
            setTimeout(attemptToShowFrame, 500);
            setTimeout(attemptToShowFrame, 1000);
        }
    });

    // Handle header visibility on scroll
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        // Header shrink/show logic
        if (currentScrollY > 100) {
            header.classList.add('shrunk');
        } else {
            header.classList.remove('shrunk');
        }
        
        // Update last scroll position
        lastScrollY = currentScrollY;
    });

    // Handle video playback with optimizations
    function handleVideoPlayback(card, shouldPlay) {
        const video = card.querySelector('video');
        if (!video) {
            console.log("No video found in card:", card);
            return;
        }
        
        console.log("Video found in card:", video.src);
        
        // Prevent constant start/stop cycles
        if (shouldPlay && (video.paused || video.ended)) {
            // If another video is playing, pause it first
            if (currentPlaying && currentPlaying !== video) {
                const previousCard = currentPlaying.closest('.gallery-card');
                if (previousCard) {
                    currentPlaying.pause();
                    showOverlay(previousCard);
                    previousCard.classList.remove('playing');
                }
            }
            
            // Remember the current time to resume from same position
            const currentTime = video.currentTime;
            
            if (!playedVideos.has(video)) {
                playedVideos.add(video);
                // Don't reload the video as it causes flashing
                // Just ensure we have a valid time position
                if (currentTime <= 0 || isNaN(currentTime)) {
                    video.currentTime = 0;
                }
            } else {
                // For videos already played, make sure we resume from the correct position
                video.currentTime = currentTime > 0 ? currentTime : 0;
            }
            
            console.log("Playing video:", video.src);
            // Use a silent catch to prevent console errors on mobile autoplay restrictions
            const playPromise = video.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    card.classList.add('playing');
                    
                    // Hide overlay immediately on desktop, with delay on mobile
                    hideOverlayWithDelay(card, isMobile ? 1500 : 0);
                    currentPlaying = video;
                }).catch(error => {
                    console.log("Playback prevented:", error);
                    showOverlay(card);
                });
            }
        } else if (!shouldPlay && !video.paused) {
            video.pause();
            card.classList.remove('playing');
            showOverlay(card);
        }
    }

    // Hide overlay with delay
    function hideOverlayWithDelay(card, delay = 0) {
        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;
        
        clearTimeout(overlayTimeout);
        
        if (delay) {
            overlayTimeout = setTimeout(() => {
                overlay.classList.add('hidden');
                console.log("Overlay hidden after 2s for:", card.querySelector('video')?.src || "unknown");
            }, delay);
        } else {
            overlay.classList.add('hidden');
        }
    }

    // Show overlay
    function showOverlay(card) {
        if (!card) return;
        
        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;
        
        clearTimeout(overlayTimeout);
        overlay.classList.remove('hidden');
        console.log("Overlay reset for card:", card);
    }

    // Function to check if an element is in viewport
    function isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= -rect.height/2 &&
            rect.top <= window.innerHeight - rect.height/2
        );
    }
    
    // Better viewport detection for smoother mobile experience
    function isInViewportBetter(element) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Get center point of viewport
        const viewportCenter = windowHeight / 2;
        
        // Get center point of element
        const elementCenter = rect.top + (rect.height / 2);
        
        // Calculate how close the element's center is to the viewport's center
        const distanceFromCenter = Math.abs(elementCenter - viewportCenter);
        
        // Element is considered "centered" if its center is within 20% of the viewport's center
        const threshold = windowHeight * 0.2;
        
        return distanceFromCenter < threshold;
    }
    
    // Preload all videos to prevent stuttering on mobile
    function preloadVideos() {
        galleryCards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                // Set low-priority loading
                video.preload = "metadata";
                
                // Attempt to preload a bit of the video
                setTimeout(() => {
                    video.load();
                }, 1000); // Delay preloading to not block initial page load
            }
        });
    }

    // Desktop hover behavior
    if (!isMobile) {
        galleryCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                handleVideoPlayback(card, true);
            });
            
            card.addEventListener('mouseleave', () => {
                handleVideoPlayback(card, false);
            });
        });
    }
    
    // Mobile scroll behavior with debounce
    if (isMobile) {
        let scrollTimeout;
        let lastCheckTime = 0;
        let isScrolling = false;
        const THROTTLE_DELAY = 400; // Only check every 400ms to avoid rapid start/stop
        
        function checkVideoVisibility() {
            // Don't check too frequently
            const now = Date.now();
            if (now - lastCheckTime < THROTTLE_DELAY) return;
            lastCheckTime = now;
            
            // Stop all videos while scrolling to prevent stuttering
            if (isScrolling) {
                galleryCards.forEach(card => {
                    const video = card.querySelector('video');
                    if (video && !video.paused) {
                        video.pause();
                        showOverlay(card);
                    }
                });
                return;
            }
            
            // Only play one video at a time - the most centered one
            let bestCard = null;
            let bestDistance = Infinity;
            
            galleryCards.forEach(card => {
                const rect = card.getBoundingClientRect();
                const windowHeight = window.innerHeight;
                const elementCenter = rect.top + (rect.height / 2);
                const viewportCenter = windowHeight / 2;
                const distance = Math.abs(elementCenter - viewportCenter);
                
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCard = card;
                }
                
                // Pause all videos initially
                handleVideoPlayback(card, false);
            });
            
            // Only play the most centered video if it's actually in viewport
            if (bestCard && isInViewportBetter(bestCard)) {
                handleVideoPlayback(bestCard, true);
            }
        }
        
        // Initial check on page load with a slight delay to allow videos to load
        setTimeout(() => {
            checkVideoVisibility();
        }, 500);
        
        // Track scroll state
        window.addEventListener('scroll', () => {
            isScrolling = true;
            clearTimeout(scrollTimeout);
            
            // After scrolling stops, wait a bit before checking visibility
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                checkVideoVisibility();
            }, 300);
        });
        
        // Check videos on page load
        window.addEventListener('load', () => {
            preloadVideos();
            setTimeout(checkVideoVisibility, 1000);
        });
    }

    // Spinning circle animation
    if (spinningCircle) {
        const spinningGroup = spinningCircle.querySelector('.spinning-group');
        
        // Smoothly animate the circle rotation with requestAnimationFrame
        function animateCircle(timestamp) {
            if (!isAnimating) return;
            
            // Base rotation on scroll amount
            rotation += velocity;
            
            // Apply rotation transform
            if (spinningGroup) {
                spinningGroup.style.transform = `rotate(${rotation}deg)`;
            }
            
            // Apply friction to slow down when not scrolling
            velocity *= 0.98;
            
            // Keep animating
            requestAnimationFrame(animateCircle);
        }
        
        // Start animation initially
        function startAnimation() {
            if (!isAnimating) {
                isAnimating = true;
                requestAnimationFrame(animateCircle);
            }
        }

        // React to scroll events
        window.addEventListener('scroll', () => {
            velocity = 0.5;  // Reset velocity on scroll
            startAnimation();
        });
        
        // Start with a little velocity
        velocity = 0.5;
        startAnimation();
    }
    
    // Cleanup when leaving page
    window.addEventListener('beforeunload', () => {
        if (currentPlaying) {
            currentPlaying.pause();
            currentPlaying = null;
        }
    });
});
