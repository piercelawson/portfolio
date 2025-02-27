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

    // Play video with error handling and optimized loading
    function playVideo(video) {
        if (!video) return false;

        try {
            // Ensure video has loaded enough for smooth playback
            if (video.readyState < 3) { // HAVE_FUTURE_DATA = 3
                // If not enough data, preload a bit more before playing
                video.load();
                
                // Set a short timeout to allow buffer to fill
                setTimeout(() => {
                    startPlayback(video);
                }, 50);
            } else {
                // Ready to play immediately
                startPlayback(video);
            }
            return true;
        } catch (e) {
            console.error("Error playing video:", e);
            return false;
        }
    }
    
    // Helper function to start actual playback
    function startPlayback(video) {
        // Reset the video to the beginning if it ended
        if (video.ended) {
            video.currentTime = 0;
        }
        
        // Use Promise to handle autoplay restrictions
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise.then(() => {
                currentPlaying = video;
                video.classList.remove('paused');
            }).catch(error => {
                console.warn("Play promise error:", error);
                video.pause();
            });
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

        // Clear any existing timeouts to prevent race conditions
        clearTimeout(overlayTimeout);
        clearTimeout(parseInt(card.dataset.overlayTimeout, 10));
        
        // Add a 'transitioning' class to prevent other operations during transition
        card.classList.add('overlay-transitioning');
        
        if (delay > 0) {
            overlayTimeout = setTimeout(() => {
                overlay.classList.add('hidden');
                overlay.style.opacity = '0';
                
                // Remove transitioning flag after animation completes
                setTimeout(() => {
                    card.classList.remove('overlay-transitioning');
                }, 300); // Match transition duration in CSS
            }, delay);
        } else {
            overlay.classList.add('hidden');
            overlay.style.opacity = '0';
            
            // Remove transitioning flag after animation completes
            setTimeout(() => {
                card.classList.remove('overlay-transitioning');
            }, 300); // Match transition duration in CSS
        }
        
        // Store the timeout ID on the card element for better tracking
        card.dataset.overlayTimeout = overlayTimeout;
    }

    // Show overlay
    function showOverlay(card) {
        if (!card) return;

        const overlay = card.querySelector('.gallery-overlay');
        if (!overlay) return;

        // Don't modify overlay if it's currently transitioning
        if (card.classList.contains('overlay-transitioning')) {
            return;
        }

        // Clear any existing timeouts
        clearTimeout(overlayTimeout);
        clearTimeout(parseInt(card.dataset.overlayTimeout, 10));
        
        // Add transitioning class
        card.classList.add('overlay-transitioning');
        
        // Immediately show overlay
        overlay.classList.remove('hidden');
        overlay.style.opacity = '1';
        
        // Remove transitioning flag after animation completes
        setTimeout(() => {
            card.classList.remove('overlay-transitioning');
        }, 300); // Match transition duration in CSS
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
        // Element is considered "centered" if within 20% of viewport center (more strict)
        const threshold = windowHeight * 0.2;

        // Also check element is actually visible with more height visible
        const isVisible = (
            rect.bottom > 0 &&
            rect.top < windowHeight &&
            rect.height * 0.6 < windowHeight // At least 60% visible
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
            const playSuccess = playVideo(video);
            
            if (playSuccess) {
                card.classList.add('playing');
                currentPlaying = video;

                // Hide overlay text (with delay on mobile)
                const delay = isMobile ? 1000 : 0;
                hideOverlay(card, delay);
                console.log("Hiding overlay for playing video");
            }
        } else {
            // Force pause even if it's already paused (safety)
            video.pause();
            
            // Set class for visual state
            video.classList.add('paused');
            card.classList.remove('playing');
            
            // Ensure we show the overlay right away
            showOverlay(card);
            console.log("Showing overlay for paused video");

            // Clear current playing reference if needed
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
        let scrollEndTimeout;
        let lastScrollPosition = window.scrollY;
        let scrollStableCount = 0;
        let activationDebounce = null;

        // Improved scroll handler with debouncing
        const handleScroll = () => {
            isScrolling = true;
            const currentScrollPosition = window.scrollY;
            
            // Check if scroll is relatively stable
            const scrollDifference = Math.abs(currentScrollPosition - lastScrollPosition);
            
            // Only make changes when scroll is relatively stable or significant movement
            if (scrollDifference < 5) {
                scrollStableCount++;
            } else {
                scrollStableCount = 0;
            }
            
            // Process videos only when scrolling has stabilized somewhat or significant scroll
            if (scrollStableCount >= 2 || scrollDifference > 50) {
                // Process one card at a time for smoother performance
                const centeredCard = Array.from(galleryCards).find(card => isElementCentered(card));
                
                if (centeredCard) {
                    // Debounce activation to prevent flickering
                    clearTimeout(activationDebounce);
                    activationDebounce = setTimeout(() => {
                        handleVideoPlayback(centeredCard, true);
                        
                        // Pause all other videos
                        galleryCards.forEach(card => {
                            if (card !== centeredCard) {
                                const video = card.querySelector('video');
                                if (video && !video.paused) {
                                    handleVideoPlayback(card, false);
                                }
                            }
                        });
                    }, 150); // Short delay to confirm center position
                }
            }

            // Clear previous timeouts
            clearTimeout(scrollTimeout);
            clearTimeout(scrollEndTimeout);

            // Set new timeout for scroll end detection
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                
                // Final check after scrolling stops completely
                scrollEndTimeout = setTimeout(() => {
                    // Do a complete check of all videos once scrolling has completely stopped
                    galleryCards.forEach(card => {
                        const video = card.querySelector('video');
                        const isCentered = isElementCentered(card);
                        
                        if (!isCentered && video && !video.paused) {
                            // Extra safety - pause any videos still playing but not centered
                            handleVideoPlayback(card, false);
                        } else if (isCentered && (!video || video.paused) && !card.classList.contains('playing')) {
                            // If centered but not playing, ensure it plays
                            handleVideoPlayback(card, true);
                        }
                    });
                }, 200);
            }, 150);
            
            lastScrollPosition = currentScrollPosition;
        };

        // Listen for scroll events with improved throttling
        let lastScrollProcessTime = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            // Less frequent processing for better performance
            if (now - lastScrollProcessTime > 100) {
                lastScrollProcessTime = now;
                handleScroll();
            }
        });
        
        // Also check on touch events for mobile
        window.addEventListener('touchend', () => {
            // After touch ends, do a full final check
            setTimeout(() => {
                scrollStableCount = 3; // Force stability check to pass
                handleScroll();
            }, 150);
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