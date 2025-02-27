
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
    const videoStates = new Map(); // Store video states (time position, etc.)
    
    console.log("Gallery cards found:", galleryCards.length);
    console.log("Is mobile:", isMobile);
    
    // Aggressive video preloading for better previews, especially on desktop
    function preloadAllVideos() {
        galleryCards.forEach(card => {
            const video = card.querySelector('video');
            if (video) {
                // Apply a CSS class to prevent black flash before play
                video.classList.add('video-preview');
                
                // Force full preload for all devices
                video.preload = "auto";
                video.muted = true; // Ensure autoplay works
                video.setAttribute('playsinline', ''); // iOS compatibility
                
                // Force preload immediately
                video.load();
                
                // Store initial state
                videoStates.set(video, {
                    lastTime: 0,
                    hasLoaded: false,
                    attemptsMade: 0
                });
                
                // More aggressive frame loading
                const prepareVideoFrame = () => {
                    const state = videoStates.get(video);
                    if (!state) return;
                    
                    if (state.hasLoaded) return; // Already loaded a frame
                    state.attemptsMade++;
                    
                    try {
                        // Ensure we're at the first frame
                        video.currentTime = 0.01; // Slightly after start to avoid black frame
                        video.pause();
                        
                        // Make it visible only once we have a frame
                        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
                            video.classList.add('ready');
                            video.style.visibility = 'visible';
                            state.hasLoaded = true;
                            console.log("Frame loaded for video:", video.src);
                        } else if (state.attemptsMade < 10) {
                            // Try again soon if we haven't hit max attempts
                            setTimeout(prepareVideoFrame, 200);
                        }
                    } catch (err) {
                        console.error("Error preparing video frame:", err);
                    }
                };
                
                // Try multiple events to catch the first available frame
                video.addEventListener('loadeddata', prepareVideoFrame, { once: true });
                video.addEventListener('loadedmetadata', prepareVideoFrame, { once: true });
                video.addEventListener('canplay', prepareVideoFrame, { once: true });
                
                // Initial attempt
                setTimeout(prepareVideoFrame, 100);
            }
        });
    }
    
    // Call preload function
    preloadAllVideos();

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
        
        // Ensure we have a state object for this video
        if (!videoStates.has(video)) {
            videoStates.set(video, {
                lastTime: 0,
                hasLoaded: video.classList.contains('ready'),
                attemptsMade: 0
            });
        }
        
        const videoState = videoStates.get(video);
        
        // When we should play the video
        if (shouldPlay) {
            // Exit if video is already playing
            if (!video.paused && !video.ended) return;
            
            // If another video is playing, pause it first
            if (currentPlaying && currentPlaying !== video) {
                const previousCard = currentPlaying.closest('.gallery-card');
                if (previousCard) {
                    // Save current state before pausing
                    const prevState = videoStates.get(currentPlaying);
                    if (prevState) {
                        prevState.lastTime = currentPlaying.currentTime;
                    }
                    
                    currentPlaying.pause();
                    showOverlay(previousCard);
                    previousCard.classList.remove('playing');
                }
            }
            
            // Prepare the video for playback
            try {
                // Make sure we have a valid time position to resume from
                if (videoState.lastTime > 0 && video.duration > 0) {
                    // Resume from last position, but ensure it's valid
                    const targetTime = Math.min(videoState.lastTime, video.duration - 0.1);
                    video.currentTime = targetTime;
                } else {
                    // Start from beginning if no valid last time
                    video.currentTime = 0.01; // Slightly after start to avoid black frame
                }
                
                // Ensure visibility and ready state before playing
                video.style.visibility = 'visible';
                
                // Add to played videos set to track history
                playedVideos.add(video);
            } catch (err) {
                console.error("Error preparing video for playback:", err);
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
        
        // Element is considered "centered" if its center is within 30% of the viewport's center
        // This wider threshold makes it more stable, preventing flicker
        const threshold = windowHeight * 0.3;
        
        // Also check that it's actually visible (not completely off-screen)
        const isVisible = (
            rect.bottom > 0 &&
            rect.top < windowHeight &&
            rect.height > 0
        );
        
        return isVisible && (distanceFromCenter < threshold);
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
        const THROTTLE_DELAY = 250; // Check more frequently, but not too often
        let scheduledCheck = false;
        
        function checkVideoVisibility() {
            // Track when we last checked
            lastCheckTime = Date.now();
            scheduledCheck = false;
            
            // Stop all videos while actively scrolling to prevent stuttering
            if (isScrolling) {
                galleryCards.forEach(card => {
                    const video = card.querySelector('video');
                    if (video && !video.paused) {
                        // Save position before pausing
                        const state = videoStates.get(video);
                        if (state) {
                            state.lastTime = video.currentTime;
                        }
                        
                        video.pause();
                        showOverlay(card);
                    }
                });
                
                // Schedule another check after scroll ends
                if (!scheduledCheck) {
                    scheduledCheck = true;
                    scrollTimeout = setTimeout(() => {
                        isScrolling = false;
                        checkVideoVisibility();
                    }, 300);
                }
                
                return;
            }
            
            // Only play one video at a time - find the most centered one
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
